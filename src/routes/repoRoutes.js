const express = require('express');
const router = express.Router();

// GET all repositories
router.get('/', (req, res) => {
  res.json({ message: 'Get all repositories' });
});

// GET single repository
router.get('/:id', (req, res) => {
  res.json({ message: `Get repository ${req.params.id}` });
});

// POST create repository
router.post('/', (req, res) => {
  res.json({ message: 'Create repository' });
});

// PUT update repository
router.put('/:id', (req, res) => {
  res.json({ message: `Update repository ${req.params.id}` });
});

// DELETE repository
router.delete('/:id', (req, res) => {
  res.json({ message: `Delete repository ${req.params.id}` });
});

module.exports = router;
