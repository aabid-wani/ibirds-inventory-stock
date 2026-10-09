const connection = require('../config/db.connect.js');

/**
 * Log a user action into user_activities table
 */
async function logActivity(data) {
  try {
    const {
      user_id,
      user_name,
      user_email,
      role_name,
      session_id,
      action_type,
      action_category,
      module,
      description,
      entity_id,
      metadata,
      ip_address
    } = data;

    const query = `
      INSERT INTO user_activities (
        user_id, user_name, user_email, role_name, session_id,
        action_type, action_category, module, description,
        entity_id, metadata, ip_address, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING *;
    `;

    const values = [
      user_id || null,
      user_name || 'System User',
      user_email || null,
      role_name || 'User',
      session_id || null,
      action_type || 'GENERAL',
      action_category || 'general',
      module || 'general',
      description || 'User performed an action',
      entity_id ? String(entity_id) : null,
      metadata ? JSON.stringify(metadata) : null,
      ip_address || '127.0.0.1'
    ];

    const result = await connection.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging user activity:', error.message);
    return null; // non-blocking
  }
}

/**
 * Start a new login session
 */
async function startSession(data) {
  try {
    const { user_id, user_name, user_email, role_name, ip_address, user_agent } = data;

    const query = `
      INSERT INTO user_sessions (
        user_id, user_name, user_email, role_name,
        login_at, last_active_at, ip_address, user_agent, status, created_at
      )
      VALUES ($1, $2, $3, $4, NOW(), NOW(), $5, $6, 'active', NOW())
      RETURNING *;
    `;

    const values = [
      user_id || null,
      user_name || 'User',
      user_email || null,
      role_name || 'User',
      ip_address || '127.0.0.1',
      user_agent || null
    ];

    const result = await connection.query(query, values);
    const session = result.rows[0];

    // Log login activity
    await logActivity({
      user_id,
      user_name,
      user_email,
      role_name,
      session_id: session.id,
      action_type: 'LOGIN',
      action_category: 'auth',
      module: 'auth',
      description: `User ${user_name} (${role_name}) logged in to the system`,
      ip_address
    });

    return session;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
}

/**
 * Heartbeat to update session duration and last_active_at
 */
async function heartbeatSession(sessionId) {
  try {
    if (!sessionId) return null;
    const query = `
      UPDATE user_sessions
      SET 
        last_active_at = NOW(),
        duration_seconds = GREATEST(0, ROUND(EXTRACT(EPOCH FROM (NOW() - login_at)))),
        duration_minutes = ROUND((EXTRACT(EPOCH FROM (NOW() - login_at)) / 60.0)::numeric, 2)
      WHERE id = $1 AND status = 'active'
      RETURNING *;
    `;
    const result = await connection.query(query, [sessionId]);
    return result.rows[0];
  } catch (error) {
    console.error('Error heartbeat session:', error.message);
    return null;
  }
}

/**
 * End a user session
 */
async function endSession(sessionId) {
  try {
    if (!sessionId) return null;
    const query = `
      UPDATE user_sessions
      SET 
        logout_at = NOW(),
        last_active_at = NOW(),
        status = 'closed',
        duration_seconds = GREATEST(0, ROUND(EXTRACT(EPOCH FROM (NOW() - login_at)))),
        duration_minutes = ROUND((EXTRACT(EPOCH FROM (NOW() - login_at)) / 60.0)::numeric, 2)
      WHERE id = $1
      RETURNING *;
    `;
    const result = await connection.query(query, [sessionId]);
    const session = result.rows[0];

    if (session) {
      // Log logout activity
      await logActivity({
        user_id: session.user_id,
        user_name: session.user_name,
        user_email: session.user_email,
        role_name: session.role_name,
        session_id: session.id,
        action_type: 'LOGOUT',
        action_category: 'auth',
        module: 'auth',
        description: `User ${session.user_name} logged out (Session duration: ${session.duration_minutes || 0} mins)`,
        ip_address: session.ip_address
      });
    }

    return session;
  } catch (error) {
    console.error('Error ending session:', error.message);
    return null;
  }
}

/**
 * Get recent activity logs for live audit stream
 */
async function getActivityTimeline({ limit = 40, userId, category }) {
  try {
    let query = `
      SELECT id, user_id, user_name, user_email, role_name, action_type,
             action_category, module, description, entity_id, created_at
      FROM user_activities
      WHERE 1=1
    `;
    const params = [];

    if (userId && userId !== 'all') {
      params.push(userId);
      query += ` AND user_id = $${params.length}`;
    }

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND action_category = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await connection.query(query, params);
    return result.rows;
  } catch (error) {
    throw error;
  }
}

/**
 * Get aggregated activity metrics for the line chart
 */
async function getActivityAnalytics({ days = 7, userId }) {
  try {
    const isAllTime = days === 'all' || String(days) === '365' || String(days) === 'all_time';
    const numDays = parseInt(days, 10) || 7;

    let userFilterSql = '';
    const queryParams = [];

    if (userId && userId !== 'all') {
      queryParams.push(userId);
      userFilterSql = `AND ua.user_id = $${queryParams.length}`;
    }

    let trendQuery = '';
    let summaryQuery = '';

    if (isAllTime) {
      trendQuery = `
        SELECT 
          TO_CHAR(DATE_TRUNC('month', ua.created_at), 'Mon YYYY') AS date_label,
          TO_CHAR(DATE_TRUNC('month', ua.created_at), 'YYYY-MM') AS full_date,
          COALESCE(COUNT(ua.id) FILTER (WHERE ua.action_category = 'purchasing'), 0)::int AS purchasing,
          COALESCE(COUNT(ua.id) FILTER (WHERE ua.action_category = 'issuing'), 0)::int AS issuing,
          COALESCE(COUNT(ua.id) FILTER (WHERE ua.action_category = 'products'), 0)::int AS products,
          COALESCE(COUNT(ua.id), 0)::int AS total_actions
        FROM user_activities ua
        WHERE 1=1 ${userFilterSql}
        GROUP BY DATE_TRUNC('month', ua.created_at)
        ORDER BY DATE_TRUNC('month', ua.created_at) ASC;
      `;

      summaryQuery = `
        SELECT 
          COUNT(id)::int AS total_activities,
          COUNT(id) FILTER (WHERE action_category = 'purchasing')::int AS total_purchasing,
          COUNT(id) FILTER (WHERE action_category = 'issuing')::int AS total_issuing,
          COUNT(id) FILTER (WHERE action_category = 'products')::int AS total_products,
          COUNT(DISTINCT user_id)::int AS active_users
        FROM user_activities ua
        WHERE 1=1 ${userFilterSql};
      `;
    } else {
      queryParams.unshift(numDays);
      const userParamIdx = queryParams.length > 1 ? '$2' : '';
      const filterForTrend = userParamIdx ? `AND ua.user_id = ${userParamIdx}` : '';
      const filterForSummary = userParamIdx ? `AND user_id = ${userParamIdx}` : '';

      trendQuery = `
        WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '1 day' * ($1 - 1),
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date AS day
        )
        SELECT 
          TO_CHAR(ds.day, 'Mon DD') AS date_label,
          TO_CHAR(ds.day, 'YYYY-MM-DD') AS full_date,
          COALESCE(COUNT(ua.id) FILTER (WHERE ua.action_category = 'purchasing'), 0)::int AS purchasing,
          COALESCE(COUNT(ua.id) FILTER (WHERE ua.action_category = 'issuing'), 0)::int AS issuing,
          COALESCE(COUNT(ua.id) FILTER (WHERE ua.action_category = 'products'), 0)::int AS products,
          COALESCE(COUNT(ua.id), 0)::int AS total_actions
        FROM date_series ds
        LEFT JOIN user_activities ua 
          ON ua.created_at::date = ds.day
          ${filterForTrend}
        GROUP BY ds.day
        ORDER BY ds.day ASC;
      `;

      summaryQuery = `
        SELECT 
          COUNT(id)::int AS total_activities,
          COUNT(id) FILTER (WHERE action_category = 'purchasing')::int AS total_purchasing,
          COUNT(id) FILTER (WHERE action_category = 'issuing')::int AS total_issuing,
          COUNT(id) FILTER (WHERE action_category = 'products')::int AS total_products,
          COUNT(DISTINCT user_id)::int AS active_users
        FROM user_activities
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * ($1 - 1)
        ${filterForSummary};
      `;
    }

    const [trendRes, summaryRes] = await Promise.all([
      connection.query(trendQuery, queryParams),
      connection.query(summaryQuery, queryParams)
    ]);

    return {
      trend: trendRes.rows,
      summary: summaryRes.rows[0] || {
        total_activities: 0,
        total_purchasing: 0,
        total_issuing: 0,
        total_products: 0,
        active_users: 0
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get aggregated session duration metrics for duration graph
 */
async function getSessionDurationMetrics({ days = 7, userId }) {
  try {
    const isAllTime = days === 'all' || String(days) === '365' || String(days) === 'all_time';
    const numDays = parseInt(days, 10) || 7;

    let userFilterSql = '';
    const queryParams = [];

    if (userId && userId !== 'all') {
      queryParams.push(userId);
      userFilterSql = `AND us.user_id = $${queryParams.length}`;
    }

    let trendQuery = '';
    let summaryQuery = '';

    if (isAllTime) {
      trendQuery = `
        SELECT 
          TO_CHAR(DATE_TRUNC('month', us.login_at), 'Mon YYYY') AS date_label,
          TO_CHAR(DATE_TRUNC('month', us.login_at), 'YYYY-MM') AS full_date,
          COALESCE(ROUND(SUM(us.duration_minutes), 1), 0)::float AS total_duration_minutes,
          COALESCE(ROUND(AVG(us.duration_minutes), 1), 0)::float AS avg_duration_minutes,
          COALESCE(COUNT(us.id), 0)::int AS session_count
        FROM user_sessions us
        WHERE 1=1 ${userFilterSql}
        GROUP BY DATE_TRUNC('month', us.login_at)
        ORDER BY DATE_TRUNC('month', us.login_at) ASC;
      `;

      summaryQuery = `
        SELECT 
          COALESCE(ROUND(SUM(duration_minutes), 1), 0)::float AS total_duration_minutes,
          COALESCE(ROUND(AVG(duration_minutes), 1), 0)::float AS avg_duration_minutes,
          COUNT(id)::int AS total_sessions,
          COUNT(id) FILTER (WHERE status = 'active' AND last_active_at >= NOW() - INTERVAL '15 minutes')::int AS active_now
        FROM user_sessions us
        WHERE 1=1 ${userFilterSql};
      `;
    } else {
      queryParams.unshift(numDays);
      const userParamIdx = queryParams.length > 1 ? '$2' : '';
      const filterForTrend = userParamIdx ? `AND us.user_id = ${userParamIdx}` : '';
      const filterForSummary = userParamIdx ? `AND user_id = ${userParamIdx}` : '';

      trendQuery = `
        WITH date_series AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '1 day' * ($1 - 1),
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date AS day
        )
        SELECT 
          TO_CHAR(ds.day, 'Mon DD') AS date_label,
          TO_CHAR(ds.day, 'YYYY-MM-DD') AS full_date,
          COALESCE(ROUND(SUM(us.duration_minutes), 1), 0)::float AS total_duration_minutes,
          COALESCE(ROUND(AVG(us.duration_minutes), 1), 0)::float AS avg_duration_minutes,
          COALESCE(COUNT(us.id), 0)::int AS session_count
        FROM date_series ds
        LEFT JOIN user_sessions us 
          ON us.login_at::date = ds.day
          ${filterForTrend}
        GROUP BY ds.day
        ORDER BY ds.day ASC;
      `;

      summaryQuery = `
        SELECT 
          COALESCE(ROUND(SUM(duration_minutes), 1), 0)::float AS total_duration_minutes,
          COALESCE(ROUND(AVG(duration_minutes), 1), 0)::float AS avg_duration_minutes,
          COUNT(id)::int AS total_sessions,
          COUNT(id) FILTER (WHERE status = 'active' AND last_active_at >= NOW() - INTERVAL '15 minutes')::int AS active_now
        FROM user_sessions
        WHERE login_at >= CURRENT_DATE - INTERVAL '1 day' * ($1 - 1)
        ${filterForSummary};
      `;
    }

    const [trendRes, summaryRes] = await Promise.all([
      connection.query(trendQuery, queryParams),
      connection.query(summaryQuery, queryParams)
    ]);

    return {
      trend: trendRes.rows,
      summary: summaryRes.rows[0] || {
        total_duration_minutes: 0,
        avg_duration_minutes: 0,
        total_sessions: 0,
        active_now: 0
      }
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  logActivity,
  startSession,
  heartbeatSession,
  endSession,
  getActivityTimeline,
  getActivityAnalytics,
  getSessionDurationMetrics
};
