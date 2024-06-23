const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '..', 'config', 'config.json');
const exampleConfigPath = path.join(__dirname, '..', 'config', 'config_example.json');

let config;

if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath));
} else {
    config = JSON.parse(fs.readFileSync(exampleConfigPath));
}

function saveConfig(newConfig) {
    config = { ...config, ...newConfig };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

module.exports = { config, saveConfig };
