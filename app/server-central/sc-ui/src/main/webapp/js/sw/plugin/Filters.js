Ext.define('sw.plugins.Filters', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'filters',

    iconCls: 'icon-filter',
    defaultItemClass: 'Ext.menu.Item',
    disabled: true,
    text: 'Manage Filters',

    init: function() {
        this.widget.on('serviceadd', this.onServiceAdd, this);
        this.widget.on('serviceremove', this.onServiceRemove, this);
    },

    onServiceAdd: function(widgetId, serviceKey) {
        var service = this.widget.services[serviceKey];
        this.itemRef.menu.add(Ext.create('Ext.menu.Item', {
            text: service.metadata.name,
            itemId: 'Filter_'+service.metadata.name,
            serviceKey: serviceKey,
            listeners: {
                click: this.handleMenuItemClick,
                scope: this
            }
        }));
        this.itemRef.enable();
    },

    onServiceRemove: function(widgetId, serviceKey) {
        this.itemRef.menu.items.each(function(item) {
            if (item.serviceKey === serviceKey) {
                this.itemRef.menu.remove(item);
            }
        }, this);
        if (this.itemRef.menu.items.getCount() === 0) {
            this.itemRef.disable();
        }
    },

    createItem: function(itemClass) {
        var menuItems = [], serviceKey, service;

        for (serviceKey in this.widget.services) {
            if (this.widget.services.hasOwnProperty(serviceKey)) {
                this.disabled = false;
                service = this.widget.services[serviceKey];

                // create the menu item config
                menuItems.push({
                    text: service.metadata.name,
                    itemId: 'Filter_'+service.metadata.name,
                    serviceKey: serviceKey,
                    listeners: {
                        click: this.handleMenuItemClick,
                        scope: this
                    }
                });
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
        var serviceKey = item.serviceKey,
            filters = this.widget.services[serviceKey].filters,
            val = '', useAnd = null, items = [],
            record = this.widget.currentRecords[serviceKey][0], dateFields = [],
            ageFilter = null, drFilter = null;

        if (record) {
            record.fields.each(function(field) {
                if (Ext.Date.parse(record.get(field.name), 'c')) {
                    dateFields.push([field.name, field.name]);
                }
            });
        }

        if (filters.length) {
            for (var curr,x=0,xlen=filters.length; x<xlen; x++) {
                if (filters[x].operator === 'agelimit') {
                    ageFilter = filters[x];
                } else if (filters[x].operator === 'daterange') {
                    drFilter = filters[x];
                } else {
                    if (useAnd === null) {
                        useAnd = filters[x].useAnd;
                    }
                    curr = filters[x].value;
                    if (curr.indexOf(' ') !== -1 ) {
                        val = val + '"' + curr + '" ';
                    } else {
                        val = val + curr + ' ';
                    }
                }
            }
        } else {
            useAnd = true;
        }

        items.push({
            xtype: 'textfield',
            itemId: 'filterphrase',
            fieldLabel: 'Filter terms (use "" for phrases)',
            labelAlign: 'top',
            name: 'value',
            allowBlank: false,
            value: val
        },new Ext.form.RadioGroup({
            itemId: 'anyallradio',
            columns: 1,
            hideLabel: true,
            items: [{
                name: 'useAnd',
                boxLabel: 'Contains ALL of these terms (AND)',
                inputValue: true,
                checked: useAnd
            },{
                name: 'useAnd',
                boxLabel: 'Contains ANY of these terms (OR)',
                inputValue: false,
                checked: !useAnd
            }]
        }));

        if (dateFields.length) {
            items.push({
                xtype: 'fieldset',
                name: 'useAgeLimit',
                title: 'By Age',
                checkboxToggle: true,
                collapsed: ageFilter === null,
                defaultType: 'textfield',
                defaults: {anchor: '100%'},
                layout: 'anchor',
                items: [{
                    xtype: 'combobox',
                    itemId: 'ageColumnCombo',
                    fieldLabel: 'Field',
                    name: 'ageColumn',
                    store: Ext.create('Ext.data.ArrayStore', { fields: ['name', 'value'], data: dateFields }),
                    queryMode: 'local',
                    displayField: 'name',
                    valueField: 'value',
                    value: ageFilter !== null ? ageFilter.field : ''
                },{
                    fieldLabel: 'No older than (seconds)',
                    name: 'ageLimit',
                    value: ageFilter !== null ? ageFilter.limit : ''
                }]
            },{
                xtype: 'fieldset',
                name: 'useDateRange',
                title: 'By Date Range',
                checkboxToggle: true,
                collapsed: drFilter === null,
                defaultType: 'datefield',
                defaults: {anchor: '100%'},
                layout: 'anchor',
                items: [{
                    xtype: 'combobox',
                    itemId: 'ageColumnCombo',
                    fieldLabel: 'Field',
                    name: 'dateRangeColumn',
                    store: Ext.create('Ext.data.ArrayStore', { fields: ['name', 'value'], data: dateFields }),
                    queryMode: 'local',
                    displayField: 'name',
                    valueField: 'value',
                    value: drFilter !== null ? drFilter.field : ''
                },{
                    fieldLabel: 'From',
                    name: 'dateRangeFrom',
                    maxValue: new Date(),  // limited to the current date or prior
                    value: drFilter !== null ? new Date(drFilter.from) : ''
                },{
                    fieldLabel: 'To',
                    name: 'dateRangeTo',
                    maxValue: new Date(),  // limited to the current date or prior
                    value: drFilter !== null ? new Date(drFilter.to) : new Date()
                }]
            });
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
            items: items,
            bbar: ['->',{
                iconCls: 'icon-filter',
                text: 'Apply Filter',
                handler: Ext.bind(this.applyFilter, this, [serviceKey], 0)
            },{
                iconCls: 'icon-cancel',
                text: 'Remove Filter',
                handler: Ext.bind(this.removeFilter, this, [serviceKey], 0)
            }]
        });
    },

    applyFilter: function(serviceKey, btn) {
        var panel = btn.ownerCt.ownerCt,
            formValues = panel.getForm().getFieldValues(),
            val = formValues.value,
            useAnd = formValues.useAnd,
            useAgeRange = panel.items.getAt(2) ? formValues[panel.items.getAt(2).getId()+'-checkbox'] : false,
            useDateRange = panel.items.getAt(3) ? formValues[panel.items.getAt(3).getId()+'-checkbox'] : false,
            vals = [], vtmp = [], filters = [];

        if (useAgeRange) {
            filters.push({
                operator: 'agelimit',
                limit: formValues.ageLimit,
                field: formValues.ageColumn
            });
        }

        if (useDateRange) {
            filters.push({
                operator: 'daterange',
                from: formValues.dateRangeFrom.getTime(),
                to: formValues.dateRangeTo.getTime(),
                field: formValues.dateRangeColumn
            });
        }

        if (val.indexOf('"') !== -1) {
			vtmp = val.split(' ');
			for (var y=0,ylen=vtmp.length,phrase; y<ylen; y++) {
				if (vtmp[y].indexOf('"') === 0) {
					phrase = vtmp[y].substring(1) + ' ';

					while (y<ylen && vtmp[y].lastIndexOf('"') !== vtmp[y].length-1) {
						y = y + 1;
						if (y < ylen) {
							phrase = phrase + vtmp[y] + ' ';
						}
					}

					if (y < ylen && phrase.trim() !== '') {
						vals.push(phrase.substring(0, phrase.length-2));
					}
				} else {
					vals.push(vtmp[y]);
				}
			}
		} else {
			vals = val.split(' ');
		}

        for (var v=0,vlen=vals.length; v<vlen; v++) {
			if (Ext.String.trim(vals[v]) !== '') {
                filters.push({
                    operator: 'contains',
                    value: vals[v],
                    useAnd: useAnd
                });
            }
		}

        this.widget.services[serviceKey].filters = filters;
        if (this.widget.useOwnStores || this.widget.useRawData) {
            this.widget.removeCurrentData(serviceKey, true);
            this.widget.pushCurrentData(serviceKey);
        } else {
            this.widget.processStoreFilters(serviceKey, this.widget.services[serviceKey].metadata);
        }
    },

    removeFilter: function(serviceKey, btn) {
        // TODO: fix reset() when opening window from STATE. default form values are not empty!!!!
        var panel = btn.ownerCt.ownerCt;
        panel.getForm().reset();
        this.widget.services[serviceKey].filters = [];
        this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Filters removed.');
        if (this.widget.useOwnStores || this.widget.useRawData) {
            this.widget.removeCurrentData(serviceKey, true);
            this.widget.pushCurrentData(serviceKey);
        } else {
            this.widget.processStoreFilters(serviceKey, this.widget.services[serviceKey].metadata);
        }
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});