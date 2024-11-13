import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Switch,
  Stack,
  Link,
} from '@mui/material';

import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent
  } from '@mui/lab';
  
import {
  ArrowBack as ArrowBackIcon,
  LocalShipping as LocalShippingIcon,
  AccessTime as AccessTimeIcon,
  Description as DescriptionIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  ContentCopy as ContentCopyIcon,
  Event as EventIcon,
  LocationOn as LocationOnIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  Visibility as VisibilityIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { apiCall } from '../utils/api';
import jsonld from 'jsonld';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';


// Update EVENT_TYPES constant with standardized codes
const EVENT_TYPES = [
  { code: 'FMA', name: 'Freight Management Acceptance', description: 'Acceptance of freight for management' },
  { code: 'RCS', name: 'Ready for Carriage Status', description: 'Shipment is ready for carriage' },
  { code: 'DEP', name: 'Flight Departure', description: 'Flight has departed' },
  { code: 'ARR', name: 'Arrived Flight', description: 'Flight has arrived' },
  { code: 'TFD', name: 'Transferred', description: 'Shipment has been transferred' },
  { code: 'NFD', name: 'Notification of Delivery', description: 'Delivery notification sent' },
  { code: 'AWD', name: 'Arrived and Waiting Delivery', description: 'Shipment arrived and awaiting delivery' },
  { code: 'DLV', name: 'Delivered', description: 'Shipment has been delivered' },
  { code: 'FOH', name: 'Freight On-Hand', description: 'Freight is on hand' },
  { code: 'RCT', name: 'Ready for Collection Time', description: 'Ready for collection' },
  { code: 'RCF', name: 'Received from Flight', description: 'Received from flight' },
  { code: 'CUM', name: 'Custom filing', description: 'Custom filing'}
];

// Add EVENT_TIME_TYPES constant
const EVENT_TIME_TYPES = [
  { value: 'ACTUAL', label: 'Actual' },
  { value: 'ESTIMATED', label: 'Estimated' },
  { value: 'EXPECTED', label: 'Expected' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'REQUESTED', label: 'Requested' }
];

// Add this function before the component
const formatEventToJsonLd = (eventData, logisticsObjectId) => {
  const selectedEventType = EVENT_TYPES.find(type => type.code === eventData.type);

  return {
    "@context": {
      "cargo": "https://onerecord.iata.org/ns/cargo#"
    },
    "@type": "cargo:LogisticsEvent",
    "cargo:creationDate": {
      "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
      "@value": new Date().toISOString()
    },
    "cargo:eventDate": {
      "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
      "@value": eventData.timestamp
    },
    "cargo:eventCode": {
      "@type": "cargo:CodeListElement",
      "cargo:code": eventData.type,
      "cargo:codeListName": selectedEventType?.name || ''
    },
    "cargo:eventName": eventData.description,
    "cargo:eventTimeType": {
      "@id": `cargo:${eventData.timeType}`,
      "@type": "cargo:EventTimeType"
    },
    "cargo:partialEventIndicator": eventData.partialEventIndicator

  };
};

const LogisticsObjectView = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [sendingEvent, setSendingEvent] = useState(false);
  const [eventData, setEventData] = useState({
    type: '',
    name: '',
    description: '',
    location: '',
    timestamp: new Date().toISOString(),
    timeType: 'ACTUAL',
    partialEventIndicator: false
  });
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [auditTrail, setAuditTrail] = useState(null);
  const [loadingAuditTrail, setLoadingAuditTrail] = useState(false);

  // Get server info from location state
  const serverUrl = location.state?.serverUrl;
  const token = location.state?.token;

  // Add this to determine if the object is external
  const isExternalObject = serverUrl !== localStorage.getItem('baseUrl');

  useEffect(() => {
    if (!serverUrl || !token) {
      setError('Server configuration not found');
      return;
    }
    fetchObjectData();
    fetchEvents();
    fetchAuditTrail();
  }, [id, serverUrl, token]);

  const frame = {
    "@context": {
      "@vocab": "https://onerecord.iata.org/ns/cargo#"
    }
  };

  const fetchObjectData = async () => {
    try {
      setLoading(true);
      
      if (!serverUrl || !token) {
        throw new Error('Server configuration not found');
      }

      const response = await fetch(`${serverUrl}/logistics-objects/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/ld+json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to fetch logistics object: ${response.statusText}`);
      }

      const jsonData = await response.json();

      if (!jsonData) {
        throw new Error('No data received from server');
      }

      // Add safety checks for JSON-LD framing
      const framedResponse = await jsonld.frame(jsonData, {
        "@context": {
          "@vocab": "https://onerecord.iata.org/ns/cargo#"
        },
        "@embed": "@always"
      });
      

      let processedData;
      if (framedResponse['@graph'] && framedResponse['@graph'].length > 0) {
        // Extract the ID portion from the request URL
        const idPart = id.includes('logistics-objects/') 
          ? id.split('logistics-objects/')[1]
          : id;

        // Find the main object with the matching ID
        processedData = framedResponse['@graph'].find(obj => 
          obj['@id'].includes(`/logistics-objects/${idPart}`)
        );

        if (!processedData) {
          throw new Error(`Logistics object with ID ${idPart} not found in framed data`);
        }
      } else if (framedResponse['@id']) {
        processedData = framedResponse;
      } else {
        throw new Error('Invalid data structure received');
      }

      
      if (!processedData) {
        throw new Error('Failed to process logistics object data');
      }

      setData(processedData);
      setError(null);
    } catch (err) {
      console.error('Error in fetchObjectData:', err);
      setError(err.message);
      
      if (err.status === 401) {
        navigate('/settings', { 
          state: { message: 'Please check your server configuration.' }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await fetch(`${serverUrl}/logistics-objects/${id}/logistics-events`, {
        headers: {
          'Accept': 'application/ld+json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const jsonData = await response.json();

      // Frame the JSON-LD response
      const framedResponse = await jsonld.frame(jsonData, {
        "@context": {
          "@vocab": "https://onerecord.iata.org/ns/cargo#"
        },
        "@embed": "@always"
      });
      
      if (framedResponse['@graph']) {
        // Find the Collection object
        const collection = framedResponse['@graph'].find(item => 
          item['@type'] === 'https://onerecord.iata.org/ns/api#Collection'
        );

        if (collection) {
          // Process each event
          const hasItems = collection['https://onerecord.iata.org/ns/api#hasItem'];
          const eventRefs = Array.isArray(hasItems) ? hasItems : [hasItems];
          
          const processedEvents = eventRefs
            .filter(Boolean)
            .map(eventRef => {
              const eventId = eventRef['@id'];
              const eventData = framedResponse['@graph'].find(item => item['@id'] === eventId);
              const eventCode = framedResponse['@graph'].find(item => 
                item['@id'] === eventData?.eventCode?.['@id']
              );

              if (!eventData) return null;

              return {
                id: eventId.split('/').pop(),
                creationDate: eventData.creationDate?.['@value'],
                eventDate: eventData.eventDate?.['@value'],
                eventName: eventData.eventName,
                eventCode: eventCode?.code || '',
                codeListName: eventCode?.codeListName || '',
                timeType: eventData.eventTimeType?.['@id']?.split('#')?.pop() || '',
                partialEventIndicator: eventData.partialEventIndicator?.['@value'] === 'true'
              };
            })
            .filter(Boolean); // Remove any null events

          setEvents(processedEvents);
        }
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  const fetchAuditTrail = async () => {
    try {
      setLoadingAuditTrail(true);
      const response = await fetch(`${serverUrl}/logistics-objects/${id}/audit-trail`, {
        headers: {
          'Accept': 'application/ld+json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAuditTrail(data);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
    } finally {
      setLoadingAuditTrail(false);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // Update the handleRefresh function to fetch both object data and events
  const handleRefresh = async () => {
    await fetchObjectData();
    await fetchEvents();
  };

  const handleSendEvent = async () => {
    try {
      setSendingEvent(true);
      const eventJsonLd = formatEventToJsonLd(eventData, id);
      
      const response = await fetch(`${serverUrl}/logistics-objects/${id}/logistics-events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/ld+json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventJsonLd)
      });

      if (!response.ok) {
        throw new Error('Failed to send event');
      }
      
      await fetchObjectData();
      await fetchEvents();
      setOpenEventDialog(false);
      setEventData({
        type: '',
        name: '',
        description: '',
        location: '',
        timestamp: new Date().toISOString(),
        timeType: 'ACTUAL',
        partialEventIndicator: false
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSendingEvent(false);
    }
  };

  const formatValue = (value, schema = null) => {
    if (value === null || value === undefined) {
      return <Typography color="text.secondary">-</Typography>;
    }

    // Handle primitive values with @value wrapper
    if (typeof value === 'object' && value['@value'] !== undefined) {
      return <Typography>{value['@value']}</Typography>;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return (
        <Stack spacing={1}>
          {value.map((item, index) => (
            <Box key={index}>{formatValue(item)}</Box>
          ))}
        </Stack>
      );
    }

    // Handle objects
    if (typeof value === 'object') {
      // Handle reference objects (with only @id)
      if (Object.keys(value).length === 1 && value['@id']) {
        if (isLogisticsObjectLink(value['@id'])) {
          const externalServerUrl = new URL(value['@id']).origin;
          const externalServers = JSON.parse(localStorage.getItem('externalServers') || '[]');
          const serverConfig = externalServers.find(s => s.baseUrl === externalServerUrl);
          return (
            <Button
            onClick={() => {
              navigate(`/logistics-objects/${value['@id'].split('/').pop()}`, {
                replace: false,
                state: { 
                  serverUrl: externalServerUrl || serverUrl,
                  token: serverConfig?.token || token
                }
              });
              window.location.reload();
            }}
            startIcon={<LocalShippingIcon />}
            sx={{ textTransform: 'none' }}
          >
            View Logistics Object
          </Button>
          )
        }
        if (isExternalLink(value['@id'])) {
          return (
            <Link 
              component={RouterLink} 
              to={value['@id'].replace(serverUrl, '')}
              color="primary"
            >
              {value['@id'].split('/').pop()}
            </Link>
          );
        }
        return <Typography>{value['@id']}</Typography>;
      }

      // Handle complex objects (rest of the code remains the same)
      return (
        <Box sx={{ pl: 2, borderLeft: '2px solid #e0e0e0' }}>
          {Object.entries(value)
            .filter(([key]) => !key.startsWith('@'))
            .map(([key, val]) => (
              <Box key={key} sx={{ mb: 1 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ display: 'block', mb: 0.5 }}
                >
                  {key.split('#').pop()?.replace(/([A-Z])/g, ' $1').trim() || key}:
                </Typography>
                {formatValue(val)}
              </Box>
            ))}
        </Box>
      );
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      return <Typography>{value ? 'Yes' : 'No'}</Typography>;
    }

    // Handle dates
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
      return <Typography>{new Date(value).toLocaleString()}</Typography>;
    }

    // Handle simple values (strings, numbers)
    return <Typography>{String(value)}</Typography>;
  };

  // Helper functions to handle logistics object links
  const isLogisticsObjectLink = (url) => {
    try {
      return url.includes('/logistics-objects/');
    } catch {
      return false;
    }
  };

  const isExternalLink = (url) => {
    try {
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const renderLink = (url) => {
    if (!url) return <Typography>-</Typography>;
    
    if (isLogisticsObjectLink(url)) {
      const isExternal = !url.startsWith(serverUrl);
      const objectId = url.split('/logistics-objects/')[1];
      
      if (isExternal) {
        const externalServerUrl = new URL(url).origin;
        const externalServers = JSON.parse(localStorage.getItem('externalServers') || '[]');
        const serverConfig = externalServers.find(s => s.baseUrl === externalServerUrl);

        return (
          <Button
            onClick={() => {
              navigate(`/logistics-objects/${objectId}`, {
                replace: false,
                state: { 
                  isExternal: true,
                  serverUrl: externalServerUrl,
                  token: serverConfig?.token
                }
              });
              window.location.reload();
            }}
            startIcon={<LocalShippingIcon />}
            sx={{ textTransform: 'none' }}
          >
            View External Logistics Object
          </Button>
        );
      } else {
        return (
          <Button
            onClick={() => {
              navigate(`/logistics-objects/${objectId}`, {
                replace: false,
                state: { 
                  isExternal: false,
                  serverUrl: serverUrl,
                  token: token
                }
              });
              window.location.reload();
            }}
            startIcon={<LocalShippingIcon />}
            sx={{ textTransform: 'none' }}
          >
            View Logistics Object
          </Button>
        );
      }
    } else if (isExternalLink(url)) {
      return (
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ 
            wordBreak: 'break-all',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: 'primary.main',
            textDecoration: 'none',
            visibility: 'visible',
            '&:hover': {
              textDecoration: 'underline',
              color: 'primary.dark'
            }
          }}
        >
          <VisibilityIcon 
            sx={{ 
              fontSize: 16,
              color: 'primary.main'
            }} 
          />
          {url}
        </Link>
      );
    }
    return null;
  };

  const getObjectPath = (url) => {
    try {
      const path = new URL(url).pathname;
      const id = path.split('/logistics-objects/')[1];
      return `/logistics-objects/${id}`;
    } catch {
      return '#';
    }
  };

  const cleanupItem = (item) => {
  
    return {
      id: item['@id'].split('/').pop()
      // Add any other properties you need to clean up
    };
  };

  // Update the getEventColor function to match the actual event codes
  const getEventColor = (eventCode) => {
    const colorMap = {
      'FMA': 'info',     // Freight Management Acceptance
      'RCS': 'success',  // Ready for Carriage Status
      'DEP': 'primary',  // Flight Departure
      'ARR': 'primary',  // Arrived Flight
      'TFD': 'warning',  // Transferred
      'NFD': 'info',     // Notification of Delivery
      'AWD': 'warning',  // Arrived and Waiting Delivery
      'DLV': 'success',  // Delivered
      'FOH': 'info',     // Freight On-Hand
      'RCT': 'warning',  // Ready for Collection Time
      'RCF': 'primary'   // Received from Flight
    };
    return colorMap[eventCode] || 'grey';
  };

  const getStatusColor = (status) => {
    const colors = {
      'REQUEST_ACCEPTED': 'success',
      'REQUEST_FAILED': 'error',
      'REQUEST_PENDING': 'warning'
    };
    return colors[status.split('#')[1]] || 'default';
  };

  const renderAuditTrail = () => {
    if (!auditTrail) return null;

    // Check if @graph exists, if not, there are no change requests
    if (!auditTrail['@graph']) {
      return (
        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="audit-trail-content"
            id="audit-trail-header"
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventIcon sx={{ color: '#1976d2' }} />
              <Typography sx={{ color: '#1976d2' }}>Audit Trail</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {loadingAuditTrail ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="textSecondary">
                  No changes have been made to this object.
                  Latest revision: {auditTrail.hasLatestRevision?.['@value'] || '1'}
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      );
    }

    // Get and sort change requests by time (newest first)
    const changeRequests = auditTrail['@graph']
      ?.filter(item => item['@type'] === 'ChangeRequest')
      ?.sort((a, b) => {
        const timeA = new Date(a.isRequestedAt['@value']).getTime();
        const timeB = new Date(b.isRequestedAt['@value']).getTime();
        return timeB - timeA;
      }) || [];

    const changes = auditTrail['@graph']?.filter(item => item['@type'] === 'Change') || [];

    return (
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="audit-trail-content"
          id="audit-trail-header"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon sx={{ color: '#1976d2' }} />
            <Typography sx={{ color: '#1976d2' }}>
              Audit Trail {changeRequests.length > 0 && `(${changeRequests.length})`}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {loadingAuditTrail ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : changeRequests.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No changes have been made to this object.
                Latest revision: {auditTrail.hasLatestRevision?.['@value'] || '1'}
              </Typography>
            </Box>
          ) : (
            <Timeline>
              {changeRequests.map((request) => {
                const change = changes.find(c => c['@id'] === request.hasChange['@id']);
                const requestId = request['@id'].split('/').pop();
                
                return (
                  <TimelineItem key={request['@id']}>
                    <TimelineOppositeContent color="textSecondary">
                      {new Date(request.isRequestedAt['@value']).toLocaleString()}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color={getStatusColor(request.hasRequestStatus['@id'])} />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper elevation={3} sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" component="span">
                            {change?.hasDescription || 'Change Request'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" color="textSecondary">
                            Revision: {change?.hasRevision?.['@value']}
                          </Typography>
                          <Chip 
                            label={request.hasRequestStatus['@id'].split('#')[1]}
                            color={getStatusColor(request.hasRequestStatus['@id'])}
                            size="small"
                          />
                        </Box>
                        {renderChangeRequestLink(request['@id'])}
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderLogisticsEvents = () => {
    // Show loading state
    if (loadingEvents) {
      return (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        </Paper>
      );
    }

    // Always render the section, even with no events
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon color="primary" />
            Logistics Events {events.length > 0 && `(${events.length})`}
          </Typography>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setOpenEventDialog(true)}
            size="small"
          >
            Send Event
          </Button>
        </Box>

        {!events || events.length === 0 ? (
          <Box sx={{ 
            p: 3, 
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 1,
            border: '1px solid #e0e0e0'
          }}>
            <EventIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
            <Typography color="textSecondary">
              No logistics events have been recorded for this object yet.
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Click "Send Event" to record a new logistics event.
            </Typography>
          </Box>
        ) : (
          <Timeline>
            {events.map((event) => (
              <TimelineItem key={event.id}>
                <TimelineOppositeContent color="textSecondary">
                  <Typography variant="body2">
                    {new Date(event.eventDate).toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    {event.timeType}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot color={getEventColor(event.eventCode)}>
                    <EventIcon />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="subtitle1" component="span">
                      {event.eventCode} - {event.codeListName}
                    </Typography>
                    {event.partialEventIndicator && (
                      <Chip 
                        label="Partial" 
                        size="small" 
                        color="warning" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Box>
                  <Typography>{event.eventName}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Created: {new Date(event.creationDate).toLocaleString()}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Paper>
    );
  };

  const getServerDetailsForUrl = (url) => {
    if (!url) return null;
    
    // Get all configured servers
    const externalServers = JSON.parse(localStorage.getItem('externalServers') || '[]');
    const currentServer = {
      baseUrl: localStorage.getItem('baseUrl'),
      token: localStorage.getItem('token')
    };
    
    // Check if URL matches any configured server
    const urlOrigin = new URL(url).origin;
    
    if (urlOrigin === currentServer.baseUrl) {
      return currentServer;
    }
    
    const matchingServer = externalServers.find(server => url.startsWith(server.baseUrl));
    return matchingServer || null;
  };

  const renderChangeRequestLink = (url) => {
    const serverDetails = getServerDetailsForUrl(url);
    const changeRequestId = url.split('/action-requests/')[1];
    
    return (
      <Button
        component={RouterLink}
        to={`/changes-request/${changeRequestId}`}
        state={serverDetails ? {
          serverUrl: serverDetails.baseUrl,
          token: serverDetails.token
        } : undefined}
        startIcon={<DescriptionIcon />}
        sx={{ textTransform: 'none' }}
      >
        View Change Request
      </Button>
    );
  };

  const renderAuditTrailItem = (event) => (
    <TimelineItem>
      <TimelineOppositeContent color="textSecondary">
        {new Date(event.timestamp).toLocaleString()}
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot color="primary">
          <EventIcon />
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent>
        <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" component="h3">
            {event.type}
          </Typography>
          <Typography>{event.description}</Typography>
          {event.changeRequest && renderChangeRequestLink(event.changeRequest)}
        </Paper>
      </TimelineContent>
    </TimelineItem>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert 
          severity="error" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefresh}
            >
              Retry
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (!data || typeof data !== 'object') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          No valid data available for this logistics object
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2 
        }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Database
          </Button>
          {isExternalObject && (
            <Chip
              label="External Object"
              color="warning"
              icon={<InfoIcon />}
              sx={{ ml: 2 }}
              title={`Server: ${serverUrl}`}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <LocalShippingIcon 
            sx={{ 
              fontSize: 40, 
              color: isExternalObject ? 'warning.main' : 'primary.main' 
            }} 
          />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              Logistics Object Details
            </Typography>
            {isExternalObject && (
              <Typography variant="caption" color="text.secondary">
                From external server: {serverUrl}
              </Typography>
            )}
          </Box>
        </Box>
        <Divider />
      </Box>


      {/* Dynamic Content View - Updated */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ 
          mb: 3, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          color: '#1976d2'
        }}>
          <DescriptionIcon />
          Object Properties
        </Typography>
        <Grid container spacing={3}>
          {Object.entries(data || {})
            .filter(([key]) => !key.startsWith('@'))
            .map(([key, value]) => {
              if (value === undefined || value === null) return null;
              
              return (
                <Grid item xs={12} md={6} key={key}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2.5, 
                      backgroundColor: '#f8f9fa',
                      borderRadius: 2,
                      height: '100%',
                      border: '1px solid #e0e0e0',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }
                    }}
                  >
                    <Typography 
                      variant="subtitle2" 
                      color="primary"
                      sx={{ 
                        mb: 1.5,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        borderBottom: '2px solid #e3f2fd',
                        paddingBottom: 1
                      }}
                    >
                      {key.split('#').pop()?.replace(/([A-Z])/g, ' $1').trim() || key}
                    </Typography>
                    {formatValue(value)}
                  </Paper>
                </Grid>
              );
          })}
        </Grid>
      </Paper>

      {/* Logistics Events Section */}
      {renderLogisticsEvents()}

      {/* Audit Trail - Moved up */}
      {renderAuditTrail()}

      {/* Event Dialog */}
      <Dialog 
        open={openEventDialog} 
        onClose={() => !sendingEvent && setOpenEventDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Send Logistics Event</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              select
              label="Event Type"
              value={eventData.type}
              onChange={(e) => {
                const selectedType = EVENT_TYPES.find(type => type.code === e.target.value);
                setEventData(prev => ({ 
                  ...prev, 
                  type: e.target.value,
                  name: selectedType?.name || '',
                  description: selectedType?.description || ''
                }));
              }}
              fullWidth
              required
              helperText="Select the type of logistics event"
            >
              {EVENT_TYPES.map((type) => (
                <MenuItem key={type.code} value={type.code}>
                  <Box>
                    <Typography>
                      {type.code} - {type.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {type.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              select
              label="Time Type"
              value={eventData.timeType}
              onChange={(e) => setEventData(prev => ({ ...prev, timeType: e.target.value }))}
              fullWidth
              required
              helperText="Specify the nature of the event time"
            >
              {EVENT_TIME_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            
            <TextField
              label="Description"
              value={eventData.description}
              onChange={(e) => setEventData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              required
              helperText="Additional details about the event"
            />

            <TextField
              label="Location"
              value={eventData.location}
              onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
              fullWidth
              required
              helperText="Location where the event occurred"
            />

            <TextField
              label="Timestamp"
              type="datetime-local"
              value={eventData.timestamp.slice(0, 16)}
              onChange={(e) => setEventData(prev => ({ 
                ...prev, 
                timestamp: new Date(e.target.value).toISOString()
              }))}
              fullWidth
              required
              helperText="When the event occurred"
              InputLabelProps={{
                shrink: true,
              }}
            />

            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              bgcolor: 'background.paper',
              p: 1,
              borderRadius: 1
            }}>
              <Typography color="textSecondary">Partial Event</Typography>
              <Switch
                checked={eventData.partialEventIndicator}
                onChange={(e) => setEventData(prev => ({ 
                  ...prev, 
                  partialEventIndicator: e.target.checked 
                }))}
                inputProps={{ 'aria-label': 'partial event indicator' }}
              />
              <Typography variant="caption" color="textSecondary">
                Indicate if this is a partial event
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenEventDialog(false)}
            disabled={sendingEvent}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSendEvent}
            disabled={sendingEvent || !eventData.type || !eventData.description || !eventData.location}
            startIcon={sendingEvent ? <CircularProgress size={20} /> : null}
          >
            {sendingEvent ? 'Sending...' : 'Send Event'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Raw JSON-LD Viewer */}
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="raw-jsonld-content"
          id="raw-jsonld-header"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CodeIcon sx={{ color: '#1976d2' }} />
            <Typography sx={{ color: '#1976d2' }}>Raw JSON-LD</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ position: 'relative' }}>
            <Paper
              sx={{
                p: 2,
                backgroundColor: '#272822',
                color: '#f8f8f2',
                fontFamily: 'monospace',
                overflow: 'auto',
                maxHeight: '500px'
              }}
            >
              <Tooltip title="Copy to clipboard">
                <IconButton
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
              <pre style={{ margin: 0 }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            </Paper>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default LogisticsObjectView;
