const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.config', 'rbaker', 'directories.json');
if (!fs.existsSync(configPath)) {
  console.error(`Configuration file not found: ${configPath}`);
  process.exit(1);
}
const config = require(configPath);

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${stderr}`);
        reject(error);
      } else {
        console.log(`Output: ${stdout}`);
        resolve(stdout);
      }
    });
  });
}

async function processBatch(batch) {
  const promises = batch.map(async (dir) => {
    const relativePath = path.relative('/', dir);
    const destPath = `${config.remote}${relativePath}`;
    const command = `rclone sync "${dir}" "${destPath}" --use-mmap --user-agent rclone --fast-list --create-empty-src-dirs --local-no-check-updated`;

    try {
      console.log(`Starting backup for directory: ${dir}`);
      await execCommand(command);
      console.log(`Successfully backed up directory: ${dir}`);
      return true;
    } catch (error) {
      console.error(`Failed to back up directory: ${dir}`, error);
      return false;
    }
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
    const batchCompletedSuccessfully = await processBatch(batch);
    currentIndex += batchSize;

    if (currentIndex < directories.length && !batchCompletedSuccessfully) {
      console.log(`Waiting for 5 minutes before processing the next batch...`);
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000)); // Wait for 5 minutes
    }
  }
}

module.exports = backupDirectories;
