Ext.define('sw.gmap.plugin.GoogleMapPolyline', {

    extend: 'o2e.plugin.AbstractDataPlugin',

    pluginId: 'gmapPolyline',
    widgetType: 'gmap',
    requiredAnnotations: ['title', 'polyline_id'],
    optionalAnnotations: ['polyline_lat', 'polyline_lng', 'polyline_lat,lng', 'polyline_lng,lat', 'uid'],
    requiredMetaFields: {
        polylineColor: [
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
        polylineThickness: '2'
    },

    polylineColor: 'yellow',
    polylineThickness: '2',

    polylines: null,
    polylineStyles: null,

    init: function () {
        this.polylineStyles = this.widget.gmapPolyState || {};
        this.polylines = {};
        this.callParent();

        this.addEvents('click');

        this.widget.addAvailableEventSource({
            name: 'clicks a polyline',
            source: this,
            event: 'click',
            args: [{
                name: 'Entire record'
            },{
                name: 'record',
                index: 0,
                getValues: Ext.Function.bind(function() {
                    var geoId, x, xlen, vals = [], fields;
                    for (geoId in this.polylines) {
                        if (this.polylines.hasOwnProperty(geoId)) {
                            fields = Ext.ModelManager.getModel(this.widget.models[this.polylines[geoId].serviceKey]).prototype.fields.getRange();
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

    addData: function (records, serviceKey, metadata) {
        var msg, errCount = 0;

        if (records.length) {
            keys = records[0].fields.keys;
            if ((Ext.Array.indexOf(keys, 'polyline_lat') === -1 ||
                Ext.Array.indexOf(keys, 'polyline_lng') === -1) &&
                Ext.Array.indexOf(keys, 'polyline_lat,lng') === -1 &&
                Ext.Array.indexOf(keys, 'polyline_lng,lat') === -1) {
                this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'Could not locate data required to plot lines. Please check data mappings.');
                return;
            }
        }

        Ext.each(records, function (record) {
            var polyline, geoId = record.get('polyline_id'),
                lat = record.get('polyline_lat'),
                lng = record.get('polyline_lng');

            if (!lat || !lng) {
                ll = record.get('polyline_lat,lng');
                if (ll) {
                    ll = ll.split(ll.indexOf(',') === -1 ? ' ' : ',');
                    lat = ll[0];
                    lng = ll[1];
                } else {
                    ll = record.get('polyline_lng,lat');
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
                    return;
                }
            } catch (e) {
                errCount = errCount + 1;
                return;
            }

            if (!this.polylines[geoId]) {
                var strokeStyles, strokeColor = sw.gmap.Utils.getColorHexValue(metadata.viz.gmap.polylineColor || this.polylineColor);

                if (!this.polylineStyles[geoId]) {
                    strokeStyles = this.polylineStyles[geoId] = {
                        color: '#' + strokeColor,
                        visible: true,
                        weight: Number(metadata.viz.gmap.polylineThickness) || 2,
                        opacity: 1.0
                    };
                } else {
                    strokeStyles = this.polylineStyles[geoId];
                }

                polyline = new sw.gmap.Polyline({
                    map: this.widget.gmap,
                    color: strokeStyles.color,
                    visible: strokeStyles.visible,
                    maxSegmentPoints: 5,
                    weight: strokeStyles.weight,
                    opacity: strokeStyles.opacity,
                    allowOptionEditing: true,
                    geoId: geoId
                });

                this.polylines[geoId] = polyline;
                polyline.on('showdetails', this.onPolylineClick, this);
                polyline.on('contextclick', this.onPolylineContextClick, this);
            } else {
                polyline = this.polylines[geoId];
            }
            polyline.addVertex(lat, lng, serviceKey, record);
        }, this);

        msg = 'Plotted ' + (records.length - errCount) + ' of ' + records.length + ' polyline records.';
        if (errCount === 0) {
            this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, msg);
        } else {
            this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.WARN, msg);
        }
    },

    updateData: function (records, serviceKey, metadata) {
        //TBD
    },

    removeData: function (records, serviceKey, metadata) {
        //TBD
    },

    clearData: function (serviceKey) {
        for (var polyline in this.polylines) {
            if (this.polylines.hasOwnProperty(polyline)) {
                this.polylines[polyline].destroy();
                delete this.polylines[polyline];
            }
        }
    },

    onPolylineClick: function (serviceKey, record) {
        this.widget.getInfoPanel(serviceKey, record.get('title'), record.data);
        this.fireEvent('click', record);
    },

    onPolylineContextClick: function (polyline, record, event) {
        var p = this.widget.widgetCt.getPosition(),
            point = this.widget.gmapOverlay.getProjection().fromLatLngToContainerPixel(event.latLng);

        Ext.menu.MenuMgr.get({
            plain: true,
            items: [
                {
                    iconCls: 'icon-colorswatch',
                    text: 'Color',
                    menu: {
                        xtype: 'colormenu',
                        handler: function (p, color) {
                            this.polylineStyles[polyline.geoId].color = '#' + color;
                            polyline.setColor('#' + color);
                        },
                        scope: this,
                        hideOnClick: false
                    }
                },
                {
                    iconCls: 'icon-chartline',
                    text: 'Weight',
                    menu: {
                        items: [
                            {
                                itemId: 'increaseweight',
                                iconCls: 'icon-sort-asc',
                                text: 'Increase Weight',
                                handler: function (item) {
                                    var s = this.polylineStyles[polyline.geoId],
                                        d = item.parentMenu.getComponent('decreaseweight');
                                    s.weight++;
                                    polyline.setWeight(s.weight);
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
                                    var s = this.polylineStyles[polyline.geoId];
                                    s.weight--;
                                    polyline.setWeight(s.weight);
                                    if (polyline.weight == 1) {
                                        item.disable();
                                    }
                                },
                                scope: this,
                                hideOnClick: false,
                                disabled: polyline.weight === 1
                            }
                        ]
                    }
                },
                {
                    iconCls: 'icon-contrast',
                    text: 'Opacity',
                    menu: {
                        items: [
                            {
                                itemId: 'increaseopacity',
                                iconCls: 'icon-sort-asc',
                                text: 'Increase Opacity',
                                handler: function (item) {
                                    var s = this.polylineStyles[polyline.geoId],
                                        d = item.parentMenu.getComponent('decreaseopacity');
                                    s.opacity = (Math.floor(s.opacity * 10.0) + 1.0) / 10.0;
                                    polyline.setOpacity(s.opacity);
                                    if (polyline.opacity == 1.0) {
                                        item.disable();
                                    }
                                    if (d.disabled) {
                                        d.enable();
                                    }
                                },
                                scope: this,
                                hideOnClick: false,
                                disabled: polyline.opacity === 1.0
                            },
                            {
                                itemId: 'decreaseopacity',
                                iconCls: 'icon-sort-desc',
                                text: 'Decrease Opacity',
                                handler: function (item) {
                                    var s = this.polylineStyles[polyline.geoId],
                                        d = item.parentMenu.getComponent('increaseopacity');
                                    s.opacity = (Math.floor(s.opacity * 10.0) - 1.0) / 10.0;
                                    polyline.setOpacity(s.opacity);
                                    if (polyline.opacity == 0.1) {
                                        item.disable();
                                    }
                                    if (d.disabled) {
                                        d.enable();
                                    }
                                },
                                scope: this,
                                hideOnClick: false,
                                disabled: polyline.opacity === 0.1
                            }
                        ]
                    }
                }
            ]
        }).showAt([Math.round(point.x) + p[0], Math.round(point.y) + p[1]]);
    },

    getStateConfig: function () {
        return {
            gmapPolyState: this.polylineStyles
        }
    }

}, function () {
    o2e.plugin.DataPluginMgr.reg(this);
});