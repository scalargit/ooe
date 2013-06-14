Ext.define('sw.Environment', {
    extend: 'o2e.Environment',

    constructor: function (cfg) {
        Ext.MessageBox.show({
            title: 'Please wait',
            msg: 'Loading Application...',
            progressText: 'Configuring webtop...',
            width: 300,
            modal: true,
            progress: true,
            closable: true
        });

        this.callParent([cfg]);

        if (this.messagingDeliveryEndpoint) {
            this.messagingDeliveryEndpoint = window.location.protocol + '//' + window.location.host + '/' + this.o2eServerContext + this.messagingDeliveryEndpoint;
        }

        if (this.connector.xmppInvoke) {
            this.xmppMgr = Ext.create('sw.xmpp.XmppManager', { connector: this.connector });
        }

        o2e.connectorMgr.reg('ungoverned', Ext.create('o2e.connector.UngovernedConnector', {}));
        o2e.connectorMgr.reg('flowdata', Ext.create('sw.connector.FlowDataConnector', {}));
        this.connector.on('userauth', function (authData) {
            if (this.username !== 'guest') {
                return;
            }

            this.username = authData.username;
            this.userAuthorities = authData.authorities;
            this.notifyMgr = Ext.create('sw.notify.NotifyManager', { connector: this.connector });

            var userCN = this.username, attrs = userCN.split(",");
            if (attrs.length > 1) {
                for (var i = 0; i < attrs.length; i++) {
                    var attr = Ext.String.trim(attrs[i]);
                    if (attr.indexOf("CN=") === 0) {
                        userCN = attr.substring(3);
                        break;
                    }
                }
            }

            var banner = Ext.get('banner');
            if (banner) {
                banner.dom.innerHTML = 'You are logged in as ' + userCN + '.';
            }

            this.fireEvent('userauth', authData);

            Ext.MessageBox.updateProgress(0.4, 'Loading UDOPs...');
            // Now that we have username, load UDOPs
            o2e.connectorMgr.query({
                componentId: this.id,
                serviceId: 'SYSTEM_collection_list',
                params: {
                    query: {
                        $or: [
                            { 'json.public': true },
                            { 'json.creator': this.username}
                        ]
                    },
                    pageSize: '1000',
                    pageNumber: '0',
                    collection: 'udop'
                },
                success: function (serviceKey, data, forceRefresh) {
                    var rec, md, x = 0, xlen = data.records.length, arr = [];
                    for (; x < xlen; x++) {
                        rec = data.records[x].record;
                        md = rec.json;
                        if (!md.uuid) {
                            md.uuid = rec.uuid;
                        }
                        arr.push(md);
                    }
                    o2e.udopRegistry.load(arr);

                    if (o2e.env.udop && o2e.env.udop !== '') {
                        o2e.app.openUdop(o2e.env.udop);
                    }

                    // KML layers now
                    Ext.MessageBox.updateProgress(0.6, 'Loading KML Layers...');
                    Ext.Function.defer(o2e.connectorMgr.query, 500, o2e.connectorMgr, [
                        {
                            componentId: 'kmlRegistry',
                            serviceId: 'SYSTEM_collection_list',
                            params: {
                                pageSize: '1000',
                                pageNumber: '0',
                                collection: 'kml'
                            },
                            success: function (sKey, kmlData, fr) {
                                var r, kmlMeta, y = 0, ylen = kmlData.records.length, a = [];
                                for (; y < ylen; y++) {
                                    r = kmlData.records[y].record;
                                    kmlMeta = r.json;
                                    if (!kmlMeta.uuid) {
                                        kmlMeta.uuid = r.uuid;
                                    }
                                    a.push(kmlMeta);
                                }
                                o2e.kmlRegistry.load(a);

                                // user profile now
                                Ext.MessageBox.updateProgress(0.7, 'Retrieving user profile...');
                                o2e.dashboard.ProfileMgr.loadUserProfile();
                            },
                            failure: this._onError,
                            scope: o2e.kmlRegistry
                        }
                    ]);
                },
                failure: this._onError,
                scope: o2e.udopRegistry
            });

            //Finalize
            o2e.dashboard.ProfileMgr.on('userprofilefound', function () {
                Ext.MessageBox.updateProgress(0.9, 'Loading user profile...');
            });
            o2e.dashboard.ProfileMgr.on('userprofileloaded', function () {
                Ext.MessageBox.updateProgress(1.0, 'Initialization complete.');
                Ext.Function.defer(Ext.MessageBox.hide, 1000, Ext.MessageBox);
            });
        }, this);

        this.on('load', this.loadProfile, this);
    },

    loadProfile: function () {
        var profiles, i, len;

        Ext.MessageBox.updateProgress(0.2, 'Retrieving requested profile(s)...');

        this.un('load', this.loadProfile, this);

        //Load extra profiles specifically requested or automatic for all users
        if (this.profiles.length > 0) {
            profiles = this.profiles.split(',');
            for (i = 0, len = profiles.length; i < len; i++) {
                o2e.profileRegistry.get(profiles[i], o2e.app.applyStateConfig, o2e.app);
            }
        }
    },

    hasAuthority: function(auth) {
        if (this.userAuthorities && this.userAuthorities.length && Ext.Array.contains(this.userAuthorities, auth)) {
            return true;
        }
        return false;
    },

    application: 'sw.Application',
    username: 'guest',

    /**
     * @cfg {Object} metadataRegistries
     */
    registries: ['serviceRegistry', 'profileRegistry', 'udopRegistry', 'appRegistry', 'widgetRegistry', 'widgetTypeRegistry', 'kmlRegistry', 'tplRegistry', 'capanelRegistry'],

    profileRegistry: {
        type: 'profile',
        isRemote: true,
        primaryKey: 'uuid',
        getService: 'SYSTEM_collection_get',
        insertService: 'SYSTEM_collection_save',
        updateService: 'SYSTEM_collection_save',
        removeService: 'SYSTEM_collection_remove',
        insertKey: 'json',
        updateKey: 'json',
        defaultParams: { collection: 'profile' }
    },
    udopRegistry: {
        type: 'udop',
        isRemote: true,
        primaryKey: 'uuid',
        getService: 'SYSTEM_collection_get',
        insertService: 'SYSTEM_collection_save',
        updateService: 'SYSTEM_collection_save',
        removeService: 'SYSTEM_collection_remove',
        insertKey: 'json',
        updateKey: 'json',
        defaultParams: { collection: 'udop' }
    },
    widgetRegistry: {
        type: 'widget',
        isRemote: false,
        primaryKey: 'widgetId'
    },
    kmlRegistry: {
        type: 'kml',
        isRemote: true,
        primaryKey: 'uuid',
        getService: 'SYSTEM_collection_get',
        insertService: 'SYSTEM_collection_save',
        updateService: 'SYSTEM_collection_save',
        removeService: 'SYSTEM_collection_remove',
        insertKey: 'json',
        updateKey: 'json',
        defaultParams: { collection: 'kml' }
    },
    tplRegistry: {
        type: 'tpl',
        isRemote: true,
        primaryKey: 'uuid',
        getService: 'SYSTEM_collection_get',
        insertService: 'SYSTEM_collection_save',
        updateService: 'SYSTEM_collection_save',
        removeService: 'SYSTEM_collection_remove',
        insertKey: 'json',
        updateKey: 'json',
        defaultParams: { collection: 'tpl' }
    },
    capanelRegistry: {
        type: 'capanel',
        isRemote: true,
        primaryKey: 'uuid',
        getService: 'SYSTEM_collection_get',
        insertService: 'SYSTEM_collection_save',
        updateService: 'SYSTEM_collection_save',
        removeService: 'SYSTEM_collection_remove',
        insertKey: 'json',
        updateKey: 'json',
        defaultParams: { collection: 'capanel' }
    },

    profiles: '',

    /**
     * @cfg defaultClassification
     */
    defaultClassification: 'SECRET',

    defaultClassificationStyle: 'sw-secret',
    /**
     * @cfg showServiceStatus
     */
    showServiceStatus: true,
    /**
     * @cfg defaultServiceStatusHistory
     */
    serviceStatusHistory: 10,
    /**
     * @cfg showWidgetIcons
     */
    showWidgetIcons: true,
    /**
     * @cfg allowTitleEdits
     */
    allowTitleEdits: true,
    /**
     * @cfg allowAlerting
     */
    allowAlerting: true,
    /**
     * @cfg allowWidgetMaximize
     */
    allowWidgetMaximize: true,
    /**
     * @cfg allowWidgetMinimize
     */
    allowWidgetMinimize: false,
    /**
     * @cfg allowWidgetMove
     */
    allowWidgetMove: true,
    /**
     * @cfg allowWidgetDrop
     */
    allowWidgetDrop: true,
    /**
     * @cfg allowWidgetActionMenu
     */
    allowWidgetActionMenu: true,
    /**
     * @cfg allowWidgetCreateActionsOnly
     */
    allowWidgetCreateActionsOnly: false,
    /**
     * @cfg allowPaging
     */
    allowPaging: true,
    /**
     * @cfg pagingType
     * When using paging what type to use - client or server
     */
    pagingType: 'client',
    /**
     * @cfg recordLimit
     */
    recordLimit: 100,
    /**
     * @cfg pageSize
     */
    pageSize: 50,
    /**
     * @cfg allowFiltering
     */
    allowFiltering: true,
    /**
     * @cfg filterType
     * When using filters what type to use - client or server
     */
    filterType: 'client',
    /**
     * @cfg allowLocking
     */
    allowLocking: true,
    /**
     * @cfg allowRefreshing
     */
    allowRefreshing: true,
    /**
     * @cfg allowDeactivateService
     */
    allowDeactivateService: true,
    /**
     * @cfg allowRemoveService
     */
    allowRemoveService: true,
    /**
     * @cfg allowServiceInputChanges
     */
    allowServiceInputChanges: true,
    /**
     * @cfg allowServiceInsert
     */
    allowServiceInsert: true,
    /**
     * @cfg allowServiceRemove
     */
    allowServiceRemove: true,
    /**
     * @cfg allowServiceUpdate
     */
    allowServiceUpdate: true,
    /**
     * @cfg notifyOnServiceInsert
     */
    notifyOnServiceInsert: true,
    /**
     * @cfg notifyOnWidgetInsert
     */
    notifyOnWidgetInsert: true,
    /**
     * @cfg notifyOnUdopInsert
     */
    notifyOnUdopInsert: true,

    quickPanelWidth: 200,
    quickPanelHeight: 200,
    msgLevel: -1
}, function () {
    o2e.envCls = Ext.getClassName(this);
});