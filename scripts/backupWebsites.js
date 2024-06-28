const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const log = require('./logger');

const configPath = path.join(os.homedir(), '.config', 'rbaker', 'websites.json');
if (!fs.existsSync(configPath)) {
  log(`Configuration file not found: ${configPath}`);
  process.exit(1);
}
const config = require(configPath);

function backupWebsites() {
  return new Promise((resolve, reject) => {
    let pendingOperations = config.sites.length;
    if (pendingOperations === 0) {
      resolve();
    }

    config.sites.forEach(site => {
      const backupDir = site.backup_dir;
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
      const tarFile = path.join(backupDir, `site_backup_${timestamp}.tar.bz2`);
      const command = `tar -cjf ${tarFile} -C ${site.source} .`;
      
      log(`Backing up website from ${site.source} to ${tarFile}`);
      exec(command, (error, stdout, stderr) => {
        if (error) {
          log(`Error creating tar file: ${stderr}`);
          return reject(error);
        }
        log(`Website backed up to ${tarFile}`);
        
        const logFilePath = path.join(os.homedir(), '.config', 'rbaker', 'logs', `rclone_${site.source.replace('/', '_')}.log`);
        const rcloneCommand = `rclone move ${tarFile} ${config.remote} --use-mmap --user-agent rclone --fast-list --min-age ${config.retention_days}d --log-file "${logFilePath}"`;
        log(`Executing: ${rcloneCommand}`);
        
        exec(rcloneCommand, (error, stdout, stderr) => {
          if (error) {
            log(`Error moving to remote: ${stderr}`);
            return reject(error);
          }
          log(`Website backup ${tarFile} moved to remote successfully.`);
          
          if (--pendingOperations === 0) {
            resolve();
          }
        });
      });
    });
  });
}

module.exports = backupWebsites;
