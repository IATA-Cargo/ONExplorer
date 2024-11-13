import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { apiCall, externalApiCall } from '../utils/api';

const SubscriptionDialog = ({ open, onClose, objectId }) => {
  const [selectedServer, setSelectedServer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [servers, setServers] = useState(
    JSON.parse(localStorage.getItem('externalServers') || '[]')
  );

  const handleSubmit = async () => {
    if (!selectedServer) return;

    try {
      setLoading(true);
      setError(null);
      const serverConfig = servers.find(s => s.baseUrl === selectedServer);
      const encodedTopic = encodeURIComponent(objectId);
      
      const externalResponse = await externalApiCall(
        serverConfig.baseUrl,
        `/subscriptions?topicType=https://onerecord.iata.org/ns/api%23LOGISTICS_OBJECT_IDENTIFIER&topic=${encodedTopic}`,
        {
          method: 'GET',
          server: {
            token: serverConfig.token
          }
        }
      );

      const internalResponse = await apiCall(
        '/subscriptions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/ld+json'
          },
          body: JSON.stringify(externalResponse)
        }
      );

      console.log('Subscription created:', internalResponse);
      onClose(true);
    } catch (err) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Subscribe to Logistics Object</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select Server</InputLabel>
          <Select
            value={selectedServer}
            onChange={(e) => setSelectedServer(e.target.value)}
            label="Select Server"
          >
            {servers.map((server) => (
              <MenuItem key={server.baseUrl} value={server.baseUrl}>
                {server.name || server.baseUrl}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!selectedServer || loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Subscribe'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubscriptionDialog; 