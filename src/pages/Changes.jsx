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
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Backdrop
} from '@mui/material';
import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { getLogisticsObjects, apiCall } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
    REQUEST_PENDING: { bg: '#fff3e0', color: '#e65100', label: 'PENDING' },
    REQUEST_ACCEPTED: { bg: '#e8f5e9', color: '#2e7d32', label: 'ACCEPTED' },
    REQUEST_REJECTED: { bg: '#ffebee', color: '#c62828', label: 'REJECTED' },
    REQUEST_FAILED: { bg: '#fce4ec', color: '#c2185b', label: 'FAILED' }
};

const ActionButtons = ({ change, onStatusUpdate }) => {
  const navigate = useNavigate();
  const isPending = change.status === 'REQUEST_PENDING';
  
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
      <Tooltip title="View Details">
        <IconButton
          color="primary"
          onClick={() => navigate(`/changes-request/${change.id}`)}
        >
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
      
      <Tooltip title={isPending ? "Approve" : "Already processed"}>
        <span>
          <IconButton
            color="success"
            onClick={() => onStatusUpdate(change.id, 'REQUEST_ACCEPTED')}
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
            onClick={() => onStatusUpdate(change.id, 'REQUEST_REJECTED')}
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

const Changes = () => {
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchChanges();
  }, []);

  const fetchChanges = async () => {
    try {
      setLoading(true);
      const response = await getLogisticsObjects('https%3A%2F%2Fonerecord.iata.org%2Fns%2Fapi%23ChangeRequest');
      
      const rawData = response['@graph'] ? response['@graph'] : [response];
      const cleanArray = rawData.filter(value => Object.keys(value).length !== 0);
      const cleanedData = cleanArray.map(cleanupItem);

      // Sort changes by request time in descending order (newest first)
      const sortedChanges = cleanedData.sort((a, b) => {
        return new Date(b.requestTime) - new Date(a.requestTime);
      });

      setChanges(sortedChanges);
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
      requestor: item['https://onerecord.iata.org/ns/api#isRequestedBy']['@id'],
      requestTime: item['https://onerecord.iata.org/ns/api#isRequestedAt']['@value'],
      change: item['https://onerecord.iata.org/ns/api#hasChange']['@id'].split('/').pop()
    };
  };

  const handleStatusUpdate = async (changeId, newStatus) => {
    try {
      setActionLoading(true);
      
      await apiCall(`/action-requests/${changeId}?status=${newStatus}`, {
        method: 'PATCH'
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchChanges();
      
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setTimeout(() => {
        setActionLoading(false);
      }, 300);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
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

      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EditIcon 
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
              Changes
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchChanges}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>
        <Divider />
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchChanges}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : changes.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No change requests found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>ID</TableCell>
                <TableCell>Requestor</TableCell>
                <TableCell>Change</TableCell>
                <TableCell>Request Time</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {changes.map((change) => (
                <TableRow
                  key={change.id}
                  sx={{ 
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    backgroundColor: change.status !== 'pending' 
                      ? 'rgba(0, 0, 0, 0.02)' 
                      : 'inherit'
                  }}
                >
                  <TableCell>{change.id}</TableCell>
                  <TableCell>{change.requestor}</TableCell>
                  <TableCell>{change.change}</TableCell>
                  <TableCell>
                    {new Date(change.requestTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <ActionButtons 
                      change={change}
                      onStatusUpdate={handleStatusUpdate}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Changes;
