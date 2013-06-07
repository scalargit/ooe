#!/bin/bash

PWD=`pwd`
export JRE_HOME=###JRE_HOME###
echo "Starting Jetty..."
echo "Using JRE_HOME=$JRE_HOME"
echo "Executing from $PWD"

TMP_DIR=###java.io.tmpdir###
LOG_FILE=logs/stdout.log
O2E_MASTER_PASSWORD=""
read -s -p "Enter SC Master Password: " O2E_MASTER_PASSWORD

DEBUG_OPTIONS="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005 -verbose:gc"
JVM_TUNING_OPTIONS="-server -Xms2g -Xmx2g -XX:NewSize=256m -XX:MaxPermSize=256m -XX:+UseConcMarkSweepGC -XX:+UseParNewGC"
KEYSTORE_OPTIONS="-Dorg.o2e.server.encryption.password=$O2E_MASTER_PASSWORD \
-Djavax.net.ssl.trustStore=###org.o2e.keystore.file### -Djavax.net.ssl.keyStore=###org.o2e.keystore.file### \
-Dorg.o2e.keystore.key.alias=###org.o2e.keystore.key.alias###"
MISC_OPTIONS="-DSTOP.PORT=###org.o2e.server.stop.port### -DSTOP.KEY=stopkey###org.o2e.server.stop.port### \
-Dspring.profiles.active=prod -Djava.io.tmpdir=$TMP_DIR"

if [ ! -d "$TMP_DIR" ]; then
    echo "Creating temp directory."
    mkdir -p "$TMP_DIR";
fi

#Need to set JSSE keystore properties in order to make outbound HTTP requests over SSL
JAVA_OPTIONS="$JVM_TUNING_OPTIONS $KEYSTORE_OPTIONS $MISC_OPTIONS"

nohup $JRE_HOME/bin/java $JAVA_OPTIONS -jar $PWD/o2e-bootstrap-jetty-%{org.o2e.bootstrap.version}.jar >> $LOG_FILE &
