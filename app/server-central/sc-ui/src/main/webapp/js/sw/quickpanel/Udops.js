Ext.define('sw.quickpanel.Udops', {
    extend: 'o2e.widget.MetadataRegistryCategoryTreePanel',
    alias: 'widget.udoptree',

    emptyText: 'No dashboards found.',
    ddGroup: 'udops',
    textField: 'udopTitle',
    descriptionField: 'udopDescription',
    categoryField: 'udopCategory',
    searchFields: ['udopTags'],

    initComponent: function() {
        this.callParent();
        this.mon(o2e.env.connector, 'userauth', function(authData) {
            this.refreshQuery.params.query.$or[1]['json.creator'] = authData.username;
        }, this);
    },

    handler: function(pk, metadata) {
        var openUdop = o2e.app.findOpenUdop(metadata.uuid),
            browser = o2e.app.viewport.getComponent('mainContentPanel');
        if (openUdop === null) {
            browser.loadUdop(Ext.clone(metadata));
        } else {
            browser.getLayout().setActiveItem(openUdop);
        }
    },

    onItemContextMenu: function(v, r, i, idx, e) {
        e.preventDefault();
        if (!r.get('leaf')) {
            return;
        }

        var menu, vizType, items = [], m = { data: r.get('metadata') };

        items.push({
            text: 'Add to Favorites',
            iconCls: 'icon-favorites',
            handler: function() {
                o2e.app.addFavorite({ favoriteName: m.data.udopTitle, favoriteId: m.data.uuid, favoriteType: 'UDOPs' });
            }
        },{
            text: 'Show Dashboard Link',
            iconCls: 'icon-wiring',
            handler: function() {
                var url = window.location.protocol + '//' + window.location.host + window.location.pathname + '?udop=' + m.data.uuid;
                Ext.Msg.prompt('UDOP Link', 'Please copy/paste the link below', Ext.emptyFn, this, false, url);
            }
        },{
            text: 'Rename Dashboard',
            iconCls: 'icon-udop-edit',
            handler: function() {
                var newUdop = Ext.clone(m.data);
                Ext.Msg.prompt('Rename UDOP', 'Please enter a new name for this UDOP.', function(id, txt) {
                    txt = Ext.String.trim(txt);
                    if ((id === 'yes' || id === 'ok') && txt !== newUdop.udopTitle) {
                        newUdop.udopTitle = txt;
                        o2e.udopRegistry.update(newUdop.uuid, newUdop, function(d) {
                            Ext.Msg.hide();
                            o2e.env.notifyMgr.send('udop', {action: 'update', metadata: d});
                        }, this);
                    }
                }, this, false, newUdop.udopTitle);
            }
        },{
            text: 'Duplicate Dashboard',
            iconCls: 'icon-pagecopy',
            handler: function() {
                var newUdop = Ext.clone(m.data);
                delete newUdop.uuid;
                newUdop.creator = o2e.env.username;
                Ext.Msg.prompt('Duplicate Dashboard', 'Please enter a new name for this Dashboard.', function(id, txt) {
                    if (id === 'yes' || id === 'ok') {
                        newUdop.udopTitle = txt;
                        o2e.udopRegistry.insert(null, newUdop, function(d) {
                            Ext.Msg.hide();
                            o2e.env.notifyMgr.send('udop', {action: 'add', metadata: d});
                        }, this);
                    }
                }, this, false, 'Copy of '+newUdop.udopTitle);
            }
        },{
            text: 'Remove Dashboard',
            iconCls: 'icon-cancel',
            handler: function() {
                var notifyMeta = { public: m.data.public, uuid: m.data.uuid };
                o2e.udopRegistry.remove(m.data.uuid);
                o2e.env.notifyMgr.send('udop', {action: 'remove', metadata: notifyMeta });
            }
        });

        menu = Ext.menu.Manager.get({
            plain: true,
            items: items
        });

        menu.showAt(e.getX(), e.getY());
    }
});