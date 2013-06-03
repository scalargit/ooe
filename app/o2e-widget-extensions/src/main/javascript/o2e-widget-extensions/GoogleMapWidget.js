Ext.define('o2e.GoogleMapWidget', {
    extend: 'o2e.widget.AbstractWidget',

    type: 'gmap',

    dependencies: {
        js: [{className: 'google.maps', filePath: window.location.protocol + '//maps.google.com/maps/api/js?sensor=false&callback=initializeGmap'}],
        css: []
    },

    requiredAnnotations: [],
    optionalAnnotations: [],

    useOwnStores: true,
    unionData: false,
    useRawData: false,

    gmap: null,

    centerLat: 38.0,
    centerLng: -97.0,
    zoomLevel: 3,

    requiredMetaFields: {
        centerLat: '38.0',
        centerLng: '-97.0',
        zoomLevel: '3',
        infoPanelTpl: function() {
            var arr = [], items = o2e.tplRegistry.registry.items;
            for (var x=0,xlen=items.length;x<xlen;x++) {
                arr.push([items[x].name, items[x].uuid]);
            }
            return arr;
        },
        infoPanelItemSelector: 'div.rssRow',
        infoPanelOverClass: 'x-list-over'
    },

    statics: {
        pendingLoad: false,
        loaded: false
    },

    loadDependencies: function() {
        var dependencies = this.dependencies;

        if (!this.self.loaded && !o2e.env.isFusion) {
            if (!this.self.pendingLoad) {
                this.self.pendingLoad = true;
                o2e.env.addEvents('gmaploaded');
                o2e.env.on('gmaploaded', this.loadMetadata, this);
                o2e.util.Loader.requireJs(dependencies.js[0].className, dependencies.js[0].filePath);
            } else {
                o2e.env.on('gmaploaded', this.loadMetadata, this);
            }
        } else {
            this.loadMetadata();
        }
    },

    // Dependencies will already be loaded once init is called
    init: function() {
        var serviceKey, metadata, panel;

        for (serviceKey in this.services) {
            if (this.services.hasOwnProperty(serviceKey)) {
                metadata = this.services[serviceKey].metadata;
                if (metadata.viz && metadata.viz['gmap']) {
                    Ext.apply(this, metadata.viz['gmap']);
                }
            }
        }

        panel = new Ext.panel.Panel({
            itemId: 'default',
            border: false,
            preventHeader: true,
            listeners: {
                afterrender: {
                    fn: function() {
                        var point = new google.maps.LatLng(
                                typeof this.centerLat === 'string' ? parseFloat(Ext.String.trim(this.centerLat)) : this.centerLat,
                                typeof this.centerLng === 'string' ? parseFloat(Ext.String.trim(this.centerLng)) : this.centerLng
                            ),
                            mapOpts = {
                                zoom: typeof this.zoomLevel === 'string' ? parseFloat(Ext.String.trim(this.zoomLevel)) : this.zoomLevel,
                                center: point,
                                mapTypeId: google.maps.MapTypeId.ROADMAP,
                                mapTypeControl: !o2e.env.isFusion,
                                mapTypeControlOptions: { style: google.maps.MapTypeControlStyle.DROPDOWN_MENU },
                                zoomControl: true,
                                zoomControlOptions: { style: google.maps[o2e.env.isFusion ? 'NavigationControlStyle' : 'ZoomControlStyle'].SMALL }
                            };

                        if (o2e.env.isFusion) {
                            this.gmap = new GFusionMap(panel.body.id, geeServerDefs, mapOpts).map;
                        } else {
                            this.gmap = new google.maps.Map(panel.body.dom, mapOpts);
                        }

                        this.gmapOverlay = new google.maps.OverlayView();
                        this.gmapOverlay.draw = Ext.emptyFn;
                        this.gmapOverlay.setMap(this.gmap);

                        try {
                            this.earth = new GoogleEarth(this.gmap);
                        } catch (e) {
                            o2e.log.warn('Google Earth Plugin initialization error: ' + e.message, false, e);
                        }

                        google.maps.event.addListener(this.gmap, 'click', function() {
                            Ext.menu.Manager.hideAll();
                        });

                        panel.mon(panel, 'afterlayout', this.checkResize, this);

                        this.setReady();
                    },
                    scope: this
                }
            }
        });
        this.add(panel);

        this.addAvailableEventAction({
            name: 'pan to lat & lng',
            callback: function(lat, lng) {
                lat = typeof lat === 'string' ? parseFloat(Ext.String.trim(lat)) : lat;
                lng = typeof lng === 'string' ? parseFloat(Ext.String.trim(lng)) : lng;
                this.gmap.panTo(new google.maps.LatLng(lat, lng));
            },
            scope: this,
            args: ['lat', 'lng']
        });

        this.addAvailableEventAction({
            name: 'pan to point (lat,lng)',
            callback: function(latlng) {
                var ll, lat, lng;
                ll = latlng.split(latlng.indexOf(',') === -1 ? ' ' : ',');
                lat = ll[0];
                lng = ll[1];
                lat = typeof lat === 'string' ? parseFloat(Ext.String.trim(lat)) : lat;
                lng = typeof lng === 'string' ? parseFloat(Ext.String.trim(lng)) : lng;
                this.gmap.panTo(new google.maps.LatLng(lat, lng));
            },
            scope: this,
            args: ['latLng']
        });

        this.addAvailableEventAction({
            name: 'pan to point (lng,lat)',
            callback: function(latlng) {
                var ll, lat, lng;
                ll = latlng.split(latlng.indexOf(',') === -1 ? ' ' : ',');
                lat = ll[1];
                lng = ll[0];
                lat = typeof lat === 'string' ? parseFloat(Ext.String.trim(lat)) : lat;
                lng = typeof lng === 'string' ? parseFloat(Ext.String.trim(lng)) : lng;
                this.gmap.panTo(new google.maps.LatLng(lat, lng));
            },
            scope: this,
            args: ['lngLat']
        });

        this.widgetCt.on('maximize', this.checkResize, this);
        this.widgetCt.on('restore', this.checkResize, this);
        this.widgetCt.on('resize', this.checkResize, this);
        this.widgetCt.on('beforemaximize', this.captureState, this);
        this.widgetCt.on('beforerestore', this.captureState, this);
    },

    handleData: function(data, serviceKey, metadata) {
        this.processDataPlugins(data, serviceKey, metadata);
    },

    clearData: function(serviceKey) {
        if (serviceKey !== undefined) {
            this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing all records');
            this.processDataPlugins({add: [], remove: [], update: [], clear: true}, serviceKey, this.services[serviceKey].metadata);
            this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Total records: 0');
        } else {
            for (var key in this.services) {
                this.clearData(key);
            }
        }
    },

    checkResize: function() {
        this.captureState();
        google.maps.event.trigger(this.gmap, 'resize');
        this.gmap.setCenter(new google.maps.LatLng(this.centerLat, this.centerLng, true));
    },

    captureState: function() {
        var center = this.gmap.getCenter();
        this.centerLat = center.lat();
        this.centerLng = center.lng();
    },

    getStateConfig: function() {
        var map  = this.gmap, center = map.getCenter();

        return Ext.apply({
            centerLat: center.lat(),
            centerLng: center.lng(),
            zoomLevel: map.getZoom()
        }, this.callParent());
    },

    getInfoPanel: function(serviceKey, title, data) {
        if (!this.infoPanel) {
            this.infoPanel = Ext.create('Ext.window.Window', {
                autoScroll: true,
                closable: true,
                closeAction: 'hide',
                draggable: false,
                hideMode: 'offsets',
                layout: 'card',
                resizable: true,
                resizeHandles: 'e w',
                renderTo: this.widgetCt.up('portalpanel').body.dom,
                // render it off screen so it animates nicely
                x: -10000,
                y: -10000,
                // set initial width to 200, height to match parent (because we're rendering it left or right)
                width: 200,
                height: this.widgetCt.getHeight(),
                title: title,
                items: []
            });
            // Handle widgetCt height change and window resize (for managed layouts)
            this.widgetCt.on('resize', function(ct, w, h, e) {
                if (!this.infoPanel.isHidden()) {
                    this.showInfoPanel();
                }
            }, this);

            // NOTE: need to uncomment this if using absolute layouts
//            // Handle window resize, see showInfoPanel for more info
//            Ext.EventManager.onWindowResize(function() {
//                if (!this.infoPanel.isHidden()) {
//                    this.showInfoPanel();
//                }
//            }, this);

            // Handle widget destroy by cleaning up the infoPanel
            this.on('beforedestroy', function() {
                this.infoPanel.destroy();
                return true;
            });
            this.showInfoPanel(serviceKey, title, data);
        } else if (this.infoPanel.isHidden()) {
            this.showInfoPanel(serviceKey, title, data);
        } else {
            var item, ip = this.infoPanel,
                layout = this.infoPanel.getLayout();

            if (!ip.getComponent(serviceKey)) {
                ip.add(this.getNewInfoPanelItem(serviceKey));
            }

            layout.setActiveItem(serviceKey);
            item = layout.getActiveItem();
            item[item.$className === 'Ext.view.View' ? 'update' : 'setSource'](data);
            ip.setTitle(title);
        }
    },

    getNewInfoPanelItem: function(serviceKey) {
        var vizMeta = this.services[serviceKey].metadata.viz['gmap'],
            tpl = o2e.tplRegistry.registry.get(vizMeta.infoPanelTpl);

        if (tpl) {
            return Ext.create('Ext.view.View', {
                itemId: serviceKey,
                autoScroll: true,
                style: 'background: #FFFFFF',
                itemSelector: vizMeta.infoPanelItemSelector,
                overClass: vizMeta.infoPanelOverClass,
                tpl: new Ext.XTemplate(tpl.tplContent, Ext.decode(tpl.tplMethods))
            });
        } else {
            return Ext.create('Ext.grid.property.Grid', {
                itemId: serviceKey,
                source: { 'No data available': ''},
                border: 0
            });
        }
    },

    //private
    showInfoPanel: function(serviceKey, title, data) {
        var ip = this.infoPanel,
            layout = this.infoPanel.getLayout(),
            ct = this.widgetCt;

        if (serviceKey && !ip.getComponent(serviceKey)) {
            ip.add(this.getNewInfoPanelItem(serviceKey));
        }

        // Wanted to use Element.anchorTo, but anchorTo doesn't take into account hidden, it uses flyweights
        ip.getEl().alignTo(ct.header.getEl(), 'tr?', [0,0], {
            easing: 'easeOut',
            duration: 2,
            callback: function() {
                ip.hidden = false;
                ip.setHeight(ct.getHeight());
                ip.toFront();

                if (serviceKey) {
                    layout.setActiveItem(serviceKey);
                }
                if (title) {
                    ip.setTitle(title);
                }
                if (data) {
                    var item = layout.getActiveItem();
                    item[item.$className === 'Ext.view.View' ? 'update' : 'setSource'](data);
                }
            },
            scope: this
        }, true);
    }
});

function initializeGmap() {

    o2e.util.Loader.requireJs('GoogleEarth', 'js/widgets/o2e/GoogleEarth.js',
        function() {
            var widgetClass = Ext.ClassManager.get('o2e.GoogleMapWidget');
            widgetClass.pendingLoad = false;
            widgetClass.loaded = true;
            o2e.env.fireEvent('gmaploaded');
        }, window);
}