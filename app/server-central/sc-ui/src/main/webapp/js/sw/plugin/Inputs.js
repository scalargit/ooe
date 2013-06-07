Ext.define('sw.plugins.Inputs', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'inputs',

    iconCls: 'icon-filter',
    defaultItemClass: 'Ext.menu.Item',
    disabled: true,
    text: 'Manage Inputs',

    paramValues: null,
    inputMap: null,
    eventAction: null,

    init: function() {
        this.paramValues = this.paramValues || {};
        this.inputMap = [];
        this.widget.on('serviceadd', this.onServiceAdd, this);
        this.widget.on('serviceremove', this.onServiceRemove, this);
    },

    registerEventAction: function(serviceKey, inputs) {
        if (this.eventAction === null) {
            this.eventAction = {
                name: 'Change input value',
                callback: function() {
                    this.widget.widgetCt.getEl().mask('Loading, please wait...');

                    var x=0, xlen=arguments.length, inputToUpdate, serviceKey, serviceKeysToUpdate = {};
                    for (;x<xlen;x++) {
                        if (arguments[x] && arguments[x] !== '') {
                            inputToUpdate = this.inputMap[x];
                            serviceKey = inputToUpdate.serviceKey;
                            if (!serviceKeysToUpdate[serviceKey]) {
                                serviceKeysToUpdate[serviceKey] = {};
                            }
                            serviceKeysToUpdate[serviceKey][inputToUpdate.input] = arguments[x];
                        }
                    }

                    for (serviceKey in serviceKeysToUpdate) {
                        if (serviceKeysToUpdate.hasOwnProperty(serviceKey)) {
                            this.currentServiceKey = serviceKey;
                            this.paramValues[serviceKey] = this.paramValues[serviceKey] || this.widget.services[serviceKey].metadata.ext.inputs;

                            o2e.connectorMgr.query({
                                componentId: 'console',
                                serviceId: 'SYSTEM_service_get',
                                serviceKey: 'AdminConsole|getServiceSpec',
                                params: { id: this.widget.services[serviceKey].params.serviceSpecificationId },
                                success: Ext.bind(this.setServiceParams, this, [this.widget.widgetCt, serviceKeysToUpdate[serviceKey]], 0),
                                failure: this._onError,
                                scope: this
                            });
                        }
                    }
                },
                scope: this,
                args: []
            };
            this.widget.addAvailableEventAction(this.eventAction);
        }
        this.applyInputsToAction(serviceKey, inputs);
    },

    applyInputsToAction: function(serviceKey, inputs) {
        var i, input;
        for (i in inputs) {
            if (inputs.hasOwnProperty(i)) {
                input = inputs[i];
                this.eventAction.args.push(this.widget.services[serviceKey].metadata.name + '|' + (input.header !== '' ? input.header : input.name));
                this.inputMap.push({ serviceKey: serviceKey, input: i });
            }
        }
    },

    unregisterEventAction: function() {
        delete this.widget.availableEventActions[this.eventAction.name];
        this.eventAction = null;
    },

    onServiceAdd: function(widgetId, serviceKey) {
        var service = this.widget.services[serviceKey];
        if (service.metadata.ext && !!service.metadata.ext.inputs) {
            this.itemRef.menu.add(Ext.create('Ext.menu.Item', {
                text: service.metadata.name,
                itemId: 'Inputs_'+service.metadata.name,
                serviceKey: serviceKey,
                listeners: {
                    click: this.handleMenuItemClick,
                    scope: this
                }
            }));
            this.itemRef.enable();
            this.registerEventAction(serviceKey, service.metadata.ext.inputs);
        }
    },

    onServiceRemove: function(widgetId, serviceKey) {
        this.itemRef.menu.items.each(function(item) {
            if (item.serviceKey === serviceKey) {
                this.itemRef.menu.remove(item);
            }
        }, this);
        if (this.itemRef.menu.items.getCount() === 0) {
            this.itemRef.disable();
            this.unregisterEventAction();
        }
    },

    createItem: function(itemClass) {
        var menuItems = [], serviceKey, service;

        for (serviceKey in this.widget.services) {
            if (this.widget.services.hasOwnProperty(serviceKey)) {
                service = this.widget.services[serviceKey];
                if (service.metadata.ext && !!service.metadata.ext.inputs) {
                    this.disabled = false;
                    // create the menu item config
                    menuItems.push({
                        text: service.metadata.name,
                        itemId: 'Input_'+service.metadata.name,
                        serviceKey: serviceKey,
                        listeners: {
                            click: this.handleMenuItemClick,
                            scope: this
                        }
                    });
                    this.registerEventAction(serviceKey, service.metadata.ext.inputs);
                }
            }
        }

        this.itemRef = Ext.create(itemClass || this.defaultItemClass, {
            iconCls: this.iconCls,
            text: this.text,
            itemId: this.pluginId,
            disabled: this.disabled,
            menu: menuItems
        });

        return this.itemRef;
    },

    getPanel: function(item) {
        this.currentServiceKey = item.serviceKey;
        var input, inputs = this.paramValues[this.currentServiceKey] || this.widget.services[this.currentServiceKey].metadata.ext.inputs, fields = [];
        this.paramValues[this.currentServiceKey] = inputs;

        for (input in inputs) {
            if (inputs.hasOwnProperty(input)) {
                fields.push({
                    xtype: 'textfield',
                    name: input,
                    fieldLabel: inputs[input].header !== '' ? inputs[input].header : inputs[input].name,
                    value: inputs[input].defaultValue
                });
            }
        }

        return Ext.create('Ext.form.Panel', {
            itemId: item.itemId,
            border: 0,
            bodyPadding: 10,
            monitorValid: true,
            autoScroll: true,
            defaults: {
                anchor: '100%'
            },
            items: fields,
            bbar: ['->',{
                iconCls: 'icon-filter',
                text: 'Apply Changes',
                handler: this.applyChanges,
                scope: this
            }]
        });
    },

    applyChanges: function(btn) {
        var panel = btn.ownerCt.ownerCt,
            inputs = panel.getForm().getFieldValues();

        panel.getEl().mask('Please wait...');

        o2e.connectorMgr.query({
            componentId: 'console',
            serviceId: 'SYSTEM_service_get',
            serviceKey: 'AdminConsole|getServiceSpec',
            params: { id: this.widget.services[this.currentServiceKey].params.serviceSpecificationId },
            success: Ext.bind(this.setServiceParams, this, [panel, inputs], 0),
            failure: this._onError,
            scope: this
        });
    },

    setServiceParams: function(panel, newInputs, sKey, spec) {
        spec.paramMap = newInputs;
        delete spec.id;
        delete spec._id;

        o2e.connectorMgr.query({
            componentId: 'console',
            connectionType: 'metadata',
            serviceId: 'SYSTEM_service_save',
            params: spec,
            failure: this._onError,
            success: function(sk, meta) {
                var newParams = Ext.clone(this.widget.services[this.currentServiceKey].params);
                newParams.serviceSpecificationId = meta._id;
                var newServiceKey = this.widget.changeInputs(this.currentServiceKey, newParams);
                this.paramValues[newServiceKey] = this.paramValues[this.currentServiceKey];
                delete this.paramValues[this.currentServiceKey];

                for (var input in this.paramValues[newServiceKey]) {
                    if (this.paramValues[newServiceKey].hasOwnProperty(input)){
                        this.paramValues[newServiceKey][input].defaultValue = newInputs[input];
                    }
                }
                for (var x=0,xlen=this.inputMap.length;x<xlen;x++) {
                    if (this.inputMap[x].serviceKey === this.currentServiceKey) {
                        this.inputMap[x].serviceKey = newServiceKey;
                    }
                }

                this.currentServiceKey = newServiceKey;

                panel.getEl().unmask();
            },
            scope: this
        });
    },

    getStateConfig: function() {
        return Ext.apply({
            paramValues: this.paramValues
        }, this.callParent());
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});