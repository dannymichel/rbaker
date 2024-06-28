const fs = require('fs');
const path = require('path');
const os = require('os');

const logDir = path.join(os.homedir(), '.config', 'rbaker', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'backup.log');
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  console.log(formattedMessage.trim());
  logStream.write(formattedMessage);
}

module.exports = log;
