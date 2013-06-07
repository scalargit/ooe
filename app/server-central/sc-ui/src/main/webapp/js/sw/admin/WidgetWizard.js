Ext.define('sw.admin.WidgetWizard', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.sw-widgetwizard',

    dataSources: [
        { name: 'Flow Data Sensor', value: 'flowdata' },
        { name: 'Presto Mashable', value: 'presto' },
        { name: 'REST/RSS Feed', value: 'rest' },
        { name: 'URL (HTML)', value: 'url'},
        { name: 'Messaging Topic', value: 'em'}
    ],

    trustLevels: [
        { name: 'Gold', value: 3 },
        { name: 'Silver', value: 2 },
        { name: 'Bronze', value: 1 }
    ],

    attrTest: /\.content$/,
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
                        },
                        {
                            xtype: 'combobox',
                            itemId: 'trustLevelCombo',
                            fieldLabel: 'Trust Level',
                            name: 'trust',
                            store: Ext.create('Ext.data.Store', { fields: ['name', 'value'], data: this.trustLevels }),
                            queryMode: 'local',
                            displayField: 'name',
                            valueField: 'value',
                            value: 1
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
            sType = recs[0].get('value'),
            pf = this.serviceFormPanel.getComponent('prestoServiceFieldSet');
        f.removeAll();
        if (pf) {
            this.serviceFormPanel.remove(pf);
        }

        if (sType === 'presto') {
            f.add([
                {
                    fieldLabel: 'Presto URL',
                    name: 'prestoHostname',
                    allowBlank: false,
                    value: o2e.env.prestoHost
                },
                {
                    fieldLabel: 'Presto Port',
                    name: 'prestoPort',
                    allowBlank: false,
                    value: o2e.env.prestoPort
                },
                {
                    xtype: 'button',
                    text: 'Use this Presto Instance',
                    handler: function (btn) {
                        var prestoServiceFieldSet = this.serviceFormPanel.getComponent('prestoServiceFieldSet'),
                            prestoServer = this.serviceFormPanel.getForm().getValues();
                        if (prestoServiceFieldSet) {
                            prestoServiceFieldSet.removeAll();
                        } else {
                            this.serviceFormPanel.add({
                                xtype: 'fieldset',
                                itemId: 'prestoServiceFieldSet',
                                title: 'Presto Service Info',
                                collapsible: false,
                                defaultType: 'textfield',
                                defaults: {anchor: '100%'},
                                layout: 'anchor',
                                items: []
                            });
                        }

                        this.ownerCt.getEl().mask('Communicating with Presto, please wait...');
                        o2e.connectorMgr.query({
                            componentId: 'console',
                            serviceId: 'SYSTEM_data_getSynch',
                            serviceKey: 'AdminConsole|getSynch|MetaRepositoryService|getListOfAllServicesGists',
                            params: {
                                name: 'synchtest',
                                prestoHostname: prestoServer.prestoHostname,
                                prestoPort: Number(prestoServer.prestoPort) || o2e.env.prestoPort,
                                refreshIntervalSeconds: 300,
                                prestoSid: 'MetaRepositoryService',
                                prestoOid: 'getListOfAllServicesGists',
                                append: false,
                                version: '1.1',
                                svcVersion: '0.1',
                                paramMap: null,
                                paramList: null,
                                isSecure: o2e.env.prestoSecure,
                                dataType: 'presto'
                            },
                            success: this.handlePrestoServiceList,
                            failure: this._onError,
                            scope: this
                        });
                    },
                    scope: this
                }
            ]);
        } else if (sType === 'em') {
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
        } else if (sType === 'flowdata') {
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
                    fieldLabel: 'Refresh rate (s):',
                    name: 'refreshInterval',
                    allowBlank: false,
                    value: '1'
                },
                {
                    xtype: 'button',
                    text: 'Save Flow Data Source',
                    handler: function () {
                        var vals = this.serviceFormPanel.getForm().getValues(),
                            targets = vals.targets.split(','),
                            x=0, xlen=targets.length, resp = [],
                            meta = Ext.apply({
                                clientConnector: 'flowdata',
                                connectorAction: 'invoke',
                                connectionType: 'flowdata',
                                recordBreak: 'flow.data',
                                append: false,
                                request: [
                                    {
                                        name: 'targets',
                                        header: 'Targets',
                                        defaultValue: vals.targets
                                    }
                                ],
                                response: [
                                    {
                                        name: 'time',
                                        header: 'Time',
                                        defaultValue: '',
                                        annotations: ['uid', 'line_x_axis', 'area_x_axis'],
                                        ignore: false
                                    }
                                ],
                                type: 'line',
                                refreshIntervalSeconds: vals.refreshInterval,
                                viz: {
                                    grid: {}, line: {
                                        xLabel: 'Time',
                                        yLabel: 'Total',
                                        markerStyle: 'circle',
                                        markerSize: '4',
                                        markerRadius: '4',
                                        markerStrokeWidth: '0'
                                    }, area: {
                                        xLabel: 'Time',
                                        yLabel: 'Total',
                                        showSeriesLabel: false
                                    }
                                },
                                ext: vals
                            }, vals);

                        for (;x<xlen;x++) {
                            meta.response.push({
                                name: Ext.String.trim(targets[x]),
                                header: Ext.String.trim(targets[x]),
                                defaultValue: '',
                                annotations: ['line_y_axis', 'area_y_axis'],
                                ignore: false
                            });
                        }

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
        } else if (sType === 'rest') {
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
                    text: 'Save Data Source',
                    handler: function () {
                        this.ownerCt.getEl().mask('Registering URL, please wait...');
                        var meta = this.serviceFormPanel.getForm().getValues();

                        o2e.connectorMgr.query({
                            componentId: 'console',
                            serviceId: 'SYSTEM_data_getSynch',
                            serviceKey: 'AdminConsole|getSynch|RDSService|registerRESTService',
                            params: {
                                name: 'registerRESTService',
                                prestoHostname: o2e.env.prestoHost,
                                prestoPort: o2e.env.prestoPort,
                                refreshIntervalSeconds: 300,
                                prestoSid: 'RDSService',
                                prestoOid: 'registerRESTService',
                                append: false,
                                version: '1.1',
                                svcVersion: '1',
                                paramMap: {
                                    svcRegInfo: {
                                        name: meta.name,
                                        description: meta.description,
                                        tags: meta.tags.split(','),
                                        providerName: 'NONE',
                                        categories: [],
                                        republish: false,
                                        registerUsingAuthProtocol: false,
                                        authProtocol: '',
                                        authParams: { map: {} }
                                    },
                                    restUrl: meta.url,
                                    opName: '',
                                    outputSample: ''
                                },
                                paramList: null,
                                isSecure: o2e.env.prestoSecure,
                                dataType: 'presto'
                            },
                            success: function (serviceKey, response) {
                                this.ownerCt.getEl().unmask();
                                if (response.error != null && response.error.code === 500) {
                                    Ext.Msg.alert('Error', 'An error occurred. ' + response.error.details);
                                } else if (response.response.hasOwnProperty('id')) {
                                    this.ownerCt.getEl().mask('Activating URL, please wait...');
                                    o2e.connectorMgr.query({
                                        componentId: 'console',
                                        serviceId: 'SYSTEM_data_getSynch',
                                        serviceKey: 'AdminConsole|getSynch|RDSService|activateService',
                                        params: {
                                            name: 'activateService',
                                            prestoHostname: o2e.env.prestoHost,
                                            prestoPort: o2e.env.prestoPort,
                                            refreshIntervalSeconds: 300,
                                            prestoSid: 'RDSService',
                                            prestoOid: 'activateService',
                                            append: false,
                                            version: '1.1',
                                            svcVersion: '1',
                                            paramMap: null,
                                            paramList: [response.response.id],
                                            isSecure: o2e.env.prestoSecure,
                                            dataType: 'presto'
                                        },
                                        success: function (sKey, resp) {
                                            this.ownerCt.getEl().unmask();
                                            if (resp.error != null && resp.error.code === 500) {
                                                Ext.Msg.alert('Error', 'An error occurred. ' + resp.error.details);
                                            } else {
                                                this.ownerCt.getEl().mask('Setting Permissions on URL, please wait...');
                                                o2e.connectorMgr.query({
                                                    componentId: 'console',
                                                    serviceId: 'SYSTEM_data_getSynch',
                                                    serviceKey: 'AdminConsole|getSynch|PolicyService|setPrincipalsAllowedToExecuteService',
                                                    params: {
                                                        name: 'setPrincipalsAllowedToExecuteService',
                                                        prestoHostname: o2e.env.prestoHost,
                                                        prestoPort: o2e.env.prestoPort,
                                                        refreshIntervalSeconds: 300,
                                                        prestoSid: 'PolicyService',
                                                        prestoOid: 'setPrincipalsAllowedToExecuteService',
                                                        append: false,
                                                        version: '1.1',
                                                        svcVersion: '1',
                                                        paramMap: {
                                                            principals: [
                                                                {
                                                                    principalId: 'Presto_Guest',
                                                                    principalTypeId: 'SpecialGroup'
                                                                }
                                                            ],
                                                            serviceId: response.response.id
                                                        },
                                                        paramList: null,
                                                        isSecure: o2e.env.prestoSecure,
                                                        dataType: 'presto'
                                                    },
                                                    success: function (sk, r) {
                                                        if (r.error != null && r.error.code === 500) {
                                                            this.ownerCt.getEl().unmask();
                                                            Ext.Msg.alert('Error', 'An error occurred. ' + r.error.details);
                                                        } else {
                                                            this.prestoServiceOverride = {
                                                                sid: response.response.id,
                                                                oid: response.response.operations[0].id
                                                            };

                                                            var dsCombo = this.serviceFormPanel.getComponent('dsCombo'),
                                                                dsComboStore = dsCombo.store,
                                                                dsRecord = dsComboStore.getAt(dsComboStore.findExact('value', 'presto'));
                                                            dsCombo.select(dsRecord);
                                                            dsCombo.fireEvent('select', dsCombo, [dsRecord]);

                                                            var dsfs = this.serviceFormPanel.getComponent('dsFieldSet'),
                                                                dsBtn = dsfs.items.getAt(2);
                                                            dsBtn.fireHandler(null);
                                                        }
                                                    },
                                                    failure: this._onError,
                                                    scope: this
                                                });
                                            }
                                        },
                                        failure: this._onError,
                                        scope: this
                                    });
                                } else {
                                    Ext.Msg.alert('Error', 'An error occurred. ');
                                }
                            },
                            failure: this._onError,
                            scope: this
                        });
                    },
                    scope: this
                }
            ]);
        }
    },

    handlePrestoServiceList: function (serviceKey, data, fr) {
        Ext.define('prestoServiceGist', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'name', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'uid', type: 'string', mapping: 'id.uid' }
            ],
            idProperty: 'uid'
        });

        var c = this.serviceFormPanel.getComponent('prestoServiceFieldSet').add({
            xtype: 'combo',
            fieldLabel: 'Presto Service ID',
            name: 'prestoSid',
            store: Ext.create('Ext.data.Store', { model: 'prestoServiceGist', sorters: [
                {property: 'name', direction: 'ASC'}
            ], data: data.response }),
            queryMode: 'local',
            displayField: 'name',
            valueField: 'id',
            typeAhead: true,
            lazyRender: true,
            listeners: {
                select: {
                    fn: function (combo, records) {
                        var prestoServer = this.serviceFormPanel.getForm().getFieldValues(),
                            fs = this.serviceFormPanel.getComponent('prestoServiceFieldSet');
                        while (!!fs.items.getAt(1)) {
                            fs.remove(fs.items.getAt(1));
                        }
                        this.ownerCt.getEl().mask('Retrieving information, please wait...');
                        Ext.Function.defer(o2e.connectorMgr.query, 250, o2e.connectorMgr, [
                            {
                                componentId: 'console',
                                serviceId: 'SYSTEM_data_getSynch',
                                serviceKey: 'AdminConsole|getSynch|MetaRepositoryService|getServiceNSD',
                                params: {
                                    name: 'synchtest',
                                    prestoHostname: prestoServer.prestoHostname,
                                    prestoPort: Number(prestoServer.prestoPort) || o2e.env.prestoPort,
                                    refreshIntervalSeconds: 300,
                                    prestoSid: 'MetaRepositoryService',
                                    prestoOid: 'getServiceNSD',
                                    append: false,
                                    version: '1.1',
                                    svcVersion: '0.1',
                                    paramMap: null,
                                    paramList: [combo.getValue().uid],
                                    isSecure: o2e.env.prestoSecure,
                                    dataType: 'presto'
                                },
                                success: this.handlePrestoServiceInfo,
                                failure: this._onError,
                                scope: this
                            }
                        ]);
                    },
                    scope: this
                }
            }
        });
        this.ownerCt.getEl().unmask();
        if (this.prestoServiceOverride) {
            var match = c.store.getAt(c.store.findBy(function (rec) {
                if (rec.data.id.uid === this.prestoServiceOverride.sid) {
                    return true;
                }
            }, this));
            c.select(match);
            c.fireEvent('select', c, [match]);
        }
    },

    handlePrestoServiceInfo: function (serviceKey, data, fr) {
        var fs = this.serviceFormPanel.getComponent('prestoServiceFieldSet');

        var c = fs.add({
            xtype: 'combo',
            fieldLabel: 'Presto Operation ID',
            itemId: 'prestoOid',
            name: 'prestoOid',
            store: Ext.create('Ext.data.Store', { fields: ['id', 'name', 'inputMessage'], data: data.response.operations }),
            queryMode: 'local',
            displayField: 'name',
            valueField: 'id',
            typeAhead: true,
            lazyRender: true,
            listeners: {
                select: {
                    fn: function (combo, records) {
                        var inputs = records[0].get('inputMessage').inputs;

                        fs.add([
                            {
                                fieldLabel: 'Refresh Interval (seconds)',
                                name: 'refreshIntervalSeconds',
                                allowBlank: false,
                                value: '60'
                            },
                            {
                                xtype: 'checkboxfield',
                                fieldLabel: 'Append data',
                                name: 'append'
                            },
                            {
                                fieldLabel: 'Requires User Authorization',
                                name: 'assertUser',
                                xtype: 'checkboxfield'
                            }
                        ]);

                        if (inputs.length) {
                            fs.add(Ext.create('Ext.grid.Panel', {
                                itemId: 'inputs',
                                store: Ext.create('Ext.data.Store', { fields: ['name', 'header', 'defaultValue', 'type', 'annotations'], data: inputs}),
                                columns: [
                                    { header: 'Name', dataIndex: 'name', flex: 1, editor: false },
                                    { header: 'Type', dataIndex: 'type', flex: 1, editor: false },
                                    { header: 'Header (*)', dataIndex: 'header', flex: 1, editor: { allowBlank: false } },
                                    { header: 'Value (*)', dataIndex: 'defaultValue', flex: 1, editor: 'textfield' },
                                    { header: 'Annotations (*)', dataIndex: 'annotations', flex: 1, editor: 'textfield' }
                                ],
                                selModel: { selType: 'cellmodel' },
                                title: 'Manage Inputs - Click to edit (*)',
                                frame: true,
                                margin: '5 0',
                                plugins: [ Ext.create('Ext.grid.plugin.CellEditing', { clicksToEdit: 1 }) ],
                                viewConfig: { emptyText: 'No inputs available' }
                            }));
                        }

                        var b = fs.add({
                            xtype: 'button',
                            text: 'Save Presto Data Source',
                            handler: function () {
                                var md = Ext.apply({
                                        isSecure: o2e.env.prestoSecure,
                                        version: '1.1',
                                        svcVersion: '0.1',
                                        paramMap: null,
                                        paramList: null
                                    }, this.serviceFormPanel.getForm().getValues()),
                                    inputGrid = fs.getComponent('inputs'), inputs;

                                this.generalInfoFormPanel.getForm().setValues({
                                    name: data.response.name,
                                    description: data.response.description,
                                    tags: data.response.tags.toString()
                                });

                                md.refreshIntervalSeconds = Number(md.refreshIntervalSeconds) || 60;
                                md.prestoSid = md.prestoSid.uid;
                                if (!md.name) {
                                    md.name = md.prestoSid;
                                }
                                if (md.assertUser === true) {
                                    md.shared = false;
                                }

                                if (!!inputGrid) {
                                    md.paramMap = {};
                                    this.inputs = {};
                                    inputs = inputGrid.getStore().getRange();
                                    for (var x = 0, xlen = inputs.length; x < xlen; x++) {
                                        md.paramMap[inputs[x].get('name')] = inputs[x].get('defaultValue');
                                        this.inputs[inputs[x].get('name')] = inputs[x].data;
                                    }
                                } else {
                                    this.inputs = null;
                                }
                                this.saveDataSource(md);
                            },
                            scope: this
                        });

                        if (this.prestoServiceOverride) {
                            b.fireHandler(null);
                        }
                    },
                    scope: this
                }
            }
        });

        this.ownerCt.getEl().unmask();

        if (this.prestoServiceOverride) {
            var match = c.store.getAt(0);
            c.select(match);
            c.fireEvent('select', c, [match]);
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
        } else if (meta.clientConnector === 'flowdata') {
            var combo = this.serviceFormPanel.getComponent('dsCombo'),
                comboRec = combo.getStore().getAt(combo.getStore().findExact('value', 'flowdata'));
            combo.setValue('flowdata'); // URL (HTML)

            this.setupDataSourceFieldset(combo, [comboRec]);
            this.serviceFormPanel.getForm().setValues(meta.ext);
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
            dsFs = this.serviceFormPanel.getComponent('dsFieldSet');
        this.currentServiceSpec = data;
        this.assertUser = data.assertUser || false;
        dsCombo.setValue(data.dataType);
        this.setupDataSourceFieldset(dsCombo, [dsStore.getAt(dsStore.findExact('value', data.dataType))]);

        if (data.dataType === 'presto') {
            this.serviceFormPanel.getForm().setValues(data);
            dsFs.items.each(function (item) {
                item.disable();
            });
            var fs = this.serviceFormPanel.add({
                xtype: 'fieldset',
                itemId: 'prestoServiceFieldSet',
                title: 'Presto Service Info',
                collapsible: false,
                defaultType: 'textfield',
                defaults: {anchor: '100%'},
                layout: 'anchor',
                items: [
                    {
                        fieldLabel: 'Presto Service ID',
                        value: data.prestoSid,
                        disabled: true
                    },
                    {
                        fieldLabel: 'Presto Operation ID',
                        value: data.prestoOid,
                        disabled: true
                    },
                    {
                        fieldLabel: 'Refresh Interval',
                        name: 'refreshIntervalSeconds',
                        value: data.refreshIntervalSeconds,
                        listeners: { change: { fn: function () {
                            this.serviceEdited = true;
                        }, scope: this }}
                    },
                    {
                        fieldLabel: 'Append data',
                        name: 'append',
                        xtype: 'checkboxfield',
                        checked: data.append,
                        listeners: { change: { fn: function () {
                            this.serviceEdited = true;
                        }, scope: this }}
                    },
                    {
                        fieldLabel: 'Requires User Authorization',
                        name: 'assertUser',
                        xtype: 'checkboxfield',
                        checked: data.assertUser,
                        listeners: { change: { fn: function () {
                            this.serviceEdited = true;
                        }, scope: this }}
                    }
                ]
            });
            if (meta.ext && meta.ext.inputs) {
                this.inputs = meta.ext.inputs;
                var inputs = [];
                for (var input in meta.ext.inputs) {
                    if (meta.ext.inputs.hasOwnProperty(input)) {
                        inputs.push(meta.ext.inputs[input]);
                    }
                }
                fs.add(Ext.create('Ext.grid.Panel', {
                    itemId: 'inputs',
                    store: Ext.create('Ext.data.Store', { fields: ['name', 'header', 'defaultValue', 'type', 'annotations'], data: inputs}),
                    columns: [
                        { header: 'Name', dataIndex: 'name', flex: 1, editor: false },
                        { header: 'Type', dataIndex: 'type', flex: 1, editor: false },
                        { header: 'Header (*)', dataIndex: 'header', flex: 1, editor: { allowBlank: false } },
                        { header: 'Value (*)', dataIndex: 'defaultValue', flex: 1, editor: 'textfield' },
                        { header: 'Annotations (*)', dataIndex: 'annotations', flex: 1, editor: 'textfield' }
                    ],
                    selModel: { selType: 'cellmodel' },
                    title: 'Manage Inputs - Click to edit (*)',
                    frame: true,
                    margin: '5 0',
                    plugins: [ Ext.create('Ext.grid.plugin.CellEditing', { clicksToEdit: 1, listeners: { edit: {fn: function () {
                        this.serviceEdited = true;
                    }, scope: this }}}) ],
                    viewConfig: { emptyText: 'No inputs available' }
                }));
            }
        } else {
            this.serviceFormPanel.getForm().setValues(data);
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
        }

        this.setupVizForm(data.dataType === 'presto' ? data : null, Ext.bind(function (meta) {
            this.items.getAt(0).setActiveTab(this.vizFormPanel);
            this.generalInfoFormPanel.getForm().setValues({
                name: meta.name,
                description: meta.description,
                category: meta.category,
                tags: meta.tags,
                trust: meta.ext ? (meta.ext.trust || 1) : 1
            });

            if (data.dataType === 'presto') {
                this.repElemCombo.setValue(meta.recordBreak.substr(9));
                if (this.repElemCombo.getValue() !== null) {
                    this.getResponse(this.repElemCombo.responseObj);
                }
            } else {
                this.repElemStore.loadData([
                    [meta.recordBreak, meta.recordBreak]
                ]);
                this.repElemCombo.setValue(meta.recordBreak);
            }

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
                this.assertUser = m.assertUser || false;
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
                    var response = metadata.response,
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
            connectionType: this.assertUser === true ? 'data/private/listen' : 'data/shared/listen',
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
            ext: { trust: genInfo.trust, inputs: this.inputs || null }
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
        meta.recordBreak = this.serviceFormPanel.getForm().getValues().dataType === 'presto' ? 'response.' + this.repElemCombo.getValue() : this.repElemCombo.getValue();
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