@echo off
echo "Backing up previous SC install..."

set BACKUP_DIR=%1
set PREVIOUS_INSTALL_DIR=%2
if not exist "%BACKUP_DIR%/sc-backup" mkdir "%BACKUP_DIR%/sc-backup"
SET timestamp=%date:~10,4%-%date:~7,2%-%date:~4,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
xcopy /i /e "%PREVIOUS_INSTALL_DIR%" "%BACKUP_DIR%/sc-backup/sc-%timestamp%"

echo "Backup complete."