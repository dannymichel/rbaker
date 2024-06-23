const { runCommand } = require('./helpers');
const { config } = require('./config');
const { format } = require('date-fns');

async function backupDirectories(duration = config.maxDuration, dryRun = false) {
    for (const dir of config.directories) {
        const destPath = `${config.remote}${dir.substring(1)}`;
        const command = `timeout ${duration} rclone ${dryRun ? 'sync --dry-run' : 'sync'} --log-file ${config.logDir}backup.log -v --use-mmap --user-agent rclone --fast-list --config ${config.rcloneConfig} ${dir} ${destPath}`;
        try {
            await runCommand(command);
        } catch (error) {
            console.log(`rclone sync for directory ${dir} timed out after ${duration} seconds.`);
            break;
        }
    }
}

async function backupMysql(dryRun = false) {
    const timestamp = format(new Date(), 'yyyy-MM-dd');
    const showDatabasesCommand = `mysql -u ${config.mysqlUser} -p${config.mysqlPassword} -e 'SHOW DATABASES' | grep -Ev '${config.ignoreDb}'`;
    const databases = (await runCommand(showDatabasesCommand)).split('\n').filter(Boolean);
    for (const db of databases) {
        const backupFile = `${config.backupDir}/${timestamp}.${db}.sql.gz`;
        const command = `mysqldump -u ${config.mysqlUser} -p${config.mysqlPassword} ${db} | ${dryRun ? 'cat' : 'gzip'} > ${backupFile}`;
        await runCommand(command);
    }
    if (!dryRun) {
        await deleteOldBackups(config.backupDir);
    }
}

async function deleteOldBackups(directory) {
    const command = `find ${directory} -type f -name '*.sql.gz' -mtime +${config.keepBackupsFor} -exec rm {} \\;`;
    await runCommand(command);
}

async function deleteOldRemoteBackups(remoteDir, dryRun = false) {
    const command = `rclone lsf --files-only ${remoteDir} | awk -F'_' '{print $1"_"$2}' | sort | uniq | while read base_name; do rclone lsf --files-only ${remoteDir} | grep "$base_name" | sort -r | tail -n +4 | while read file; do rclone ${dryRun ? '--dry-run' : ''} delete ${remoteDir}"$file"; done; done`;
    await runCommand(command);
}

async function moveBackupDatabase(dryRun = false) {
    const command1 = `chown -R ${config.user}:${config.group} ${config.backupDir}`;
    const command2 = `rclone ${dryRun ? 'move --dry-run' : 'move'} --log-file ${config.logDir}database.log -v --use-mmap --user-agent rclone --fast-list --config ${config.rcloneConfig} ${config.backupDir}/ ${config.remote}database`;
    const command3 = `find ${config.backupDir}/* -empty -type d -delete`;
    await runCommand(command1);
    await runCommand(command2);
    if (!dryRun) {
        await runCommand(command3);
        await deleteOldRemoteBackups(`${config.remote}database/`, dryRun);
    }
}

async function moveMediaFiles(dryRun = false) {
    for (const [media, path] of Object.entries(config.mediaPaths)) {
        const command1 = `rclone ${dryRun ? 'move --dry-run' : 'move'} --log-file ${config.logDir}${media}.log -v --use-mmap --user-agent rclone --fast-list --config ${config.rcloneConfig} ${path} ${media}:`;
        const command2 = `find ${path}* -empty -type d -delete`;
        await runCommand(command1);
        if (!dryRun) {
            await runCommand(command2);
        }
    }
}

async function backupSite(dryRun = false) {
    const timestamp = format(new Date(), 'dd-MM-yy.HH.HH.MM');
    for (const site of config.siteBackups) {
        const tarFile = `${config.siteBackupDir}/${timestamp}.${site.name}.tar.bz2`;
        const command = `tar ${dryRun ? '-cvjf' : '-cvjSf'} ${tarFile} ${site.source}`;
        await runCommand(command);
    }
    await runCommand(`chown -R ${config.user}:${config.group} ${config.siteBackupDir}`);
    await runCommand(`rclone ${dryRun ? 'move --dry-run' : 'move'} --log-file ${config.logDir}${config.siteBackupLog} -v --use-mmap --user-agent rclone --fast-list --config ${config.rcloneConfig} ${config.siteBackupDir}/ ${config.remote}site`);
    if (!dryRun) {
        await runCommand(`find ${config.siteBackupDir}/* -empty -type d -delete`);
        await deleteOldRemoteBackups(`${config.remote}site/`, dryRun);
    }
}

module.exports = {
    backupDirectories,
    backupMysql,
    moveBackupDatabase,
    moveMediaFiles,
    backupSite,
    deleteOldBackups
};
