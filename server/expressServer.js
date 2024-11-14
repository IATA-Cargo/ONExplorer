const express = require('express');
const app = express();
const basePort = parseInt(process.argv[2]) || 3000;
const PORT = basePort + 1;
const crypto = require('crypto');

// Add a middleware to allow all CORS requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// Configure express.json middleware with proper settings
app.use(express.json({
  limit: '10mb',
  type: ['application/ld+json'],
  strict: false
}));

// Configure URL-encoded bodies
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

const clients = new Set();

// Add a basic route to test the server
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.get('/notifyServer', (req, res) => {
  // Add headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', `*`);
  
  // Send initial connection message
  res.write('data: Connected to event stream\n\n');
  
  // Keep connection alive
  const keepAlive = setInterval(() => {
    res.write(':\n\n'); // Send comment to keep connection alive
  }, 30000);
  
  clients.add(res);
  
  req.on('close', () => {
    clients.delete(res);
    console.log('Client disconnected');
    clearInterval(keepAlive);
  });
  
  console.log('Client connected');
});

app.post('/notifications', (req, res) => {
  const message = req.body;
  
  // Add logging to debug
  console.log('Received notification body:', message);
  
  if (!message) {
    console.error('Empty message received');
    return res.status(400).send('No message body');
  }

  clients.forEach(client => {
    client.write(`data: ${JSON.stringify(message)}\n\n`);
  });
  
  console.log('Notification sent:', message);
  res.status(200).send('Notification sent');
});

app.get('/subscriptions', (req, res) => {
  const { topicType, topic } = req.query;
  
  // Generate a random UUID for the subscription
  const subscriptionId = crypto.randomUUID();
  
  const response = {
    "@context": {
      "cargo": "https://onerecord.iata.org/ns/cargo#",
      "api": "https://onerecord.iata.org/ns/api#"
    },
    "@id": `https://1r.example.com/subscriptions/${subscriptionId}`,
    "@type": "api:Subscription",
    "api:hasContentType": "application/ld+json",
    "api:hasSubscriber": {
      "@id": "http://host.docker.internal:"+PORT
    },
    "api:hasTopicType": {
      "@id": topicType
    },
    "api:includeSubscriptionEventType": [
      {
        "@id": "api:LOGISTICS_OBJECT_UPDATED"
      },
      {
        "@id": "api:LOGISTICS_OBJECT_CREATED"
      },
      {
        "@id": "api:LOGISTICS_EVENT_RECEIVED"
      }
    ],
    "api:hasTopic": {
      "@type": "http://www.w3.org/2001/XMLSchema#anyURI",
      "@value": topic
    }
  };

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

