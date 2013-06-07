Ext.define('sw.gmap.plugin.GoogleMapPolygon', {

    extend: 'o2e.plugin.AbstractDataPlugin',

    pluginId: 'gmapPolygon',
    widgetType: 'gmap',
    requiredAnnotations: ['polygon_id'],
    optionalAnnotations: ['polygon_lat', 'polygon_lng', 'polygon_lat,lng', 'polygon_lng,lat', 'polygon_color', 'polygon_fill', 'uid'],
    requiredMetaFields: {
        polygonColor: [
            ['Pink', 'pink'],
            ['Red', 'red'],
            ['Orange', 'orange'],
            ['Yellow', 'yellow'],
            ['Green', 'green'],
            ['Light Blue', 'lightBlue'],
            ['Blue', 'blue'],
            ['Purple', 'purple'],
            ['Black', 'black']
        ],
        polygonThickness: '2',
        polygonFillColor: [
            ['Pink', 'pink'],
            ['Red', 'red'],
            ['Orange', 'orange'],
            ['Yellow', 'yellow'],
            ['Green', 'green'],
            ['Light Blue', 'lightBlue'],
            ['Blue', 'blue'],
            ['Purple', 'purple'],
            ['Black', 'black']
        ],
        polygonIsGeodesic: true
    },

    polygonColor: 'yellow',
    polygonThickness: '2',
    polygonFillColor: 'yellow',
    polygonIsGeodesic: true,

    polygons: null,
    polygonPoints: null,

    init: function() {
        this.callParent();
        this.polygons = {};
        this.polygonPoints = {};

        this.addEvents('click');

        this.widget.addAvailableEventSource({
            name: 'clicks a polygon',
            source: this,
            event: 'click',
            args: [{
                name: 'Entire record'
            },{
                name: 'record',
                index: 0,
                getValues: Ext.Function.bind(function() {
                    var serviceKey, x, xlen, vals = [], fields;
                    for (serviceKey in this.polygons) {
                        if (this.polygons.hasOwnProperty(serviceKey) && this.polygons[serviceKey].length) {
                            fields = Ext.ModelManager.getModel(this.widget.models[serviceKey]).prototype.fields.getRange();
                            for (x=0,xlen=fields.length;x<xlen;x++) {
                                vals.push(fields[x].name);
                            }
                        }
                    }
                    return vals;
                }, this),
                processor: function(record, field) {
                    return record.get(field);
                }
            }]
        });
    },

    addData: function(records, serviceKey, metadata) {
        var keys, msg, errCount = 0, i, len, id, lat, lng, ll, latLng, color, fill, polygon;

        if (!this.polygons.hasOwnProperty(serviceKey)) {
            this.polygons[serviceKey] = [];
        }

        if (records.length) {
            keys = records[0].fields.keys;
            if ((Ext.Array.indexOf(keys, 'polygon_lat') === -1 ||
                Ext.Array.indexOf(keys, 'polygon_lng') === -1) &&
                Ext.Array.indexOf(keys, 'polygon_lat,lng') === -1 &&
                Ext.Array.indexOf(keys, 'polygon_lng,lat') === -1) {
                this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'Could not locate data required to plot polygons. Please check data mappings.');
                return;
            }
        }

        for (i=0, len=records.length; i<len; i++) {
            id = records[i].get('polygon_id');
            lat = records[i].get('polygon_lat');
            lng = records[i].get('polygon_lng');
            color = records[i].get('polygon_color') || metadata.viz.gmap.polygonColor || this.polygonColor;
            fill = records[i].get('polygon_fill') || metadata.viz.gmap.polygonFillColor || this.polygonFillColor;
            if (!lat || !lng) {
                ll = records[i].get('polygon_lat,lng');
                if (ll) {
                    ll = ll.split(ll.indexOf(',') === -1 ? ' ' : ',');
                    lat = ll[0];
                    lng = ll[1];
                } else {
                    ll = records[i].get('polygon_lng,lat');
                    if (ll) {
                        ll = ll.split(ll.indexOf(',') === -1 ? ' ' : ',');
                        lat = ll[1];
                        lng = ll[0];
                    }
                }
            }

            try {
                lat = typeof lat === 'string' ? parseFloat(Ext.String.trim(lat)) : lat;
                lng = typeof lng === 'string' ? parseFloat(Ext.String.trim(lng)) : lng;
                if (!lat || !lng) {
                    errCount = errCount + 1;
                } else {
                    latLng = new google.maps.LatLng(lat, lng);
                    if (this.polygonPoints[id]) {
                        this.polygonPoints[id].push(latLng);
                    } else {
                        this.polygonPoints[id] = new google.maps.MVCArray();
                        this.polygonPoints[id].push(latLng);
                        polygon = new google.maps.Polygon({
                            paths: this.polygonPoints[id],
                            geodesic: metadata.viz.gmap.polygonIsGeodesic || this.polygonIsGeodesic,
                            map: this.widget.gmap,
                            fillColor: '#' + sw.gmap.Utils.getColorHexValue(fill),
                            fillOpacity: 0.5,
                            strokeColor: '#' + sw.gmap.Utils.getColorHexValue(color),
                            strokeOpacity: 1.0,
                            strokeWeight: Number(metadata.viz.gmap.polygonThickness) || 2
                        });
                        google.maps.event.addListener(polygon, 'click', Ext.bind(this.onPolygonClick, this, [serviceKey, records[i]], 0));
                        google.maps.event.addListener(polygon, 'rightclick', Ext.bind(this.onPolygonContextClick, this, [polygon], 0));

                        this.polygons[serviceKey].push(polygon);
                    }
                }
            } catch (e) {
                errCount = errCount + 1;
            }
        }

        msg = 'Plotted '+(records.length - errCount)+' of '+records.length+' polygon records.';
        if (errCount === 0) {
            this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, msg);
        } else {
            this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.WARN, msg);
        }
    },

    updateData: function(records, serviceKey, metadata) {
        //TBD
    },

    removeData: function(records, serviceKey, metadata) {
        //TBD
    },

    clearData: function(serviceKey) {
        var i, len, polygons = this.polygons[serviceKey];
        if (Ext.isArray(polygons)) {
            for (i=0, len=polygons.length; i<len; i++) {
                polygons[i].setMap(null);
            }
            polygons = [];
        }
    },

    onPolygonClick: function(serviceKey, record, event) {
        this.widget.getInfoPanel(serviceKey, record.get('title'), record.data);
        this.fireEvent('click', record);
    },

    onPolygonContextClick: function(polygon, event) {
        var p = this.widget.widgetCt.getPosition(),
            point = this.widget.gmapOverlay.getProjection().fromLatLngToContainerPixel(event.latLng);

        Ext.menu.MenuMgr.get({
            plain: true,
            items: [{
                iconCls: 'icon-colorswatch',
                text: 'Color',
                menu: {
				    xtype: 'colormenu',
                    handler: function(p, color) {
                        polygon.setOptions({ strokeColor: '#' + color });
                    },
                    scope: this,
                    hideOnClick: false
                }
            },{
                iconCls: 'icon-chartline',
                text: 'Weight',
                menu: {
                    items: [
                        {
                            itemId: 'increaseweight',
                            iconCls: 'icon-sort-asc',
                            text: 'Increase Weight',
                            handler: function (item) {
                                var d = item.parentMenu.getComponent('decreaseweight');
                                polygon.setOptions({ strokeWeight: polygon.strokeWeight + 1 });
                                if (d.disabled) {
                                    d.enable();
                                }
                            },
                            scope: this,
                            hideOnClick: false
                        },
                        {
                            itemId: 'decreaseweight',
                            iconCls: 'icon-sort-desc',
                            text: 'Decrease Weight',
                            handler: function (item) {
                                polygon.setOptions({ strokeWeight: polygon.strokeWeight - 1 });
                                if (polygon.strokeWeight == 1) {
                                    item.disable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: polygon.strokeWeight === 1
                        }
                    ]
                }
            },{
                iconCls: 'icon-contrast',
                text: 'Opacity',
                menu: {
                    items: [
                        {
                            itemId: 'increaseopacity',
                            iconCls: 'icon-sort-asc',
                            text: 'Increase Opacity',
                            handler: function (item) {
                                var d = item.parentMenu.getComponent('decreaseopacity');
                                polygon.setOptions({ strokeOpacity: (Math.floor(polygon.strokeOpacity * 10.0) + 1.0) / 10.0 });
                                if (polygon.strokeOpacity == 1.0) {
                                    item.disable();
                                }
                                if (d.disabled) {
                                    d.enable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: polygon.strokeOpacity === 1.0
                        },
                        {
                            itemId: 'decreaseopacity',
                            iconCls: 'icon-sort-desc',
                            text: 'Decrease Opacity',
                            handler: function (item) {
                                var d = item.parentMenu.getComponent('increaseopacity');
                                polygon.setOptions({ strokeOpacity: (Math.floor(polygon.strokeOpacity * 10.0) - 1.0) / 10.0 });
                                if (polygon.strokeOpacity == 0.1) {
                                    item.disable();
                                }
                                if (d.disabled) {
                                    d.enable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: polygon.strokeOpacity === 0.1
                        }
                    ]
                }
            },{
                iconCls: 'icon-colorswatch',
                text: 'Fill Color',
                menu: {
				    xtype: 'colormenu',
                    handler: function(p, color) {
                        polygon.setOptions({ fillColor: '#' + color });
                    },
                    scope: this,
                    hideOnClick: false
                }
            }
                ,{
                iconCls: 'icon-contrast',
                text: 'Fill Opacity',
                menu: {
                    items: [
                        {
                            itemId: 'increaseopacity',
                            iconCls: 'icon-sort-asc',
                            text: 'Increase Opacity',
                            handler: function (item) {
                                var d = item.parentMenu.getComponent('decreaseopacity');
                                polygon.setOptions({ fillOpacity: (Math.floor(polygon.fillOpacity * 10.0) + 1.0) / 10.0 });
                                if (polygon.fillOpacity == 1.0) {
                                    item.disable();
                                }
                                if (d.disabled) {
                                    d.enable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: polygon.fillOpacity === 1.0
                        },
                        {
                            itemId: 'decreaseopacity',
                            iconCls: 'icon-sort-desc',
                            text: 'Decrease Opacity',
                            handler: function (item) {
                                var d = item.parentMenu.getComponent('increaseopacity');
                                polygon.setOptions({ fillOpacity: (Math.floor(polygon.fillOpacity * 10.0) - 1.0) / 10.0 });
                                if (polygon.fillOpacity == 0.1) {
                                    item.disable();
                                }
                                if (d.disabled) {
                                    d.enable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: polygon.fillOpacity === 0.1
                        }
                    ]
                }
            }
                ]
        }).showAt([Math.round(point.x) + p[0], Math.round(point.y) + p[1]]);
    }

}, function() {
    o2e.plugin.DataPluginMgr.reg(this);
});