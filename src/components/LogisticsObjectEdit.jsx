import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import LogisticsObjectForm from './LogisticsObjectForm';
import { 
  getLogisticsObjectWithRevision, 
  submitChangeRequest,
  apiCall 
} from '../utils/api';
import jsonld from 'jsonld';

const LogisticsObjectEdit = ({ objectId, objectType, serverDetails, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [latestRevision, setLatestRevision] = useState(1);
  const [schemaData, setSchemaData] = useState(null);

  // Load object data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Extract base URL and path
        let targetBaseUrl;
        let objectPath;
        
        if (objectId.startsWith('http')) {
          const url = new URL(objectId);
          targetBaseUrl = url.origin;
          objectPath = url.pathname;
        } else {
          targetBaseUrl = serverDetails.baseUrl;
          objectPath = objectId.includes('logistics-objects/') 
            ? `/${objectId}` 
            : `/logistics-objects/${objectId}`;
        }

        const isExternalObject = targetBaseUrl !== serverDetails.baseUrl;
        const token = isExternalObject
          ? serverDetails.externalTokens?.[targetBaseUrl]
          : serverDetails.token;

        if (!token) {
          throw new Error(`No authentication token available for ${targetBaseUrl}`);
        }

        // Fetch the object data
        const response = await fetch(`${targetBaseUrl}${objectPath}`, {
          headers: {
            'Accept': 'application/ld+json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch object: ${response.statusText}`);
        }

        // Extract revision from headers
        const revisionHeader = response.headers.get('latest-revision');
        const currentRevision = revisionHeader ? parseInt(revisionHeader, 10) : 1;
        setLatestRevision(currentRevision);

        const data = await response.json();
        
        // Frame the data
        const framedData = await jsonld.frame(data, {
          "@context": {
            "@vocab": "https://onerecord.iata.org/ns/cargo#"
          },
          "@embed": "@always"
        });

        // Find the correct object in the graph
        let processedData;
        if (framedData['@graph']) {
          const idPart = objectPath.split('/logistics-objects/')[1];
          processedData = framedData['@graph'].find(obj => 
            obj['@id'].includes(`/logistics-objects/${idPart}`)
          );
        } else {
          processedData = framedData;
        }

        if (!processedData) {
          throw new Error('Object not found in response');
        }

        setOriginalData(processedData);
        setFormData(processedData);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (objectId && serverDetails) {
      loadData();
    }
  }, [objectId, serverDetails]);

  // Load schema data
  useEffect(() => {
    const loadSchema = async () => {
      try {
        // Extract the object type from the @type array or string
        let typeIdentifier = '';
        if (originalData?.['@type']) {
          const types = Array.isArray(originalData['@type']) 
            ? originalData['@type'] 
            : [originalData['@type']];
          
          // Filter out 'LogisticsObject' from the types array
          const filteredTypes = types.filter(type => !type.includes('LogisticsObject'));

          // Find the most specific type (usually the last one)
          const specificType = filteredTypes.length > 0 
            ? filteredTypes[filteredTypes.length - 1]
            : types[types.length - 1];
            
          typeIdentifier = specificType.split('#').pop(); // Remove namespace
        } else {
          typeIdentifier = objectType;
        }
        
        // Find and load the schema file that matches the object type
        const context = require.context('../assets/logistics-objects/', false, /\..*\.json$/);
        const schemaFile = context.keys().find(key => key.endsWith(`.${typeIdentifier}.json`));
        
        if (!schemaFile) {
          throw new Error(`No schema file found for type: ${typeIdentifier}`);
        }

        const schema = await import(`../assets/logistics-objects/${schemaFile.slice(2)}`);
        
        // Store both the schema and the type information consistently
        setSchemaData({
          name: typeIdentifier,
          schema: schema.default.schema || 'Core'
        });
        
        setError(null);
      } catch (err) {
        console.error('Error loading schema:', err);
        setError(`Failed to load schema`);
      }
    };

    if (originalData) {
      loadSchema();
    }
  }, [originalData, objectType]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const operations = [];
      
      const generateFakeId = () => `_:b${Math.random().toString(36).substr(2, 9)}`;

      // Helper function to create operations for nested objects/arrays
      const createNestedOperations = (value, parentId, propertyPath, propertySchema) => {
        const operations = [];
        const isArray = propertySchema.array;
        
        if (isArray && Array.isArray(value)) {
          // Handle array elements
          value.forEach(item => {
            if (typeof item !== 'object' || item === null) {
              // Handle primitive array values directly
              operations.push({
                "@type": "api:Operation",
                "api:op": { "@id": "api:ADD" },
                "api:s": parentId,
                "api:p": `https://onerecord.iata.org/ns/cargo#${propertyPath}`,
                "api:o": [{
                  "@type": "api:OperationObject",
                  "api:hasDatatype": propertySchema.valueIRI,
                  "api:hasValue": item['@value'] || item
                }]
              });
            } else {
              // Handle object array elements
              const itemId = (Object.keys(item).length === 1 && item['@id']) 
                ? item['@id'] 
                : generateFakeId();
              
              operations.push({
                "@type": "api:Operation",
                "api:op": { "@id": "api:ADD" },
                "api:s": parentId,
                "api:p": `https://onerecord.iata.org/ns/cargo#${propertyPath}`,
                "api:o": [{
                  "@type": "api:OperationObject",
                  "api:hasDatatype": propertySchema.valueIRI,
                  "api:hasValue": itemId
                }]
              });

              // Process nested properties if item has more than just @id
              if (Object.keys(item).length > 1) {
                Object.keys(item).forEach(key => {
                  if (key.startsWith('@')) return;
                  
                  const nestedSchema = require(`../assets/logistics-objects/${propertySchema.schemaType}.${propertySchema.type}.json`);
                  const nestedPropertySchema = nestedSchema.columns.find(col => col.name === key);
                  
                  if (nestedPropertySchema) {
                    operations.push(...createNestedOperations(
                      item[key],
                      itemId,
                      key,
                      nestedPropertySchema
                    ));
                  }
                });
              }
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          if (value['@value']) {
            // Handle primitive values with @value
            operations.push({
              "@type": "api:Operation",
              "api:op": { "@id": "api:ADD" },
              "api:s": parentId,
              "api:p": `https://onerecord.iata.org/ns/cargo#${propertyPath}`,
              "api:o": [{
                "@type": "api:OperationObject",
                "api:hasDatatype": propertySchema.valueIRI,
                "api:hasValue": value['@value']
              }]
            });
          } else {
            // Handle nested objects
            const objectId = value['@id'] || generateFakeId();
            
            operations.push({
              "@type": "api:Operation",
              "api:op": { "@id": "api:ADD" },
              "api:s": parentId,
              "api:p": `https://onerecord.iata.org/ns/cargo#${propertyPath}`,
              "api:o": [{
                "@type": "api:OperationObject",
                "api:hasDatatype": propertySchema.valueIRI,
                "api:hasValue": objectId
              }]
            });

            // Process nested properties
            Object.keys(value).forEach(key => {
              if (key.startsWith('@')) return;
              
              const nestedSchema = require(`../assets/logistics-objects/${propertySchema.schemaType}.${propertySchema.type}.json`);
              const nestedPropertySchema = nestedSchema.columns.find(col => col.name === key);
              
              if (nestedPropertySchema) {
                operations.push(...createNestedOperations(
                  value[key],
                  objectId,
                  key,
                  nestedPropertySchema
                ));
              }
            });
          }
        } else {
          // Handle primitive values
          operations.push({
            "@type": "api:Operation",
            "api:op": { "@id": "api:ADD" },
            "api:s": parentId,
            "api:p": `https://onerecord.iata.org/ns/cargo#${propertyPath}`,
            "api:o": [{
              "@type": "api:OperationObject",
              "api:hasDatatype": propertySchema.valueIRI,
              "api:hasValue": value
            }]
          });
        }
        
        return operations;
      };

      // Helper function to create delete operations for nested objects/arrays
      const createNestedDeleteOperations = (value, parentId, propertyPath, propertySchema) => {
        const operations = [];
        const isArray = propertySchema.array;
        
        if (isArray && Array.isArray(value)) {
          // Handle array elements
          value.forEach(item => {
            if (typeof item !== 'object' || item === null) {
              // Handle primitive array values directly
              operations.push({
                "@type": "api:Operation",
                "api:op": { "@id": "api:DELETE" },
                "api:s": parentId,
                "api:p": `https://onerecord.iata.org/ns/cargo#${propertyPath}`,
                "api:o": [{
                  "@type": "api:OperationObject",
                  "api:hasDatatype": propertySchema.valueIRI,
                  "api:hasValue": item
                }]
              });
            } else {
              const itemId = item['@id'];
              if (!itemId) return; // Skip if no ID (shouldn't happen for existing data)
              
              // Delete the array element reference from parent
              operations.push({
                "@type": "api:Operation",
                "api:op": { "@id": "api:DELETE" },
                "api:s": parentId,
                "api:p": `https://onerecord.iata.org/ns/cargo#${propertyPath}`,
                "api:o": [{
                  "@type": "api:OperationObject",
                  "api:hasDatatype": propertySchema.valueIRI,
                  "api:hasValue": itemId
                }]
              });

              // Delete nested properties
              Object.keys(item).forEach(key => {
                if (key.startsWith('@')) return;
                
                const nestedSchema = require(`../assets/logistics-objects/${propertySchema.schemaType}.${propertySchema.type}.json`);
                const nestedPropertySchema = nestedSchema.columns.find(col => col.name === key);
                
                if (nestedPropertySchema) {
                  operations.push(...createNestedDeleteOperations(
                    item[key],
                    itemId,
                    key,
                    nestedPropertySchema
                  ));
                }
              });
            }
          });
        } else if (typeof value === 'object' && value !== null) {
          const objectId = value['@id'];
          if (!objectId) return; // Skip if no ID
          
          // Delete the object reference from parent
          operations.push({
            "@type": "api:Operation",
            "api:op": { "@id": "api:DELETE" },
            "api:s": parentId,
            "api:p": `https://onerecord.iata.org/ns/cargo#${propertyPath}`,
            "api:o": [{
              "@type": "api:OperationObject",
              "api:hasDatatype": propertySchema.valueIRI,
              "api:hasValue": objectId
            }]
          });

          // Delete nested properties
          Object.keys(value).forEach(key => {
            if (key.startsWith('@')) return;
            
            const nestedSchema = require(`../assets/logistics-objects/${propertySchema.schemaType}.${propertySchema.type}.json`);
            const nestedPropertySchema = nestedSchema.columns.find(col => col.name === key);
            
            if (nestedPropertySchema) {
              operations.push(...createNestedDeleteOperations(
                value[key],
                objectId,
                key,
                nestedPropertySchema
              ));
            }
          });
        } else {
          // Handle primitive values
          operations.push({
            "@type": "api:Operation",
            "api:op": { "@id": "api:DELETE" },
            "api:s": parentId,
            "api:p": `https://onerecord.iata.org/ns/cargo#${propertyPath}`,
            "api:o": [{
              "@type": "api:OperationObject",
              "api:hasDatatype": propertySchema.valueIRI,
              "api:hasValue": value
            }]
          });
        }
        
        return operations;
      };

      // Process each top-level field
      Object.keys(formData).forEach(key => {
        if (key.startsWith('@')) return;
        
        const originalValue = originalData[key];
        const newValue = formData[key];
        
        if (JSON.stringify(originalValue) !== JSON.stringify(newValue)) {
          const schemaFile = require(`../assets/logistics-objects/${schemaData.schema}.${schemaData.name}.json`);
          const propertySchema = schemaFile.columns.find(column => column.name === key);
          
          if (propertySchema) {
            // Delete original value if it exists
            if (originalValue) {
              operations.push({
                "@type": "api:Operation",
                "api:op": { "@id": "api:DELETE" },
                "api:s": originalData['@id'],
                "api:p": `https://onerecord.iata.org/ns/cargo#${key}`,
                "api:o": [{
                  "@type": "api:OperationObject",
                  "api:hasDatatype": propertySchema.valueIRI,
                  "api:hasValue": originalValue['@id'] || originalValue
                }]
              });
            }

            // Add new value with proper nesting
            if (newValue) {
              operations.push(...createNestedOperations(
                newValue,
                originalData['@id'],
                key,
                propertySchema
              ));
            }
          }
        }
      });

      // Prepare the change request
      const changeRequest = {
        "@context": {
          "cargo": "https://onerecord.iata.org/ns/cargo#",
          "api": "https://onerecord.iata.org/ns/api#"
        },
        "@type": "api:Change",
        "api:hasLogisticsObject": {
          "@id": originalData['@id']
        },
        "api:hasDescription": "Update object properties",
        "api:hasOperation": operations,
        "api:hasRevision": {
          "@type": "http://www.w3.org/2001/XMLSchema#positiveInteger",
          "@value": String(latestRevision)
        }
      };

      // Submit the changes
      const response = await fetch(`${serverDetails.baseUrl}/logistics-objects/${objectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/ld+json',
          'Authorization': `Bearer ${serverDetails.token}`
        },
        body: JSON.stringify(changeRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to update object: ${response.statusText}`);
      }

      // Close the dialog on success
      onClose();
    } catch (err) {
      console.error('Error submitting changes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open fullWidth maxWidth="md">
      <DialogTitle>
        Edit {schemaData?.name || objectType}
        <Typography variant="caption" display="block" color="text.secondary">
          {objectId}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !schemaData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <LogisticsObjectForm
            objectType={{
              schema: schemaData.schema,
              name: schemaData.name,
              fullSchema: schemaData.fullSchema
            }}
            initialData={formData}
            onSubmit={(updatedData) => {
              setFormData(updatedData);
            }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !schemaData || JSON.stringify(originalData) === JSON.stringify(formData)}
        >
          Submit Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogisticsObjectEdit;
