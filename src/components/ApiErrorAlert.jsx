import React from 'react';
import { Alert, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const ApiErrorAlert = ({ error, onRetry }) => {
  const navigate = useNavigate();

  const handleSettingsClick = () => {
    navigate('/settings');
  };

  if (error?.status === 401) {
    return (
      <Alert 
        severity="error"
        action={
          <Button 
            color="inherit" 
            size="small" 
            onClick={handleSettingsClick}
          >
            Go to Settings
          </Button>
        }
      >
        Unauthorized access. Please check your API token in settings.
      </Alert>
    );
  }

  return (
    <Alert 
      severity="error"
      action={
        onRetry && (
          <Button 
            color="inherit" 
            size="small" 
            onClick={onRetry}
          >
            Retry
          </Button>
        )
      }
    >
      {error?.message || 'An error occurred'}
    </Alert>
  );
};

export default ApiErrorAlert;
