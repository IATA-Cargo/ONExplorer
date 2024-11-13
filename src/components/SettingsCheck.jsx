import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SettingsCheck = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const baseUrl = localStorage.getItem('baseUrl');
    const token = localStorage.getItem('token');
    
    if (!baseUrl || !token) {
      navigate('/settings');
    }
  }, [navigate]);

  return null;
};

export default SettingsCheck;
