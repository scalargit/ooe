@echo off
echo "Encrypting O2E passwords..."

set JRE_HOME=%1
set O2E_MASTER_PASSWORD=%2
shift
shift

rem Get remaining unshifted command line arguments and save them in the
set CMD_LINE_ARGS=
:setArgs
if ""%1""=="""" goto doneSetArgs
set CMD_LINE_ARGS=%CMD_LINE_ARGS% %1
shift
goto setArgs
:doneSetArgs

echo Using JRE_HOME=%JRE_HOME%
set JVM_ARGS=
if not "%O2E_MASTER_PASSWORD%" == "" set JVM_ARGS=-Dorg.o2e.server.encryption.password=%O2E_MASTER_PASSWORD%

%JRE_HOME%\bin\java %JVM_ARGS% -jar "%{INSTALL_PATH}\jetty\o2e-crypto-%{org.o2e.crypto.version}.jar" ^
org.o2e.launchOption:encrypt org.o2e.encryptMode:useArguments ^
org.o2e.secretsFile:"%{INSTALL_PATH}\jetty\etc\secrets.properties" ^
%CMD_LINE_ARGS%