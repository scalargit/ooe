Ext.define('sw.quickpanel.Favorites', {
    extend: 'o2e.widget.MetadataRegistryCategoryTreePanel',
    alias: 'widget.favoritestree',

    emptyText: 'No favorites found.',
    textField: 'favoriteName',
    categoryField: 'favoriteType',

    handler: function(pk, metadata) {
        var type = metadata.favoriteType;
        if (type === 'Services') {
            o2e.app.viewport.getComponent('mainContentPanel').addWidgetFromService(metadata.favoriteId, null);
        } else if (type === 'Map Layers') {
            o2e.kmlRegistry.get(metadata.favoriteId, function(meta) {
                var widgetMeta = { services: {}, widgetCt: { title: meta.name, configPlugins: { gmapKml: { layers: {}}}}};
                widgetMeta.widgetCt.configPlugins.gmapKml.layers[meta.uuid] = { name: meta.name, url: meta.url, active: true };
                o2e.app.viewport.getComponent('mainContentPanel').addWidget('gmap', widgetMeta);
            }, this);
        } else if (type === 'UDOPs') {
            o2e.app.openUdop(metadata.favoriteId);
        }
    },

    onItemContextMenu: function(v, r, i, idx, e) {
        e.preventDefault();
        if (!r.get('leaf')) {
            return;
        }

        var menu, vizType, items = [], m = r.get('metadata');

        items.push({
            text: 'Remove Favorite',
            iconCls: 'icon-cancel',
            handler: function() {
                this.favoriteStore.fireEvent('remove', m.favoriteId);
                this.favoriteStore.removeAt(this.favoriteStore.findExact('favoriteId', m.favoriteId));
                this.saveFavorites();
            },
            scope: o2e.app
        });

        menu = Ext.menu.Manager.get({
            plain: true,
            items: items
        });

        menu.showAt(e.getX(), e.getY());
    }
});