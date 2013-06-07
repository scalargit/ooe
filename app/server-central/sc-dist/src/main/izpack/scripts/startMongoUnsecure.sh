#!/bin/bash

if [ ! -d "%{INSTALL_PATH}/repository" ]; then
    echo "Creating repository directory."
    mkdir "%{INSTALL_PATH}/repository";
fi
%{org.o2e.server.mongodb.home}/bin/mongod --dbpath %{INSTALL_PATH}/repository --noauth --nojournal --port ###org.o2e.server.mongod.port###
