import React, { useState } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Divider,
  Typography,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Storage as DatabaseIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Send as SendIcon,
  Edit as EditIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  LocalShipping,
  Flight,
  Business,
  LocalPostOffice,
  AccountBalance
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo'; // Import the Logo component

const THEMES = {
  SHIPPER: { 
    color: '#2e7d32', // Green
    icon: <LocalShipping />, 
    label: 'Shipper',
    menuItemStyle: {
      backgroundColor: '#2e7d32',
      color: 'white',
      '&:hover': {
        backgroundColor: '#1b5e20'
      }
    }
  },
  FORWARDER: { 
    color: '#0288d1', // Blue
    icon: <Business />, 
    label: 'Forwarder',
    menuItemStyle: {
      backgroundColor: '#0288d1',
      color: 'white',
      '&:hover': {
        backgroundColor: '#01579b'
      }
    }
  },
  AIRLINE: { 
    color: '#d32f2f', // Red
    icon: <Flight />, 
    label: 'Airline',
    menuItemStyle: {
      backgroundColor: '#d32f2f',
      color: 'white',
      '&:hover': {
        backgroundColor: '#c62828'
      }
    }
  },
  POST: { 
    color: '#f57c00', // Orange
    icon: <LocalPostOffice />, 
    label: 'Post',
    menuItemStyle: {
      backgroundColor: '#f57c00',
      color: 'white',
      '&:hover': {
        backgroundColor: '#e65100'
      }
    }
  },
  CUSTOM: { 
    color: '#7b1fa2', // Purple
    icon: <AccountBalance />, 
    label: 'Custom',
    menuItemStyle: {
      backgroundColor: '#7b1fa2',
      color: 'white',
      '&:hover': {
        backgroundColor: '#6a1b9a'
      }
    }
  }
};

const Sidebar = ({ open, toggleDrawer }) => {
  // Initialize theme from localStorage or default to 'SHIPPER'
  const [selectedTheme, setSelectedTheme] = useState(() => 
    localStorage.getItem('userRole') || 'SHIPPER'
  );
  const navigate = useNavigate();
  const location = useLocation();

  const handleThemeChange = (event) => {
    const newTheme = event.target.value;
    setSelectedTheme(newTheme);
    localStorage.setItem('userRole', newTheme);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Database', icon: <DatabaseIcon />, path: '/' },
    { text: 'Create Object', icon: <AddIcon />, path: '/logistics-objects/create' },
    { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
    { text: 'Subscriptions', icon: <SendIcon />, path: '/subscriptions' },
    { text: 'Changes', icon: <EditIcon />, path: '/changes' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' }
  ];

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? 240 : 64,
        transition: 'width 0.2s ease-in-out',
        '& .MuiDrawer-paper': {
          width: open ? 240 : 64,
          transition: 'width 0.2s ease-in-out',
          overflowX: 'hidden',
          backgroundColor: THEMES[selectedTheme].color,
          color: 'white'
        }
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: open ? 'space-between' : 'center',
          p: 2,
          minHeight: 64
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          flex: 1,
          justifyContent: open ? 'flex-start' : 'center'
        }}>
          {open && (
            <>
              <Logo size={32} color="white" />
              <Typography 
                variant="h6" 
                noWrap 
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                  color: 'white'
                }}
              >
                ONE Record
              </Typography>
            </>
          )}
        </Box>
        <IconButton 
          onClick={toggleDrawer}
          sx={{ 
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.08)'
            }
          }}
        >
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>
      
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
      
      {open && (
        <Box sx={{ p: 2 }}>
          <FormControl fullWidth size="small">
            <Select
              value={selectedTheme}
              onChange={handleThemeChange}
              sx={{
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                  borderRadius: '8px',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 255, 255, 0.87)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'white',
                  borderWidth: '2px',
                },
                '& .MuiSvgIcon-root': {
                  color: 'white',
                },
                '& .MuiSelect-select': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  py: 1,
                }
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    mt: 1,
                    backgroundColor: '#424242',
                    backgroundImage: 'none',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.2)',
                  }
                }
              }}
            >
              {Object.entries(THEMES).map(([key, value]) => (
                <MenuItem 
                  key={key} 
                  value={key} 
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1.5,
                    mx: 0.5,
                    my: 0.25,
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    ...value.menuItemStyle,
                    '&.Mui-selected': {
                      ...value.menuItemStyle,
                      '&:hover': {
                        ...value.menuItemStyle['&:hover']
                      }
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    color: 'inherit'
                  }}>
                    {React.cloneElement(value.icon, { 
                      sx: { fontSize: 20 } 
                    })}
                  </Box>
                  <Typography sx={{ 
                    fontWeight: 500,
                    color: 'inherit'
                  }}>
                    {value.label}
                  </Typography>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            disablePadding 
            sx={{ display: 'block' }}
          >
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                backgroundColor: 
                  location.pathname === item.path 
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.12)'
                }
              }}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: open ? 1 : 0,
                  '& .MuiListItemText-primary': {
                    color: 'white',
                    fontWeight: location.pathname === item.path ? 600 : 400
                  }
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
