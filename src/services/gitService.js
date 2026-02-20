const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

/**
 * Fetch a pull request branch from a remote repository.
 * Executes: git fetch <remote> pull/<prId>/head:<localBranch>
 *
 * @param {string} repoPath - Absolute path to the local git repository
 * @param {number|string} prId - The pull request ID/number
 * @param {string} [remote='origin'] - The git remote name
 * @returns {Promise<{success: boolean, output: string}>}
 */
async function fetchPullRequest(repoPath, prId, remote = 'origin') {
  const localBranch = `pr-${prId}`;
  const refSpec = `pull/${prId}/head:${localBranch}`;

  try {
    const { stdout, stderr } = await execFileAsync(
      'git',
      ['-C', repoPath, 'fetch', remote, refSpec],
      { timeout: 30000 }
    );

    return {
      success: true,
      output: stdout || stderr,
      branch: localBranch,
    };
  } catch (err) {
    const details = err.stderr || err.message;
    throw new Error(`git fetch failed for PR #${prId}: ${details}`);
  }
}

module.exports = { fetchPullRequest };
