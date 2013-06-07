#!/bin/bash

echo "Encrypting O2E passwords..."

current_dir=`pwd`
export JRE_HOME=$1
export O2E_MASTER_PASSWORD=$2
shift
shift

echo "Using JRE_HOME=$JRE_HOME"
cd "%{org.o2e.server.jetty.home}"

sh run-crypto.sh org.o2e.launchOption:encrypt org.o2e.encryptMode:useArguments $@

cd $current_dir