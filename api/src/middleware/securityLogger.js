const logger = require('../utils/logger');

function securityLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    if (req.path.startsWith('/api/analises')) {
      logger.access({
        method: req.method,
        path: req.path,
        ip: req.ip,
        status: res.statusCode,
        duration_ms: duration
      });
    }
  });

  next();
}

module.exports = securityLogger;