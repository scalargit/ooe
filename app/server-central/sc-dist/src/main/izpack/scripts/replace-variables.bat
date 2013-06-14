@echo off

SETLOCAL 
SETLOCAL EnableDelayedExpansion
set type=%1
shift

if /i "%~1" EQU "" goto EndLoop

:loop
set key=%~1
shift
if /i "%~1" NEQ "" (
	set val=%~1
	shift
)

for /f "Tokens=* Delims=" %%f in ('type "%{INSTALL_PATH}\scripts\replace-files-%type%.txt"') do (
	echo Setting key "%key%" to value "%val%" in file "%%f"
  call %{INSTALL_PATH}\scripts\sed.bat "%%f" "%key%" "%val%"
)

if /i "%~1" NEQ "" goto loop
:endloop
ENDLOCAL