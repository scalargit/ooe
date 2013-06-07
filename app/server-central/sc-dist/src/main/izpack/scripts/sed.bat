@echo off

SETLOCAL EnableDelayedExpansion
setlocal
set file=%~1
set newfile=temp
set key=%2
set value=%~3

rem Escape individual forward slashes
set value=%value:\=\\%

rem Call sed-3.59.exe to perform actual string replacement
%{INSTALL_PATH}\scripts\sed-3.59 "s|###%key%###|%value%|g" "%file%" > "%newfile%"
move /Y %newfile% %file%

endlocal