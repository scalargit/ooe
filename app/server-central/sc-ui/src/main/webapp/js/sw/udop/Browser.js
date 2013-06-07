Ext.define('sw.udop.Browser', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.sw-udopBrowser'],

    initComponent: function() {
        Ext.apply(this, {
            layout: 'card',
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'bottom',
                itemId: 'startBar',
                layout: {
                    overflowHandler: 'Menu'
                },
                plugins : [Ext.create('Ext.ux.BoxReorderer', {})],
                items: [{
                    xtype: 'button',
                    text: 'Start',
                    iconCls: 'icon-application-home',
                    menuAlign: 'bl-tl',
                    menu: [{
                        text: 'New UDOP',
                        iconCls: 'icon-pageadd',
                        handler: function() {
                            this.createUdop();
                        },
                        scope: this
                    },'-',{
                        text: 'Admin Console',
                        iconCls: 'icon-manage-edit',
                        handler: function() {
                            var console = Ext.create('sw.admin.Console', {});
                            console.show();
                        },
                        scope: this
                    },{
                        text: 'Templates',
                        iconCls: 'icon-pagecode-white',
                        handler: function() {
                            Ext.create('Ext.window.Window', {
                                draggable: false,
                                resizable: false,
                                collapsible: false,
                                maximizable: false,
                                modal: true,
                                width: 200,
                                height: 200,
                                layout: 'fit',
                                items: [Ext.create('o2e.widget.MetadataRegistryCategoryTreePanel', {
                                    xtype: 'tpltree',
                                    title: 'Templates',
                                    registry: o2e.tplRegistry,
                                    emptyText: 'No Templates found.',
                                    refreshQuery: {
                                        serviceId: 'SYSTEM_collection_list',
                                        params: { pageSize: '1000', pageNumber: '0', collection: 'tpl' }
                                    },
                                    listeners: {
                                        itemcontextmenu: {
                                            fn: function(v, r, i, idx, e) {
                                                e.preventDefault();
                                                if (!r.get('leaf')) {
                                                    return;
                                                }

                                                var menu, vizType, items = [], m = { data: r.get('metadata') };

                                                items.push({
                                                    text: 'Edit Template',
                                                    iconCls: 'icon-edit',
                                                    handler: function() {
                                                        var console = Ext.create('sw.admin.Console', { initTab: 2 });
                                                        console.show();
                                                        console.loadMetadata(m.data);
                                                    }
                                                },{
                                                    text: 'Duplicate Template',
                                                    iconCls: 'icon-pagecopy',
                                                    handler: function() {
                                                        var newTpl = Ext.clone(m.data);
                                                        delete newTpl.uuid;
                                                        Ext.Msg.prompt('Duplicate Template', 'Please enter a new name for this template.', function(id, txt) {
                                                            if (id === 'yes' || id === 'ok') {
                                                                newTpl.name = txt;
                                                                o2e.tplRegistry.insert(null, newTpl, function(d) {
                                                                    Ext.Msg.hide();
                                                                }, this);
                                                            }
                                                        }, this, false, 'Copy of '+newTpl.name);
                                                    }
                                                },{
                                                    text: 'Remove Template',
                                                    iconCls: 'icon-cancel',
                                                    handler: function() {
                                                        o2e.tplRegistry.remove(m.data.uuid);
                                                    }
                                                });

                                                menu = Ext.menu.Manager.get({
                                                    plain: true,
                                                    items: items
                                                });

                                                menu.showAt(e.getX(), e.getY());
                                            }
                                        }
                                    }
                                })]
                            }).show();

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
                                },
                                failure: this._onError,
                                scope: o2e.tplRegistry
                            });
                        }
                    },'-',{
                        text: 'Help',
                        iconCls: 'icon-help',
                        handler: function() {
                            window.open("/strategicwatch-help/index.html","mywindow","scrollbars=1,width=600,height=800");
                        }
                    },{
                        text: 'Logout',
                        iconCls: 'icon-logout',
                        handler: function() {
                            window.location = o2e.env.redirectPage;
                        }
                    }]
                }, '-']
            }],
            items: [{
                bodyStyle: {
                    fontSize: '24px',
                    padding: '20px'
                },
                html: '<b>Click on a Dashboard, Registered Service, Map Layer or Presto App to begin. Or, click the Start button for more options.</b>'
            }]
        });

        this.callParent();
    },

    addWidgetFromService: function(serviceId, widgetType) {
        var u, c = this.getLayout().getActiveItem();
        if (!c.udopTitle) {
            u = this.createUdop();
            u.addWidgetFromService(serviceId, widgetType);
        } else {
            c.addWidgetFromService(serviceId, widgetType);
        }
    },

    addWidget: function(widgetType, widgetCfg) {
        var u, c = this.getLayout().getActiveItem();
        if (!c.udopTitle) {
            u = this.createUdop();
            u.addWidget(widgetType, widgetCfg);
        } else {
            c.addWidget(widgetType, widgetCfg);
        }
    },

    createUdop: function(cfg) {
        var button, newUdop = this.add(cfg || {
            xtype: 'sw-udop',
            udopTitle: 'Untitled UDOP',
            udopDescription: 'No description provided.',
            udopCategory: 'Uncategorized',
            udopTags: ''
        });
        this.getLayout().setActiveItem(newUdop);
        button = this.createUdopButton(newUdop);
        button.toggle();
        newUdop.on('alertstart', function() {
            this.blinkTask = this.blinkTask || Ext.TaskManager.start({
                run: function() {
                    var btn = this.getEl().down('.x-btn-inner');
                    if (btn.hasCls('sw-alert-header')) {
                        btn.removeCls('sw-alert-header')
                    } else {
                        btn.addCls('sw-alert-header');
                    }
                },
                scope: this,
                interval: 500
            });
        }, button);
        newUdop.on('alertend', function() {
            var btn = this.getEl().down('.x-btn-inner');
            if (this.blinkTask) {
                Ext.TaskManager.stop(this.blinkTask);
                this.blinkTask = null;
            }
            if (btn.hasCls('sw-alert-header')) {
                btn.removeCls('sw-alert-header');
            }
        }, button);
        return newUdop;
    },

    createUdopButton: function(udop) {
        // create button
        var btn = this.getDockedComponent('startBar').add({
            xtype: 'button',
            text: udop.udopTitle,
            udop: udop,
            enableToggle: true,
            toggleGroup: this.getId()+'-items',
//            tooltip: '',
//            tooltipType: 'title',
            handler: function(btn) {
                this.getLayout().setActiveItem(btn.udop);
            },
            scope: this,
            reorderable: true
        });

        // setup listeners on udop
        udop.on('removed', function() {
            this.getDockedComponent('startBar').remove(btn);
        }, this);
        udop.on('activate', function() {
            btn.toggle(true);
        }, this);
        udop.on('rename', function(name) {
            btn.setText(name);
        }, this);

        return btn;
    },

    loadUdop: function(cfg) {
        this.createUdop({
            xtype: 'sw-udop',
            udopTitle: cfg.udopTitle || 'Untitled UDOP',
            udopDescription: cfg.udopDescription || 'No description provided.',
            udopCategory: cfg.udopCategory || 'Uncategorized',
            udopTags: cfg.udopTags || '',
            items: cfg.tabs,
            uuid: cfg.uuid,
            public: cfg.public,
            activeTab: cfg.activeTab || 0
        });
    }
});