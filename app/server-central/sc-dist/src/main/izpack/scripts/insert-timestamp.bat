@echo off

set TIMESTAMP=%DATE:/=-%@%TIME::=-%
set file=%1
set newfile=temp
set key=%2
set value=%TIMESTAMP%

echo Replacing all instances of key %key% with value %value% in file %file%

call "%{INSTALL_PATH}\scripts\batch-substitute.bat" "%key%" "%value%" "%file%" > "%newfile%"

del %file%
move %newfile% %file%