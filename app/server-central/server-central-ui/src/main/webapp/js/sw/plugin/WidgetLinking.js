Ext.define('sw.plugins.WidgetLinking', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'wiring',

    iconCls: 'icon-wiring',
    defaultItemClass: 'Ext.menu.Item',
    disabled: true,
    text: 'Manage Linked Widgets',

    linkages: null,

    init: function() {
        var eventSrc, fn;
        if (this.linkages !== null) {
            this.disabled = false;
            fn = Ext.Function.createDelayed(function() {
                for (var linkage in this.linkages) {
                    if (this.linkages.hasOwnProperty(linkage)) {
                        for (var i=0,ilen=this.linkages[linkage].length;i<ilen;i++) {
                            this.linkages[linkage][i].handler = this.createWiring(linkage, this.linkages[linkage][i]);
                        }
                    }
                }
            }, 5000, this);
            if (this.widget.widgetCt.rendered) {
                fn();
            } else {
                this.widget.widgetCt.on('afterrender', fn);
            }
        } else {
            if (this.widget.ready) {
                for (eventSrc in this.widget.availableEventSources) {
                    if (this.widget.availableEventSources.hasOwnProperty(eventSrc)) {
                        this.linkages = {};
                        this.disabled = false;
                        break;
                    }
                }
            } else {
                this.widget.on('ready', function() {
                    for (eventSrc in this.widget.availableEventSources) {
                        if (this.widget.availableEventSources.hasOwnProperty(eventSrc)) {
                            this.linkages = {};
                            this.disabled = false;
                            if (this.itemRef) {
                                this.itemRef.enable();
                            }
                            break;
                        }
                    }
                }, this);
            }
        }
    },

    getPanel: function(item) {
        var widgets = Ext.Array.remove(this.widget.widgetCt.up('sw-udop').getWidgets(), this.widget.widgetCt), // a reference to all "wire-able" widgets. NOTE: this particular logic may need to be modified when plugin is shared -- it is cognizant of application-specific paths
            source, sources = this.widget.availableEventSources,
            items = [];

        // TODO: support removing linkages -- will need to do this below in the add window as well
        for (source in sources) {
            if (sources.hasOwnProperty(source)) {
                items.push({
                    itemId: source.replace(' ', '_'),
                    title: 'When a user '+sources[source].name,
                    defaultType: 'fieldcontainer',
                    defaults: { anchor: '100%', layout: 'hbox' },
                    layout: 'anchor',
                    items: this.getLinkages(source, widgets)
                });
            }
        }

        return Ext.create('Ext.form.Panel', {
            itemId: item.itemId,
            border: 0,
            bodyPadding: 10,
            autoScroll: true,
            defaultType: 'fieldset',
            defaults: {
                anchor: '100%'
            },
            items: items
        });
    },

    getLinkages: function(source, widgets) {
        var x,xlen,linkage,links = [];
        if (this.linkages[source] && this.linkages[source].length) {
            for (x=0,xlen=this.linkages[source].length;x<xlen;x++) {
                linkage = this.linkages[source][x];
                links.push({
                    items: [{
                        xtype: 'displayfield',
                        fieldLabel: linkage.name,
                        value: this.getWidgetTitleByLinkageId(widgets, linkage.linkageId),
                        flex: 1
                    },{
                        xtype: 'button',
                        iconCls: 'icon-delete',
                        linkageSrc: source,
                        linkageIdx: x,
                        handler: function(btn) {
                            var fieldset = btn.ownerCt.ownerCt;
                            this.removeWiring(btn.linkageSrc, this.linkages[btn.linkageSrc].splice(btn.linkageIdx, 1));
                            fieldset.remove(btn.ownerCt);
                            if (this.linkages[btn.linkageSrc].length === 0) {
                                fieldset.insert(fieldset.items.getCount()-1, { items: [{ xtype: 'displayfield', flex: 1, fieldLabel: 'Currently Linked Widgets', labelWidth: 145, value: 'none' }]});
                            }
                        },
                        scope: this
                    }]
                });
            }
        } else {
            links.push({ items: [{ xtype: 'displayfield', flex: 1, fieldLabel: 'Currently Linked Widgets', labelWidth: 145, value: 'none' }]});
        }
        links.push({
            xtype: 'button',
            iconCls: 'icon-add',
            text: 'Add Widget Link',
            handler: function(addBtn) {
                var x, xlen, widgetArr = [], valueArr = [],
                    widgetStore, actionStore, valueStore,
                    widgets = Ext.Array.remove(this.widget.widgetCt.up('sw-udop').getWidgets(), this.widget.widgetCt),
                    y, ylen, argValues, args = this.widget.availableEventSources[source].args;

                for (x=0,xlen=widgets.length;x<xlen;x++) {
                    widgetArr.push({name: widgets[x].title, value: widgets[x].widget.availableEventId});
                }

                for (x=0,xlen=args.length;x<xlen;x++) {
                    if (args[x].getValues && args[x].processor) {
                        argValues = args[x].getValues();
                        for (y=0,ylen=argValues.length;y<ylen;y++) {
                            valueArr.push({name: argValues[y], value: args[x].name+'|INDEX|'+x+'|PROCESSOR|'+argValues[y]});
                        }
                    } else {
                        valueArr.push({name: args[x].name, value: args[x].name+'|INDEX|'+x});
                    }
                }

                widgetStore = Ext.create('Ext.data.Store', { fields: ['name', 'value'], data: widgetArr });
                actionStore = Ext.create('Ext.data.Store', { fields: ['name', 'value'] });
                valueStore = Ext.create('Ext.data.Store', { fields: ['name', 'value'], data: valueArr });

                Ext.create('Ext.window.Window', {
                    title: 'Add Widget Link',
                    modal: true,
                    closable: true,
                    collapsible: false,
                    resizable: false,
                    maximizable: false,
                    draggable: false,
                    width: 400,
                    height: 400,
                    layout: 'fit',
                    items: [Ext.create('Ext.form.Panel', {
                        border: 0,
                        bodyPadding: 10,
                        autoScroll: true,
                        defaultType: 'combobox',
                        defaults: {
                            anchor: '100%'
                        },
                        items: [{
                            itemId: 'widgetCombo',
                            fieldLabel: 'Widget',
                            name: 'linkageId',
                            store: widgetStore,
                            queryMode: 'local',
                            displayField: 'name',
                            valueField: 'value',
                            listeners: {
                                select: {
                                    fn: function(combo, recs) {
                                        var arr = [], action, actions = this.getWidgetByLinkageId(widgets, recs[0].get('value')).widget.availableEventActions;
                                        for (action in actions) {
                                            if (actions.hasOwnProperty(action)) {
                                                arr.push({name: actions[action].name, value: actions[action].name});
                                            }
                                        }
                                        actionStore.loadData(arr);
                                    },
                                    scope: this
                                }
                            }
                        },{
                            itemId: 'actionCombo',
                            fieldLabel: 'Action',
                            name: 'name',
                            store: actionStore,
                            queryMode: 'local',
                            displayField: 'name',
                            valueField: 'value',
                            listeners: {
                                select: {
                                    fn: function(combo, recs) {
                                        var actions = this.getWidgetByLinkageId(widgets, combo.ownerCt.getComponent('widgetCombo').getSubmitValue()).widget.availableEventActions,
                                            action = actions[recs[0].get('value')],
                                            x,xlen,items=[];
                                        for (x=0,xlen=action.args.length;x<xlen;x++) {
                                            items.push({
                                                fieldLabel: action.args[x],
                                                name: action.args[x],
                                                store: valueStore,
                                                queryMode: 'local',
                                                displayField: 'name',
                                                valueField: 'value'
                                            });
                                        }
                                        combo.ownerCt.add(items);
                                    },
                                    scope: this
                                }
                            }
                        }]
                    })],
                    bbar: [{
                        iconCls: 'icon-save',
                        text: 'Save',
                        handler: function(btn) {
                            var formValue = btn.ownerCt.ownerCt.items.getAt(0).getForm().getFieldValues();
                            formValue.handler = this.createWiring(source, formValue);

                            // then, store for persistence
                            this.linkages[source] = (this.linkages[source] || []).concat([formValue]);

                            // finally, update UI
                            if (addBtn.ownerCt.items.getAt(0).items.getAt(0).getFieldLabel() === 'Currently Linked Widgets') {
                                addBtn.ownerCt.remove(addBtn.ownerCt.items.getAt(0));
                            }
                            addBtn.ownerCt.insert(addBtn.ownerCt.items.getCount()-1, {
                                items: [{
                                    xtype: 'displayfield',
                                    fieldLabel: formValue.name,
                                    value: this.getWidgetTitleByLinkageId(widgets, formValue.linkageId),
                                    flex: 1
                                },{
                                    xtype: 'button',
                                    iconCls: 'icon-delete',
                                    linkageSrc: source,
                                    linkageIdx: this.linkages[source].length - 1,
                                    handler: function(btn) {
                                        var fieldset = btn.ownerCt.ownerCt;
                                        this.removeWiring(btn.linkageSrc, this.linkages[btn.linkageSrc].splice(btn.linkageIdx, 1));
                                        fieldset.remove(btn.ownerCt);
                                        if (this.linkages[btn.linkageSrc].length === 0) {
                                            fieldset.insert(fieldset.items.getCount()-1, { items: [{ xtype: 'displayfield', flex: 1, fieldLabel: 'Currently Linked Widgets', labelWidth: 145, value: 'none' }]});
                                        }
                                    },
                                    scope: this
                                }]
                            });

                            btn.ownerCt.ownerCt.close();
                        },
                        scope: this
                    },{
                        iconCls: 'icon-cancel',
                        text: 'Cancel',
                        handler: function(btn) {
                            btn.ownerCt.ownerCt.close();
                        }
                    }]
                }).show();
            },
            scope: this
        });
        return links;
    },

    getWidgetByLinkageId: function(widgets, id) {
        var x,xlen;
        for (x=0,xlen=widgets.length;x<xlen;x++) {
            if (widgets[x].widget.availableEventId === id) {
                return widgets[x];
            }
        }
        return null;
    },

    getWidgetTitleByLinkageId: function(widgets, id) {
        var widget = this.getWidgetByLinkageId(widgets,id);
        return widget ? widget.title : 'Widget no longer exists';
    },

    createWiring: function(source, cfg) {
        var widgets = Ext.Array.remove(this.widget.widgetCt.up('sw-udop').getWidgets(), this.widget.widgetCt),
            src = this.widget.availableEventSources[source],
            action = this.getWidgetByLinkageId(widgets, cfg.linkageId).widget.availableEventActions[cfg.name],
            handler =  function() {
                var x, xlen, argStr, argVal, processorIdx, processorVal, indexIdx, index, srcArg, args = [];

                // set up the linkages
                for (x=0,xlen=action.args.length;x<xlen;x++) {
                    argStr = cfg[action.args[x]];
                    processorIdx = argStr.indexOf('|PROCESSOR|');
                    if (processorIdx !== -1) {
                        processorVal = argStr.substr(processorIdx+11);
                        argStr = argStr.substring(0, processorIdx);
                    }
                    indexIdx = argStr.indexOf('|INDEX|');
                    index = argStr.substr(indexIdx+7);
                    argVal = argStr.substring(0, indexIdx);
                    srcArg = src.args[index];
                    index = isNaN(srcArg.index) ? index : srcArg.index;
                    if (processorVal) {
                        argVal = srcArg.processor(arguments[index], processorVal);
                    } else {
                        argVal = arguments[index];
                    }
                    args.push(argVal);
                }

                Ext.Function.bind(action.callback, action.scope, args)();
            };

        src.source.on(src.event, handler, this);
        return handler;
    },

    removeWiring: function(source, linkage) {
        var src = this.widget.availableEventSources[source];
        src.source.un(src.event, linkage[0].handler, this);
    },

    getStateConfig: function() {
        var x,xlen,linkage,linkages = Ext.clone(this.linkages);
        for (linkage in linkages) {
            if (linkages.hasOwnProperty(linkage)) {
                for (x=0,xlen=linkages[linkage].length;x<xlen;x++) {
                    delete linkages[linkage][x].handler;
                }
            }
        }
        return Ext.apply({
            linkages: this.linkages
        }, this.callParent());
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});