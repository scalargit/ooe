/**
 * @class sw.Application
 */
Ext.define('sw.Application', {

    viewport: null,

    /**
     * @constructor
     * @param cfg
     */
    constructor: function(cfg) {
        Ext.define('favorite', {
            extend: 'Ext.data.Model',
            fields: [
                { name: 'favoriteName', type: 'string' },
                { name: 'favoriteId', type: 'string' },
                { name: 'favoriteType', type: 'string' }
            ]
        });

        this.favoriteStore = Ext.create('Ext.data.Store', {
            model: 'favorite',
            sorters: ['favoriteType', 'favoriteName'],
            groupField: 'favoriteType'
        });
        this.favoriteStore.addEvents('insert', 'update', 'remove', 'load');
        this.favoriteStore.primaryKey = 'favoriteId';

        var items = [{
            xtype: 'panel',
            border: 0,
            bodyStyle: {
                background: 'transparent !important'
            },
            region : 'north',
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            height: 52,
            items: [{
                xtype: 'component',
                html: '<div id="header" class="header" style="height:100%">' +
                        '<table cellpadding="0" cellspacing="0" border="0" style="layout:fixed;width:100%">' +
                            '<tr>' +
                                '<td id="banner" class="banner">&nbsp;</td>' +
                                '<td style="width:20px">&nbsp;</td>'+
                            '</tr>' +
                        '</table>' +
                    '</div>',
                height: 52,
                itemId : 'header',
                border : 0,
                bodyBorder : false,
                margins : '0 0 0 0'
            }]
        },{
            itemId: 'mainContentPanel',
            xtype: 'sw-udopBrowser',
            region: 'center',
            cls: 'mainPanel',
            bodyCls: 'mainPanel',
            border: 0,
            bodyStyle: { border: '0 none' },
            margins:'0 0 3 3'
        },{
            itemId: 'chatcenter',
            xtype: 'chatcenter',
            region: 'south',
            split: true,
            collapsible: true,
            collapsed: true,
            height: 400,
            title: 'Chat',
            iconCls: 'icon-chat',
            hideCollapseTool: true
        },{
            title: 'Toolbox',
            itemId: 'accordionPanel',
            xtype: 'panel',
            region: 'east',
            split: true,
            collapsible: true,
            collapsed: false,
            layout: 'accordion',
            width: 200,
            minSize: 175,
            maxSize: 400,
            margins:'0 3 3 3',
            layoutConfig: {
                hideCollapseTool: true,
                titleCollapse: true,
                animate: true,
                activeOnTop: false
            },
            bodyStyle: { borderBottom: 'none' },
            items: [{
                xtype: 'servicetree',
                title: 'Registered Services',
                registry: o2e.serviceRegistry,
                iconCls: 'icon-service',
                hideCollapseTool: true
            },{
                xtype: 'maplayerstree',
                title: 'Map Layers',
                registry: o2e.kmlRegistry,
                iconCls: 'icon-maplayer',
                hideCollapseTool: true
            },{
                xtype: 'udoptree',
                title: 'Dashboards',
                registry: o2e.udopRegistry,
                iconCls: 'icon-udop',
                hideCollapseTool: true,
                collapsed: false,
                // need to put query here because o2e.env doesn't exist before this
                refreshQuery: {
                    serviceId: 'SYSTEM_collection_list',
                    params: {
                        query: { $or : [ { 'json.public': true }, { 'json.creator': o2e.env.username } ] },
                        pageSize: '10000',pageNumber: '0',collection: 'udop'
                    }
                }
            }
//                        ,{
//                        xtype: 'favoritestree',
//                        title: 'Favorites',
//                        registry: this.favoriteStore,
//                        iconCls: 'icon-favorites',
//                        hideCollapseTool: true
//                    }
                ]
            }];

        o2e.env.on('userauth', this.handleUserAuth, this);

        this.viewport = Ext.create('Ext.Viewport', {
            layout: 'border',
            items: items
        });
    },

    /**
     *
     * @param cfg
     */
    applyStateConfig: function(cfg) {
        o2e.log.debug('Attempting to load profile: ', false, cfg);
        if (this.favoritesLoaded !== true && cfg && cfg.favorites && cfg.favorites.length) {
            this.favoriteStore.loadData(cfg.favorites);
            this.favoriteStore.fireEvent('load', cfg.favorites);
            this.viewport.getComponent('accordionPanel').items.getAt(3).expand();
            this.favoritesLoaded = true;
        }
    },

    /**
     *
     */
    getStateConfig: function() {
        return {};
    },

    handleUserAuth: function() {
        if (!o2e.env.hasAuthority("ADMINS")) {
            this.viewport.getComponent('accordionPanel').hide();
            this.viewport.getComponent('mainContentPanel').removeAdminFunctionality();
        }
    },

    queryUdopDependencies: function(query, cb, scope) {
        o2e.connectorMgr.query({
            componentId: this.id,
            serviceId: 'SYSTEM_collection_list',
            params: {
                query: {
                    $and: [
                        {$or : [
                            { 'json.public': true },
                            { 'json.creator': o2e.env.username }
                        ]},
                        query
                    ]
                },
                pageSize: '10000',
                pageNumber: '0',
                collection: 'udop'
            },
            success: function(sKey, data, fr) {
                cb.call(scope || this, data);
            },
            failure: function() {
                cb.call(scope || this, {records: []});
            },
            scope: this
        });
    },

    openUdop: function(udopId) {
        o2e.udopRegistry.get(udopId, function(md) {
            this.viewport.getComponent('mainContentPanel').loadUdop(md);
        }, this) ;
    },

    addFavorite: function(cfg) {
        if (this.favoriteStore.findBy(function(r) {
            return r.get('favoriteId') === cfg.favoriteId && r.get('favoriteType') === cfg.favoriteType;
        }) === -1) {
            this.favoriteStore.add(cfg);
            this.favoriteStore.fireEvent('insert', cfg);
            this.saveFavorites();
            return true;
        }
        return false;
    },

    saveFavorites: function() {
        var favs = [], recs = this.favoriteStore.getRange();
        for (var x=0,xlen=recs.length;x<xlen;x++) {
            favs.push(recs[x].data);
        }
        o2e.dashboard.ProfileMgr.setUserProfile({ favorites: favs });
    },

    findOpenUdop: function(uuid) {
        var udops = this.viewport.getComponent('mainContentPanel').items;
        for (var x=0,xlen=udops.getCount();x<xlen;x++) {
            if (udops.getAt(x).uuid === uuid) {
                return udops.getAt(x);
            }
        }
        return null;
    }
});