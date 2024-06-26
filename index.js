#!/usr/bin/env node

const fs = require('fs');
require('./initConfig');

const { program } = require('commander');
const backupDirectories = require('./scripts/backupDirectories');
const backupMySQL = require('./scripts/backupMySQL');
const moveMedia = require('./scripts/moveMedia');
const backupWebsites = require('./scripts/backupWebsites');
const db = require('./scripts/db');
const scheduler = require('./scripts/scheduler');
const path = require('path');
const os = require('os');

const configDir = path.join(os.homedir(), '.config', 'rbaker');

program
  .command('scheduler')
  .description('Run the task scheduler')
  .action(scheduler);

program
  .command('add-task <task> <interval> <timeout>')
  .description('Add a new scheduled task')
  .action((task, interval, timeout) => {
    db.get(`SELECT * FROM schedule WHERE task = ? AND interval = ? AND timeout = ?`, [task, interval, parseInt(timeout)], (err, row) => {
      if (err) {
        return console.log(err.message);
      }
      if (row) {
        return console.log(`Task ${task} with interval ${interval} and timeout ${timeout} seconds already exists.`);
      }

      db.run(`INSERT INTO schedule (task, interval, timeout) VALUES (?, ?, ?)`, [task, interval, parseInt(timeout)], function (err) {
        if (err) {
          return console.log(err.message);
        }
        console.log(`Task ${task} added with interval ${interval} and timeout ${timeout} seconds.`);

        const scheduleConfigPath = path.join(configDir, 'schedule.json');
        const scheduleConfig = require(scheduleConfigPath);
        scheduleConfig.tasks = scheduleConfig.tasks.filter(t => t.task !== task);
        scheduleConfig.tasks.push({ task, interval, timeout: parseInt(timeout) });
        fs.writeFileSync(scheduleConfigPath, JSON.stringify(scheduleConfig, null, 2));
      });
    });
  });

program
  .command('remove-task <task>')
  .description('Remove a scheduled task')
  .action((task) => {
    db.run(`DELETE FROM schedule WHERE task = ?`, [task], function (err) {
      if (err) {
        return console.log(err.message);
      }
      console.log(`Task ${task} removed.`);
      
      const scheduleConfigPath = path.join(configDir, 'schedule.json');
      const scheduleConfig = require(scheduleConfigPath);
      scheduleConfig.tasks = scheduleConfig.tasks.filter(t => t.task !== task);
      fs.writeFileSync(scheduleConfigPath, JSON.stringify(scheduleConfig, null, 2));
    });
  });

program
  .command('backup-directories')
  .description('Backup specified directories')
  .action(backupDirectories);

program
  .command('backup-mysql')
  .description('Backup MySQL databases')
  .option('-u, --user <user>', 'MySQL user')
  .option('-p, --password <password>', 'MySQL root password')
  .action((options) => {
    const mysqlConfigPath = path.join(configDir, 'mysql.json');
    const config = require(mysqlConfigPath);

    if (options.user) {
      config.mysql_user = options.user;
    }
    if (options.password) {
      config.mysql_password = options.password;
    }
    backupMySQL(config);
  });

program
  .command('move-media')
  .description('Move media files')
  .action(moveMedia);

program
  .command('backup-websites')
  .description('Backup website directories')
  .action(backupWebsites);

program.parse(process.argv);
