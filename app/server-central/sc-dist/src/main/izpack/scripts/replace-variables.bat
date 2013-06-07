@echo off

SETLOCAL 
SETLOCAL EnableDelayedExpansion
set type=%1
shift

if /i "%~1" EQU "" goto EndLoop

:loop
set key=%~1
rem echo "found key %key%
shift
if /i "%~1" NEQ "" (
	set val=%~1
	rem echo "Found val %1"
	shift
)
rem echo %key%=%val% >> %file%
echo "Reading file names from %{INSTALL_PATH}\scripts\replace-files-%type%.txt"

for /f "Tokens=* Delims=" %%f in ('type "%{INSTALL_PATH}\scripts\replace-files-%type%.txt"') do (
	rem call "C:\Users\Jeff\Documents\tmp\scripts\repl.bat" %k1% "%val%" < "%%f" > "%tmp%"
  call %{INSTALL_PATH}\scripts\sed.bat "%%f" "%key%" "%val%"
)

if /i "%~1" NEQ "" goto loop
:endloop
ENDLOCAL