#!/bin/bash

if [ ! -d "%{INSTALL_PATH}/log" ]; then
    echo "Creating log directory."
    mkdir "%{INSTALL_PATH}/log";
fi

%{org.o2e.server.mongodb.home}/bin/mongod --config mongodb.conf &