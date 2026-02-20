const path = require('path');
const { fetchPullRequest } = require('../services/gitService');

const REPO_PATH = process.env.REPO_PATH || path.resolve(process.cwd());

/**
 * GET /api/pull-requests
 * Returns a placeholder list of pull requests.
 */
function listPullRequests(req, res) {
  res.status(200).json({
    message: 'Pull requests endpoint is active. Configure your repository to list PRs.',
    pullRequests: [],
  });
}

/**
 * POST /api/pull-requests/:id/pull
 * Fetches the specified pull request branch locally.
 */
async function pullPullRequest(req, res) {
  const prId = parseInt(req.params.id, 10);

  if (!prId || prId <= 0) {
    return res.status(400).json({ error: 'Invalid pull request ID.' });
  }

  const remote = req.body && req.body.remote ? req.body.remote : 'origin';

  try {
    const result = await fetchPullRequest(REPO_PATH, prId, remote);
    return res.status(200).json({
      message: `Pull request #${prId} fetched successfully into branch '${result.branch}'.`,
      branch: result.branch,
      output: result.output,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to pull the pull request.',
      details: err.message,
    });
  }
}

module.exports = { listPullRequests, pullPullRequest };
