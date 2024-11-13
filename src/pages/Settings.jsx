import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';

const Settings = () => {
  // Internal API settings
  const [internalSettings, setInternalSettings] = useState({
    baseUrl: localStorage.getItem('baseUrl') || '',
    token: localStorage.getItem('token') || ''
  });

  // External servers
  const [servers, setServers] = useState(() => {
    const savedServers = localStorage.getItem('externalServers');
    return savedServers ? JSON.parse(savedServers) : [];
  });

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [newServer, setNewServer] = useState({
    name: '',
    baseUrl: '',
    token: '',
    id: ''
  });

  // Error states
  const [error, setError] = useState(null);
  const [dialogError, setDialogError] = useState(null);

  // Save internal settings
  const handleInternalSave = () => {
    try {
      localStorage.setItem('baseUrl', internalSettings.baseUrl.trim());
      localStorage.setItem('token', internalSettings.token.trim());
      setError(null);
      // Navigate to home page after saving settings
      window.location.href = '/';
    } catch (err) {
      setError('Failed to save settings: ' + err.message);
    }
  };

  // Save external servers
  const handleServerSave = () => {
    if (!newServer.name || !newServer.baseUrl || !newServer.token) {
      setDialogError('All fields are required');
      return;
    }

    try {
      const serverToSave = {
        ...newServer,
        id: editingServer !== null ? newServer.id : Date.now().toString() // Generate new ID for new servers
      };

      let updatedServers;
      if (editingServer !== null) {
        updatedServers = servers.map((server, index) =>
          index === editingServer ? serverToSave : server
        );
      } else {
        updatedServers = [...servers, serverToSave];
      }

      localStorage.setItem('externalServers', JSON.stringify(updatedServers));
      setServers(updatedServers);
      handleCloseDialog();
    } catch (err) {
      setDialogError('Failed to save server: ' + err.message);
    }
  };

  const handleDeleteServer = (index) => {
    const updatedServers = servers.filter((_, i) => i !== index);
    localStorage.setItem('externalServers', JSON.stringify(updatedServers));
    setServers(updatedServers);
  };

  const handleEditServer = (index) => {
    setEditingServer(index);
    setNewServer(servers[index]);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingServer(null);
    setNewServer({ name: '', baseUrl: '', token: '', id: '' });
    setDialogError(null);
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 2,
          mb: 3
        }}>
          <SettingsIcon sx={{ fontSize: 40, color: '#1976d2' }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2' }}>
            Settings
          </Typography>
        </Box>
        <Divider />
      </Box>

      {/* Internal API Settings */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Internal API Settings</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Base URL"
            value={internalSettings.baseUrl}
            onChange={(e) => setInternalSettings(prev => ({
              ...prev,
              baseUrl: e.target.value
            }))}
            fullWidth
            helperText="The base URL of your ONE Record server"
          />
          <TextField
            label="JWT Token"
            value={internalSettings.token}
            onChange={(e) => setInternalSettings(prev => ({
              ...prev,
              token: e.target.value
            }))}
            fullWidth
            type="password"
            helperText="Your JWT authentication token"
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          <Button 
            variant="contained" 
            onClick={handleInternalSave}
            disabled={!internalSettings.baseUrl || !internalSettings.token}
          >
            Save Internal Settings
          </Button>
        </Box>
      </Paper>

      {/* External Servers */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3 
        }}>
          <Typography variant="h6">External Servers</Typography>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setOpenDialog(true)}
          >
            Add Server
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Base URL</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {servers.map((server, index) => (
                <TableRow key={index}>
                  <TableCell>{server.name}</TableCell>
                  <TableCell>{server.baseUrl}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Edit">
                        <IconButton onClick={() => handleEditServer(index)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          color="error"
                          onClick={() => handleDeleteServer(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {servers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography color="textSecondary">
                      No external servers configured
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit Server Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingServer !== null ? 'Edit Server' : 'Add New Server'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {dialogError && (
              <Alert severity="error">
                {dialogError}
              </Alert>
            )}
            <TextField
              label="Server Name"
              value={newServer.name}
              onChange={(e) => setNewServer(prev => ({
                ...prev,
                name: e.target.value
              }))}
              fullWidth
              required
            />
            <TextField
              label="Base URL"
              value={newServer.baseUrl}
              onChange={(e) => setNewServer(prev => ({
                ...prev,
                baseUrl: e.target.value
              }))}
              fullWidth
              required
            />
            <TextField
              label="JWT Token"
              value={newServer.token}
              onChange={(e) => setNewServer(prev => ({
                ...prev,
                token: e.target.value
              }))}
              fullWidth
              type="password"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            variant="contained"
            onClick={handleServerSave}
            disabled={!newServer.name || !newServer.baseUrl || !newServer.token}
          >
            {editingServer !== null ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
