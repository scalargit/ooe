#!/bin/bash

echo "Backing up previous SC install..."
timestamp=`date +%Y%m%d-%H.%M.%S`

BACKUP_DIR=$1
PREVIOUS_INSTALL_DIR=$2

if [ ! -d "$BACKUP_DIR/sc-backup" ]; then
    echo "Creating sc-backup directory."
    mkdir "$BACKUP_DIR/sc-backup";
fi

tar cfzv "$BACKUP_DIR/sc-backup/sc-$timestamp.tgz" $PREVIOUS_INSTALL_DIR

echo "Backup complete."