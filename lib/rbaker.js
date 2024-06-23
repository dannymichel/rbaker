#!/usr/bin/env node

const schedule = require('node-schedule');
const yargs = require('yargs');
const { backupDirectories, backupMysql, moveBackupDatabase, moveMediaFiles, backupSite } = require('./tasks');
const { config, saveConfig } = require('./config');
const { runCommand } = require('./helpers');

// Schedule the tasks
schedule.scheduleJob('0 1 * * *', () => backupDirectories());
schedule.scheduleJob('0 2 * * *', () => backupMysql());
schedule.scheduleJob('0 3 * * *', () => moveBackupDatabase());
schedule.scheduleJob('0 4 * * *', () => moveMediaFiles());
schedule.scheduleJob('0 5 * * *', () => backupSite());

// CLI Functions
function listSchedules() {
    console.log('Scheduled tasks:');
    for (const [name, job] of Object.entries(schedule.scheduledJobs)) {
        console.log(`${name}: Next run at ${job.nextInvocation()}`);
    }
}

function addSchedule(taskName, time) {
    const taskMap = {
        'backupDirectories': backupDirectories,
        'backupMysql': backupMysql,
        'moveBackupDatabase': moveBackupDatabase,
        'moveMediaFiles': moveMediaFiles,
        'backupSite': backupSite
    };
    if (taskName in taskMap) {
        const [hour, minute] = time.split(':').map(Number);
        schedule.scheduleJob(`${minute} ${hour} * * *`, taskMap[taskName]);
        console.log(`Scheduled ${taskName} at ${time}`);
    } else {
        console.log(`Task ${taskName} not recognized`);
    }
}

function removeSchedule(taskName) {
    const job = schedule.scheduledJobs[taskName];
    if (job) {
        job.cancel();
        console.log(`Removed schedule for ${taskName}`);
    } else {
        console.log(`Task ${taskName} not found`);
    }
}

async function runTask(taskName, duration, dryRun) {
    const taskMap = {
        'backupDirectories': backupDirectories,
        'backupMysql': backupMysql,
        'moveBackupDatabase': moveBackupDatabase,
        'moveMediaFiles': moveMediaFiles,
        'backupSite': backupSite
    };
    if (taskName in taskMap) {
        // Pause the systemd service
        await runCommand("sudo systemctl stop rbaker.service");
        try {
            await taskMap[taskName](duration, dryRun);
        } finally {
            // Resume the systemd service
            await runCommand("sudo systemctl start rbaker.service");
        }
    } else {
        console.log(`Task ${taskName} not recognized`);
    }
}

function setConfig(key, value) {
    const newConfig = {};
    newConfig[key] = value;
    saveConfig(newConfig);
    console.log(`Configuration ${key} set to ${value}`);
}

const argv = yargs
    .command('run', 'Run the scheduler', {}, () => {
        // Run the scheduler continuously
        setInterval(() => {}, 1 << 30);
    })
    .command('list', 'List scheduled tasks', {}, listSchedules)
    .command('add', 'Add a scheduled task', {
        task: {
            describe: 'Task name',
            demandOption: true,
            type: 'string'
        },
        time: {
            describe: 'Time to schedule the task (HH:MM format)',
            demandOption: true,
            type: 'string'
        }
    }, (argv) => {
        addSchedule(argv.task, argv.time);
    })
    .command('remove', 'Remove a scheduled task', {
        task: {
            describe: 'Task name',
            demandOption: true,
            type: 'string'
        }
    }, (argv) => {
        removeSchedule(argv.task);
    })
    .command('run_task', 'Run a task immediately', {
        task: {
            describe: 'Task name',
            demandOption: true,
            type: 'string'
        },
        duration: {
            describe: 'Duration for running the task (in seconds)',
            type: 'number'
        },
        dryRun: {
            describe: 'Perform a dry run',
            type: 'boolean',
            default: false
        }
    }, (argv) => {
        runTask(argv.task, argv.duration, argv.dryRun);
    })
    .command('set', 'Set a configuration value', {
        key: {
            describe: 'Configuration key',
            demandOption: true,
            type: 'string'
        },
        value: {
            describe: 'Configuration value',
            demandOption: true,
            type: 'string'
        }
    }, (argv) => {
        setConfig(argv.key, argv.value);
    })
    .help()
    .argv;
