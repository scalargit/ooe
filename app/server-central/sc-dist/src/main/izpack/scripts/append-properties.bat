@echo off

set file="%{INSTALL_PATH}\scripts\install.properties"

if /i "%~1" EQU "" goto EndLoop

:loop
set key=%~1
shift
if /i "%~1" NEQ "" (
	set val=%~1
	shift
)
echo %key%=%val% >> %file%

if /i "%~1" NEQ "" goto loop
:endloop

::End of code