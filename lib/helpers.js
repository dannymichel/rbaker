const { exec } = require('child_process');

function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${command}\n${stderr}`);
                reject(error);
            }
            resolve(stdout);
        });
    });
}

module.exports = { runCommand };
