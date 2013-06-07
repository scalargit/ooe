#!/bin/bash

echo "Shutting down Mongod..."
pid=`cat %{INSTALL_PATH}/repository/mongod.lock`
kill $pid