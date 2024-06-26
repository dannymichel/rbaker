const CronJob = require('cron').CronJob;
const db = require('./db');
const backupDirectories = require('./backupDirectories');
const backupMySQL = require('./backupMySQL');
const moveMedia = require('./moveMedia');
const backupWebsites = require('./backupWebsites');

const tasks = {
  backupDirectories,
  backupMySQL,
  moveMedia,
  backupWebsites,
};

const taskQueue = [];
let isTaskRunning = false;
let taskTimeout = null;

async function executeTask(taskName, timeout) {
  if (isTaskRunning) {
    console.log(`Task ${taskName} skipped because another task is running.`);
    return;
  }

  isTaskRunning = true;
  console.log(`Executing task: ${taskName}`);

  let taskCompleted = false;

  taskTimeout = setTimeout(() => {
    if (!taskCompleted) {
      console.log(`Task ${taskName} exceeded timeout of ${timeout} seconds. This is an expected behavior.`);
      isTaskRunning = false;
      processNextTask();
    }
  }, timeout * 1000);

  try {
    await tasks[taskName]();
    taskCompleted = true;
    console.log(`Task ${taskName} completed.`);
  } catch (error) {
    console.error(`Error executing task ${taskName}:`, error);
  } finally {
    clearTimeout(taskTimeout);
    isTaskRunning = false;
    processNextTask();
  }
}

function processNextTask() {
  if (taskQueue.length > 0) {
    const { taskName, timeout } = taskQueue.shift();
    executeTask(taskName, timeout);
  }
}

function scheduleTask(taskName, interval, timeout) {
  new CronJob(interval, () => {
    taskQueue.push({ taskName, timeout });
    if (!isTaskRunning) {
      processNextTask();
    }
  }, null, true).start();
}

function scheduler() {
  console.log("Scheduler started");

  db.all("SELECT * FROM schedule", [], (err, rows) => {
    if (err) {
      console.error("Error fetching schedule:", err);
      throw err;
    }
    console.log("Tasks loaded from the database:", rows);

    rows.forEach((row) => {
      console.log(`Scheduled task: ${row.task} to run at ${row.interval}`);
      scheduleTask(row.task, row.interval, row.timeout);
    });
  });

  setInterval(() => {
    console.log('Scheduler is running');
  }, 60000);
}

module.exports = scheduler;
