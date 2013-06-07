#!/bin/bash

ADMIN_PW=$1
O2E_PW=$2

echo "Starting Mongod in unsecure mode..."
%{INSTALL_PATH}/scripts/./startMongoUnsecure.sh &

echo "Sleeping for 10 seconds to give mongod time to start up..."
sleep 10

echo "Adding mongo users 'admin' and 'o2e'..."
"%{org.o2e.server.mongodb.home}/bin/mongo" --port ###org.o2e.server.mongod.port### admin --eval "db.addUser('admin', '$ADMIN_PW')"
"%{org.o2e.server.mongodb.home}/bin/mongo" --port ###org.o2e.server.mongod.port### o2e --eval "db.addUser('o2e', '$O2E_PW')"
"%{org.o2e.server.mongodb.home}/bin/mongo" --port ###org.o2e.server.mongod.port### admin --eval "db.shutdownServer()"