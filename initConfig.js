const fs = require('fs');
const path = require('path');
const os = require('os');

function ensureConfigFiles() {
  const configDir = path.join(os.homedir(), '.config', 'rbaker');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const exampleFiles = [
    'mysql_example.json',
    'schedule_example.json',
    'websites_example.json',
    'media_example.json',
    'directories_example.json'
  ];

  exampleFiles.forEach(file => {
    const sourcePath = path.resolve(__dirname, 'config', file);
    const destPath = path.join(configDir, file.replace('_example', ''));
    if (!fs.existsSync(destPath) && fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

ensureConfigFiles();
