Ext.define('o2e.DetailWidget', {
    extend: 'o2e.widget.AbstractWidget',

    type: 'detail',

    useRawData: false,
    useOwnStores: true,
    unionData: false,

    requiredAnnotations: ['title'],
    optionalAnnotations: ['uid'],
    restrictFields: false,

    tabPanel: null,
    dwSortState: null,

    init: function() {
        this.tabPanel = Ext.create('Ext.tab.Panel', {
            border: 0
        });
        this.dwSortState = this.dwSortState || { property: 'name', direction: 'ASC' };
        this.add(this.tabPanel);
        this.setReady();

        this.doLayout();
    },

    addData: function(records, serviceKey, metadata) {
        var i, len;
        for (i=0, len=records.length; i<len; i++) {
            this.addTab(records[i], serviceKey);
        }
        this.tabPanel.doLayout();
    },

    updateData: function(records, serviceKey, metadata) {
        var i, len;
        for (i=0, len=records.length; i<len; i++) {
            this.updateTab(records[i], serviceKey);
        }
    },

    removeData: function(records, serviceKey, metadata) {
        var i, len;
        for (i=0, len=records.length; i<len; i++) {
            this.removeTab(records[i], serviceKey);
        }
    },

    clearData: function(serviceKey) {
        this.tabPanel.removeAll();
        this.tabPanel.tabBar.hide();
    },

    addTab: function(model, serviceKey) {
        var title = this.getTabTitle(model), grid;

        grid = Ext.create('Ext.grid.property.Grid', {
            title: title,
            itemId: model.get('uid') || Ext.id('o2e-detail'),
            source: model.data,
            originalModel: model,
            border: 0,
            isSortInit: false,
            listeners: {
                sortchange: {
                    fn: function(header, column, direction) {
                        if (header.ownerCt.isSortInit === true) {
                            this.dwSortState = { property: column.dataIndex, direction: direction };
                        }
                    },
                    scope: this
                },
                activate: {
                    fn: this.handleSort,
                    scope: this
                },
                afterrender: {
                    fn: this.handleSort,
                    scope: this,
                    single: true
                }
            }
        });

        this.tabPanel.add(grid);

        this.checkTabStrip();
    },

    handleSort: function(tab) {
        if (this.dwSortState === null) {
            var store = tab.store;
            store.sorters.clear();
            tab.headerCt.clearOtherSortStates();
            store.setSource(tab.getSource());
        } else {
            tab.getStore().sort(this.dwSortState.property, this.dwSortState.direction);
            tab.headerCt.items.each(function(column) {
                if (column.dataIndex === this.dwSortState.property) {
                    column.setSortState(this.dwSortState.direction);
                }
            }, this);
        }
        tab.isSortInit = true;
    },

    /*
     **** We know for sure there will be a uid if this is invoked ****
     *
     * updateData is only called when the uid annotation is in use
     */
    updateTab: function(model, serviceKey) {
        var uid = model.get('uid'), grid = this.tabPanel.getComponent(uid);
        grid.setSource(model.data);
    },

    removeTab: function(model, serviceKey) {
        var tab = this.findTab(model);

        if (tab !== null) {
            this.tabPanel.remove(tab);
        } else {
            console.warn('Tab could not be removed for serviceKey: ', serviceKey);
        }

        this.checkTabStrip();
    },

    checkTabStrip: function() {
        if (this.tabPanel.items.getCount() < 2) {
            this.tabPanel.tabBar.hide();
        } else {
            this.tabPanel.tabBar.show();
        }
    },

    getTabTitle: function(model) {
        return model.get('title');
    },

    findTab: function(model) {
        var itemId = model.get('uid'), i, len, currTab;
        if (!Ext.isEmpty(itemId)) {
            return this.tabPanel.getComponent(itemId);
        } else {
            for (i=0, len=this.tabPanel.items.getCount(); i<len; i++) {
                currTab = this.tabPanel.items.getAt(i);
                if (o2e.data.DataUtils.isStrictMatch(model, currTab.originalModel)) {
                    return currTab;
                }
            }
        }
        return null;
    },

    getStateConfig: function() {
        return Ext.apply({
            dwSortState: this.dwSortState
        }, this.callParent());
    }
});