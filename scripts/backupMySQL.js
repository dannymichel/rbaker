const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const log = require('./logger');

const configPath = path.join(os.homedir(), '.config', 'rbaker', 'mysql.json');
if (!fs.existsSync(configPath)) {
  log(`Configuration file not found: ${configPath}`);
  process.exit(1);
}
const config = require(configPath);

function backupMySQL() {
  return new Promise((resolve, reject) => {
    const userOption = config.mysql_user ? `-u${config.mysql_user}` : '';
    const passwordOption = config.mysql_password ? `-p${config.mysql_password}` : '';
    const additionalOptions = '--routines --triggers --events --single-transaction --quick --lock-tables=false --opt --complete-insert';

    exec(`mysql ${userOption} ${passwordOption} --skip-column-names -e "SHOW DATABASES;"`, (error, stdout, stderr) => {
      if (error) {
        log(`Error listing databases: ${stderr}`);
        return reject(error);
      }

      const databases = stdout.split('\n').filter(db => db && db !== 'Database' && db !== 'information_schema' && db !== 'performance_schema');
      if (databases.length === 0) {
        log('No databases found to back up.');
        return resolve();
      }

      let pendingOperations = databases.length;
      databases.forEach(db => {
        const timestamp = new Date().toISOString().replace(/[:.-]/g, '_');
        const backupFile = path.join(config.backup_dir, `${db}_${timestamp}.sql`);
        const command = `mysqldump ${userOption} ${passwordOption} ${db} ${additionalOptions} > ${backupFile}`;

        log(`Backing up database: ${db}`);
        exec(command, (error, stdout, stderr) => {
          if (error) {
            log(`Error backing up ${db}: ${stderr}`);
            return reject(error);
          }
          log(`Database ${db} backed up successfully.`);

          const verifyCommand = `mysql ${userOption} ${passwordOption} --skip-column-names -e "SELECT 'Verification Test' AS ''; SOURCE ${backupFile};"`;
          exec(verifyCommand, (error, stdout, stderr) => {
            if (error) {
              log(`Backup verification failed: ${stderr}`);
              return reject(error);
            } else {
              log(`Backup verification succeeded: ${stdout}`);

              const logFilePath = path.join(os.homedir(), '.config', 'rbaker', 'logs', `rclone_${db}_${timestamp}.log`);
              const rcloneCommand = `rclone move ${backupFile} ${config.remote} --use-mmap --user-agent rclone --fast-list --min-age ${config.retention_days}d --log-file "${logFilePath}"`;
              exec(rcloneCommand, (error, stdout, stderr) => {
                if (error) {
                  log(`Error moving ${backupFile} to remote: ${stderr}`);
                  return reject(error);
                }
                log(`MySQL backup ${backupFile} moved to remote successfully.`);
                
                if (--pendingOperations === 0) {
                  resolve();
                }
              });
            }
          });
        });
      });
    });
  });
}

module.exports = backupMySQL;
