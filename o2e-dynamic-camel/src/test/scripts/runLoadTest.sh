#!/bin/sh

KEYSTORE_OPTIONS="-Djavax.net.ssl.keyStore=/home/ec2-user/certs/sw-user-truststore.jks -Djavax.net.ssl.keyStorePassword=password -Dorg.eclipse.jetty.ssl.keypassword=password -Dorg.o2e.keystore.key.alias=sw-user"
JVM_TUNING_OPTIONS="-Xms1g -Xmx1g -XX:NewSize=128m -XX:MaxPermSize=128m -XX:+UseConcMarkSweepGC -XX:+UseParNewGC"

timestamp=`date +%Y%m%d-%H.%M.%S`

java $KEYSTORE_OPTIONS $JVM_TUNING_OPTIONS -cp ".:lib/*:resources" org.o2e.test.load.CometdLoadTest > $timestamp.out &
