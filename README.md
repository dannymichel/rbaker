# Rclone Backup (RBaker)

Rclone Backup (RBaker) is a tool to automate backups using `rclone`. It supports scheduling tasks to back up directories, MySQL databases, and more. You can configure the tool via a configuration file or command-line options.

## Installation

### Prerequisites

1. **Node.js**: Make sure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).

2. **Rclone**: Install `rclone` by following the instructions on [rclone.org](https://rclone.org/install/).

3. **MySQL Client**: Ensure the MySQL client is installed.

### Install RBaker

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/rbaker.git
    cd rbaker
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Link the package globally:

    ```bash
    npm link
    ```

4. Verify installation:

    ```bash
    rbaker --help
    ```

## Configuration

Copy the example configuration file to create your own configuration:

```bash
cp config/config_example.json config/config.json
```

Edit `config/config.json` to fit your needs. Below is an example configuration:

```json
{
    "backupDir": "/data/backups/database",
    "mysqlUser": "root",
    "mysqlPassword": "example_password",
    "ignoreDb": "(^mysql|_schema$)",
    "keepBackupsFor": 30,
    "rcloneConfig": "/data/rclone/config/rclone.conf",
    "logDir": "/data/rclone/logs/",
    "remote": "cloud:backups/live/",
    "maxDuration": 3600,
    "directories": [],
    "user": "user",
    "group": "user",
    "mediaPaths": {
        "tv": "/local/tv/",
        "movies": "/local/movies/",
        "music": "/local/music/"
    },
    "siteBackups": [
        {
            "name": "example-site",
            "source": "/data/nginx/html/example"
        },
        {
            "name": "example-tor",
            "source": "/data/exampleup"
        }
    ],
    "siteBackupDir": "/data/backups/live/site",
    "siteBackupLog": "example-site.log"
}
```

## Usage

### Systemd Service

To run RBaker as a service, create a systemd service file:

```ini
[Unit]
Description=RBaker Scheduler Service
After=network.target

[Service]
ExecStart=/usr/local/bin/rbaker/bin/rbaker run
Restart=always
User=your-username
Group=your-group
Environment=PATH=/usr/bin:/usr/local/bin
WorkingDirectory=/usr/local/bin/rbaker

[Install]
WantedBy=multi-user.target
```

Replace `your-username` and `your-group` with the appropriate values.

Enable and start the service:

```bash
sudo systemctl enable rbaker.service
sudo systemctl start rbaker.service
```

### Commands

- **List Scheduled Tasks**:
    ```bash
    rbaker list
    ```

- **Add a Scheduled Task**:
    ```bash
    rbaker add --task backupDirectories --time 01:00
    ```

- **Remove a Scheduled Task**:
    ```bash
    rbaker remove --task backupDirectories
    ```

- **Run a Task Immediately**:
    ```bash
    rbaker run_task --task backupDirectories --duration 1800 --dryRun
    ```

- **Set a Configuration Value**:
    ```bash
    rbaker set --key mysqlPassword --value new_password
    ```

## Example Configuration

Here is an example configuration file:

```json
{
    "backupDir": "/data/backups/database",
    "mysqlUser": "root",
    "mysqlPassword": "example_password",
    "ignoreDb": "(^

mysql|_schema$)",
    "keepBackupsFor": 30,
    "rcloneConfig": "/data/rclone/config/rclone.conf",
    "logDir": "/data/rclone/logs/",
    "remote": "cloud:backups/live/",
    "maxDuration": 3600,
    "directories": [
        "/data/bazarr",
        "/data/bin",
        "/data/bots"
    ],
    "user": "user",
    "group": "user",
    "mediaPaths": {
        "tv": "/local/tv/",
        "movies": "/local/movies/",
        "music": "/local/music/"
    },
    "siteBackups": [
        {
            "name": "example-site",
            "source": "/data/nginx/html/example"
        },
        {
            "name": "example-tor",
            "source": "/data/exampleup"
        }
    ],
    "siteBackupDir": "/data/backups/live/site",
    "siteBackupLog": "example-site.log"
}
```

## Contribution

Feel free to open issues or submit pull requests on the GitHub repository.

## License

This project is licensed under the MIT License.