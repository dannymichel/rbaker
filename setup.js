#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');
const chalk = require('chalk');

const configDir = path.join(os.homedir(), '.config', 'rbaker');
const exampleFiles = [
  'mysql_example.json',
  'schedule_example.json',
  'websites_example.json',
  'media_example.json',
  'directories_example.json'
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function ensureConfigFiles() {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  exampleFiles.forEach(file => {
    const sourcePath = path.resolve(__dirname, 'config', file);
    const destPath = path.join(configDir, file.replace('_example', ''));
    if (!fs.existsSync(destPath) && fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupConfig() {
  console.log(chalk.blue('Welcome to rbaker setup!'));

  const setupOptions = [
    'Setup backup directories',
    'Setup website backups',
    'Setup MySQL database backups',
    'Setup media folders',
    'Specify rclone config path',
    'Exit'
  ];

  while (true) {
    console.log(chalk.green('\nPlease select an option:'));
    setupOptions.forEach((option, index) => {
      console.log(chalk.yellow(`${index + 1}. ${option}`));
    });

    const choice = await prompt(chalk.cyan('\nEnter the number of your choice: '));
    const optionIndex = parseInt(choice, 10) - 1;

    if (optionIndex < 0 || optionIndex >= setupOptions.length) {
      console.log(chalk.red('Invalid choice. Please try again.'));
      continue;
    }

    if (setupOptions[optionIndex] === 'Exit') {
      break;
    }

    switch (optionIndex) {
      case 0:
        await setupBackupDirectories();
        break;
      case 1:
        await setupWebsiteBackups();
        break;
      case 2:
        await setupMySQLBackups();
        break;
      case 3:
        await setupMediaFolders();
        break;
      case 4:
        await setupRcloneConfig();
        break;
      default:
        console.log(chalk.red('Invalid option. Please try again.'));
    }
  }

  rl.close();
}

async function setupBackupDirectories() {
  console.log(chalk.blue('\nSetup Backup Directories:'));
  const directories = [];
  while (true) {
    const dir = await prompt(chalk.cyan('Enter a directory to backup (or leave blank to finish): '));
    if (!dir) break;
    directories.push(dir);
  }

  const configPath = path.join(configDir, 'directories.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
  }
  config.directories = directories;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green('Backup directories configured.'));
}

async function setupWebsiteBackups() {
  console.log(chalk.blue('\nSetup Website Backups:'));
  const sites = [];
  while (true) {
    const source = await prompt(chalk.cyan('Enter the source directory for the website (or leave blank to finish): '));
    if (!source) break;
    const backupDir = await prompt(chalk.cyan('Enter the backup directory for this website: '));
    sites.push({ source, backup_dir: backupDir });
  }

  const remote = await prompt(chalk.cyan('Enter the remote path for website backups: '));
  const retentionDays = await prompt(chalk.cyan('Enter the retention period in days: '));

  const configPath = path.join(configDir, 'websites.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
  }
  config.sites = sites;
  config.remote = remote;
  config.retention_days = parseInt(retentionDays, 10);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green('Website backups configured.'));
}

async function setupMySQLBackups() {
  console.log(chalk.blue('\nSetup MySQL Backups:'));
  const mysqlUser = await prompt(chalk.cyan('Enter the MySQL user: '));
  const mysqlPassword = await prompt(chalk.cyan('Enter the MySQL password: '));
  const backupDir = await prompt(chalk.cyan('Enter the backup directory for MySQL backups: '));
  const remote = await prompt(chalk.cyan('Enter the remote path for MySQL backups: '));
  const retentionDays = await prompt(chalk.cyan('Enter the retention period in days: '));

  const configPath = path.join(configDir, 'mysql.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
  }
  config.mysql_user = mysqlUser;
  config.mysql_password = mysqlPassword;
  config.backup_dir = backupDir;
  config.remote = remote;
  config.retention_days = parseInt(retentionDays, 10);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green('MySQL backups configured.'));
}

async function setupMediaFolders() {
  console.log(chalk.blue('\nSetup Media Folders:'));
  const mediaDirectories = [];
  while (true) {
    const dir = await prompt(chalk.cyan('Enter a media directory (or leave blank to finish): '));
    if (!dir) break;
    mediaDirectories.push(dir);
  }

  const remote = await prompt(chalk.cyan('Enter the remote path for media: '));

  const configPath = path.join(configDir, 'media.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
  }
  config.media_directories = mediaDirectories;
  config.remote = remote;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green('Media folders configured.'));
}

async function setupRcloneConfig() {
  console.log(chalk.blue('\nSpecify rclone Config Path:'));
  const rcloneConfigPath = await prompt(chalk.cyan('Enter the path to your rclone config: '));
  const configPath = path.join(configDir, 'rclone.json');
  fs.writeFileSync(configPath, JSON.stringify({ rclone_config_path: rcloneConfigPath }, null, 2));
  console.log(chalk.green('rclone config path set.'));
}

ensureConfigFiles();
setupConfig().catch(console.error);
