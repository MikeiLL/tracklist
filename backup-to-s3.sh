#!/bin/bash
eval $(cat .env | sed 's/^/export /')
export AWS_CONFIG_FILE="/home/web/.aws/config"
echo $AWS_CONFIG_FILE
TIMESTAMP=`env TZ=America/Chicago date +%Y-%m-%d-%H%M`
ARCHIVE_PATH=/tmp/$DATABASE
ARCHIVE_FILENAME=$DATABASE-$TIMESTAMP.sql #.tar.gz
mkdir -p $ARCHIVE_PATH
/usr/bin/pg_dump $DATABASE > $ARCHIVE_PATH/$ARCHIVE_FILENAME
#tar -C $ARCHIVE_PATH -czf /tmp/$ARCHIVE_FILENAME . &&
/usr/bin/aws s3 cp $ARCHIVE_PATH/$ARCHIVE_FILENAME s3://mzoo-site-backups/mzoomicro/$DATABASE/$ARCHIVE_FILENAME &&
rm -rf $ARCHIVE_PATH
