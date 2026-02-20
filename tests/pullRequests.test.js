const request = require('supertest');
const app = require('../src/app');
const gitService = require('../src/services/gitService');

jest.mock('../src/services/gitService');

describe('Pull Request Routes', () => {
  describe('GET /api/pull-requests', () => {
    it('should return 200 with a list placeholder', async () => {
      const res = await request(app).get('/api/pull-requests');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('pullRequests');
      expect(Array.isArray(res.body.pullRequests)).toBe(true);
    });
  });

  describe('POST /api/pull-requests/:id/pull', () => {
    it('should return 400 for an invalid PR id of 0', async () => {
      const res = await request(app)
        .post('/api/pull-requests/0/pull')
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 400 for a non-numeric PR id', async () => {
      const res = await request(app)
        .post('/api/pull-requests/abc/pull')
        .send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return 200 with branch info when git fetch succeeds', async () => {
      gitService.fetchPullRequest.mockResolvedValue({
        success: true,
        output: "From https://github.com/owner/repo\n * [new ref] pr-1",
        branch: 'pr-1',
      });

      const res = await request(app)
        .post('/api/pull-requests/1/pull')
        .send({ remote: 'origin' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('branch', 'pr-1');
      expect(res.body.message).toContain('#1');
    });

    it('should return 500 with error details when git fetch fails', async () => {
      gitService.fetchPullRequest.mockRejectedValue(
        new Error('git fetch failed for PR #1: remote: Repository not found.')
      );

      const res = await request(app)
        .post('/api/pull-requests/1/pull')
        .send({ remote: 'origin' });

      expect(res.statusCode).toBe(500);
      expect(res.body).toHaveProperty('error');
      expect(res.body).toHaveProperty('details');
    });
  });
});
