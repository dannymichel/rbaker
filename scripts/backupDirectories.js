const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const log = require('./logger');

const configPath = path.join(os.homedir(), '.config', 'rbaker', 'directories.json');
if (!fs.existsSync(configPath)) {
  log(`Configuration file not found: ${configPath}`);
  process.exit(1);
}
const config = require(configPath);

function execCommand(command, logFilePath) {
  return new Promise((resolve) => {
    exec(`${command} --log-file="${logFilePath}"`, (error, stdout, stderr) => {
      if (error) {
        log(`Error executing command: ${stderr}`);
        resolve({ success: false, error: stderr });
      } else {
        log(`Output: ${stdout}`);
        resolve({ success: true });
      }
    });
  });
}

async function processBatch(batch) {
  const promises = batch.map(async (dir) => {
    const relativePath = path.relative('/', dir);
    const destPath = `${config.remote}${relativePath}`;
    const logFilePath = path.join(os.homedir(), '.config', 'rbaker', 'logs', `rclone_${relativePath.replace(/\//g, '_')}.log`);
    const command = `rclone sync "${dir}" "${destPath}" --use-mmap --user-agent rclone --fast-list --create-empty-src-dirs --local-no-check-updated`;

    log(`Starting backup for directory: ${dir}`);
    const result = await execCommand(command, logFilePath);
    if (result.success) {
      log(`Successfully backed up directory: ${dir}`);
    } else {
      log(`Failed to back up directory: ${dir} - ${result.error}`);
    }
    
    if (fs.existsSync(logFilePath)) {
      const rcloneLog = fs.readFileSync(logFilePath, 'utf8');
      log(rcloneLog);
    }

    return result.success;
  });

  const results = await Promise.all(promises);
  return results.every(result => result);
}

async function backupDirectories() {
  const directories = config.directories;
  const batchSize = 3;
  let currentIndex = 0;

  while (currentIndex < directories.length) {
    const batch = directories.slice(currentIndex, currentIndex + batchSize);
    await processBatch(batch);
    currentIndex += batchSize;

    if (currentIndex < directories.length) {
      log(`Waiting for 5 minutes before processing the next batch...`);
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
  }
}

module.exports = backupDirectories;
