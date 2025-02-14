import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  MenuItem,
  Backdrop
} from '@mui/material';
import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { getLogisticsObjects, apiCall, externalApiCall } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { validateSettings } from '../utils/settingsValidator';

const STATUS_COLORS = {
    REQUEST_PENDING: { bg: '#fff3e0', color: '#e65100', label: 'PENDING' },
    REQUEST_ACCEPTED: { bg: '#e8f5e9', color: '#2e7d32', label: 'ACCEPTED' },
    REQUEST_REJECTED: { bg: '#ffebee', color: '#c62828', label: 'REJECTED' },
    REQUEST_FAILED: { bg: '#fce4ec', color: '#c2185b', label: 'FAILED' }
};

const TOPIC_TYPES = [
  'LOGISTICS_OBJECT_IDENTIFIER',
  'LOGISTICS_OBJECT_TYPE'
];

const TABLE_STYLES = {
  header: {
    variant: "h6",
    sx: { 
      mb: 2, 
      display: 'flex', 
      alignItems: 'center', 
      gap: 1,
      color: '#1976d2',
      fontWeight: 600 
    }
  },
  tableHead: {
    sx: { backgroundColor: '#f5f5f5' }
  },
  tableRow: {
    sx: { 
      '&:hover': { backgroundColor: '#f5f5f5' },
      backgroundColor: 'inherit'
    }
  }
};

const ActionButtons = ({ subscription, onStatusUpdate }) => {
  const navigate = useNavigate();
  const isPending = subscription.status === 'REQUEST_PENDING';
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
      <Tooltip title="View Details">
        <IconButton
          color="primary"
          onClick={() => navigate(`/subscription-requests/${subscription.id}`)} // Fixed URL path
        >
          <VisibilityIcon />
          
        </IconButton>
      </Tooltip>
      
      <Tooltip title={isPending ? "Approve" : "Already processed"}>
        <span>
          <IconButton
            color="success"
            onClick={() => onStatusUpdate(subscription.id, 'REQUEST_ACCEPTED')}
            disabled={!isPending}
            sx={{
              '&.Mui-disabled': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            <CheckIcon />
          </IconButton>
        </span>
      </Tooltip>
      
      <Tooltip title={isPending ? "Reject" : "Already processed"}>
        <span>
          <IconButton
            color="error"
            onClick={() => onStatusUpdate(subscription.id, 'REQUEST_REJECTED')}
            disabled={!isPending}
            sx={{
              '&.Mui-disabled': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: 'rgba(0, 0, 0, 0.26)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

const Subscriptions = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newSubscription, setNewSubscription] = useState({
    topic: '',
    subscriber: '',
    topictype: 'LOGISTICS_OBJECT_IDENTIFIER',
    serverId: '' // Add server selection
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [servers, setServers] = useState([]);
  const [externalSubscriptions, setExternalSubscriptions] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const [settingsValid, setSettingsValid] = useState(false);
  
  // Add this helper function inside the component
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  useEffect(() => {
    const { isValid } = validateSettings();
    setSettingsValid(isValid);
  }, []);

  useEffect(() => {
    if (settingsValid) {
      fetchSubscriptions();
    }
  }, [settingsValid]);

  useEffect(() => {
    const loadServers = () => {
      const savedServers = JSON.parse(localStorage.getItem('externalServers') || '[]');
      setServers(savedServers);
    };
    loadServers();
  }, []);

  useEffect(() => {
    // Load external subscriptions from localStorage
    const loadExternalSubscriptions = () => {
      const saved = JSON.parse(localStorage.getItem('externalSubscriptions') || '[]');
      setExternalSubscriptions(saved);
    };
    loadExternalSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await getLogisticsObjects('https%3A%2F%2Fonerecord.iata.org%2Fns%2Fapi%23SubscriptionRequest');
      
      // Check if response is an array, if not convert it to an array
      const rawData = response['@graph'] ? response['@graph'] : [response];
      const cleanArray = rawData.filter(value => Object.keys(value).length !== 0);
      // Clean up each item in the array
      const cleanedData = cleanArray.map(cleanupItem);

      // Sort subscriptions by request time in descending order (newest first)
      const sortedSubscriptions = cleanedData.sort((a, b) => {
        return new Date(b.requestTime) - new Date(a.requestTime);
      });

      setSubscriptions(sortedSubscriptions);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const cleanupItem = (item) => {
  
    return {
      id: item['@id'].split('/').pop(),
      status: item['https://onerecord.iata.org/ns/api#hasRequestStatus']['@id'].split('#').pop(),
      subscriber: item['https://onerecord.iata.org/ns/api#isRequestedBy']['@id'],
      requestTime: item['https://onerecord.iata.org/ns/api#isRequestedAt']['@value'],
      subscription: item['https://onerecord.iata.org/ns/api#hasSubscription']['@id'].split('/').pop()
    };
  };

  const handleCreateSubscription = async () => {
    try {
        setSubmitting(true);
        setSubmitError(null);

        const selectedServer = servers.find(s => s.id === newSubscription.serverId);
        if (!selectedServer) {
            throw new Error('Please select a server');
        }

        
        const subscriptionPayload = {
            "@context": {
                "cargo": "https://onerecord.iata.org/ns/cargo#",
                "api": "https://onerecord.iata.org/ns/api#"
            },
            "@type": "api:Subscription",
            "api:hasContentType": "application/ld+json",
            "api:hasSubscriber": {
                "@id": newSubscription.subscriber
            },
            "api:hasTopicType": {
                "@id": `api:${newSubscription.topictype}`
            },
            "api:includeSubscriptionEventType": [
                {
                    "@id": "api:LOGISTICS_OBJECT_UPDATED"
                },
                {
                    "@id": "api:LOGISTICS_OBJECT_CREATED"
                },
                {
                    "@id": "api:LOGISTICS_EVENT_RECEIVED"
                }
            ],
            "api:hasTopic": {
                "@type": "http://www.w3.org/2001/XMLSchema#anyURI",
                "@value": newSubscription.topic
            }
        };

        // Use externalApiCall with the selected server's base URL
        const response = await externalApiCall(
            selectedServer.baseUrl,
            '/subscriptions',
            {
                method: 'POST',
                body: JSON.stringify(subscriptionPayload),
                server: selectedServer,
                returnFullResponse: true
            }
        );

        // Get subscription ID from Location header
        const locationHeader = response.headers.get('Location');
        if (locationHeader) {
            // Extract the subscription ID from the location header
            const subscriptionId = locationHeader.split('/').pop();
            
            const newExternalSub = {
                id: subscriptionId,
                server: selectedServer.name,
                serverId: selectedServer.id,
                topic: newSubscription.topic,
                subscriber: newSubscription.subscriber,
                topicType: newSubscription.topictype,
                createdAt: new Date().toISOString(),
                subscriptionId: subscriptionId
            };

            const updatedSubs = [...externalSubscriptions, newExternalSub];
            setExternalSubscriptions(updatedSubs);
            localStorage.setItem('externalSubscriptions', JSON.stringify(updatedSubs));
        }

        // Reset form and close dialog
        setOpenDialog(false);
        setNewSubscription({
            topic: '',
            subscriber: '',
            topictype: 'LOGISTICS_OBJECT_IDENTIFIER',
            serverId: ''
        });

    } catch (err) {
        console.error('Subscription creation error:', err);
        setSubmitError(err.message || 'Failed to create subscription');
    } finally {
        setSubmitting(false);
    }
};

  const handleStatusUpdate = async (subscriptionId, newStatus) => {
    try {
      setActionLoading(true); // Block the screen
      
      await apiCall(`/action-requests/${subscriptionId}?status=${newStatus}`, {
        method: 'PATCH'
      });

      // Add a small delay to ensure the server has processed the update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Refresh the table and wait for it to complete
      await fetchSubscriptions();
      
    } catch (err) {
      console.error(`Error updating subscription status: ${err.message}`);
      setError(`Failed to update status: ${err.message}`);
    } finally {
      // Small delay to ensure the UI has updated
      setTimeout(() => {
        setActionLoading(false); // Unblock the screen
      }, 300);
    }
  };

  const handleDeleteExternalSubscription = (subscription) => {
    setSubscriptionToDelete(subscription);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (subscriptionToDelete) {
      const updatedSubs = externalSubscriptions.filter(
        sub => sub.id !== subscriptionToDelete.id
      );
      setExternalSubscriptions(updatedSubs);
      localStorage.setItem('externalSubscriptions', JSON.stringify(updatedSubs));
    }
    setDeleteDialogOpen(false);
    setSubscriptionToDelete(null);
  };

  const ExternalSubscriptionsTable = () => (
    <>
      <Typography {...TABLE_STYLES.header} sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SendIcon />
        External Subscriptions
      </Typography>
      {externalSubscriptions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No external subscriptions found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow {...TABLE_STYLES.tableHead}>
                <TableCell>Server</TableCell>
                <TableCell>Subscription ID</TableCell>
                <TableCell>Topic</TableCell>
                <TableCell>Subscriber</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {externalSubscriptions.map((sub) => (
                <TableRow 
                  key={sub.id}
                  {...TABLE_STYLES.tableRow}
                >
                  <TableCell>{sub.server}</TableCell>
                  <TableCell>{sub.subscriptionId}</TableCell>
                  <TableCell>{sub.topic}</TableCell>
                  <TableCell>{sub.subscriber}</TableCell>
                  <TableCell>{new Date(sub.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/external-subscription-requests/${sub.serverId}/${sub.subscriptionId}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove from local database">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteExternalSubscription(sub)}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Add the Backdrop component */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
        open={actionLoading}
      >
        <CircularProgress color="inherit" />
        <Typography>Processing request...</Typography>
      </Backdrop>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SendIcon 
              sx={{ 
                fontSize: 40,
                color: '#1976d2'
              }} 
            />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                color: '#1976d2'
              }}
            >
              Subscriptions
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchSubscriptions}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              New Subscription
            </Button>
          </Box>
        </Box>
        <Divider />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchSubscriptions}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Internal Subscriptions Table */}
      <Typography {...TABLE_STYLES.header}>
        <SendIcon />
        Internal Subscriptions
      </Typography>

      {!settingsValid ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            Please configure API settings to view internal subscriptions
          </Typography>
        </Paper>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : subscriptions.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No internal subscriptions found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow {...TABLE_STYLES.tableHead}>
                <TableCell>ID</TableCell>
                <TableCell>Subscriber</TableCell>
                <TableCell>Subscription</TableCell>
                <TableCell>Request Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.map((subscription) => (
                <TableRow
                  key={subscription.id}
                  {...TABLE_STYLES.tableRow}
                >
                  <TableCell>{subscription.id}</TableCell>
                  <TableCell>{subscription.subscriber}</TableCell>
                  <TableCell>{subscription.subscription}</TableCell>
                  <TableCell>
                    {new Date(subscription.requestTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <ActionButtons 
                      subscription={subscription}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* External Subscriptions Table */}
      <ExternalSubscriptionsTable />

      {/* New Subscription Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Subscription</DialogTitle>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              label="Server"
              value={newSubscription.serverId}
              onChange={(e) => setNewSubscription(prev => ({
                ...prev,
                serverId: e.target.value
              }))}
              fullWidth
              required
              helperText={servers.length === 0 ? 
                "No external servers configured. Please add servers in Settings." : 
                "Select the server to create the subscription on"
              }
              error={servers.length === 0}
            >
              {servers.map((server) => (
                <MenuItem key={server.id} value={server.id}>
                  {server.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Topic Type"
              value={newSubscription.topictype}
              onChange={(e) => setNewSubscription(prev => ({
                ...prev,
                topictype: e.target.value
              }))}
              fullWidth
              required
              helperText="Select the type of topic to subscribe to"
            >
              {TOPIC_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Topic URI"
              fullWidth
              value={newSubscription.topic}
              onChange={(e) => setNewSubscription(prev => ({
                ...prev,
                topic: e.target.value
              }))}
              helperText="The URI of the logistics object to subscribe to (e.g., https://1r.example.com/logistics-objects/123)"
              error={newSubscription.topic && !isValidUrl(newSubscription.topic)}
              required
            />

            <TextField
              label="Subscriber URI"
              fullWidth
              value={newSubscription.subscriber}
              onChange={(e) => setNewSubscription(prev => ({
                ...prev,
                subscriber: e.target.value
              }))}
              helperText="The URI of the subscriber (e.g., https://1r.example.com/logistics-objects/456)"
              error={newSubscription.subscriber && !isValidUrl(newSubscription.subscriber)}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateSubscription}
            disabled={submitting || !isValidUrl(newSubscription.topic) || !isValidUrl(newSubscription.subscriber)}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add this Dialog component at the end */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Remove External Subscription</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will only remove the subscription from your local database. 
            The subscription will remain active on the external server.
          </Alert>
          <Typography sx={{ mt: 2 }}>
            Are you sure you want to remove this subscription from your local database?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Subscriptions;
