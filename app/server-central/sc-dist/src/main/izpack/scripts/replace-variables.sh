#!/bin/bash

install_type=$1 # should be 'jetty' or 'mongo'
properties_file="%{INSTALL_PATH}/scripts/install.properties"
replace_file="%{INSTALL_PATH}/scripts/replace-files-$install_type.txt"

IFS=$'\r\n'

while read file
do
        read -rd '' file <<< "$file"
        if [ -n "$file" ]; then
                echo "Making backup of $file"
                cp "$file" "$file.bak"
                while read property
                do
                    read -rd '' property <<< "$property"
                    if [ -n "$property" ]; then
                        splitidx=`expr index "$property" '[=:]'` # get the first index of the equals sign or colon
                        if [ "$splitidx" = 0 ]; then
                            key="$property"
                            value=""
                        else
                            key=${property:0:$splitidx-1}
                            value=${property:$splitidx}
                        fi

                        read -rd '' key <<< "$key" # trim string
                        read -rd '' val <<< "$val" # trim string
                        key="###$key###"
                        echo "Replacing all instances of key $key with value $value in file $file"
                        sed -i 's!'"$key"'!'"$value"'!g' "$file"
                        #sed 's!'"$key"'!'"$value"'!g' "$file.bak" > "$file"
                    fi
                done < "$properties_file"
        fi
done < "$replace_file"
