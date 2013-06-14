Ext.define('sw.xmpp.BuddyList', {
    extend: 'Ext.grid.Panel',
    alias: 'widget.buddylist',

    initComponent: function() {
        Ext.define('buddy', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'fromUser', type: 'string' },
                { name: 'fromJid', type: 'string' },
                { name: 'presenceType', type: 'string' }
            ]
        });

        this.store = Ext.create('Ext.data.Store', {
            model: 'buddy',
            sorters: ['presenceType', 'fromUser']
        });

        Ext.apply(this, {
            columnLines: true,
            columns: [
                {
                    flex     : 1,
                    dataIndex: 'fromUser',
                    renderer: function(v, md, r) {
                        md.tdAttr = 'data-qtip="Status: ' + r.get('presenceType') + '"';
                        if (r.get('presenceType') === 'available') {
                            return '<b>' + v + '</b>';
                        } else {
                            return '<span style="color:#999"><i>' + v + '</i></span>'
                        }
                    }
                }
            ],
            viewConfig: {
                stripeRows: true,
                emptyText: 'No buddies found.'
            }
        });

        this.callParent();

        this.on('afterlayout', function(grid) {
            grid.headerCt.hide();
        });

        this.on('itemclick', function(v, m) {
            this.ownerCt.addChat(m.get('fromUser'));
        }, this);
    },

    loadBuddies: function(buddies) {
        this.store.loadData(buddies);
    },

    removeBuddies: function() {
        this.store.removeAll();
    },

    handlePresence: function(presence) {
        var pStore = this.getStore(), idx = pStore.findExact('fromUser', presence.fromUser);
        if (idx !== -1) {
            pStore.removeAt(idx);
        }
        pStore.add(presence);
        pStore.sort(pStore.sorters.getRange());
    }
});