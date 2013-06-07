#!/bin/bash

file="%{INSTALL_PATH}/scripts/install.properties"

for var in "$@"
do
    #Strip single quotes that are passed in by izpack
    var=`echo "$var" | sed -e "s/'//g"`

    echo "Adding property $var"
    echo "$var" >> "$file"
done