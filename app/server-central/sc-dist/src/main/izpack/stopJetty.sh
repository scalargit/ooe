#!/bin/bash

export JRE_HOME=###JRE_HOME###
echo "Shutting down Jetty..."
echo "Using JRE_HOME=$JRE_HOME"

JAVA_OPTIONS="-DSTOP.PORT=###org.o2e.server.stop.port### -DSTOP.KEY=stopkey###org.o2e.server.stop.port###"

$JRE_HOME/bin/java $JAVA_OPTIONS -jar start.jar --stop