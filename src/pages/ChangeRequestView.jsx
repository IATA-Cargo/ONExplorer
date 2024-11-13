import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Tooltip,
  Card,
  CardContent,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Description as DescriptionIcon,
  Inventory as InventoryIcon,
  Numbers as NumbersIcon,
  Notifications as NotificationsIcon
} from '@mui/icons-material';
import { apiCall } from '../utils/api';
import jsonld from 'jsonld';

const ChangeRequestView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [change, setChange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get server details from location state or use defaults
  const serverDetails = {
    baseUrl: location.state?.serverUrl || localStorage.getItem('baseUrl'),
    token: location.state?.token || localStorage.getItem('token')
  };

  const isExternalServer = serverDetails.baseUrl !== localStorage.getItem('baseUrl');

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${serverDetails.baseUrl}/action-requests/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${serverDetails.token}`,
            'Accept': 'application/ld+json'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch change request: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (isMounted) {
          const framedResponse = await jsonld.frame(data, frame);
          const processedData = framedResponse['@graph'] 
            ? framedResponse['@graph'].find(item => item['@id']?.includes('/action-requests/'))
            : framedResponse;

          setChange(cleanChangeData(processedData));
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id, serverDetails.baseUrl, serverDetails.token]);

  const frame = {
    "@context": {
      "@vocab": "https://onerecord.iata.org/ns/api#"
    }
  };

  const cleanChangeData = (rawData) => {
    if (!rawData) return null;

    // Helper function to clean operation data
    const cleanOperation = (op) => ({
      id: op['@id'] || '',
      type: op['op']?.['@id']?.split('#').pop() || '',
      subject: op['s'] || '',
      predicate: op['p'] || '',
      object: {
        id: op['o']?.['@id'] || '',
        datatype: op['o']?.['hasDatatype'] || '',
        value: op['o']?.['hasValue'] || ''
      }
    });

    // Handle operations array
    const operations = Array.isArray(rawData['hasChange']?.['hasOperation'])
      ? rawData['hasChange']?.['hasOperation'].map(op => cleanOperation(op))
      : [cleanOperation(rawData['hasChange']?.['hasOperation'])];

    return {
      id: rawData['@id']?.split('/').pop() || '',
      type: rawData['@type'] || '',
      status: rawData['hasRequestStatus']?.['@id']?.split('#').pop() || 'UNKNOWN',
      requestedBy: rawData['isRequestedBy']?.['@id'] || '',
      requestTime: rawData['isRequestedAt']?.['@value'] || '',
      change: {
        id: rawData['hasChange']?.['@id'] || '',
        type: rawData['hasChange']?.['@type'] || '',
        description: rawData['hasChange']?.['hasDescription'] || '',
        logisticsObject: rawData['hasChange']?.['hasLogisticsObject']?.['@id'] || '',
        revision: rawData['hasChange']?.['hasRevision']?.['@value'] || '',
        notifyStatusChange: rawData['hasChange']?.['notifyRequestStatusChange']?.['@value'] === 'true',
        operations: operations
      }
    };
  };

  const handleBack = () => {
    navigate(-1); // This will go back to the previous page in history
  };

  // Format link function to handle both internal and external links
  const formatLink = (url) => {
    if (!url) return <Typography>-</Typography>;

    const isExternal = !url.startsWith(serverDetails.baseUrl);
    const objectId = url.split('/').pop();
    
    if (url.includes('/logistics-objects/')) {
      return (
        <Button
          component={RouterLink}
          to={`/logistics-objects/${objectId}`}
          state={{ 
            isExternal,
            serverUrl: isExternal ? new URL(url).origin : serverDetails.baseUrl,
            token: serverDetails.token
          }}
          startIcon={<InventoryIcon />}
          sx={{ textTransform: 'none' }}
        >
          View Logistics Object
        </Button>
      );
    }
    
    return (
      <Link href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </Link>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Header with improved styling */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 2,
          backgroundColor: 'primary.main',
          color: 'white',
          p: 3,
          borderRadius: 2,
          boxShadow: 2
        }}>
          <EditIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Change Request Details
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              ID: {change?.id}
            </Typography>
          </Box>
        </Box>
      </Box>

      {change && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Status Card */}
          <Card>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={change.status}
                color={
                  change.status === 'REQUEST_ACCEPTED' ? 'success' :
                  change.status === 'REQUEST_REJECTED' ? 'error' : 'warning'
                }
                sx={{ fontWeight: 'bold' }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="action" />
                <Typography>
                  {new Date(change.requestTime).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="action" />
                <Typography>
                  {change.requestedBy.split('/').pop()}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Change Details Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <DescriptionIcon color="primary" />
                Change Details
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Description</Typography>
                  <Typography variant="body1">{change.change.description}</Typography>
                </Box>
                
                <Box>
                  <Typography color="textSecondary" gutterBottom>Logistics Object</Typography>
                  {formatLink(change.change.logisticsObject)}
                </Box>
                
                <Box>
                  <Typography color="textSecondary" gutterBottom>Revision</Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <NumbersIcon fontSize="small" />
                    {change.change.revision}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography color="textSecondary" gutterBottom>Notify Status Change</Typography>
                  <Chip 
                    icon={<NotificationsIcon />}
                    label={change.change.notifyStatusChange ? 'Enabled' : 'Disabled'}
                    color={change.change.notifyStatusChange ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Operations Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EditIcon color="primary" />
                Operations
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {change.change.operations.map((operation, index) => (
                  <Paper 
                    key={operation.id || index}
                    elevation={0}
                    sx={{ 
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Chip
                        icon={operation.type === 'ADD' ? <AddIcon /> : <DeleteIcon />}
                        label={operation.type}
                        color={operation.type === 'ADD' ? 'success' : 'error'}
                        sx={{ fontWeight: 'bold' }}
                      />
                      {change.change.operations.length > 1 && (
                        <Typography variant="subtitle2" color="textSecondary">
                          Operation {index + 1} of {change.change.operations.length}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                      <Tooltip title={operation.subject} placement="top">
                        <Box>
                          <Typography color="textSecondary" gutterBottom>Subject</Typography>
                          {formatLink(operation.subject)}
                        </Box>
                      </Tooltip>

                      <Box>
                        <Typography color="textSecondary" gutterBottom>Predicate</Typography>
                        <Typography>{operation.predicate.split('#').pop()}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ 
                      p: 2,
                      bgcolor: operation.type === 'ADD' ? 'success.soft' : 'error.soft',
                      borderRadius: 1,
                      border: 1,
                      borderColor: operation.type === 'ADD' ? 'success.main' : 'error.main',
                      borderStyle: 'dashed'
                    }}>
                      <Typography variant="subtitle2" color={operation.type === 'ADD' ? 'success.main' : 'error.main'} gutterBottom>
                        Object Value
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 2 }}>
                        <Typography><strong>Data Type:</strong> {operation.object.datatype.split('#').pop()}</Typography>
                        <Typography><strong>Value:</strong> {operation.object.value}</Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default ChangeRequestView;
