/**
 * @class BuilderApplication
 */
Ext.define('sw.BuilderApplication', {

    viewport: null,
    widgetEventingController: null,
    widgetLauncher: null,
    ozoneState: null,
    
    /**
     * @constructor
     * @param cfg
     */
    constructor: function(cfg) {
        // OWF initialization for builder context
        this.widgetEventingController = new Ozone.eventing.Widget('/rpc_relay.uncompressed.html');
        this.widgetLauncher = new Ozone.launcher.WidgetLauncher(this.widgetEventingController);

        this.ozoneState = new Ozone.state.WidgetState({
			widgetEventingController: this.widgetEventingController,
			autoInit: true,
			onStateEventReceived: this.handleEvents
		});

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

        this.viewport = Ext.create('Ext.Viewport', {
            layout: 'border',
            items: [
                {
                    itemId: 'mainContentPanel',
                    xtype: 'sw-builder-udopBrowser',
                    region: 'center',
                    cls: 'mainPanel',
                    bodyCls: 'mainPanel',
                    border: 0,
                    bodyStyle: { border: '0 none' },
                    margins:'0 3 0 0'
                },{
                    title: 'Quick Panel',
                    itemId: 'accordionPanel',
                    xtype: 'panel',
                    region: 'west',
                    split: true,
                    shadow: true,
                    collapsible: true,
                    collapsed: false,
                    layout: 'accordion',
                    width: 200,
                    minSize: 175,
                    maxSize: 400,
                    margins:'0 0 0 3',
                    layoutConfig: {
                        hideCollapseTool: true,
                        titleCollapse: true,
                        animate: true,
                        activeOnTop: false
                    },
                    bodyStyle: { borderBottom: 'none' },
                    /*listeners: {
                    	expand : {
                    		fn: function(p) {
                    			Ext.ComponentManager.get('builderservicetree').expand();
                    			Ext.get('intro-image').animate({
                            	   	duration: 1000,
                            	   	to: {
                            			marginLeft:-300
                            	    }
                            	});
                    			Ext.get('intro-headerbox').animate({
                            	   	duration: 1200,
                            	   	to: {
                            			marginTop:-280
                            	    }
                            	});
                    			
                    			Ext.get('intro-content2').animate({
                            	   	duration: 600,
                            	   	to: {
                            			color: '222222',
                            			marginTop: 60
                            	    }
                            	});
                    			console.log(p.getId());
                    			
                    		}
                    	},
                    	beforecollapse: {
                    		fn: function() {
                				//Ext.ComponentManager.get('controlpanel').expand();
                				//Back to square
                                Ext.get('intro-image').animate({
                            	   	duration: 1000,
                            	   	to: {
                            			marginLeft:-78
                            	    }
                            	});
                                Ext.get('intro-headerbox').animate({
                            	   	duration: 1500,
                            	   	ease: 'easeOut',
                            	   	to: {
                            			marginTop: 18
                            	    }
                            	});
                                Ext.get('intro-content2').animate({
                                	ease: 'easeOut',
                                	duration: 2000,
                            	   	to: {
                            			color: 'FFFFFF',
                            			marginTop: 2000
                            	    }
                            	});
                			}
                    	}
                    },*/
                    items: [{
                        xtype: 'builderservicetree',
                        id: 'builderservicetree',
                        title: 'Registered Services',
                        registry: o2e.serviceRegistry,
                        iconCls: 'icon-service',
                        hideCollapseTool: true,
                        collapsed: false,
                        setBodyStyle: {fontSize: 20}
                    },{
                        xtype: 'maplayerstree',
                        title: 'Map Layers',
                        registry: o2e.kmlRegistry,
                        iconCls: 'icon-maplayer',
                        hideCollapseTool: true
                    },{
                        xtype: 'udoptree',
                        title: 'UDOPs',
                        registry: o2e.udopRegistry,
                        iconCls: 'icon-udop',
                        hideCollapseTool: true,
                        // need to put query here because o2e.env doesn't exist before this
                        refreshQuery: {
                            serviceId: 'SYSTEM_collection_list',
                            params: {
                                query: { $or : [ { 'json.public': true }, { 'json.creator': o2e.env.username } ] },
                                pageSize: '10000',pageNumber: '0',collection: 'udop'
                            }
                        }
                    },{
                        xtype: 'favoritestree',
                        title: 'Favorites',
                        registry: this.favoriteStore,
                        iconCls: 'icon-favorites',
                        hideCollapseTool: true
                    }/**,{
                        xtype: 'panel',
                        title: 'Control Panel',
                        id: 'controlpanel',
                        hideCollapseTool: true,
                        html: '"Start" menu tools...?',
                        collapsed: false
                    }**/]
                }]
        });   
        
        this.ozoneState.addStateEventOverrides({
			events: ['beforeclose']
		});
    },
    
    handleEvents : function(sender, msg) {
		if (msg.eventName === 'beforeclose') {
			o2e.app.ozoneState.removeStateEventOverrides({
				events: ['beforeclose'],
				callback: function() {
					o2e.app.widgetEventingController.publish("ClassificationChannel", "remove");
					o2e.app.ozoneState.closeWidget();					
				}
			});
		}
		return true;
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
        }, this);
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
