Ext.define('sw.udop.Udop', {
    extend: 'Ext.tab.Panel',
    requires: [
        'Ext.ux.tab.Toolbar'
    ],
    alias: ['widget.sw-udop'],

    dirty: true,
    public: false,

    desiredPlugins: ['refresh', 'lock', 'status'],

    stata: {
        PUBLISHED: 'Status: <span style="color:#00CC00"><b>Published</b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>',
        UNPUBLISHED: 'Status: <b>Unpublished</b>'
    },

    constructor: function(cfg) {
        this.addEvents('rename', 'alertstart', 'alertend');
        this.callParent(arguments);
    },

    initComponent: function() {
        Ext.apply(this, {
            defaults: {
                xtype: 'portalpanel',
                closable: true,
                padding: 0,
                border: 0,
                bodyStyle: { border: '0 none' }
            },
            plugins: [
                Ext.create('Ext.ux.TabCloseMenu', {}),
                Ext.create('Ext.ux.TabReorderer', {}),
                Ext.create('Ext.ux.tab.Toolbar', {
                    width: 403,
                    items: [{
                        iconCls: 'icon-tab-add',
                        tooltip: 'Add a new tab to this dashboard',
                        handler: this.createTab,
                        scope: this
                    },{
                        iconCls: 'icon-tab-edit',
                        tooltip: 'Edit the current tab\'s title',
                        handler: function() {
                            var t = this.getActiveTab();
                            Ext.Msg.prompt('Rename Tab', 'Enter a name for this tab', function(id, txt) {
                                t.setTitle(txt);
                            }, this, false, t.title);
                        },
                        scope: this
                    },{
                        iconCls: 'icon-pagecopy',
                        tooltip: 'Duplicate the current tab',
                        handler: function(btn) {
                            var udops, x, xlen, y, ylen, z, zlen, cols, currCol, col, widgets, tab, pos = btn.getPosition(), currTab = this.getActiveTab();
                            tab = {
                                title: currTab.title,
                                autoScroll : true,
                                items: []
                            };
                            for (y=0,cols=currTab.items,ylen=cols.getCount(); y<ylen; y++) {
                                currCol = cols.getAt(y);
                                col = {
                                    columnWidth: currCol.columnWidth,
                                    widgets: [],
                                    listeners: {
                                        remove: {
                                            fn: function(col, item, e) {
                                                col.ownerCt.doLayout();
                                            }
                                        }
                                    }
                                };
                                for (z=0,widgets=currCol.items,zlen=widgets.getCount(); z<zlen; z++) {
                                    for (x=0,xlen=widgets.getAt(z).items.getCount(); x<xlen; x++) {
                                        col.widgets.push(widgets.getAt(z).items.getAt(x).widget.getStateConfig());
                                    }
                                }
                                tab.items.push(col);
                            }
                            if (this.ownerCt.items.getCount() > 2) {
                                udops = [];
                                this.ownerCt.items.each(function(udop) {
                                    if (udop.udopTitle) {
                                        udops.push([udop.udopTitle, udop]);
                                    }
                                }, this);
                                Ext.create('Ext.window.Window', {
                                    title: 'Select tab destination:',
                                    border: 0,
                                    width: 200,
                                    layout: 'fit',
                                    draggable: false,
                                    closable: false,
                                    resizable: false,
                                    modal: true,
                                    items: [{
                                        name: 'udop',
                                        xtype: 'combo',
                                        store: Ext.create('Ext.data.ArrayStore', {
                                            autoDestroy: true,
                                            fields: ['name', 'value'],
                                            data: udops
                                        }),
                                        queryMode: 'local',
                                        displayField: 'name',
                                        valueField: 'value',
                                        value: this,
                                        typeAhead: true,
                                        lazyRender: true
                                    }],
                                    bbar: ['->',{
                                        text: 'Ok',
                                        iconCls: 'icon-ok',
                                        handler: function(btn) {
                                            var x, xlen, w = btn.ownerCt.ownerCt,
                                                v = w.items.getAt(0).getValue();

                                            this.ownerCt.getLayout().setActiveItem(v);
                                            v.setActiveTab(v.add(tab));
                                            w.close();
                                        },
                                        scope: this
                                    },{
                                        text: 'Cancel',
                                        iconCls: 'icon-cancel',
                                        handler: function(btn) {
                                            btn.ownerCt.ownerCt.close();
                                        }
                                    }]
                                }).setPosition(pos[0], pos[1]).show().animate({ to: { x: pos[0], y: pos[1]+btn.getHeight()+2}, easing: 'ease', duration: 400 });
                            } else {
                                this.setActiveTab(this.add(tab));
                            }
                        },
                        scope: this
                    },{
                        iconCls: 'icon-columns',
                        tooltip: 'Add a column to this tab',
                        handler: function() {
                            var t = this.getActiveTab(),
                                cols = t.items,
                                newIdx = cols.getCount() + 1,
                                newWidth = 1 / newIdx;
                            for (var x=0; x<newIdx-1; x++) {
                                var currWidth = cols.getAt(x).columnWidth;
                                cols.getAt(x).columnWidth = currWidth - (currWidth * newWidth);
                            }
                            t.columnLayoutInProgress = true;
                            t.add({
                                itemId: 'col-'+newIdx,
                                columnWidth: newWidth,
                                listeners: {
                                    remove: {
                                        fn: function(col, item, e) {
                                            col.ownerCt.doLayout();
                                        }
                                    }
                                }
                            });
                            t.columnLayoutInProgress = false;
                        },
                        scope: this
                    },{
                        iconCls: 'icon-layoutedit',
                        tooltip: 'Edit the current tab\'s column configuration',
                        handler: function() {
                            var x, xlen, items=[], columns = this.getActiveTab().items;
                            for (x=0, xlen=columns.getCount(); x< xlen; x++) {
                                items.push({
                                    colIdx: x,
                                    name: 'Column '+(x+1),
                                    width: columns.getAt(x).columnWidth,
                                    remove: false
                                });
                            }
                            Ext.create('Ext.window.Window', {
                                title: 'Configure Column Layout',
                                width: 200,
                                height: 200,
                                layout: 'fit',
                                modal: true,
                                items: [Ext.create('Ext.grid.Panel', {
                                    store: Ext.create('Ext.data.Store', { fields: ['colIdx', 'name', 'width', 'remove'], data: items}),
                                    columns: [
                                        { header: 'Name', dataIndex: 'name', flex: 1, editor: false },
                                        { header: 'Width', dataIndex: 'width', flex: 1, editor: { allowBlank: false }},
                                        { header: 'Remove', dataIndex: 'remove', flex: 1, xtype: 'checkcolumn' }
                                    ],
                                    selModel: { selType: 'cellmodel' },
                                    plugins: [ Ext.create('Ext.grid.plugin.CellEditing', { clicksToEdit: 1 }) ],
                                    border: 0
                                })],
                                bbar: ['->',{
                                    text: 'Ok',
                                    iconCls: 'icon-ok',
                                    handler: function(btn) {
                                        var x, xlen, val, firstColIdx = null,
                                            remCount = 0, colWidths = {},
                                            totalCols = 0, totalWidth = 0.0,
                                            w = btn.ownerCt.ownerCt,
                                            v = w.items.getAt(0).getStore().getRange(),
                                            cols = this.getActiveTab().items;

                                        for (x=0,xlen=v.length;x<xlen;x++) {
                                            if (v[x].get('remove') === false) {
                                                colWidths[v[x].get('colIdx')] = Number(v[x].get('width'));
                                                totalCols = totalCols + 1;
                                                totalWidth = totalWidth + Number(v[x].get('width'));
                                                if (firstColIdx === null) {
                                                    firstColIdx = v[x].get('colIdx');
                                                }
                                            } else {
                                                colWidths[v[x].get('colIdx')] = false;
                                            }
                                        }

                                        if (totalCols === 0) {
                                            Ext.Msg.alert('Error', 'You must have at least one column in your layout.');
                                            return;
                                        }

                                        for (val in colWidths) {
                                            if (colWidths.hasOwnProperty(val)) {
                                                if (colWidths[val] === false) {
                                                    cols.getAt(firstColIdx-remCount).add(cols.getAt(val-remCount).removeAll(false));
                                                    this.getActiveTab().remove(cols.getAt(val-remCount));
                                                    remCount = remCount + 1;
                                                } else {
                                                    cols.getAt(val-remCount).columnWidth = colWidths[val]/totalWidth;
                                                }
                                            }
                                        }

                                        // reset resizer constraints because they may still be pointing to old DOM
                                        cols.getAt(Math.max(firstColIdx-remCount,0)).items.each(function(item) {
                                            if (item.resizer.resizeTracker.constrainTo !== item.ownerCt.el.dom) {
                                                item.resizer.resizeTracker.constrainTo = item.ownerCt.el.dom;
                                            }
                                        });

                                        this.getActiveTab().columnLayoutInProgress = true;
                                        this.getActiveTab().doLayout();
                                        this.getActiveTab().columnLayoutInProgress = false;
                                        w.close();
                                    },
                                    scope: this
                                },{
                                    text: 'Cancel',
                                    iconCls: 'icon-cancel',
                                    handler: function(btn) {
                                        btn.ownerCt.ownerCt.close();
                                    }
                                }]
                            }).show();
                        },
                        scope: this
                    },'-',{
                        iconCls: 'icon-unlocked',
                        tooltip: 'Toggle widget locking',
                        handler: function(btn) {
                            this.lockState = !this.lockState;
                            this.getActiveTab().items.each(function(col) {
                                col.items.each(function(portlet) {
                                    portlet.items.each(function(widget) {
                                        var plugin = widget.configPlugins.lock;
                                        plugin.locked = this.lockState;
                                        widget.widget.setLocked(this.lockState);
                                        plugin.updateIcon();
                                    }, this);
                                }, this);
                            }, this);
                            if (this.lockState) {
                                btn.setIconCls('icon-locked');
                            } else {
                                btn.setIconCls('icon-unlocked');
                            }
                        },
                        scope: this
                    },{
                        iconCls: 'icon-refresh',
                        tooltip: 'Refresh widgets',
                        handler: function() {
                            this.getActiveTab().items.each(function(col) {
                                col.items.each(function(portlet) {
                                    portlet.items.each(function(widget) {
                                        widget.configPlugins.refresh.handleMenuItemClick();
                                    });
                                }, this);
                            }, this);
                        },
                        scope: this
                    },'-',{
                        itemId: 'publishStatus',
                        xtype: 'tbtext',
                        text: this.public ? this.stata.PUBLISHED : this.stata.UNPUBLISHED
                    },{
                        iconCls: 'icon-edit',
                        tooltip: 'Edit Dashboard Information',
                        handler: function() {
                            Ext.create('Ext.window.Window', {
                                width: 400,
                                height: 225,
                                layout: 'fit',
                                modal: true,
                                title: 'Edit Dashboard Information',
                                layout: 'fit',
                                items: [Ext.create('Ext.form.Panel', {
                                    border: 0,
                                    bodyPadding: 5,
                                    autoScroll: true,
                                    defaults: { xtype: 'textfield', anchor: '100%' },
                                    items: [{
                                        name: 'udopTitle',
                                        fieldLabel: 'Title',
                                        value: this.udopTitle,
                                        allowBlank: false
                                    },{
                                        xtype: 'textareafield',
                                        name: 'udopDescription',
                                        fieldLabel: 'Description',
                                        value: this.udopDescription,
                                        grow: true
                                    },{
                                        name: 'udopCategory',
                                        fieldLabel: 'Category',
                                        value: this.udopCategory,
                                        allowBlank: false
                                    },{
                                        name: 'udopTags',
                                        fieldLabel: 'Tags',
                                        value: this.udopTags
                                    }]
                                })],
                                bbar: ['->',{
                                    text: 'Ok',
                                    iconCls: 'icon-ok',
                                    handler: function(btn) {
                                        var x, xlen, w = btn.ownerCt.ownerCt,
                                            v = w.items.getAt(0).getForm().getFieldValues();
                                        Ext.apply(this, v);
                                        this.fireEvent('rename', v.udopTitle);
                                        w.close();
                                    },
                                    scope: this
                                },{
                                    text: 'Cancel',
                                    iconCls: 'icon-cancel',
                                    handler: function(btn) {
                                        btn.ownerCt.ownerCt.close();
                                    }
                                }]
                            }).show();
                        },
                        scope: this
                    },{
                        iconCls: 'icon-save',
                        tooltip: 'Save this Dashboard',
                        handler: function() { this.save(this.public) },
                        scope: this
                    },{
                        iconCls: 'icon-pagego',
                        tooltip: 'Publish this Dashboard',
                        handler: this.publish,
                        scope: this
                    },{
                        iconCls: 'icon-stop',
                        tooltip: 'Close this Dashboard',
                        handler: this.closeUdop,
                        scope: this
                    }]
                })
            ],
            listeners: {
                afterrender: {
                    fn: function() {
                        if (this.items.getCount() === 0) {
                            this.createTab();
                        }
                    },
                    scope: this
                }
            }
        });

        this.callParent();
        this.on('alertstart', function(widget) {
            var tab = widget.widgetCt.up('portalpanel').tab;
            tab.blinkTask = tab.blinkTask || Ext.TaskManager.start({
                run: function() {
                    var btn = this.getEl().down('.x-tab-inner');
                    if (btn.hasCls('sw-alert-header')) {
                        btn.removeCls('sw-alert-header')
                    } else {
                        btn.addCls('sw-alert-header');
                    }
                },
                scope: tab,
                interval: 500
            });
            if (this.alertingWidgets) {
                this.alertingWidgets = Ext.Array.merge(this.alertingWidgets, [widget.id]);
            } else {
                this.alertingWidgets = [widget.id];
            }
        }, this);
        this.on('alertend', function(widget) {
            var tab = widget.widgetCt.up('portalpanel').tab, tabInner = tab.getEl().down('.x-tab-inner');
            Ext.Array.remove(this.alertingWidgets, widget.id);
            if (this.alertingWidgets.length === 0) {
                if (tab.blinkTask) {
                    Ext.TaskManager.stop(tab.blinkTask);
                    tab.blinkTask = null;
                }
                if (tabInner.hasCls('sw-alert-header')) {
                    tabInner.removeCls('sw-alert-header');
                }
            }
        }, this);
    },

    closeUdop: function() {
        if (this.isVisible()) {
            if (this.ownerCt.getLayout().getNext()) {
                this.ownerCt.getLayout().next();
            } else {
                this.ownerCt.getLayout().prev();
            }
        }
        this.ownerCt.remove(this);
    },

    addWidgetFromService: function(serviceId, widgetType) {
        o2e.serviceRegistry.get(serviceId, function(metadata) {
            var firstColumn = this.getOrCreateActiveTab().items.getAt(0);
            o2e.widgetFactory.createFromService(metadata.id, widgetType || metadata.type, 'sw-widgetcontainer', function(w) {
                this.add({
                    xtype: 'sw-hboxwrapper',
                    items: [w]
                });
            }, firstColumn);
        }, this);
    },

    addWidget: function(widgetType, widgetCfg) {
        var firstColumn = this.getOrCreateActiveTab().items.getAt(0);
        o2e.widgetFactory.create(widgetType, widgetCfg, 'sw-widgetcontainer', null, function(w) {
            this.add({
                xtype: 'sw-hboxwrapper',
                items: [w]
            });
        }, firstColumn);
    },

    getOrCreateActiveTab: function() {
        var activeTab = this.getActiveTab();
        if (!activeTab) {
            activeTab = this.createTab();
        }
        return activeTab;
    },

    getWidgets: function() {
        var x, xlen, y, ylen, col, widgets = [], tab = this.getActiveTab();
        for (x=0,xlen=tab.items.getCount();x<xlen;x++) {
            col = tab.items.getAt(x);
            for (y=0,ylen=col.items.getCount();y<ylen;y++) {
                widgets = widgets.concat(col.items.getAt(y).items.items);
            }
        }
        return widgets;
    },

    createTab: function() {
        var newTab = this.add({
            title: 'Untitled Tab',
            autoScroll : true,
            items: [{
                itemId: 'col-1',
                columnWidth: 0.5,
                listeners: {
                    remove: {
                        fn: function(col, item, e) {
                            col.ownerCt.doLayout();
                        }
                    }
                }
            },{
                itemId: 'col-2',
                columnWidth: 0.5,
                listeners: {
                    remove: {
                        fn: function(col, item, e) {
                            col.ownerCt.doLayout();
                        }
                    }
                }
            }]
        });
        this.setActiveTab(newTab);
        return newTab;
    },

    save: function(public) {
        var currTab, tab, tabs=this.items, x=0, xlen=tabs.getCount(),
            currCol, col, cols, y=0, ylen,
            widgets, z=0, zlen,
            widgetCts, widget, i=0, ilen,
            meta = {
                udopTitle: this.udopTitle,
                udopDescription: this.udopDescription,
                udopCategory: this.udopCategory,
                udopTags: this.udopTags,
                tabs: [],
                public: public,
                creator: o2e.env.username
            };

        for (; x<xlen; x++) {
            currTab = tabs.getAt(x);
            if (this.getActiveTab() === currTab) {
                meta.activeTab = x;
            }
            tab = {
                title: currTab.title,
                items: []
            };
            for (y=0,cols=currTab.items,ylen=cols.getCount(); y<ylen; y++) {
                currCol = cols.getAt(y);
                col = {
                    columnWidth: currCol.columnWidth,
                    widgets: []
                };
                for (z=0,widgets=currCol.items,zlen=widgets.getCount(); z<zlen; z++) {
                    for (i=0,widgetCts=widgets.getAt(z).items,ilen=widgetCts.getCount(); i<ilen; i++) {
                        widget = widgetCts.getAt(i).widget.getStateConfig();
                        widget.widgetCt.trackedColPosition = z;
                        col.widgets.push(widget);
                    }
                }
                tab.items.push(col);
            }
            meta.tabs.push(tab);
        }

        o2e.log.debug('Saving Dashboard Metadata: ', false, meta);
        Ext.Msg.wait('Saving Dashboard...', 'Please wait');

        if (this.uuid) {
            o2e.udopRegistry.update(this.uuid, meta, function(d) {
                this.dirty = false;
                Ext.Msg.hide();
                o2e.env.notifyMgr.send('udop', {action: 'update', metadata: d});
            }, this);
        } else {
            o2e.udopRegistry.insert(null, meta, function(d) {
                this.uuid = d.uuid;
                this.dirty = false;
                Ext.Msg.hide();
                o2e.env.notifyMgr.send('udop', {action: 'add', metadata: d});
            }, this);
        }
    },

    publish: function() {
        this.save(true);
        if (!this.public) {
            this.public = true;
            this.plugins[2].toolbar.getComponent('publishStatus').setText(this.stata.PUBLISHED);
        }
    }
});