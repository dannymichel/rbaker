const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.config', 'rbaker', 'media.json');
if (!fs.existsSync(configPath)) {
  console.error(`Configuration file not found: ${configPath}`);
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
      const command = `rclone move "${dir}/" "${remotePath}" --use-mmap --user-agent rclone --fast-list`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error moving media from ${dir} to ${remotePath}: ${stderr}`);
          return reject(error);
        }
        console.log(`Media moved from ${dir} to ${remotePath} successfully.`);
        exec(`find "${dir}" -mindepth 1 -type d -empty -delete`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error deleting empty directories in ${dir}: ${stderr}`);
            return reject(error);
          }
          console.log(`Empty directories in ${dir} deleted successfully.`);
          
          if (--pendingOperations === 0) {
            resolve();
          }
        });
      });
    });
  });
}

module.exports = moveMedia;
