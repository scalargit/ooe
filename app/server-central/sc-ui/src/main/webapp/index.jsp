<%
    boolean debug = "true".equals(request.getParameter("debug"));
    boolean allowCache = "true".equals(request.getParameter("allowCache"));
    boolean mock = "true".equals(request.getParameter("mock"));
    String udop = request.getParameter("udop");
    if (udop == null) {
        udop = "";
    }
    String widget = request.getParameter("widget");
    if (widget == null) {
        widget = "";
    }
    String widgetType = request.getParameter("widgetType");
    if (widgetType == null) {
        widgetType = "";
    }
    String widgetInstance = request.getParameter("widi");
    if (widgetInstance == null) {
        widgetInstance = "";
    }
    String profiles = request.getParameter("profiles");
    if (profiles == null) {
        profiles = "";
    }
    boolean embed = "true".equals(request.getParameter("embed"));
    boolean builder = "true".equals(request.getParameter("builder"));
    boolean hideToolbar = "true".equals(request.getParameter("hideToolbar"));
    boolean hideTitleBar = "true".equals(request.getParameter("hideTitleBar"));
    boolean isFusion = "true".equals(application.getInitParameter("isFusion"));
%>
<html>
<head>
    <%@ taglib uri="http://jawr.net/tags" prefix="jwr" %>

    <title>NetFlow | Dashboard</title>
    <link rel="icon" type="image/png" href="images/o2e.ico"/>

    <jwr:style src="/bundles/dashboard.css"/>

    <% if (isFusion) { %>
    <script type="text/javascript">
        _mFusionMapServer = GEE_STATIC_URL = GEE_BASE_URL = "http://gvsgoogleglobe.nga.smil.mil";
        GEE_SERVER_URL = "";
        GEE_EARTH_IMAGE_PATH = GEE_BASE_URL + "/earth/images/";
        GEE_MAPS_IMAGE_PATH = GEE_BASE_URL + "/maps/images";
    </script>
    <script type="text/javascript" src="http://gvsgoogleglobe.nga.smil.mil/maps/bootstrap.js?sensor=false"></script>
    <script type="text/javascript"
            src="http://gvsgoogleglobe.nga.smil.mil/maps/mapfiles/310/fusion_map_obj_v3.js"></script>
    <script type="text/javascript"
            src="http://gvsgoogleglobe.nga.smil.mil/default_map/query?request=Json&var=geeServerDefs"></script>
    <!--  Uncomment for GOOGLE EARTH 3D Configuration
    <script type="text/javascript" src="http://gis.geoint.nga.smil.mil/GoogleEarth/apis/earth/database.js"></script>
    <script type="text/javascript" src="http://gis.geoint.nga.smil.mil/GoogleEarth/apis/earth/loader.js"></script>
    -->
    <% } else { %>
    <script type="text/javascript"
            src="https://www.google.com/jsapi?key=ABQIAAAA5l_Ydp9bDQ86wyj1HF6TcBSRpfSTVAuXYVlwO2oxEA7VFMAEVxRayhv1LAbbT5Egfqgpfdv1pJvJHA"></script>
    <% } %>

    <% if (allowCache && embed) { %>
    <jwr:script src="/bundles/embed.js" useRandomParam="false"/>
    <% } else if (allowCache && !embed) { %>
    <% if (builder) { %>
    <jwr:script src="/bundles/owf.js" useRandomParam="false"/>
    <% } %>
    <jwr:script src="/bundles/dashboard.js" useRandomParam="false"/>
    <% } else if (!allowCache && embed) { %>
    <jwr:script src="/bundles/embed.js"/>
    <% } else if (!allowCache && !embed) { %>
    <% if (builder) { %>
    <!-- Builder Mode detected: Include OWF library -->
    <jwr:script src="/bundles/owf.js"/>
    <% } %>
    <jwr:script src="/bundles/dashboard.js"/>
    <% } %>
</head>
<body>
<script type="text/javascript">
    if (google.load) {
        google.load('earth', '1');
    }
    Ext.onReady(function () {
        Ext.QuickTips.init();

        <% if (embed) { %>
        var env = Ext.create(sw.embedEnvCls, {
            embedMode: true,
            o2eContextOverride: <%= ((String)application.getInitParameter("o2eContextOverride")) %>,
            o2eServerProtocol: '<%= ((String)application.getInitParameter("o2eServerProtocol")) %>',
            o2eServerHost: '<%= ((String)application.getInitParameter("o2eServerHost")) %>',
            o2eServerPort: '<%= ((String)application.getInitParameter("o2eServerPort")) %>',
            o2eServerContext: '<%= ((String)application.getInitParameter("o2eServerContext")) %>',
            debug: <%=debug%>,
            udop: '<%=udop%>',
            widget: '<%=widget%>',
            widgetType: '<%=widgetType%>',
            widgetInstance: '<%=widgetInstance%>',
            hideToolbar: <%=hideToolbar%>,
            hideTitleBar: <%=hideTitleBar%>,
            defaultClassification: '<%= ((String)application.getInitParameter("defaultClassification")) %>',
            defaultClassificationStyle: '<%= ((String)application.getInitParameter("defaultClassificationStyle")) %>',
            prestoHost: '<%= ((String)application.getInitParameter("prestoHost")) %>',
            prestoPort: '<%= ((String)application.getInitParameter("prestoPort")) %>',
            prestoSecure: <%= ((String)application.getInitParameter("prestoSecure")) %>,
            messagingServiceBase: '<%= ((String)application.getInitParameter("messagingServiceBase")) %>',
            messagingDeliveryEndpoint: '<%= ((String)application.getInitParameter("messagingDeliveryEndpoint")) %>',
            messagingRenewalMillis: '<%= ((String)application.getInitParameter("messagingRenewalMillis")) %>',
            trackHistoryPoints: <%= ((String)application.getInitParameter("trackHistoryPoints")) %>,
            isFusion: <%= ((String)application.getInitParameter("isFusion")) %>
        });
        env.init();
        <% } else if (builder) { %>
        var env = Ext.create(sw.builderEnvCls, {
            builderMode: true,
            o2eContextOverride: <%= ((String)application.getInitParameter("o2eContextOverride")) %>,
            o2eServerProtocol: '<%= ((String)application.getInitParameter("o2eServerProtocol")) %>',
            o2eServerHost: '<%= ((String)application.getInitParameter("o2eServerHost")) %>',
            o2eServerPort: '<%= ((String)application.getInitParameter("o2eServerPort")) %>',
            o2eServerContext: '<%= ((String)application.getInitParameter("o2eServerContext")) %>',
            debug: <%=debug%>,
            profiles: '<%=profiles%>',
            udop: '<%=udop%>',
            defaultClassification: '<%= ((String)application.getInitParameter("defaultClassification")) %>',
            defaultClassificationStyle: '<%= ((String)application.getInitParameter("defaultClassificationStyle")) %>',
            prestoHost: '<%= ((String)application.getInitParameter("prestoHost")) %>',
            prestoPort: '<%= ((String)application.getInitParameter("prestoPort")) %>',
            prestoSecure: <%= ((String)application.getInitParameter("prestoSecure")) %>,
            messagingServiceBase: '<%= ((String)application.getInitParameter("messagingServiceBase")) %>',
            messagingDeliveryEndpoint: '<%= ((String)application.getInitParameter("messagingDeliveryEndpoint")) %>',
            messagingRenewalMillis: '<%= ((String)application.getInitParameter("messagingRenewalMillis")) %>',
            trackHistoryPoints: <%= ((String)application.getInitParameter("trackHistoryPoints")) %>,
            isFusion: <%= ((String)application.getInitParameter("isFusion")) %>,
            redirectPage: '<%= ((String)application.getInitParameter("redirectPage")) %>'
        });
        env.init();
        <% } else { %>
        Ext.create('Ext.window.Window', {
            bodyPadding: 10,
            closable: false,
            draggable: false,
            modal: true,
            items: [{
                xtype: 'component',
                html: '<div id="logo" class="logo"/>',
                width: '100%',
                padding: '0 0 10'
            },{
                xtype: 'textfield',
                fieldLabel: 'Username',
                name: 'username'
            },{
                xtype: 'textfield',
                inputType: 'password',
                fieldLabel: 'Password',
                name: 'password'
            }],
            bbar: ['->', {
                text: 'Login',
                handler: function(btn) {
                    var env, window = btn.up('window'),
                        authToken = o2e.util.Base64.encode(
                            window.getComponent(1).getValue() +
                            ':' +
                            window.getComponent(2).getValue()
                        );
                    window.close();
                    env = Ext.create(sw.envCls, {
                        basicAuthToken: authToken,
                        o2eContextOverride: <%= ((String)application.getInitParameter("o2eContextOverride")) %>,
                        o2eServerProtocol: '<%= ((String)application.getInitParameter("o2eServerProtocol")) %>',
                        o2eServerHost: '<%= ((String)application.getInitParameter("o2eServerHost")) %>',
                        o2eServerPort: '<%= ((String)application.getInitParameter("o2eServerPort")) %>',
                        o2eServerContext: '<%= ((String)application.getInitParameter("o2eServerContext")) %>',
                        debug: <%=debug%>,
                        profiles: '<%=profiles%>',
                        udop: '<%=udop%>',
                        defaultClassification: '<%= ((String)application.getInitParameter("defaultClassification")) %>',
                        defaultClassificationStyle: '<%= ((String)application.getInitParameter("defaultClassificationStyle")) %>',
                        prestoHost: '<%= ((String)application.getInitParameter("prestoHost")) %>',
                        prestoPort: '<%= ((String)application.getInitParameter("prestoPort")) %>',
                        prestoSecure: <%= ((String)application.getInitParameter("prestoSecure")) %>,
                        messagingServiceBase: '<%= ((String)application.getInitParameter("messagingServiceBase")) %>',
                        messagingDeliveryEndpoint: '<%= ((String)application.getInitParameter("messagingDeliveryEndpoint")) %>',
                        messagingRenewalMillis: '<%= ((String)application.getInitParameter("messagingRenewalMillis")) %>',
                        trackHistoryPoints: <%= ((String)application.getInitParameter("trackHistoryPoints")) %>,
                        isFusion: <%= ((String)application.getInitParameter("isFusion")) %>,
                        redirectPage: '<%= ((String)application.getInitParameter("redirectPage")) %>'
                    });
                    env.init();
                }
            }]
        }).show();
        <% } %>
    });
</script>
</body>
</html>