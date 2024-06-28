const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const log = require('./logger');

const configPath = path.join(os.homedir(), '.config', 'rbaker', 'media.json');
if (!fs.existsSync(configPath)) {
  log(`Configuration file not found: ${configPath}`);
  process.exit(1);
}
const config = require(configPath);

function moveMedia() {
  return new Promise((resolve, reject) => {
    let pendingOperations = config.media_directories.length;
    if (pendingOperations === 0) {
      resolve();
    }

    config.media_directories.forEach(dir => {
      const dirName = path.basename(dir);
      const remotePath = `${config.remote}${dirName}/`;
      const logFilePath = path.join(os.homedir(), '.config', 'rbaker', 'logs', `rclone_${dirName}.log`);
      const command = `rclone move "${dir}/" "${remotePath}" --use-mmap --user-agent rclone --fast-list --log-file "${logFilePath}"`;

      log(`Moving media from ${dir} to ${remotePath}`);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          log(`Error moving media from ${dir} to ${remotePath}: ${stderr}`);
          return reject(error);
        }
        log(`Media moved from ${dir} to ${remotePath} successfully.`);
        exec(`find "${dir}" -mindepth 1 -type d -empty -delete`, (error, stdout, stderr) => {
          if (error) {
            log(`Error deleting empty directories in ${dir}: ${stderr}`);
            return reject(error);
          }
          log(`Empty directories in ${dir} deleted successfully.`);
          
          if (--pendingOperations === 0) {
            resolve();
          }
        });
      });
    });
  });
}

module.exports = moveMedia;
