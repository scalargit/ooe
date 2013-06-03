Ext.define('sw.gmap.plugin.GoogleMapCircle', {

    extend: 'o2e.plugin.AbstractDataPlugin',

    pluginId: 'gmapCircle',
    widgetType: 'gmap',
    requiredAnnotations: ['circle_id'],
    optionalAnnotations: ['circle_lat', 'circle_lng', 'circle_lat,lng', 'circle_lng,lat', 'circle_radius', 'circle_color', 'circle_fill', 'uid'],
    requiredMetaFields: {
        circleColor: [
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
        circleThickness: '2',
        circleFillColor: [
            ['Pink', 'pink'],
            ['Red', 'red'],
            ['Orange', 'orange'],
            ['Yellow', 'yellow'],
            ['Green', 'green'],
            ['Light Blue', 'lightBlue'],
            ['Blue', 'blue'],
            ['Purple', 'purple'],
            ['Black', 'black']
        ]
    },

    circleColor: 'yellow',
    circleThickness: '2',
    circleFillColor: 'yellow',

    circles: null,

    init: function() {
        this.callParent();
        this.circles = {};

        this.addEvents('click');

        this.widget.addAvailableEventSource({
            name: 'clicks a circle',
            source: this,
            event: 'click',
            args: [{
                name: 'Entire record'
            },{
                name: 'record',
                index: 0,
                getValues: Ext.Function.bind(function() {
                    var serviceKey, x, xlen, vals = [], fields;
                    for (serviceKey in this.circles) {
                        if (this.circles.hasOwnProperty(serviceKey) && this.circles[serviceKey].length) {
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
        var keys, msg, errCount = 0, i, len, lat, lng, ll, latLng, radius, color, fill, circle;

        if (!this.circles.hasOwnProperty(serviceKey)) {
            this.circles[serviceKey] = [];
        }

        if (records.length) {
            keys = records[0].fields.keys;
            if ((Ext.Array.indexOf(keys, 'circle_lat') === -1 ||
                Ext.Array.indexOf(keys, 'circle_lng') === -1) &&
                Ext.Array.indexOf(keys, 'circle_lat,lng') === -1 &&
                Ext.Array.indexOf(keys, 'circle_lng,lat') === -1 ||
                Ext.Array.indexOf(keys, 'circle_radius') === -1) {
                this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'Could not locate data required to plot circles. Please check data mappings.');
                return;
            }
        }

        for (i=0, len=records.length; i<len; i++) {
            lat = records[i].get('circle_lat');
            lng = records[i].get('circle_lng');
            radius = records[i].get('circle_radius');
            color = records[i].get('circle_color') || metadata.viz.gmap.circleColor || this.circleColor;
            fill = records[i].get('circle_fill') || metadata.viz.gmap.circleFillColor || this.circleFillColor;
            if (!lat || !lng) {
                ll = records[i].get('circle_lat,lng');
                if (ll) {
                    ll = ll.split(ll.indexOf(',') === -1 ? ' ' : ',');
                    lat = ll[0];
                    lng = ll[1];
                } else {
                    ll = records[i].get('circle_lng,lat');
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
                radius = typeof radius === 'string' ? parseFloat(Ext.String.trim(radius)) : radius;
                if (!lat || !lng) {
                    errCount = errCount + 1;
                } else {
                    latLng = new google.maps.LatLng(lat, lng);
                    circle = new google.maps.Circle({
                        center: latLng,
                        radius: radius,
                        map: this.widget.gmap,
                        fillColor: '#' + sw.gmap.Utils.getColorHexValue(fill),
                        fillOpacity: 0.5,
                        strokeColor: '#' + sw.gmap.Utils.getColorHexValue(color),
                        strokeOpacity: 1.0,
                        strokeWeight: Number(metadata.viz.gmap.circleThickness) || 2
                    });
                    google.maps.event.addListener(circle, 'click', Ext.bind(this.onCircleClick, this, [serviceKey, records[i]], 0));
                    google.maps.event.addListener(circle, 'rightclick', Ext.bind(this.onCircleContextClick, this, [circle], 0));

                    this.circles[serviceKey].push(circle);
                }
            } catch (e) {
                errCount = errCount + 1;
            }
        }

        msg = 'Plotted '+(records.length - errCount)+' of '+records.length+' circle records.';
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
        var i, len, circles = this.circles[serviceKey];
        if (Ext.isArray(circles)) {
            for (i=0, len=circles.length; i<len; i++) {
                circles[i].setMap(null);
            }
            circles = [];
        }
    },

    onCircleClick: function(serviceKey, record, event) {
        this.widget.getInfoPanel(serviceKey, record.get('title'), record.data);
        this.fireEvent('click', record);
    },

    onCircleContextClick: function(circle, event) {
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
                        circle.setOptions({ strokeColor: '#' + color });
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
                                circle.setOptions({ strokeWeight: circle.strokeWeight + 1 });
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
                                circle.setOptions({ strokeWeight: circle.strokeWeight - 1 });
                                if (circle.strokeWeight == 1) {
                                    item.disable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: circle.strokeWeight === 1
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
                                circle.setOptions({ strokeOpacity: (Math.floor(circle.strokeOpacity * 10.0) + 1.0) / 10.0 });
                                if (circle.strokeOpacity == 1.0) {
                                    item.disable();
                                }
                                if (d.disabled) {
                                    d.enable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: circle.strokeOpacity === 1.0
                        },
                        {
                            itemId: 'decreaseopacity',
                            iconCls: 'icon-sort-desc',
                            text: 'Decrease Opacity',
                            handler: function (item) {
                                var d = item.parentMenu.getComponent('increaseopacity');
                                circle.setOptions({ strokeOpacity: (Math.floor(circle.strokeOpacity * 10.0) - 1.0) / 10.0 });
                                if (circle.strokeOpacity == 0.1) {
                                    item.disable();
                                }
                                if (d.disabled) {
                                    d.enable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: circle.strokeOpacity === 0.1
                        }
                    ]
                }
            },{
                iconCls: 'icon-colorswatch',
                text: 'Fill Color',
                menu: {
				    xtype: 'colormenu',
                    handler: function(p, color) {
                        circle.setOptions({ fillColor: '#' + color });
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
                                circle.setOptions({ fillOpacity: (Math.floor(circle.fillOpacity * 10.0) + 1.0) / 10.0 });
                                if (circle.fillOpacity == 1.0) {
                                    item.disable();
                                }
                                if (d.disabled) {
                                    d.enable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: circle.fillOpacity === 1.0
                        },
                        {
                            itemId: 'decreaseopacity',
                            iconCls: 'icon-sort-desc',
                            text: 'Decrease Opacity',
                            handler: function (item) {
                                var d = item.parentMenu.getComponent('increaseopacity');
                                circle.setOptions({ fillOpacity: (Math.floor(circle.fillOpacity * 10.0) - 1.0) / 10.0 });
                                if (circle.fillOpacity == 0.1) {
                                    item.disable();
                                }
                                if (d.disabled) {
                                    d.enable();
                                }
                            },
                            scope: this,
                            hideOnClick: false,
                            disabled: circle.fillOpacity === 0.1
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