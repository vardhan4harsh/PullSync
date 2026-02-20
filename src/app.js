const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PullSync API is running',
    timestamp: new Date()
  });
});

// Import routes (will be added by team members)
// Placeholder for now
app.get('/api', (req, res) => {
  res.json({ 
    message: 'PullSync API v0.1',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth (coming soon)',
      repos: '/api/repos (coming soon)'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;