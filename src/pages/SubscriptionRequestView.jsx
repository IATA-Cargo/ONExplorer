import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate
import {
  Box,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
  Link,
  Tooltip,
  Typography,
  Button
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Topic as TopicIcon,
  Category as CategoryIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { apiCall, externalApiCall } from '../utils/api';
import { getServers } from '../utils/settings'; // Ensure this import is correct
import jsonld from 'jsonld';
import { Link as RouterLink } from 'react-router-dom'; // Import RouterLink if used

const SubscriptionRequestView = () => {
  const { id, serverId } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching subscription request:', { id, serverId }); // Debug log
        setLoading(true);
        let response;
        
        if (serverId) {
          // External server request
          const servers = getServers();
          const selectedServer = servers.find(server => server.id === serverId);
          if (!selectedServer) {
            throw new Error('Server not found');
          }
          console.log('External server request:', selectedServer.baseUrl); // Debug log
          response = await externalApiCall(selectedServer.baseUrl, `/action-requests/${id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${selectedServer.token}`
            }
          });
        } else {
          // Internal server request
          console.log('Internal server request for ID:', id); // Debug log
          response = await apiCall(`/action-requests/${id}`, {
            method: 'GET'
          });
        }

        console.log('Raw API response:', response); // Debug log

        // Frame the response data
        const framed = await jsonld.frame(response, frame);
        console.log('Framed data:', framed); // Debug log
        
        // Clean the subscription data
        const cleanedData = cleanSubscriptionData(framed);
        console.log('Cleaned data:', cleanedData); // Debug log
        
        if (!cleanedData) {
          throw new Error('Failed to process subscription data');
        }

        setSubscription(cleanedData);
        setError(null);
      } catch (err) {
        console.error('Error in fetchData:', err); // Detailed error logging
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) { // Only fetch if we have an ID
      fetchData();
    } else {
      console.error('No subscription ID provided'); // Debug log
      setError('No subscription ID provided');
      setLoading(false);
    }
  }, [id, serverId]);

  // Frame for JSON-LD processing
  const frame = {
    "@context": {
      "@vocab": "https://onerecord.iata.org/ns/api#",
      "cargo": "https://onerecord.iata.org/ns/cargo#"
    },
    "@type": "SubscriptionRequest"
  };

  // Clean subscription data function
  const cleanSubscriptionData = (rawData) => {
    if (!rawData) return null;

    return {
      id: rawData['@id']?.split('/').pop() || id,
      type: rawData['@type']?.split('#').pop() || '',
      status: rawData['hasRequestStatus']?.['@id']?.split('#').pop() || 'UNKNOWN',
      requestedBy: rawData['isRequestedBy']?.['@id'] || '',
      requestTime: rawData['isRequestedAt']?.['@value'] || '',
      subscription: {
        id: rawData['hasSubscription']?.['@id']?.split('/').pop() || '',
        subscriber: rawData['hasSubscription']?.['hasSubscriber']?.['@id'] || '',
        topic: rawData['hasSubscription']?.['hasTopic']?.['@value'] || '',
        topicType: rawData['hasSubscription']?.['hasTopicType']?.['@id']?.split('#').pop() || ''
      }
    };
  };

  const handleBack = () => {
    navigate('/subscriptions');
  };

  // Add helper function to format status chip
  const getStatusChipProps = (status) => {
    const statusConfig = {
      'REQUEST_ACCEPTED': { color: 'success', label: 'Accepted' },
      'REQUEST_REJECTED': { color: 'error', label: 'Rejected' },
      'REQUEST_PENDING': { color: 'warning', label: 'Pending' },
      'UNKNOWN': { color: 'default', label: 'Unknown' }
    };
    return statusConfig[status] || statusConfig['UNKNOWN'];
  };

  // Add helper function to format subscriber link
  const formatSubscriberLink = (url) => {
    const apiBaseUrl = localStorage.getItem('apiBaseUrl') || '';
    const isInternal = url.startsWith(apiBaseUrl);
    const displayId = url.split('/').pop();

    return isInternal ? (
      <RouterLink 
        to={`/logistics-objects/${displayId}`}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          color: '#1976d2',
          textDecoration: 'none' 
        }}
      >
        <AccountCircleIcon fontSize="small" />
        {displayId}
      </RouterLink>
    ) : (
      <Link 
        href={url}
        target="_blank"
        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
      >
        <AccountCircleIcon fontSize="small" />
        {displayId}
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
          Back to Subscriptions
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
          <SendIcon sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Subscription Request Details
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              ID: {subscription?.id}
            </Typography>
          </Box>
        </Box>
      </Box>

      {subscription && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Status Card */}
          <Card>
            <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Chip 
                label={getStatusChipProps(subscription.status).label}
                color={getStatusChipProps(subscription.status).color}
                sx={{ fontWeight: 'bold' }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon color="action" />
                <Typography>
                  {new Date(subscription.requestTime).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="action" />
                <Typography>
                  {subscription.requestedBy.split('/').pop()}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Subscription Details Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon color="primary" />
                Subscription Details
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>Subscription ID</Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {subscription.subscription.id}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography color="textSecondary" gutterBottom>Subscriber</Typography>
                  {formatSubscriberLink(subscription.subscription.subscriber)}
                </Box>
                
                <Box>
                  <Typography color="textSecondary" gutterBottom>Topic</Typography>
                  <Tooltip title={subscription.subscription.topic}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TopicIcon fontSize="small" color="primary" />
                      <Typography noWrap>
                        {subscription.subscription.topic}
                      </Typography>
                    </Box>
                  </Tooltip>
                </Box>
                
                <Box>
                  <Typography color="textSecondary" gutterBottom>Topic Type</Typography>
                  <Chip 
                    icon={<CategoryIcon />}
                    label={subscription.subscription.topicType}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default SubscriptionRequestView;
