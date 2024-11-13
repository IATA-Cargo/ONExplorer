import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import Sidebar from './components/Sidebar';
import Database from './pages/Database';
import LogisticsObjectView from './pages/LogisticsObjectView';
import CreateLogisticsObject from './pages/CreateLogisticsObject';
import Notifications from './pages/Notifications';
import Subscriptions from './pages/Subscriptions';
import SubscriptionRequestView from './pages/SubscriptionRequestView';
import Changes from './pages/Changes';
import ChangeRequestView from './pages/ChangeRequestView';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';

function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [notifications, setNotifications] = useState([]);

  // Calculate the server port based on the React app's port
  const getServerPort = () => {
    const clientPort = window.location.port || '3000';
    return parseInt(clientPort) + 1;
  };

  useEffect(() => {
    const serverPort = getServerPort();
    const eventSource = new EventSource(`http://localhost:${serverPort}/notifyServer`);
    
    eventSource.onmessage = (event) => {
      try {
        if (event.data.startsWith('Connected')) {
          console.log('SSE Connection established');
          return;
        }
        
        const jsonData = JSON.parse(event.data);
        const graphData = jsonData['@graph'] || [jsonData];
        
        const notificationObject = graphData.find(item => 
          item['@id'] && item['@id'].includes('/notifications/')
        );

        if (notificationObject) {
          const logisticsObjectId = notificationObject.hasLogisticsObject['@id'].split('/').pop();
          
          const eventType = notificationObject.hasEventType['@id'].split('#').pop();
          const validEventTypes = [
            'LOGISTICS_OBJECT_CREATED',
            'LOGISTICS_OBJECT_UPDATED',
            'LOGISTICS_EVENT_RECEIVED'
          ];
          
          if (!validEventTypes.includes(eventType)) {
            console.warn('Unknown event type:', eventType);
            return;
          }

          const processedNotification = {
            id: notificationObject['@id'],
            eventType: eventType,
            logisticsObject: notificationObject.hasLogisticsObject['@id'],
            logisticsObjectType: notificationObject.hasLogisticsObjectType['@value'],
            timestamp: new Date().toISOString(),
            title: `Logistics Object ${logisticsObjectId}`
          };
          
          const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
          if (!storedNotifications.some(n => n.id === processedNotification.id)) {
            const updatedNotifications = [...storedNotifications, processedNotification];
            localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
            setNotifications(updatedNotifications);
            console.log('Processed notification:', processedNotification);
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
        console.error('Raw event data:', event.data);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
    };
    
    return () => {
      eventSource.close();
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <CssBaseline />
        <Sidebar 
          open={sidebarOpen} 
          toggleDrawer={toggleSidebar}
        />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Routes>
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={<Database />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/logistics-objects/create" element={<CreateLogisticsObject />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/changes" element={<Changes />} />
            <Route path="/logistics-objects/:id" element={<LogisticsObjectView />} />
            <Route path="/subscription-requests/:id" element={<SubscriptionRequestView />} />
            <Route path="/external-subscription-requests/:serverId/:id" element={<SubscriptionRequestView />} />
            <Route path="/changes-request/:id" element={<ChangeRequestView />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
