Ext.define('sw.bootstrap.BootstrapEnvironment', {
    extend: 'sw.Environment',

    constructor: function(cfg) {
        this.callParent([cfg]);

        this.on('load', function() {
            o2e.serviceRegistry.load(meta.system.services);
            o2e.connectorMgr.query({
                componentId: this.id,
                serviceId: 'SYSTEM_widget_list',
                params: {
                    query: {
                        pageSize: "10000",
                        pageNumber: "0"
                    }
                },
                success: function(serviceKey, data, forceRefresh) {
                    o2e.serviceRegistry.load(data.results ? data.results : data);

                    o2e.connectorMgr.query({
                        componentId: 'tplRegistry',
                        serviceId: 'SYSTEM_collection_list',
                        params: {
                            pageSize: '1000',
                            pageNumber: '0',
                            collection: 'tpl'
                        },
                        success: function(sk, tplData, f) {
                            var tplRecord, tplMeta, z=0, zlen = tplData.records.length, tplArray = [];
                            for (; z<zlen; z++) {
                                tplRecord = tplData.records[z].record;
                                tplMeta = tplRecord.json;
                                if (!tplMeta.uuid) {
                                    tplMeta.uuid = tplRecord.uuid;
                                }
                                tplArray.push(tplMeta);
                            }
                            o2e.tplRegistry.load(tplArray);

                            o2e.connectorMgr.query({
                                componentId: 'console',
                                serviceId: 'SYSTEM_data_getSynch',
                                serviceKey: 'Loader|getSynch|MetaRepositoryService|search',
                                params: {
                                    name: 'synchtest',
                                    prestoHostname: o2e.env.prestoHost,
                                    prestoPort: o2e.env.prestoPort,
                                    refreshIntervalSeconds: 300,
                                    prestoSid: 'MetaRepositoryService',
                                    prestoOid: 'search',
                                    append: false,
                                    version: '1.1',
                                    svcVersion: '0.1',
                                    paramMap: {
                                        "searchRequest":
                                        {
                                            "sortBy": "name.toLowerCase() asc, lastChangeTimestamp desc",
                                            "filter":
                                            {
                                                "subtype":
                                                {
                                                    "values": "App", "operator": "IN"
                                                }
                                            }
                                        }
                                    },
                                    paramList: null,
                                    isSecure: o2e.env.prestoSecure,
                                    dataType: 'presto'
                                },
                                success: function(s, r, fr) {
                                    o2e.appRegistry.load(r.response || []);
                                },
                                failure: this._onError,
                                scope: this
                            });
                        },
                        failure: this._onError,
                        scope: o2e.tplRegistry
                    });
                },
                failure: this._onError,
                scope: o2e.serviceRegistry
            });
        }, this);

        o2e.widgetTypeRegistry.load(meta.system.widgetTypes);

        // capture window unload event to prompt user
        Ext.EventManager.addListener(window, 'beforeunload', function(e) {
            e.browserEvent.returnValue = "You about to leave the StrategicWatch application. If you continue, any unsaved changes may be lost.";
        });
    },

    useFirebug: true,
    application: 'sw.Application'

}, function() {
    sw.envCls = Ext.getClassName(this);
});