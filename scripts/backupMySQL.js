const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const configPath = path.join(os.homedir(), '.config', 'rbaker', 'mysql.json');
if (!fs.existsSync(configPath)) {
  console.error(`Configuration file not found: ${configPath}`);
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
        console.error(`Error listing databases: ${stderr}`);
        return reject(error);
      }

      const databases = stdout.split('\n').filter(db => db && db !== 'Database' && db !== 'information_schema' && db !== 'performance_schema');
      if (databases.length === 0) {
        console.error('No databases found to back up.');
        return resolve();
      }

      let pendingOperations = databases.length;
      databases.forEach(db => {
        const backupFile = path.join(config.backup_dir, `${db}.sql`);
        const command = `mysqldump ${userOption} ${passwordOption} ${db} ${additionalOptions} > ${backupFile}`;

        console.log(`Backing up database: ${db}`);
        exec(command, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error backing up ${db}: ${stderr}`);
            return reject(error);
          }
          console.log(`Database ${db} backed up successfully.`);

          const verifyCommand = `mysql ${userOption} ${passwordOption} --skip-column-names -e "SELECT 'Verification Test' AS ''; SOURCE ${backupFile};"`;
          exec(verifyCommand, (error, stdout, stderr) => {
            if (error) {
              console.error(`Backup verification failed: ${stderr}`);
              return reject(error);
            } else {
              console.log(`Backup verification succeeded: ${stdout}`);

              const rcloneCommand = `rclone move ${backupFile} ${config.remote} --use-mmap --user-agent rclone --fast-list --min-age ${config.retention_days}d`;
              exec(rcloneCommand, (error, stdout, stderr) => {
                if (error) {
                  console.error(`Error moving ${backupFile} to remote: ${stderr}`);
                  return reject(error);
                }
                console.log(`MySQL backup ${backupFile} moved to remote successfully.`);
                
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
