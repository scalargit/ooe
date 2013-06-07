#!/bin/bash

TIMESTAMP=`date`
file=$1
key=$2
value=$TIMESTAMP

#Strip single quotes that are passed in by izpack
file=`echo "$file" | sed -e "s/'//g"`

echo "Making backup of $file"
cp "$file" "$file.bak"
echo "Replacing all instances of key $key with value $value in file $file"
sed 's!'"$key"'!'"$value"'!g' "$file.bak" >"$file"