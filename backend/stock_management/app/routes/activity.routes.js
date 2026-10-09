const express = require('express');
const Activity = require('../models/activity.model.js');
const { fetchApi } = require('../middleware/fetchApi.js');

module.exports = function (app) {
  const router = express.Router();

  /**
   * Log an activity
   * POST /activity/log
   */
  router.post('/log', fetchApi, async (req, res) => {
    try {
      const {
        action_type,
        action_category,
        module,
        description,
        entity_id,
        metadata,
        session_id
      } = req.body;

      const user = req.user || {};
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

      const activity = await Activity.logActivity({
        user_id: user.id,
        user_name: user.name || user.user_name || 'System User',
        user_email: user.email,
        role_name: user.role_name || 'User',
        session_id,
        action_type,
        action_category,
        module,
        description,
        entity_id,
        metadata,
        ip_address: ip
      });

      res.status(201).json({ success: true, activity });
    } catch (err) {
      res.status(500).json({ success: false, errors: err.message });
    }
  });

  /**
   * Start a session on login
   * POST /activity/session/start
   */
  router.post('/session/start', fetchApi, async (req, res) => {
    try {
      const user = req.user || {};
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Browser';

      const session = await Activity.startSession({
        user_id: user.id,
        user_name: user.name || user.user_name || 'System User',
        user_email: user.email,
        role_name: user.role_name || 'User',
        ip_address: ip,
        user_agent: userAgent
      });

      res.status(201).json({ success: true, session });
    } catch (err) {
      res.status(500).json({ success: false, errors: err.message });
    }
  });

  /**
   * Heartbeat to update session duration
   * POST /activity/session/heartbeat
   */
  router.post('/session/heartbeat', fetchApi, async (req, res) => {
    try {
      const { session_id } = req.body;
      if (!session_id) {
        return res.status(400).json({ success: false, errors: "session_id required" });
      }

      const session = await Activity.heartbeatSession(session_id);
      res.status(200).json({ success: true, session });
    } catch (err) {
      res.status(500).json({ success: false, errors: err.message });
    }
  });

  /**
   * End session on logout
   * POST /activity/session/end
   */
  router.post('/session/end', fetchApi, async (req, res) => {
    try {
      const { session_id } = req.body;
      if (!session_id) {
        return res.status(400).json({ success: false, errors: "session_id required" });
      }

      const session = await Activity.endSession(session_id);
      res.status(200).json({ success: true, session });
    } catch (err) {
      res.status(500).json({ success: false, errors: err.message });
    }
  });

  /**
   * Get activity analytics for line chart
   * GET /activity/analytics?days=7&userId=all
   * Note: Only Super Admin can view all users' activities; other users only see their own.
   */
  router.get('/analytics', fetchApi, async (req, res) => {
    try {
      let { days = 7, userId = 'all' } = req.query;
      if (!req.user || req.user.role_name !== 'Super Admin') {
        userId = req.user?.id;
      }
      const data = await Activity.getActivityAnalytics({ days, userId });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      res.status(500).json({ success: false, errors: err.message });
    }
  });

  /**
   * Get session duration analytics for session duration graph
   * GET /activity/sessions/analytics?days=7&userId=all
   * Note: Only Super Admin can view all users' session durations; other users only see their own.
   */
  router.get('/sessions/analytics', fetchApi, async (req, res) => {
    try {
      let { days = 7, userId = 'all' } = req.query;
      if (!req.user || req.user.role_name !== 'Super Admin') {
        userId = req.user?.id;
      }
      const data = await Activity.getSessionDurationMetrics({ days, userId });
      res.status(200).json({ success: true, ...data });
    } catch (err) {
      res.status(500).json({ success: false, errors: err.message });
    }
  });

  /**
   * Get recent activity timeline stream
   * GET /activity/timeline?limit=30&userId=all&category=all
   * Note: Only Super Admin can view all users' activity stream; other users only see their own.
   */
  router.get('/timeline', fetchApi, async (req, res) => {
    try {
      let { limit = 30, userId = 'all', category = 'all' } = req.query;
      if (!req.user || req.user.role_name !== 'Super Admin') {
        userId = req.user?.id;
      }
      const activities = await Activity.getActivityTimeline({ limit, userId, category });
      res.status(200).json({ success: true, activities });
    } catch (err) {
      res.status(500).json({ success: false, errors: err.message });
    }
  });

  app.use('/activity', router);
};
