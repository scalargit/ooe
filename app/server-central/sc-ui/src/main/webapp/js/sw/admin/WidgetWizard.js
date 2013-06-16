Ext.define('sw.admin.WidgetWizard', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.sw-widgetwizard',

    dataSources: [
        { name: 'Flow Data Sensor', value: 'sensor' },
        { name: 'REST Feed', value: 'rest' },
        { name: 'URL (HTML)', value: 'url'}
        //,{ name: 'Messaging Topic', value: 'em'}
    ],

    restMethods: [
        { name: 'GET', value: 'GET' },
        { name: 'POST', value: 'POST' }
    ],

    wid: null,

    initComponent: function () {
        var me = this;

        this.serviceFormPanel = Ext.create('Ext.form.Panel', {
            title: 'Data Source',
            border: 0,
            bodyPadding: 5,
            autoScroll: true,
            defaults: {
                anchor: '100%'
            },

            items: [
                {
                    xtype: 'combobox',
                    itemId: 'dsCombo',
                    fieldLabel: 'Select Data Source',
                    name: 'dataType',
                    store: Ext.create('Ext.data.Store', { fields: ['name', 'value'], data: this.dataSources }),
                    queryMode: 'local',
                    displayField: 'name',
                    valueField: 'value',
                    listeners: {
                        select: {
                            fn: this.setupDataSourceFieldset,
                            scope: this
                        }
                    }
                },
                {
                    xtype: 'fieldset',
                    itemId: 'dsFieldSet',
                    title: 'Data Source Configuration',
                    collapsible: false,
                    defaultType: 'textfield',
                    defaults: {anchor: '100%'},
                    layout: 'anchor',
                    items: []
                }
            ]
        });

        this.generalInfoFormPanel = Ext.create('Ext.form.Panel', {
            title: 'General Information',
            border: 0,
            bodyPadding: 5,
            autoScroll: true,
            disabled: true,
            defaults: {
                anchor: '100%'
            },

            items: [
                {
                    xtype: 'fieldset',
                    itemId: 'genFieldSet',
                    title: 'General Information',
                    collapsible: false,
                    defaultType: 'textfield',
                    defaults: { anchor: '100%' },
                    layout: 'anchor',
                    items: [
                        {
                            fieldLabel: 'Name',
                            name: 'name',
                            allowBlank: false
                        },
                        {
                            fieldLabel: 'Description',
                            xtype: 'textareafield',
                            name: 'description',
                            grow: true,
                            allowBlank: false
                        },
                        {
                            fieldLabel: 'Category',
                            name: 'category',
                            allowBlank: false,
                            value: 'Uncategorized'
                        },
                        {
                            fieldLabel: 'Tags',
                            name: 'tags',
                            allowBlank: false
                        }
                    ]
                }
            ]
        });

        this.repElemStore = new Ext.data.ArrayStore({
            fields: ['value', 'display']
        });
        this.repElemCombo = new Ext.form.ComboBox({
            name: 'recordBreak',
            typeAhead: true,
            forceSelection: true,
            lazyRender: true,
            queryMode: 'local',
            store: this.repElemStore,
            valueField: 'value',
            displayField: 'display',
            listEmptyText: 'No repeating element options found',
            width: 200,
            fieldLabel: 'Repeating Element',
            listeners: {
                'select': {
                    fn: function (field, rec, index) {
                        this.getResponse(field.responseObj);
                    },
                    scope: this
                }
            }
        });

        Ext.define('widgetColumn', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'name', type: 'string' },
                { name: 'header', type: 'string' },
                { name: 'annotations' },
                { name: 'defaultValue', type: 'string' },
                { name: 'sampleValue', type: 'string' },
                { name: 'ignore', type: 'bool' },
                { name: 'exclude', type: 'bool' }
            ]
        });

        this.annotationsStore = new Ext.data.ArrayStore({
            fields: ['name', 'value'],
            data: [
                ['Classification', 'classification'],
                ['Classification Caveat', 'classificationCaveat'],
                ['Embedded Classification', 'embeddedClassification']
            ]//,['Alertable', 'alertable'],['Filterable', 'filterable']]
        });

        var widgetColumnForm = Ext.create('Ext.form.Panel', {
            title: 'Column Configuration',
            flex: 1,
            bodyPadding: '5 20 5 5',
            autoScroll: true,
            defaultType: 'textfield',
            defaults: {
                anchor: '100%'
            },
            items: [
                {
                    name: 'name',
                    fieldLabel: 'Name',
                    xtype: 'displayfield'
                },
                {
                    name: 'sampleValue',
                    fieldLabel: 'Sample Value',
                    xtype: 'displayfield'
                },
                {
                    name: 'header',
                    fieldLabel: 'Header',
                    allowBlank: true
                },
                Ext.create('Ext.ux.form.field.BoxSelect', {
                    fieldLabel: 'Annotations',
                    name: 'annotations',
                    displayField: 'name',
                    valueField: 'value',
                    store: this.annotationsStore,
                    queryMode: 'local',
                    emptyText: 'Select annotation(s)'
                }),
                {
                    name: 'defaultValue',
                    fieldLabel: 'Default Value',
                    allowBlank: true
                },
                {
                    name: 'ignore',
                    fieldLabel: 'Hidden',
                    xtype: 'checkbox',
                    checked: false
                },
                {
                    name: 'exclude',
                    fieldLabel: 'Exclude',
                    xtype: 'checkbox',
                    checked: false
                }
            ]
        });

        this.widgetColumnStore = Ext.create('Ext.data.Store', {
            model: 'widgetColumn'
        });

        this.widgetColumnGridPanel = Ext.create('Ext.grid.Panel', {
            store: this.widgetColumnStore,
            margin: '0 5 0 0',
            viewConfig: {
                plugins: [
                    { ptype: 'gridviewdragdrop'}
                ]
            },
            flex: 1,
            autoScroll: true,
            title: 'Columns',
            columns: [
                { dataIndex: 'header', text: 'Label', flex: 1 },
                { dataIndex: 'sampleValue', text: 'Sample Value', flex: 1, sortable: false }
            ],
            listeners: {
                selectionchange: {
                    fn: function (sm, m, e) {
                        if (m && m.length > 0) {
                            this.getForm().loadRecord(m[0]);
                        } else {
                            this.getForm().reset();
                        }
                    },
                    scope: widgetColumnForm
                },
                beforedeselect: {
                    fn: function (sm, m, i, e) {
                        var values = this.getForm().getFieldValues();
                        m.set('header', values.header);
                        m.set('annotations', values.annotations);
                        m.set('defaultValue', values.defaultValue);
                        m.set('ignore', values.ignore);
                        m.set('exclude', values.exclude);
                        m.commit();
                    },
                    scope: widgetColumnForm
                }
            }
        });

        this.vizFormPanel = Ext.create('Ext.form.Panel', {
            title: 'Visualization',
            border: 0,
            bodyPadding: 5,
            autoScroll: true,
            defaultType: 'fieldset',
            disabled: true,
            defaults: {
                anchor: '100%'
            },
            items: [this.repElemCombo, {
                xtype: 'panel',
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                anchor: '100%',
                height: 225,
                margin: '0 0 5',
                border: 0,
                items: [this.widgetColumnGridPanel, widgetColumnForm]
            }],
            listeners: {
                afterrender: {
                    fn: function () {
                        this.add(me.getWidgetFieldsets());
                    },
                    scope: this.vizFormPanel
                }
            }
        });

        Ext.apply(this, {
            title: 'Widget Administration',
            layout: 'fit',
            border: 0,
            bodyPadding: 5,
            items: [Ext.create('Ext.tab.Panel', {
                activeTab: 0,
                defaults: {
                    closable: false,
                    padding: 0
                },
                items: [this.serviceFormPanel, this.generalInfoFormPanel, this.vizFormPanel]
            })],
            bbar: ['->', {
                iconCls: 'icon-save',
                text: 'Save',
                handler: this.persistWidgetMetadata,
                scope: this
            }, {
                iconCls: 'icon-cancel',
                text: 'Cancel',
                handler: function () {
                    this.ownerCt.ownerCt.close();
                },
                scope: this
            }]
        });

        this.callParent();
    },

    getWidgetFieldsets: function () {
        var tmp = [], resp = [], wTypes = this.ownerCt.ownerCt.widgetInfo, w, wm, x, xlen;
        for (w in wTypes) {
            if (wTypes.hasOwnProperty(w)) {
                wm = {
                    itemId: w + 'Config',
                    title: wTypes[w].name + ' Configuration',
                    checkboxToggle: true,
                    collapsed: (w === 'grid' && !this.wid) ? false : true,
                    items: [
                        {
                            name: 'defaultWidgetType',
                            xtype: 'radiofield',
                            fieldLabel: 'Use as default',
                            inputValue: w,
                            checked: w === 'grid' ? true : false
                        }
                    ]
                };
                tmp = [];
                for (x = 0, xlen = wTypes[w].required.length; x < xlen; x++) {
                    if (this.annotationsStore.findExact('value', wTypes[w].required[x]) === -1) {
                        this.annotationsStore.loadData([
                            [Ext.String.capitalize(wTypes[w].required[x]).replace('_', ' '), wTypes[w].required[x]]
                        ], true);
                    }
                    tmp.push(Ext.String.capitalize(wTypes[w].required[x]).replace('_', ' '));
                }
                wm.items.push({
                    xtype: 'displayfield',
                    fieldLabel: 'Required Annotations',
                    value: tmp.toString()
                });
                tmp = [];
                for (x = 0, xlen = wTypes[w].optional.length; x < xlen; x++) {
                    if (this.annotationsStore.findExact('value', wTypes[w].optional[x]) === -1) {
                        this.annotationsStore.loadData([
                            [Ext.String.capitalize(wTypes[w].optional[x]).replace('_', ' '), wTypes[w].optional[x]]
                        ], true);
                    }
                    tmp.push(Ext.String.capitalize(wTypes[w].optional[x]).replace('_', ' '));
                }
                wm.items.push({
                    xtype: 'displayfield',
                    fieldLabel: 'Optional Annotations',
                    value: tmp.toString()
                });
                for (x in wTypes[w].metaFields) {
                    if (wTypes[w].metaFields.hasOwnProperty(x)) {
                        if (typeof wTypes[w].metaFields[x] === 'function') {
                            wTypes[w].metaFields[x] = wTypes[w].metaFields[x]();
                        }
                        if (Ext.isArray(wTypes[w].metaFields[x])) {
                            wm.items.push({
                                name: w + '.' + x,
                                fieldLabel: x,
                                xtype: 'combo',
                                store: Ext.create('Ext.data.ArrayStore', {
                                    autoDestroy: true,
                                    idIndex: 0,
                                    fields: ['name', 'value'],
                                    data: wTypes[w].metaFields[x]
                                }),
                                queryMode: 'local',
                                displayField: 'name',
                                valueField: 'value',
                                typeAhead: true,
                                lazyRender: true,
                                width: 300
                            });
                        } else if (typeof wTypes[w].metaFields[x] === 'string') {
                            wm.items.push({
                                name: w + '.' + x,
                                xtype: 'textfield',
                                fieldLabel: x,
                                allowBlank: false,
                                value: wTypes[w].metaFields[x]
                            });
                        } else if (typeof wTypes[w].metaFields[x] === 'boolean') {
                            wm.items.push({
                                name: w + '.' + x,
                                xtype: 'checkboxfield',
                                fieldLabel: x,
                                checked: wTypes[w].metaFields[x]
                            });
                        }
                    }
                }
                resp.push(Ext.create('Ext.form.FieldSet', wm));
            }
        }
        return resp;
    },
    setupDataSourceFieldset: function (dsCombo, recs) {
        var f = this.serviceFormPanel.getComponent('dsFieldSet'),
            sType = recs[0].get('value');
        f.removeAll();

        if (sType === 'em') {
            f.add([
                {
                    fieldLabel: 'Topic Name',
                    name: 'topic',
                    allowBlank: false,
                    xtype: 'combobox',
                    store: Ext.create('Ext.data.Store', { fields: ['name']}),
                    queryMode: 'local',
                    displayField: 'name',
                    valueField: 'name',
                    listeners: {
                        afterrender: {
                            fn: function (i) {
                                i.inputEl.mask('Retrieving topics, please wait...');
                                o2e.connectorMgr.query({
                                    componentId: 'console',
                                    serviceId: 'SYSTEM_messaging_listTopics',
                                    serviceKey: 'AdminConsole|messaging|listTopics',
                                    params: {
                                        serviceBase: o2e.env.messagingServiceBase
                                    },
                                    success: function (k, d) {
                                        i.getStore().loadData(d.topics);
                                        i.inputEl.unmask();
                                    },
                                    failure: Ext.emptyFn,
                                    scope: console
                                });
                            }
                        }
                    }
                },
                {
                    fieldLabel: 'Messaging Endpoint',
                    name: 'serviceBase',
                    allowBlank: false,
                    value: o2e.env.messagingServiceBase
                },
                {
                    fieldLabel: 'Delivery Endpoint',
                    name: 'deliveryEndpoint',
                    allowBlank: false,
                    value: o2e.env.messagingDeliveryEndpoint
                },
                {
                    xtype: 'textareafield',
                    fieldLabel: 'Sample Message',
                    name: 'schema',
                    grow: true,
                    allowBlank: false
                },
                {
                    xtype: 'button',
                    text: 'Save Messaging Data Source',
                    handler: function () {
                        var md = this.serviceFormPanel.getForm().getValues(),
                            schema = md.schema;
                        delete md.schema;
                        md.refreshIntervalSeconds = Number(md.refreshIntervalSeconds || o2e.env.messagingRenewalMillis || 9000);
                        md.name = md.topic;
                        md.append = true;
                        this.saveDataSource(md, function (k, m) {
                            this.sid = m._id;
                            this.append = true;
                            this.setupVizForm({
                                schema: schema
                            });
                        });
                    },
                    scope: this
                }
            ]);
        } else if (sType === 'url') {
            f.add([
                {
                    fieldLabel: 'Name',
                    name: 'name',
                    allowBlank: false
                },
                {
                    fieldLabel: 'Description',
                    name: 'description',
                    allowBlank: false
                },
                {
                    fieldLabel: 'Category',
                    name: 'category',
                    allowBlank: false
                },
                {
                    fieldLabel: 'Tags',
                    name: 'tags',
                    allowBlank: false
                },
                {
                    fieldLabel: 'URL',
                    name: 'url',
                    allowBlank: false
                },
                {
                    xtype: 'button',
                    text: 'Save HTML Data Source',
                    handler: function () {
                        var vals = this.serviceFormPanel.getForm().getValues(),
                            meta = {
                                clientConnector: 'ungoverned',
                                connectorAction: 'invoke',
                                connectionType: 'HTML',
                                name: vals.name,
                                description: vals.description,
                                category: vals.category,
                                tags: vals.tags,
                                recordBreak: 'html.info',
                                request: [
                                    {
                                        name: 'url',
                                        header: 'URL',
                                        defaultValue: vals.url
                                    }
                                ],
                                response: [
                                    {
                                        name: 'url',
                                        header: 'URL',
                                        defaultValue: '',
                                        annotations: [],
                                        ignore: false
                                    }
                                ],
                                refreshIntervalSeconds: 60,
                                type: 'html',
                                viz: { html: {}}
                            };

                        if (this.wid) {
                            meta._id = meta.id = this.wid;
                            meta.creator = this.currentMetadata.creator;
                            meta.createdTime = this.currentMetadata.createdTime;
                            o2e.serviceRegistry.update(this.wid, meta, function (d) {
                                this.ownerCt.ownerCt.close();
                                o2e.env.notifyMgr.send('service', { action: 'update', metadata: d});
                            }, this);
                        } else {
                            o2e.serviceRegistry.insert(null, meta, function (d) {
                                this.ownerCt.ownerCt.close();
                                o2e.env.notifyMgr.send('service', { action: 'add', metadata: d});
                            }, this);
                        }

                    },
                    scope: this
                }
            ]);
        } else if (sType === 'sensor') {
            f.add([
                {
                    fieldLabel: 'URL',
                    name: 'url',
                    allowBlank: false,
                    value: 'http://198.186.190.22/render'
                },
                {
                    fieldLabel: 'From',
                    name: 'from',
                    allowBlank: false,
                    value: '-1minutes'
                },
                {
                    fieldLabel: 'Until',
                    name: 'until',
                    allowBlank: false ,
                    value: 'now'
                },
                {
                    fieldLabel: 'Target System',
                    name: 'targetSystem',
                    allowBlank: false,
                    value: 'system.bb.port1.hash1.port'
                },
                {
                    fieldLabel: 'Target Type',
                    name: 'targetType',
                    allowBlank: false,
                    value: 'bytes'
                },
                {
                    fieldLabel: 'Targets',
                    name: 'targets',
                    allowBlank: false,
                    value: 'all'
                },
                {
                    fieldLabel: 'Refresh rate (s)',
                    name: 'refreshInterval',
                    allowBlank: false,
                    value: '1'
                },
                {
                    xtype: 'button',
                    text: 'Save Sensor Data Source',
                    handler: function () {
                        var vals = this.serviceFormPanel.getForm().getValues(),
                            targets = vals.targets.split(','),
                            x=0, xlen=targets.length,
                            url = vals.url +
                                '?format=json&from=' + vals.from +
                                '&until=' + vals.until,
                            meta = {
                                dataType: 'sensor',
                                method: 'GET',
                                append: false,
                                refreshIntervalSeconds: Number(vals.refreshInterval) || 1
                            };

                        for (;x<xlen;x++) {
                            url = url + '&target=' + vals.targetSystem + '.' + targets[x] + '.' + vals.targetType;
                        }
                        meta.name = meta.url = url;
                        this.saveDataSource(meta);
                    },
                    scope: this
                }
            ]);
        } else if (sType === 'rest') {
            f.add([
                {
                    fieldLabel: 'URL',
                    name: 'url',
                    allowBlank: false
                },{
                    xtype: 'combobox',
                    fieldLabel: 'HTTP Method',
                    name: 'method',
                    store: Ext.create('Ext.data.Store', { fields: ['name', 'value'], data: this.restMethods }),
                    queryMode: 'local',
                    displayField: 'name',
                    valueField: 'value',
                    value: 'GET'
                },
                {
                    fieldLabel: 'Refresh rate (s)',
                    name: 'refreshInterval',
                    allowBlank: false,
                    value: '60'
                },
                {
                    xtype: 'button',
                    text: 'Save Data Source',
                    handler: function () {
                        var meta = this.serviceFormPanel.getForm().getValues();
                        Ext.apply(meta, {
                            dataType: 'rest',
                            append: false,
                            refreshIntervalSeconds: Number(vals.refreshInterval) || 1
                        });
                        delete meta.refreshInterval;
                        this.saveDataSource(meta);
                    },
                    scope: this
                }
            ]);
        }
    },

    loadMetadata: function (meta) {
        this.ownerCt.ownerCt.body.mask('Loading metadata, please wait...');
        this.currentMetadata = meta;

        if (meta.type === 'html') {
            var combo = this.serviceFormPanel.getComponent('dsCombo'),
                comboRec = combo.getStore().getAt(combo.getStore().findExact('value', 'url'));
            combo.setValue('url'); // URL (HTML)

            this.setupDataSourceFieldset(combo, [comboRec]);
            this.serviceFormPanel.getForm().setValues({
                name: meta.name,
                description: meta.description,
                category: meta.category,
                tags: meta.tags,
                url: meta.request[0].defaultValue
            });
            this.wid = meta._id;
            this.ownerCt.ownerCt.body.unmask();
            return;
        }

        for (var x = 0, xlen = meta.request.length; x < xlen; x++) {
            if (meta.request[x].name === 'serviceSpecificationId') {
                this.sid = meta.request[x].defaultValue;
            } else if (meta.request[x].name === 'widgetMetadataId') {
                this.wid = meta.request[x].defaultValue;
            }
        }
        this.append = meta.append;

        o2e.connectorMgr.query({
            componentId: 'console',
            serviceId: 'SYSTEM_service_get',
            serviceKey: 'AdminConsole|getServiceSpec|' + this.sid,
            params: { id: this.sid },
            success: Ext.bind(this.finishLoadMetadata, this, [meta], 0),
            failure: this._onError,
            scope: this
        });
    },

    finishLoadMetadata: function (meta, serviceKey, data, fr) {
        var dsCombo = this.serviceFormPanel.getComponent('dsCombo'),
            dsStore = dsCombo.getStore(),
            dsFs = this.serviceFormPanel.getComponent('dsFieldSet'),
            vizSetupData = data;
        this.currentServiceSpec = data;
        this.assertUser = data.assertUser || false;
        dsCombo.setValue(data.dataType);
        this.setupDataSourceFieldset(dsCombo, [dsStore.getAt(dsStore.findExact('value', data.dataType))]);
        this.serviceFormPanel.getForm().setValues(data);

        if (data.dataType === 'em')  {
            dsFs.items.each(function (item) {
                if (item.getName) {
                    if (item.getName() === 'topic') {
                        item.on('change', function () {
                            this.serviceEdited = true;
                        }, this);
                    } else {
                        item.disable();
                    }
                } else {
                    item.disable();
                }
            }, this);
            vizSetupData = null;
        }

        this.setupVizForm(vizSetupData, Ext.bind(function (meta) {
            this.items.getAt(0).setActiveTab(this.vizFormPanel);
            this.generalInfoFormPanel.getForm().setValues({
                name: meta.name,
                description: meta.description,
                category: meta.category,
                tags: meta.tags,
                trust: meta.ext ? (meta.ext.trust || 1) : 1
            });

            this.repElemStore.loadData([
                [meta.recordBreak, meta.recordBreak]
            ]);
            this.repElemCombo.setValue(meta.recordBreak);

            for (var curr, col, y = 0, ylen = meta.response.length; y < ylen; y++) {
                curr = meta.response[y];
                col = this.widgetColumnStore.getAt(this.widgetColumnStore.findExact('name', curr.name));
                if (col) {
                    col.set('header', curr.header);
                    col.set('annotations', curr.annotations);
                    col.set('defaultValue', curr.defaultValue);
                    col.set('ignore', curr.ignore);
                    col.set('exclude', false);
                    col.commit();
                } else {
                    this.widgetColumnStore.add([
                        {
                            name: curr.name,
                            header: curr.header,
                            sampleValue: curr.defaultValue,
                            defaultValue: curr.defaultValue,
                            ignore: curr.ignore,
                            annotations: curr.annotations
                        }
                    ], true);
                }
            }

            var tmp = {};
            for (var viz in meta.viz) {
                if (meta.viz.hasOwnProperty(viz)) {
                    this.vizFormPanel.getComponent(viz + 'Config').toggle();
                    for (var opt in meta.viz[viz]) {
                        if (meta.viz[viz].hasOwnProperty(opt)) {
                            tmp[viz + '.' + opt] = meta.viz[viz][opt];
                        }
                    }
                }
            }
            this.vizFormPanel.getForm().setValues(tmp);
            this.vizFormPanel.getComponent(meta.type + 'Config').items.getAt(0).setValue(true);
            this.ownerCt.ownerCt.body.unmask();
        }, this, [meta], 0));
    },

    saveDataSource: function (md, cb) {
        this.getEl().mask('Saving, please wait...');
        o2e.connectorMgr.query({
            componentId: 'console',
            connectionType: 'metadata',
            serviceId: 'SYSTEM_service_save',
            params: md,
            success: cb ? cb : function (k, m) {
                this.sid = m._id;
                this.append = m.append;
                this.setupVizForm(m);
            },
            failure: this._onError,
            scope: this
        });
    },

    _onError: function () {
        Ext.Msg.alert('Error', 'An error occurred. Please contact your administrator.');
        this.ownerCt.getEl().unmask();
    },

    setupVizForm: function (sid, cb) {
        if (sid === null) {
            if (cb && typeof cb === 'function') cb();
            this.getEl().unmask();
            this.generalInfoFormPanel.enable();
            this.vizFormPanel.enable();
            return;
        } else if (!!sid.schema) {
            // Messaging
            var resp, repElems = [], parser = new JKL.ParseXML(), xmlDoc, parseSuccess = true;
            if (Ext.isIE) {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = "false";
                parseSuccess = xmlDoc.loadXML(sid.schema);
            } else {
                xmlDoc = new DOMParser().parseFromString(sid.schema, "text/xml");
                if (xmlDoc.getElementsByTagName('parsererror').length) {
                    parseSuccess = false;
                }
            }
            if (parseSuccess) {
                resp = parser.parseDocument(xmlDoc.documentElement);

                for (var el in resp) {
                    if (resp.hasOwnProperty(el)) {
                        repElems = repElems.concat(this.getRepElemOptions(el, resp[el], ""));
                    }
                }

                this.repElemStore.loadData(repElems);
                this.repElemCombo.responseObj = resp;
                if (cb && typeof cb === 'function') {
                    cb();
                }
            } else {
                Ext.Msg.alert('Error', 'Error parsing sample message. Please try again.');
                this.getEl().unmask();
                return;
            }
        } else {
            o2e.connectorMgr.query({
                componentId: 'console',
                serviceId: 'SYSTEM_data_getSynch',
                serviceKey: 'AdminConsole|getSynch|setupVizForm',
                params: sid,
                success: function (serviceKey, metadata) {
                    var response = metadata,
                        repElemOpts = [];

                    for (i in response) {
                        if (response.hasOwnProperty(i)) {
                            repElemOpts = repElemOpts.concat(this.getRepElemOptions(i, response[i], ""));
                        }
                    }

                    this.repElemStore.loadData(repElemOpts);
                    this.repElemCombo.responseObj = response;
                    if (cb && typeof cb === 'function') {
                        cb();
                    }
                },
                failure: this._onError,
                scope: this
            });
        }

        this.getEl().unmask();
        this.generalInfoFormPanel.enable();
        this.vizFormPanel.enable();
        this.items.getAt(0).setActiveTab(this.generalInfoFormPanel);
    },

    getRepElemOptions: function (fieldName, field, path) {
        var rb, opts, i;

        if (Ext.isArray(field) && path.length > 0) {
            rb = path + '.' + fieldName;
            opts = [
                [rb, rb]
            ];
            if (field.length) {
                for (i in field[0]) {
                    if (field[0].hasOwnProperty(i)) {
                        opts = opts.concat(this.getRepElemOptions(i, field[0][i], rb));
                    }
                }
            }
            return opts;
        } else if (typeof(field) == "object") {
            rb = fieldName;
            if (path.length > 0) {
                rb = path + '.' + rb;
            }
            opts = [
                [rb, rb]
            ];
            for (i in field) {
                if (field.hasOwnProperty(i)) {
                    opts = opts.concat(this.getRepElemOptions(i, field[i], rb));
                }
            }
            return opts;
        } else {
            return [];
        }
    },

    getResponse: function (response) {
        var x, xlen, maxRecords = 10, // TODO: user definable max records
            steps = this.repElemCombo.getValue().split('.'),
            root = steps.shift(),
            recordBreak = steps.pop(),
            rootNode = response[root],
            records = this.processData({}, rootNode, steps, recordBreak, 0);

        this.widgetColumnStore.removeAll();

        for (x = 0, xlen = Math.min(records.length, maxRecords); x < xlen; x++) {
            for (var i in records[x]) {
                if (records[x].hasOwnProperty(i)) {
                    if (this.widgetColumnStore.findExact('name', i) !== -1) {
                        // TODO: this can be problematic because it excludes fields at different levels that happen to have the same name - we can fix this!
                        return;
                    }

                    //Get field defaults and add to the store
                    this.widgetColumnStore.add([
                        {name: i, header: i, sampleValue: records[x][i], ignore: false, exclude: this.wid !== null }
                    ], true);
                }
            }
        }
    },

    processData: function (data, r, s, rb, i) {
        var recs = [], i, ilen, t;

        if (i === s.length) {
            if (Ext.isArray(r[rb])) {
                for (i = 0, ilen = r[rb].length; i < ilen; i++) {
                    t = Ext.clone(data);
                    Ext.apply(t, r[rb][i]);
                    recs.push(t);
                }
            } else {
                Ext.apply(data, r[rb]);
                recs.push(data);
            }
            return recs;
        }

        var step = s[i];

        if (Ext.isArray(r[step])) {
            for (var rec, tmp, x = 0, xlen = r[step].length; x < xlen; x++) {
                tmp = Ext.clone(data);
                for (var el in r[step][x]) {
                    if (r[step][x].hasOwnProperty(el) && typeof(r[step][x][el]) !== 'object' && !Ext.isArray(r[step][x][el])) {
                        tmp[step + '_' + el] = r[step][x][el];
                    }
                }
                recs = recs.concat(this.processData(tmp, r[step][x], s, rb, i + 1));
            }
        } else {
            for (var el in r[step]) {
                if (r[step].hasOwnProperty(el) && typeof(r[step][el]) !== 'object' && !Ext.isArray(r[step][el])) {
                    data[step + '_' + el] = r[step][el];
                }
            }
            recs = recs.concat(this.processData(data, r[step], s, rb, i + 1));
        }

        return recs;
    },

    persistWidgetMetadata: function () {
        var selModel = this.widgetColumnGridPanel.getSelectionModel();
        selModel.deselect(selModel.getLastSelected());

        // Base metadata first -- non configurable fields
        var meta = {
            clientConnector: 'comet',
            connectorAction: 'invoke',
            connectionType: 'data/shared/listen',
            append: this.append || false,
            request: [
                {
                    name: 'serviceSpecificationId',
                    header: 'Service Spec ID',
                    defaultValue: this.sid
                }
            ],
            response: [],
            refreshIntervalSeconds: 60
        };

        // General Info
        var genInfo = this.generalInfoFormPanel.getForm().getFieldValues();
        Ext.apply(meta, {
            name: genInfo.name,
            description: genInfo.description,
            category: genInfo.category,
            tags: genInfo.tags,
            ext: { inputs: this.inputs || null }
        });

        // Viz info
        // TODO: actions
        var vizMeta = this.vizFormPanel.getForm().getFieldValues(),
            wTypes = this.ownerCt.ownerCt.widgetInfo, w, i, ilen;

        meta.type = vizMeta.defaultWidgetType;
        meta.viz = {};

        this.updateAnnotations(vizMeta['general.classification'], 'classification');
        this.updateAnnotations(vizMeta['general.classificationCaveat'], 'classificationCaveat');
        this.updateAnnotations(vizMeta['general.embeddedClassification'], 'embeddedClassification');

        for (w in wTypes) {
            if (wTypes.hasOwnProperty(w)) {
                if (this.vizFormPanel.getComponent(w + 'Config').collapsed === false) {
                    meta.viz[w] = {};
//                    for (i=0,ilen=wTypes[w].required.length; i<ilen; i++) {
//                        this.updateAnnotations(vizMeta[w+'.'+wTypes[w].required[i]], wTypes[w].required[i]);
//                    }
//                    for (i=0,ilen=wTypes[w].optional.length; i<ilen; i++) {
//                        this.updateAnnotations(vizMeta[w+'.'+wTypes[w].optional[i]], wTypes[w].optional[i]);
//                    }
                    for (i in wTypes[w].metaFields) {
                        if (wTypes[w].metaFields.hasOwnProperty(i)) {
                            meta.viz[w][i] = vizMeta[w + '.' + i];
                        }
                    }
                }
            }
        }

        // Response info
        meta.recordBreak = this.repElemCombo.getValue();
        var responseFields = this.widgetColumnStore.getRange();
        for (var x = 0, xlen = responseFields.length; x < xlen; x++) {
            var data = responseFields[x].data;
            if (!data.exclude) {
                meta.response.push({
                    name: data.name,
                    header: data.header,
                    defaultValue: data.defaultValue,
                    annotations: data.annotations,
                    ignore: data.ignore
                });
            }
        }

        if (this.wid) {
            var updateFn = function () {
                meta._id = meta.id = this.wid;
                meta.creator = this.currentMetadata.creator;
                meta.createdTime = this.currentMetadata.createdTime;
                meta.request.push({
                    name: 'widgetMetadataId',
                    header: 'Widget Metadata ID',
                    defaultValue: this.wid
                });
                o2e.serviceRegistry.update(this.wid, meta, function (d) {
                    this.ownerCt.ownerCt.close();
                    o2e.env.notifyMgr.send('service', {action: 'update', metadata: d});
                }, this);
            };
            if (this.serviceEdited === true) {
                o2e.log.debug('Detected service info has been edited. Updating service ' + this.sid);
                var serviceValues = this.serviceFormPanel.getForm().getFieldValues();
                if (serviceValues.dataType === 'presto') {
                    var inputGrid = this.serviceFormPanel.getComponent('prestoServiceFieldSet').getComponent('inputs'), inputs;
                    this.currentServiceSpec.refreshIntervalSeconds = Number(serviceValues.refreshIntervalSeconds) || 60;
                    meta.append = this.currentServiceSpec.append = serviceValues.append || false;
                    this.currentServiceSpec.assertUser = serviceValues.assertUser || false;
                    this.currentServiceSpec.shared = !this.currentServiceSpec.assertUser;
                    meta.connectionType = this.currentServiceSpec.assertUser ? 'data/private/listen' : 'data/shared/listen';

                    if (!!inputGrid) {
                        this.currentServiceSpec.paramMap = {};
                        meta.ext.inputs = {};
                        inputs = inputGrid.getStore().getRange();
                        for (var x = 0, xlen = inputs.length; x < xlen; x++) {
                            this.currentServiceSpec.paramMap[inputs[x].get('name')] = inputs[x].get('defaultValue');
                            meta.ext.inputs[inputs[x].get('name')] = inputs[x].data;
                        }
                    }
                } else {
                    this.currentServiceSpec.topic = serviceValues.topic;
                }
                this.saveDataSource(this.currentServiceSpec, updateFn);
            } else {
                updateFn.call(this);
            }
        } else {
            o2e.serviceRegistry.insert(null, meta, function (metadata) {
                this.wid = metadata._id;
                metadata.request.push({
                    name: 'widgetMetadataId',
                    header: 'Widget Metadata ID',
                    defaultValue: this.wid
                });
                o2e.serviceRegistry.update(metadata._id, metadata, function (d) {
                    this.ownerCt.ownerCt.close();
                    o2e.env.notifyMgr.send('service', {action: 'add', metadata: d});
                }, this);
            }, this);
        }
    },

    updateAnnotations: function (column, annotation) {
        var annotations, currRecord = this.widgetColumnStore.findRecord('name', column);
        if (currRecord !== null) {
            annotations = currRecord.get('annotations');
            if (annotations != '') {
                annotations = annotations + ', ' + annotation;
            } else {
                annotations = annotation;
            }
            currRecord.set('annotations', annotations);
        }
    }
});