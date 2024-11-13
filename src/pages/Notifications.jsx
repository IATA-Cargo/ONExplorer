import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AddBox as AddBoxIcon
} from '@mui/icons-material';

// Add this function to check if object exists in external database
const isObjectInExternalDB = (notification) => {
  try {
    const logisticsObjectUrl = new URL(notification.logisticsObject);
    const server = logisticsObjectUrl.origin;
    const id = logisticsObjectUrl.pathname.split('/').pop();
    
    const existingObjects = JSON.parse(localStorage.getItem('externalLogisticsObjects') || '[]');
    return existingObjects.some(obj => obj.id === id && obj.server === server);
  } catch (err) {
    console.error('Error checking external objects:', err);
    return false;
  }
};

// Styled NotificationItem with enhanced visuals
const NotificationItem = ({ notification, onDelete, onAddToExternal }) => {
  const isExternal = isObjectInExternalDB(notification);
  
  return (
    <ListItem
      sx={{
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.04)',
          transition: 'background-color 0.3s ease',
        },
        borderRadius: 1,
        my: 1,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
      }}
      secondaryAction={
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {!isExternal && (
            <Tooltip title="Add to External Objects">
              <IconButton
                edge="end"
                aria-label="add to external objects"
                onClick={() => onAddToExternal(notification)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'primary.light',
                    color: 'white',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <AddBoxIcon />
              </IconButton>
            </Tooltip>
          )}
          <IconButton
            edge="end"
            aria-label="delete"
            onClick={() => onDelete(notification.id)}
            sx={{
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'white',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      }
    >
      <ListItemText
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              component="span" 
              variant="h6"
              sx={{ 
                fontSize: '1rem',
                fontWeight: 500,
                color: 'primary.main'
              }}
            >
              {notification.title}
            </Typography>
            <Chip 
              label={notification.eventType.replace('LOGISTICS_OBJECT_', '')} 
              size="small"
              color={
                notification.eventType.includes('CREATED') ? 'success' :
                notification.eventType.includes('UPDATED') ? 'warning' :
                'info'
              }
              sx={{ 
                fontWeight: 500,
                borderRadius: 1,
              }}
            />
          </Box>
        }
        secondary={
          <Box sx={{ mt: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
              <Chip
                label={notification.logisticsObjectType.split('#').pop()}
                size="small"
                variant="outlined"
                sx={{ borderRadius: 1 }}
              />
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {new Intl.DateTimeFormat('en-US', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                }).format(new Date(notification.timestamp))}
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.875rem',
                wordBreak: 'break-all'
              }}
            >
              {notification.logisticsObject}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNotifications = () => {
      try {
        setLoading(true);
        const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        setNotifications(storedNotifications);
        setError(null);
      } catch (err) {
        console.error('Error loading notifications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const handleDelete = async (notificationId) => {
    try {
      const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const updatedNotifications = storedNotifications.filter(
        notification => notification.id !== notificationId
      );
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      setNotifications(updatedNotifications);
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const fetchNotifications = () => {
    const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    setNotifications(storedNotifications);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  const handleAddToExternalObjects = (notification) => {
    try {
      const logisticsObjectUrl = new URL(notification.logisticsObject);
      const server = logisticsObjectUrl.origin;
      const id = logisticsObjectUrl.pathname.split('/').pop();

      const externalObject = {
        id: id,
        serverId: server,
        server: server,
        type: notification.logisticsObjectType.split('#').pop(),
        description: `Added from notification: ${notification.eventType}`,
      };

      const existingObjects = JSON.parse(localStorage.getItem('externalLogisticsObjects') || '[]');
      
      if (!existingObjects.some(obj => obj.id === id && obj.server === server)) {
        const updatedObjects = [...existingObjects, externalObject];
        localStorage.setItem('externalLogisticsObjects', JSON.stringify(updatedObjects));
        console.log('Added to external objects:', externalObject);
        setNotifications([...notifications]);
      }
    } catch (err) {
      console.error('Error adding to external objects:', err);
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          backgroundColor: 'primary.main',
          color: 'white',
          borderRadius: 2
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <NotificationsIcon sx={{ fontSize: 40 }} />
            <Typography variant="h4" sx={{ fontWeight: 500 }}>
              Notifications
            </Typography>
          </Box>
          
          <Button
            variant="contained"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={fetchNotifications}
            disabled={loading}
            sx={{ 
              color: 'primary.main',
              bgcolor: 'white',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          variant="filled"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchNotifications}
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
      ) : notifications.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'grey.50'
          }}
        >
          <InfoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No notifications yet
          </Typography>
        </Paper>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            bgcolor: 'transparent'
          }}
        >
          <List sx={{ p: 0 }}>
            {notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onDelete={handleDelete}
                onAddToExternal={handleAddToExternalObjects}
              />
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Notifications;
