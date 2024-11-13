import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { apiCall } from '../utils/api';
import LogisticsObjectForm from '../components/LogisticsObjectForm';

const CreateLogisticsObject = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    const loadAvailableTypes = async () => {
      try {
        // Import all JSON files from the logistics-objects directory
        const context = require.context('../assets/logistics-objects', false, /\.json$/);
        const types = context.keys()
          .filter(key => !key.includes('Embedded.') && !key.includes('Abstract.')) // Filter out embedded schemas
          .map(key => {
            const schema = require(`../assets/logistics-objects/${key.slice(2)}`);
            return {
              schema: schema.schema,
              name: schema.name,
              description: schema.description,
              fullPath: `${schema.schema}.${schema.name}`
            };
          });
        setAvailableTypes(types);
      } catch (err) {
        console.error('Error loading types:', err);
        setError('Failed to load available object types');
      }
    };

    loadAvailableTypes();
  }, []);

  const handleSubmit = async () => {
    if (!formData) return;
    
    setLoading(true);
    setError(null);

    try {
      const [schema, type] = selectedType.split('.');
      const jsonLdData = {
        '@context': {
          '@vocab': 'https://onerecord.iata.org/ns/cargo#'
        },
        '@type': [type],
        ...formData
      };

      await apiCall('/logistics-objects', {
        method: 'POST',
        body: JSON.stringify(jsonLdData)
      });

      navigate('/', { 
        state: { 
          message: 'Logistics object created successfully',
          severity: 'success'
        } 
      });
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Database
        </Button>
        
        <Typography variant="h4" component="h1" sx={{ mb: 2 }}>
          Create New Logistics Object
        </Typography>
        <Divider />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <TextField
          select
          fullWidth
          label="Select Object Type"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          sx={{ mb: 3 }}
        >
          {availableTypes.map((type) => (
            <MenuItem 
              key={type.fullPath} 
              value={type.fullPath}
            >
              <Box>
                <Typography variant="subtitle1">
                  {type.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {type.description}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </TextField>

        {selectedType && (
          <>
            <LogisticsObjectForm
              objectType={{
                schema: selectedType.split('.')[0],
                name: selectedType.split('.')[1],
              }}
              onSubmit={setFormData}
              loading={loading}
            />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={handleSubmit}
                disabled={loading || !formData}
              >
                Create Object
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default CreateLogisticsObject;
