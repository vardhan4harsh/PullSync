const express = require('express');
const path = require('path');
const cors = require('cors');
// Import repository routes
const repoRoutes = require('./routes/repoRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Use repository routes
app.use('/api/repos', repoRoutes);

// API info endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'PullSync API v0.1',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      repos: 'GET /api/repos',
      createRepo: 'POST /api/repos',
      getRepo: 'GET /api/repos/:id'
    }
  });
});



// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'PullSync API is running',
    timestamp: new Date()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;