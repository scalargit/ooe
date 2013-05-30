@echo off
set JRE_HOME=@JRE_HOME@
echo "Using JRE_HOME=%JRE_HOME%"
set _RUNJAVA="%JRE_HOME%\bin\java"

rem Get remaining unshifted command line arguments and save them in the
set CMD_LINE_ARGS=
:setArgs
if ""%1""=="""" goto doneSetArgs
set CMD_LINE_ARGS=%CMD_LINE_ARGS% %1
shift
goto setArgs
:doneSetArgs

set JVM_ARGS=
if not "%O2E_MASTER_PASSWORD%" == "" set JVM_ARGS=-Dorg.o2e.server.encryption.password=%O2E_MASTER_PASSWORD%

%_RUNJAVA% %JVM_ARGS% -jar o2e-crypto-%{o2e-crypto.version}.jar %CMD_LINE_ARGS%

goto end

:exit
exit /b 1

:end
exit /b 0