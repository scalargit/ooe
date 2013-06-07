Ext.define('sw.plugin.RssSort', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'rssSort',
    widgetType: 'rss',

    item: null,
    text: 'Sort By',
    defaultItemClass: 'Ext.menu.Item',
    disabled: false,

    sortProperties: [['Title', 'title'], ['Publish Date', 'pubDate'], ['Author', 'author'], ['Received Order', '']],

    init: function() {
        this.sortState = this.sortState || [];
        if (this.widget.ready) {
            this.widget.store.on('datachanged', Ext.Function.createBuffered(function() {
                this.widget.store.sort(this.sortState);
            }, 500, this));
        } else {
            this.widget.on('ready', function() {
                this.widget.store.on('datachanged', Ext.Function.createBuffered(function() {
                    this.widget.store.sort(this.sortState);
                }, 500, this));
            }, this);
        }
    },

    createItem: function(itemClass) {
        var menuItems = [], layer, curr, gmapLayer, mapToUse;

        for (var x=0,xlen=this.sortProperties.length; x<xlen; x++) {
            menuItems.push({
                iconCls: (this.sortState.length && this.sortState[0].property === this.sortProperties[x][1]) ?
                                ((this.sortState[0].direction === 'ASC') ? 'icon-sort-desc' : 'icon-sort-asc') : '',
                text: this.sortProperties[x][0],
                sortProp: this.sortProperties[x][1],
                hideOnClick: false,
                handler: function(item) {
                    var direction, store = this.widget.store, parentMenu = item.parentMenu;
                    if (item.sortProp === '') {
                        store.sorters.clear();
                        this.sortState = [];
                        store.data.sortBy(function(a,b) { return a.internalId > b.internalId; });
                        store.fireEvent('datachanged', store);
                    } else {
                        store.sort(item.sortProp);
                        // toggle icon logic
                        direction = store.sorters.items[0].direction;
                        if (direction === 'ASC') {
                            item.setIconCls('icon-sort-desc');
                        } else {
                            item.setIconCls('icon-sort-asc');
                        }
                    }

                    // clear all the other items' icon
                    parentMenu.items.each(function(i) {
                        if (i.sortProp !== item.sortProp) {
                            i.setIconCls('');
                        }
                    });
                },
                scope: this
            });
        }

        this.itemRef = Ext.create(itemClass || this.defaultItemClass, {
            iconCls: this.iconCls,
            text: this.text,
            itemId: this.pluginId,
            disabled: this.disabled,
            menu: menuItems
        });

        this.widget.fireEvent('servicestatus', 'Plugins', o2e.data.DataUtils.serviceStatus.INFO, 'KML Plugin Initialized.');

        return this.itemRef;
    },

    getStateConfig: function() {
        var sorters = this.widget.store.sorters.items, sortState = [];
        for (var x=0,xlen=sorters.length; x<xlen; x++) {
            sortState.push({
                property: sorters[x].property,
                direction: sorters[x].direction
            })
        }
        return Ext.apply({
            sortState: sortState
        }, this.callParent());
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});