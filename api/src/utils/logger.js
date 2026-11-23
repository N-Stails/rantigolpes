const fs = require('fs');
const path = require('path');
const logDirectory = path.resolve(__dirname, 'logs');

if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, 'access.log'),
  { flags: 'a' }
);

const log = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
  const logLine = `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}\n`;

  console.log(logLine.trim());

  if (level === 'error') {
    fs.appendFileSync(path.join(logDirectory, 'error.log'), logLine);
  } else {
    fs.appendFileSync(path.join(logDirectory, 'access.log'), logLine);
  }
};

module.exports = {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
  access: (meta) => log('access', 'API request', meta)
};