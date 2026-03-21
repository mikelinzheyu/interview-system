/**
 * Auth routes
 * Provides login, register and related auth endpoints
 * for the Node.js mock backend used in development.
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const oauthRouter = require('./oauth');

// Auth mode switch:
// - default: mock/dev mode (AUTH_MODE != 'real')
// - real   : enable when AUTH_MODE=real and real auth is implemented
const isRealAuthEnabled =
  (process.env.AUTH_MODE || '').toLowerCase() === 'real';

/**
 * Username/password login
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  try {
    const { username, password, phone, code } = req.body || {};

    if (!username && !phone) {
      return res.status(400).json({
        code: 400,
        message: '用户名或手机号必填'
      });
    }

    logger.info(`[Auth/Login] User login attempt: ${username || phone}`);

    // Default: mock behaviour for dev/test
    if (!isRealAuthEnabled) {
      const token = `dev-token-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const userId = `user-${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      return res.json({
        code: 200,
        message: 'Login successful',
        data: {
          token,
          userId,
          username: username || 'dev-user',
          email: 'dev@example.com',
          name: 'Dev User'
        }
      });
    }

    // Real mode placeholder: reject invalid credentials
    return res.status(401).json({
      code: 401,
      message: 'Invalid credentials'
    });
  } catch (error) {
    logger.error('[Auth/Login] Error:', error);
    return res.status(500).json({
      code: 500,
      message: 'Login failed'
    });
  }
});

/**
 * User registration
 * POST /api/auth/register
 */
router.post('/register', (req, res) => {
  try {
    const { username, password, phone, email } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        code: 400,
        message: '用户名和密码必填'
      });
    }

    logger.info(`[Auth/Register] User registration attempt: ${username}`);

    // Default: mock behaviour for dev/test
    if (!isRealAuthEnabled) {
      return res.json({
        code: 200,
        message: 'Registration successful',
        data: {
          userId: `user-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          username,
          email: email || `${username}@example.com`,
          phone: phone || null
        }
      });
    }

    // Real mode: not implemented yet – use 501 instead of 500
    return res.status(501).json({
      code: 501,
      message: 'Registration not implemented'
    });
  } catch (error) {
    logger.error('[Auth/Register] Error:', error);
    return res.status(500).json({
      code: 500,
      message: 'Registration failed'
    });
  }
});

/**
 * Logout
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  logger.info('[Auth/Logout] User logout');
  res.json({
    code: 200,
    message: 'Logout successful'
  });
});

/**
 * Refresh token
 * POST /api/auth/refresh
 */
router.post('/refresh', (req, res) => {
  const token = `dev-token-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;
  logger.info('[Auth/Refresh] Token refreshed');
  res.json({
    code: 200,
    message: 'Token refreshed',
    data: { token }
  });
});

/**
 * Send SMS verification code
 * POST /api/auth/sms/send
 */
router.post('/sms/send', (req, res) => {
  const { phone } = req.body || {};

  if (!phone) {
    return res.status(400).json({
      code: 400,
      message: '手机号必填'
    });
  }

  logger.info(`[Auth/SMS] SMS code sent to ${phone}`);

  res.json({
    code: 200,
    message: 'SMS code sent',
    data: {
      phone,
      message: 'Development mode - use code: 123456'
    }
  });
});

/**
 * SMS login
 * POST /api/auth/login/sms
 */
router.post('/login/sms', (req, res) => {
  const { phone, code } = req.body || {};

  if (!phone || !code) {
    return res.status(400).json({
      code: 400,
      message: '手机号和验证码必填'
    });
  }

  // Default: accept any code in mock/dev mode
  if (!isRealAuthEnabled) {
    const token = `dev-token-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    logger.info(`[Auth/LoginSMS] SMS login successful for ${phone}`);

    return res.json({
      code: 200,
      message: 'SMS login successful',
      data: {
        token,
        userId: `user-${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        phone,
        name: 'SMS User'
      }
    });
  }

  // Real mode placeholder
  return res.status(401).json({
    code: 401,
    message: 'Invalid SMS code'
  });
});

/**
 * OAuth sub-routes
 *
 * Mounted as:
 * - GET  /api/auth/oauth/:provider/authorize
 * - GET  /api/auth/oauth/:provider/qrcode
 * - GET  /api/auth/oauth/:provider/poll
 * - POST /api/auth/oauth/:provider/callback
 * - POST /api/auth/oauth/:provider/bind
 * - POST /api/auth/oauth/:provider/unbind
 * - GET  /api/auth/oauth/connections
 */
router.use('/oauth', oauthRouter);

module.exports = router;

