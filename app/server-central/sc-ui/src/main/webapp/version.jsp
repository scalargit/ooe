<html>
    <head>
		<title>StrategicWatch Version Info</title>
        <link rel="icon" type="image/png" href="images/o2e.ico"/>
    </head>
    <body>
        <div>Version: <%= ((String)application.getInitParameter("buildVersion")) %></div>
        <div>Build Date: <%= ((String)application.getInitParameter("buildDate")) %></div>

        <a href="/strategicwatch-help/index.html">StrategicWatch Help</a>
    </body>
</html>