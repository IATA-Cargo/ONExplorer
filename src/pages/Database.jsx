import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Tooltip,
  Button
} from '@mui/material';
import {
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  FlightTakeoff as FlightTakeoffIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getLogisticsObjects } from '../utils/api';
import LogisticsObjectEdit from '../components/LogisticsObjectEdit';
import { validateSettings } from '../utils/settingsValidator';
import SubscriptionDialog from '../components/SubscriptionDialog';

// Add this constant at the top of the file, after imports
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

const cleanupItem = (item) => {
  
  return {
    id: item['@id'].split('/').pop(),
    type: Array.isArray(item['@type']) 
        ? item['@type']
            .filter(t => t !== 'https://onerecord.iata.org/ns/cargo#LogisticsObject')[0]?.split('#').pop() 
        : 'test'|| 'Unknown Type',
    description: item['https://onerecord.iata.org/ns/cargo#description'] || 'No description available',
    // Add any other properties you need to clean up
  };
};

const Database = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState('');
  const [types, setTypes] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [externalObjects, setExternalObjects] = useState([]);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedObjectForSubscription, setSelectedObjectForSubscription] = useState(null);
  const [settingsValid, setSettingsValid] = useState(false);

  useEffect(() => {
    const { isValid } = validateSettings();
    setSettingsValid(isValid);
  }, []);

  useEffect(() => {
    if (settingsValid) {
      fetchData();
    }
  }, [settingsValid]);

  useEffect(() => {
    // Load external objects from localStorage on component mount
    const savedExternalObjects = localStorage.getItem('externalLogisticsObjects');
    if (savedExternalObjects) {
      setExternalObjects(JSON.parse(savedExternalObjects));
    }
  }, []);

  // Extract unique types and set filtered data
  useEffect(() => {
    const uniqueTypes = [...new Set(data.map(item => item.type))];
    setTypes(uniqueTypes);
    filterData(selectedType);
  }, [data, selectedType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await getLogisticsObjects('https%3A%2F%2Fonerecord.iata.org%2Fns%2Fcargo%23LogisticsObject');
      
      // Check if response is an array, if not convert it to an array
      const rawData = response['@graph'] ? response['@graph'] : [response];
      
      // Clean up each item in the array
      const cleanedData = rawData.map(cleanupItem);
      
      setData(cleanedData);
      setFilteredData(cleanedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
      
    } finally {
      setLoading(false);
    }
  };

  const filterData = (type) => {
    if (!type) {
      setFilteredData(data);
    } else {
      setFilteredData(data.filter(item => item.type === type));
    }
  };

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };

  const clearFilter = () => {
    setSelectedType('');
  };

  // Action Menu handlers
  const handleView = (item) => {
    navigate(`/logistics-objects/${item.id}`, {
      state: { 
        isExternal: false,
        serverUrl: localStorage.getItem('baseUrl'),
        token: localStorage.getItem('token')
      }
    });
  };

  const handleEdit = (item, isExternal = false) => {
    let serverDetails;
    
    if (isExternal) {
      // Get external server config from localStorage
      const externalServers = JSON.parse(localStorage.getItem('externalServers') || '[]');
      const serverConfig = externalServers.find(s => s.baseUrl === item.server);
      
      serverDetails = {
        baseUrl: item.server,
        token: serverConfig?.token
      };
    } else {
      // Use internal server config
      const baseUrl = localStorage.getItem('baseUrl');
      serverDetails = {
        baseUrl,
        token: localStorage.getItem('token')
      };
    }

    setSelectedItem({
      ...item,
      id: item.id,
      serverDetails
    });
    setEditDialogOpen(true);
  };

  // Add handler for dialog close
  const handleEditClose = () => {
    setEditDialogOpen(false);
    // Optionally refresh the data after edit
    fetchData();
  };

  // Apply filters whenever data, type filter, or search changes
  useEffect(() => {
    applyFilters();
  }, [data, selectedType, searchId]);

  const applyFilters = () => {
    let filtered = [...data];

    // Apply type filter
    if (selectedType) {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Apply ID search
    if (searchId) {
      filtered = filtered.filter(item => 
        item.id.toLowerCase().includes(searchId.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const handleSearchChange = (event) => {
    setSearchId(event.target.value);
  };

  const clearSearch = () => {
    setSearchId('');
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchData();
    } finally {
      setRefreshing(false);
    }
  };
  
  const handleSubscribe = (row) => {
    setSelectedObjectForSubscription(row);
    setSubscriptionDialogOpen(true);
  };

  const handleDeleteExternalObject = (object) => {
    const updatedObjects = externalObjects.filter(obj => obj.id !== object.id);
    setExternalObjects(updatedObjects);
    localStorage.setItem('externalLogisticsObjects', JSON.stringify(updatedObjects));
  };

  const ExternalLogisticsObjectsTable = () => (
    <>
      <Typography {...TABLE_STYLES.header} sx={{ mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <InventoryIcon />
        External Logistics Objects
      </Typography>
      {externalObjects.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary">
            No external logistics objects found
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow {...TABLE_STYLES.tableHead}>
                <TableCell>Server</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {externalObjects.map((row) => (
                <TableRow
                  key={row.id}
                  {...TABLE_STYLES.tableRow}
                >
                  <TableCell>{row.server}</TableCell>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>
                    <Box sx={{
                      backgroundColor: 
                        row.type === 'Shipment' ? '#e3f2fd' :
                        row.type === 'Booking' ? '#f3e5f5' :
                        '#e8f5e9',
                      color: 
                        row.type === 'Shipment' ? '#1976d2' :
                        row.type === 'Booking' ? '#7b1fa2' :
                        '#2e7d32',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      fontSize: '0.875rem'
                    }}>
                      {row.type}
                    </Box>
                  </TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/external-logistics-objects/${row.serverId}/${row.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove from local database">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteExternalObject(row)}
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
    <Box>
      {/* Internal Objects Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        {/* Header and Controls */}
        <Box sx={{ mb: 3 }}>
          <Typography {...TABLE_STYLES.header}>
            <LocalShippingIcon />
            Internal Logistics Objects
          </Typography>
          
          {/* Filters and Controls */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={selectedType}
                  onChange={handleTypeChange}
                  label="Filter by Type"
                  endAdornment={
                    selectedType && (
                      <InputAdornment position="end">
                        <IconButton onClick={clearFilter} size="small">
                          <ClearIcon />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                >
                  <MenuItem value="">All Types</MenuItem>
                  {types.map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Search by ID"
                value={searchId}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchId && (
                    <InputAdornment position="end">
                      <IconButton onClick={clearSearch} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleRefresh}
                disabled={refreshing}
                size="small"
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading or Settings Invalid State */}
        {!settingsValid ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              Please configure API settings to view internal logistics objects
            </Typography>
          </Box>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          /* Internal Data Table */
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.type}
                        size="small"
                        sx={{
                          backgroundColor: 
                            row.type === 'Shipment' ? '#e3f2fd' :
                            row.type === 'Booking' ? '#f3e5f5' :
                            '#e8f5e9',
                          color: 
                            row.type === 'Shipment' ? '#1976d2' :
                            row.type === 'Booking' ? '#7b1fa2' :
                            '#2e7d32',
                        }}
                      />
                    </TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleView(row)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(row, false)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Subscribe">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleSubscribe(row)}
                          >
                            <MessageIcon fontSize="small" />
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
      </Paper>

      {/* External Objects Section */}
      <Paper sx={{ p: 3, bgcolor: '#fafafa' }}>
        <Typography {...TABLE_STYLES.header} sx={{ color: '#424242' }}>
          <InventoryIcon />
          External Logistics Objects
        </Typography>
        
        {externalObjects.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">
              No external logistics objects found
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Server</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {externalObjects.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.server}</TableCell>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.type}
                        size="small"
                        sx={{
                          backgroundColor: '#f5f5f5',
                          color: '#424242'
                        }}
                      />
                    </TableCell>
                    <TableCell>{row.description}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              // Get the external server config from localStorage
                              const externalServers = JSON.parse(localStorage.getItem('externalServers') || '[]');
                              const serverConfig = externalServers.find(s => s.baseUrl === row.server);
                              
                              navigate(`/logistics-objects/${row.id}`, {
                                state: { 
                                  isExternal: true,
                                  serverUrl: row.server,
                                  token: serverConfig?.token
                                }
                              });
                            }}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(row, true)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove from local database">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteExternalObject(row)}
                          >
                            <CloseIcon fontSize="small" />
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
      </Paper>

      {/* Add LogisticsObjectEdit Dialog */}
      {selectedItem && editDialogOpen && (
        <LogisticsObjectEdit
          objectId={selectedItem.id}
          objectType={selectedItem.type}
          serverDetails={selectedItem.serverDetails}
          onClose={handleEditClose}
        />
      )}

      {subscriptionDialogOpen && selectedObjectForSubscription && (
        <SubscriptionDialog
          open={subscriptionDialogOpen}
          onClose={(success) => {
            setSubscriptionDialogOpen(false);
            setSelectedObjectForSubscription(null);
            if (success) {
              // Optionally show a success message or refresh data
            }
          }}
          objectId={`${localStorage.getItem('baseUrl')}/logistics-objects/${selectedObjectForSubscription.id}`}
        />
      )}
    </Box>
  );
};

export default Database;
