const express = require('express');
const path = require('path');
const pullRequestRoutes = require('./routes/pullRequests');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'PullSync - Git-native Pull Request Review Platform',
    version: '0.1.0'
  });
});

// Pull request routes
app.use('/api/pull-requests', pullRequestRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = app;