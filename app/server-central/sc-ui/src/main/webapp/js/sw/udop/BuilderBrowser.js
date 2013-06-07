Ext.define('sw.udop.BuilderBrowser', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.sw-builder-udopBrowser'],

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
                    menu: [/**{
                    	text: 'Show Ozone Widgets',
                    	handler: function() {
	                    	var data = { channel: 'rollupLauncher' };
	        				var dataString = Ozone.util.toString(adminData);
	        				Ozone.pref.PrefServer.findWidgets({
	        					searchParams : {widgetName:''},
	        					onSuccess: function(r){
	        						console.log('OZONE LIST:');
	        						console.dir(r);
	        						
	        					},
	        					onFailure: function(){
	        						Ext.Msg.alert('Fail');
	        					}
	        				});
                    	}
                    },**/{
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
                    padding: '0'
                },
                defaults: {preventBodyReset: true},
                html: '<div id="intro-headerbox" style="width: 100%; margin: 8 0 24 0; padding: 0"><img id="intro-image" style="margin-left: 0;" src="images/ORION.png" border="0"/></div>'+
                //html: '<div id="intro-headerbox" style="width: 100%; border: 1px solid #B4B4B4; border-width: 1 0 1 0; border-bottom: 1px solid #B4B4B4; margin: 18 0; padding: 0; font-size: 26px"><div id="intro-image" style="padding-left: 19px;">ORION WIDGET BUILDER</div></div>'+
                		'<!-- content 1 -->'+
                		'<div id="intro-content" style="opacity: 1; margin: 35 50; width: 100%; color: #FFFFFF"><p id="intro-header" style="font-size: 22px;"></p>'+
                		'<div style="width: 100%; border-left: 1px solid #444444; padding: 0 0 50 20; margin: 0 0 0 6">Use the left-sidebar <b>Quick Panel</b> to browse and edit Registered Services and widget visualizations.'+
                		'<br/><br/>Use the <b>Start</b> menu at the bottom of the dashboard to access your <b>Admin Console</b>, saved Templates and New UDOP options.'+
                		'<br/><br/>Widget configuration is also available through the <b>Admin Console</b>.'+
                		'<br/><br/>When you begin work with a UDOP you will have access to special options available in the upper right corner of the main panel.'+
                		'<br/><br/>Consult the <b>Help</b> documentation for questions and remember to <b>Logout</b> when you are done.</div>'+
                		'<!-- content 2-->'+
                		'<div id="intro-content2" style="opacity: 1; margin: 2000 50 0 0; width: 100%; color: #FFFFFF"><p id="intro-header2" style="font-size: 22px;">REGISTERED SERVICES & UDOPs</p><br/>'+
                		'<div style="width: 100%; border-left: 1px solid #444444; padding: 0 0 50 20; margin: 0 0 0 6"><p>Use the left-sidebar <b>Quick Panel</b> to browse and edit Registered Services and widget visualizations.</p>'+
                		'<p>Widget configuration is also available through the <b>Admin Console</b>.</p>'+
                		'<p>Consult the <b>Help</b> documentation for questions and remember to <b>Logout</b> when you are done.</p>'+
                		'<!-- end content -->'+
                		'</div>',                       
                listeners: {
                    activate: {
                        fn: function() {
                            //Back to square
                            /**
                            Ext.get('intro-image').animate({
                        	   	duration: 2500,
                        	   	to: {
                        			marginLeft:-78
                        	    }
                        	});
                        	**/
                        	Ext.get('intro-content').animate({
                        	   	duration: 2000,
                        	   	to: {
                        			color: '222222'
                        	    }
                        	});
                        	
                        },
                        scope: this
                    }       
                }
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
            udopTitle: 'New UDOP',
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
            udopTitle: cfg.udopTitle || ' - Untitled UDOP -',
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