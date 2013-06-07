echo off

set ADMIN_PW=%1
set O2E_PW=%2

echo "Starting Mongod in unsecure mode..."
start "Mongod" "%{INSTALL_PATH}/scripts/startMongoUnsecure.bat"

echo "Sleeping for 10 seconds to give mongod time to start up..."
ping 123.45.67.89 -n 1 -w 10000 > nul

echo "Adding mongo users 'admin' and 'o2e'..."
"%{org.o2e.server.mongodb.home}/bin/mongo" --port ###org.o2e.server.mongod.port### admin --eval "db.addUser('admin', '%ADMIN_PW%')"
"%{org.o2e.server.mongodb.home}/bin/mongo" --port ###org.o2e.server.mongod.port### o2e --eval "db.addUser('o2e', '%O2E_PW%')"
"%{org.o2e.server.mongodb.home}/bin/mongo" --port ###org.o2e.server.mongod.port### admin --eval "db.shutdownServer()"