const express = require('express');
const router = express.Router();
const Repository = require('../models/Repository');

// Get all repositories
router.get('/', async (req, res) => {
  try {
    const repos = await Repository.find()
      .populate('owner', 'username email')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      count: repos.length,
      data: repos
    });
  } catch (error) {
    console.error('Get repos error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repositories', 
      details: error.message 
    });
  }
});

// Get single repository by ID
router.get('/:id', async (req, res) => {
  try {
    const repo = await Repository.findById(req.params.id)
      .populate('owner', 'username email fullName')
      .populate('collaborators.user', 'username email');

    if (!repo) {
      return res.status(404).json({ 
        error: 'Repository not found' 
      });
    }

    res.json({
      success: true,
      data: repo
    });
  } catch (error) {
    console.error('Get repo error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch repository', 
      details: error.message 
    });
  }
});

// Create new repository
router.post('/', async (req, res) => {
  try {
    const { name, description, gitPath, isPrivate, defaultBranch } = req.body;

    // TODO: Get owner from authenticated user
    // For now, using a placeholder
    if (!req.body.owner) {
      return res.status(400).json({ 
        error: 'Owner ID is required (authentication coming soon)' 
      });
    }

    // Check if repo with same name exists for this owner
    const existing = await Repository.findOne({ 
      name, 
      owner: req.body.owner 
    });

    if (existing) {
      return res.status(400).json({ 
        error: 'Repository with this name already exists' 
      });
    }

    const repo = new Repository({
      name,
      description,
      gitPath: gitPath || `/repos/${name}`,
      owner: req.body.owner,
      isPrivate: isPrivate !== undefined ? isPrivate : true,
      defaultBranch: defaultBranch || 'main'
    });

    await repo.save();

    // Populate owner info before sending response
    await repo.populate('owner', 'username email');

    res.status(201).json({
      success: true,
      message: 'Repository created successfully',
      data: repo
    });
  } catch (error) {
    console.error('Create repo error:', error);
    res.status(500).json({ 
      error: 'Failed to create repository', 
      details: error.message 
    });
  }
});

// Update repository
router.put('/:id', async (req, res) => {
  try {
    const { name, description, isPrivate, defaultBranch, settings } = req.body;

    const repo = await Repository.findById(req.params.id);

    if (!repo) {
      return res.status(404).json({ 
        error: 'Repository not found' 
      });
    }

    // TODO: Check if user is owner (authentication coming soon)

    // Update fields
    if (name) repo.name = name;
    if (description !== undefined) repo.description = description;
    if (isPrivate !== undefined) repo.isPrivate = isPrivate;
    if (defaultBranch) repo.defaultBranch = defaultBranch;
    if (settings) {
      repo.settings = { ...repo.settings, ...settings };
    }

    await repo.save();
    await repo.populate('owner', 'username email');

    res.json({
      success: true,
      message: 'Repository updated successfully',
      data: repo
    });
  } catch (error) {
    console.error('Update repo error:', error);
    res.status(500).json({ 
      error: 'Failed to update repository', 
      details: error.message 
    });
  }
});

// Delete repository
router.delete('/:id', async (req, res) => {
  try {
    const repo = await Repository.findById(req.params.id);

    if (!repo) {
      return res.status(404).json({ 
        error: 'Repository not found' 
      });
    }

    // TODO: Check if user is owner (authentication coming soon)

    await repo.deleteOne();

    res.json({
      success: true,
      message: 'Repository deleted successfully'
    });
  } catch (error) {
    console.error('Delete repo error:', error);
    res.status(500).json({ 
      error: 'Failed to delete repository', 
      details: error.message 
    });
  }
});

// Get repository statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const repo = await Repository.findById(req.params.id);

    if (!repo) {
      return res.status(404).json({ 
        error: 'Repository not found' 
      });
    }

    res.json({
      success: true,
      data: {
        name: repo.name,
        stats: repo.stats,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics', 
      details: error.message 
    });
  }
});

module.exports = router;

