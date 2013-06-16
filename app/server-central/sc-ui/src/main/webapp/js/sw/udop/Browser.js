Ext.define('sw.udop.Browser', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.sw-udopBrowser'],

    initComponent: function() {
        Ext.apply(this, {
            dockedItems: [{
                xtype: 'toolbar',
                dock: 'top',
                itemId: 'startBar',
                layout: {
                    overflowHandler: 'Menu'
                },
                items: [{
                    xtype: 'button',
                    text: 'File',
                    iconCls: 'icon-application-home',
                    menuAlign: 'tl-bl',
                    menu: [{
                        text: 'New Dashboard',
                        iconCls: 'icon-pageadd',
                        handler: function() {
                            this.createUdop();
                        },
                        scope: this
                    },{
                        text: 'Add Service',
                        iconCls: 'icon-manage-edit',
                        handler: function() {
                            var console = Ext.create('sw.admin.Console', {});
                            console.show();
                        },
                        scope: this
                    },{
                        text: 'Add Map Layer',
                        iconCls: 'icon-maplayer-edit',
                        handler: function() {
                            var console = Ext.create('sw.admin.Console', { initTab: 1 });
                            console.show();
                        },
                        scope: this
                    },{
                        text: 'Manage Templates',
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
                        text: 'Logout',
                        iconCls: 'icon-logout',
                        handler: function() {
                            window.location = o2e.env.redirectPage;
                        }
                    }]
                }]
            }],
            layout: {
                type: 'hbox',
                align: 'stretch'
            },
            items: [{
                layout: 'fit',
                itemId: 'udopList',
                html: 'Coming soon',
                width: 0, //100
                border: 0,
                bodyStyle: { border: '0 none' }
            },{
                layout: 'card',
                itemId: 'udopCards',
                flex: 1,
                border: 0,
                bodyStyle: { border: '0 none' },
                items: [{
                    bodyStyle: {
                        fontSize: '24px',
                        padding: '20px'
                    },
                    html: '<b>Welcome to Accelerated Servers Monitor. Use the Menus above to begin.</b>'
                }]
            }]
        });

        this.callParent();

        o2e.udopRegistry.on('insert', this.handleUdopInsert, this);
        o2e.udopRegistry.on('update', this.handleUdopUpdate, this);
        o2e.udopRegistry.on('remove', this.handleUdopRemove, this);
        o2e.udopRegistry.on('load', this.handleUdopLoad, this);
    },

    removeAdminFunctionality: function() {
        var x=4, startMenu = this.getDockedComponent('startBar').getComponent(0).menu;
        for (;x>=0;x--) {
            startMenu.getComponent(x).hide();
        }
    },

    handleUdopInsert: function(metadata) {
        // don't display invalid data
        if (Ext.isEmpty(metadata.uuid) ||
            Ext.isEmpty(metadata.udopTitle) ||
            Ext.String.trim(metadata.udopTitle) === '') {

            return;
        }

        // normalize data
        metadata = this.normalizeData(metadata);

        // get category node
        var tbar = this.getDockedComponent('startBar'),
            category = metadata.udopCategory,
            search = tbar.down('#udopCategory-'+category.replace(/.\s/g,'-')),
            categoryMenu = search ? search.menu : this.getParentCategoryObject(category);

        // insert node under category menu
        categoryMenu.add({
            xtype: 'menuitem',
            text: metadata.udopTitle,
            itemId: metadata.uuid,
            metadata: metadata,
            listeners: {
                click: {
                    fn: this.handleItemClick,
                    scope: this
                }
            }
        });
    },

    handleUdopUpdate: function(metadata) {
        var menuItem = Ext.ComponentQuery.query('#'+metadata.uuid)[0];
        if (menuItem.metadata.udopCategory !== metadata.udopCategory) {
            this.handleUdopRemove(metadata.uuid);
            this.handleUdopInsert(metadata);
        } else if (menuItem.text !== metadata.udopTitle) {
            menuItem.setText(metadata.udopTitle);
        }
    },

    handleUdopRemove: function(id) {
        var menu,parentItem,menuItem = Ext.ComponentQuery.query('#'+id)[0];

        if (menuItem) {
            menu = menuItem.ownerCt;
            menu.remove(menuItem);
            if (menu.items.getCount() === 0) {
                parentItem = menu.parentItem;
                this.handleUdopRemove(parentItem.itemId || parentItem.id);
            }
        }
    },

    handleUdopLoad: function(metadata) {
        Ext.Array.each(metadata, Ext.Function.bind(this.handleUdopInsert, this));
    },

    normalizeData: function(metadata) {
        if (Ext.isEmpty(metadata.udopCategory)) {
            metadata.udopCategory = 'Uncategorized';
        }

        if (Ext.isEmpty(metadata.udopDescription)) {
            metadata.udopDescription = 'No description provided.';
        }

        return metadata;
    },

    getParentCategoryObject: function(category) {
        var i, ilen, fullCategory = '', search, last = this.getDockedComponent('startBar'), nest = category.split('.');
        for (i=0,ilen=nest.length; i<ilen; i++) {
            fullCategory = fullCategory + nest[i].replace(/\s/g, '-');
            search = Ext.ComponentQuery.query('#udopCategory-'+fullCategory)[0];
            if (!search) {
                last = last.add({
                    xtype: last.itemId === 'startBar' ? 'button' : 'menuitem',
                    itemId: 'udopCategory-'+fullCategory,
                    text: nest[i],
                    menu: []
                });
                last.menu.parentItem = last;
                last = last.menu;
            } else {
                last = search.menu;
            }
            fullCategory = fullCategory + '-';
        }
        return last;
    },

    handleItemClick: function(item) {
        var openUdop = o2e.app.findOpenUdop(item.metadata.uuid);
        if (openUdop === null) {
            this.loadUdop(Ext.clone(item.metadata));
        } else {
            this.getComponent('udopCards').getLayout().setActiveItem(openUdop);
        }
    },

    addWidgetFromService: function(serviceId, widgetType) {
        var u, c = this.getComponent('udopCards').getLayout().getActiveItem();
        if (!c.udopTitle) {
            u = this.createUdop();
            u.addWidgetFromService(serviceId, widgetType);
        } else {
            c.addWidgetFromService(serviceId, widgetType);
        }
    },

    addWidget: function(widgetType, widgetCfg) {
        var u, c = this.getComponent('udopCards').getLayout().getActiveItem();
        if (!c.udopTitle) {
            u = this.createUdop();
            u.addWidget(widgetType, widgetCfg);
        } else {
            c.addWidget(widgetType, widgetCfg);
        }
    },

    createUdop: function(cfg) {
        var button,
            cards = this.getComponent('udopCards'),
            newUdop = cards.add(cfg || {
                xtype: 'sw-udop',
                udopTitle: 'Untitled UDOP',
                udopDescription: 'No description provided.',
                udopCategory: 'Uncategorized',
                udopTags: ''
            });
        cards.getLayout().setActiveItem(newUdop);
        //button = this.createUdopButton(newUdop);
        //button.toggle();
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