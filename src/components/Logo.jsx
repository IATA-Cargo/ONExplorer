import React from 'react';
import { Box } from '@mui/material';
import oneRecordLogo from '../assets/images/oneRecord.png';

const Logo = ({ size = 32, color = 'white' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      <img 
        src={oneRecordLogo}
        alt="ONE Record Logo"
        style={{
          height: size,
          width: 'auto'
        }}
      />
    </Box>
  );
};

export default Logo;
