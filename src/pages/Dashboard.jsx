import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  // Mock data for charts
  const deliveryData = [
    { name: 'Jan', onTime: 65, delayed: 35 },
    { name: 'Feb', onTime: 75, delayed: 25 },
    { name: 'Mar', onTime: 80, delayed: 20 },
    { name: 'Apr', onTime: 70, delayed: 30 },
    { name: 'May', onTime: 85, delayed: 15 },
    { name: 'Jun', onTime: 90, delayed: 10 },
  ];

  const shipmentStatusData = [
    { name: 'In Transit', value: 45 },
    { name: 'Delivered', value: 30 },
    { name: 'Pending', value: 15 },
    { name: 'Delayed', value: 10 },
  ];

  const volumeData = [
    { name: 'Week 1', volume: 400 },
    { name: 'Week 2', volume: 300 },
    { name: 'Week 3', volume: 600 },
    { name: 'Week 4', volume: 800 },
    { name: 'Week 5', volume: 700 },
  ];

  const locationData = [
    { name: 'New York', shipments: 120 },
    { name: 'Los Angeles', shipments: 98 },
    { name: 'Chicago', shipments: 86 },
    { name: 'Houston', shipments: 75 },
    { name: 'Miami', shipments: 65 },
  ];

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Typography variant="h5" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
        Analytics Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Delivery Performance Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Delivery Performance
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={deliveryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="onTime" 
                  stroke="#4caf50" 
                  name="On Time"
                />
                <Line 
                  type="monotone" 
                  dataKey="delayed" 
                  stroke="#f44336" 
                  name="Delayed"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Shipment Status Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Shipment Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={shipmentStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {shipmentStatusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Shipment Volume Trend */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Shipment Volume Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#1976d2" 
                  fill="#bbdefb" 
                  name="Volume"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Shipping Locations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Top Shipping Locations
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="shipments" 
                  fill="#2196f3" 
                  name="Shipments"
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
