# rbaker

`rbaker` is a Node.js application designed for scheduling and executing various backup tasks. It supports backing up directories, MySQL databases, media files, and websites to both local and remote locations. The scheduling of these tasks is managed using cron-like syntax.

## Features

- **Backup Directories**: Sync specified directories to a remote location.
- **Backup MySQL Databases**: Dump MySQL databases and move them to a remote backup location.
- **Move Media Files**: Move media files from specified directories to a remote location.
- **Backup Websites**: Backup website directories and move the backups to a remote location.
- **Task Scheduling**: Schedule tasks using cron-like syntax.
- **Database Support**: Use SQLite to store task schedules.

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/dannymichel/rbaker.git
    cd rbaker
    ```

2. **Install dependencies:**
    ```sh
    npm install
    ```

3. **Global Installation:**
    To install `rbaker` globally and ensure configuration files are set up correctly, use:
    ```sh
    sudo npm install -g rbaker
    ```

4. **Initial Configuration:**
    On the first run, `rbaker` will create the configuration directory and copy example configuration files:
    ```sh
    ~/.config/rbaker/
    ```

## Configuration

- **MySQL Configuration (`~/.config/rbaker/mysql.json`):**
    ```json
    {
      "backup_dir": "/home/example_user/backups/database/",
      "remote": "cloud:backups/dev/database/",
      "retention_days": 10,
      "mysql_user": "root",
      "mysql_password": "example_password"
    }
    ```

- **Websites Configuration (`~/.config/rbaker/websites.json`):**
    ```json
    {
      "sites": [
        {
          "source": "/var/www",
          "backup_dir": "/home/example_user/backups/dev/site"
        },
        {
          "source": "/var/lib/gazelle/torrent",
          "backup_dir": "/home/example_user/backups/dev/tor"
        }
      ],
      "remote": "cloud:backups/dev/site/",
      "retention_days": 10
    }
    ```

- **Directories Configuration (`~/.config/rbaker/directories.json`):**
    ```json
    {
      "remote": "cloud:backups/dev/",
      "directories": [
        "/etc/dkimkeys",
        "/etc/init.d",
        "/etc/letsencrypt"
      ]
    }
    ```

- **Media Configuration (`~/.config/rbaker/media.json`):**
    ```json
    {
      "media_directories": [
         "/local/music",
         "/local/tv",
         "/local/movies"
      ],
      "remote": "cloud:media/"
    }
    ```

- **Schedule Configuration (`~/.config/rbaker/schedule.json`):**
    ```json
    {
      "tasks": [
        {
          "task": "backupDirectories",
          "interval": "0 */1 * * *",
          "timeout": 3600
        },
        {
          "task": "backupMySQL",
          "interval": "*/5 * * * *",
          "timeout": 3600
        },
        {
          "task": "moveMedia",
          "interval": "0 0 * * *",
          "timeout": 7200
        },
        {
          "task": "backupWebsites",
          "interval": "*/10 * * * *",
          "timeout": 7200
        }
      ]
    }
    ```

## Usage

### Command Line Interface

`rbaker` provides a CLI to manage and run backup tasks.

- **Scheduler**
    ```sh
    rbaker scheduler
    ```

- **Add Task**
    ```sh
    rbaker add-task <task> <interval> <timeout>
    ```
    Example:
    ```sh
    rbaker add-task backupMySQL "*/5 * * * *" 3600
    ```

- **Remove Task**
    ```sh
    rbaker remove-task <task>
    ```
    Example:
    ```sh
    rbaker remove-task backupMySQL
    ```

- **Backup Directories**
    ```sh
    rbaker backup-directories
    ```

- **Backup MySQL**
    ```sh
    rbaker backup-mysql -u <user> -p <password>
    ```

- **Move Media**
    ```sh
    rbaker move-media
    ```

- **Backup Websites**
    ```sh
    rbaker backup-websites
    ```

### Systemd Service

To run `rbaker` as a service, create a systemd service file:
```ini
[Unit]
Description=rbaker service
After=network.target

[Service]
ExecStart=/usr/bin/rbaker scheduler
Restart=always
User=root
Environment=NODE_ENV=production
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=rbaker
WorkingDirectory=/root/.config/rbaker/

[Install]
WantedBy=multi-user.target
```

## Contributing

Feel free to submit issues or pull requests if you have any suggestions or improvements.

## License

This project is licensed under the MIT License.

## References

- [Node Schedule](https://github.com/node-schedule/node-schedule)
- [Node Cron](https://github.com/node-cron/node-cron)
- [Bree](https://github.com/breejs/bree)
- [Agenda](https://github.com/agenda/agenda)
- [Node Backup](https://github.com/petersirka/node-backup)