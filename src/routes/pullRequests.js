const express = require('express');
const { listPullRequests, pullPullRequest } = require('../controllers/pullRequestController');

const router = express.Router();

// GET /api/pull-requests - list pull requests
router.get('/', listPullRequests);

// POST /api/pull-requests/:id/pull - pull (fetch) a specific pull request
router.post('/:id/pull', pullPullRequest);

module.exports = router;
