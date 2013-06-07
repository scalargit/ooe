if not exist "%{INSTALL_PATH}\repository" mkdir "%{INSTALL_PATH}\repository"
if not exist "%{INSTALL_PATH}\log" mkdir "%{INSTALL_PATH}\log"
bin\mongod --dbpath "%{INSTALL_PATH}\repository" --auth --logpath "%{INSTALL_PATH}\log\mongodb.log" --logappend --port ###org.o2e.server.mongod.port###