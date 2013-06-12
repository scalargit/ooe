@echo off
set JRE_HOME=###JRE_HOME###
echo "Starting Jetty..."
echo "Using JRE_HOME=%JRE_HOME%"

set TMP_DIR=%TEMP%\o2e

set DEBUG_OPTIONS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005 -verbose:gc
set JVM_TUNING_OPTIONS=-server -Xms1g -Xmx1g -XX:NewSize=128m -XX:MaxPermSize=128m -XX:+UseConcMarkSweepGC -XX:+UseParNewGC
set KEYSTORE_OPTIONS=-Djavax.net.ssl.trustStore="###org.o2e.keystore.file###" -Djavax.net.ssl.keyStore="###org.o2e.keystore.file###" -Dorg.o2e.keystore.key.alias=###org.o2e.keystore.key.alias###
set MISC_OPTIONS=-Djava.io.tmpdir="%TMP_DIR%" -Dspring.profiles.active=prod

if not exist "%TMP_DIR%" (
	echo "Creating temp directory at %TMP_DIR%..."
	mkdir %TMP_DIR%
)

rem Need to set JSSE keystore properties in order to make outbound HTTP requests over SSL
set JAVA_OPTIONS=%JVM_TUNING_OPTIONS% %KEYSTORE_OPTIONS%

"%JRE_HOME%\bin\java" %JAVA_OPTIONS% -jar o2e-bootstrap-jetty-%{org.o2e.bootstrap.version}.jar
pause