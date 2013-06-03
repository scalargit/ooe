Ext.define('sw.gmap.plugin.GoogleMapTrack', {

    extend: 'o2e.plugin.AbstractDataPlugin',

    pluginId: 'gmapTrack',
    widgetType: 'gmap',
    requiredAnnotations: ['title', 'track_id'],
    optionalAnnotations: ['track_lat', 'track_lng', 'track_lat,lng', 'track_lng,lat', 'geospatial_bearing', 'uid'],
    requiredMetaFields: {
        trackColor: [
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
        trackHistoryPoints: '20'
    },

    trackColor: '#FFFF00',
    trackHistoryPoints: '20',

    tracks: null,
    trackStyles: null,

    init: function () {
        this.tracks = {};
        this.trackStyles = this.widget.gmapTrackState || {};
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
                    for (geoId in this.tracks) {
                        if (this.tracks.hasOwnProperty(geoId)) {
                            fields = Ext.ModelManager.getModel(this.widget.models[this.tracks[geoId].serviceKey]).prototype.fields.getRange();
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
        var keys, map = this.widget.gmap, msg, errCount = 0;

        if (records.length) {
            keys = records[0].fields.keys;
            if ((Ext.Array.indexOf(keys, 'track_lat') === -1 ||
                Ext.Array.indexOf(keys, 'track_lng') === -1) &&
                Ext.Array.indexOf(keys, 'track_lat,lng') === -1 &&
                Ext.Array.indexOf(keys, 'track_lng,lat') === -1) {
                this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'Could not locate data required to plot tracks. Please check data mappings.');
                return;
            }
        }

        Ext.each(records, function (record) {
            var bearing = record.get('geospatial_bearing'),
                title = record.get('title'),
                lat = record.get('track_lat'),
                lng = record.get('track_lng');

            if (!lat || !lng) {
                ll = record.get('track_lat,lng');
                if (ll) {
                    ll = ll.split(ll.indexOf(',') === -1 ? ' ' : ',');
                    lat = ll[0];
                    lng = ll[1];
                } else {
                    ll = record.get('track_lng,lat');
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
                bearing = typeof bearing === 'string' ? parseFloat(Ext.String.trim(bearing)) : bearing;
                if (!lat || !lng) {
                    errCount = errCount + 1;
                    return;
                }
            } catch (e) {
                errCount = errCount + 1;
                return;
            }

            /*
             // set up icon
             // custom icon first
             var iconFields = this.getFieldsWithAnnotation('geospatialIcon'); // custom icon
             var iconLength = iconFields.length;
             if (iconLength > 0) {
             var iconUrl = this.findValue(iconFields, rawRecord);
             if (iconUrl !== '') {
             icon = new GIcon(G_DEFAULT_ICON, iconUrl);
             icon.iconSize = new GSize(16, 16);
             icon.shadowSize = new GSize(0, 0);
             }
             }
             */

            var geoId = record.get('track_id'), track, vd = metadata.viz.gmap,
                trackColor = sw.gmap.Utils.getColorHexValue(vd.trackColor || vd.markerColor || this.trackColor),
                trackHistoryPoints = vd.trackHistoryPoints || this.trackHistoryPoints;

            if (typeof trackHistoryPoints === 'string') {
                trackHistoryPoints = parseInt(trackHistoryPoints, 10);
            }

            if (!this.tracks.hasOwnProperty(geoId)) {
                if (!this.trackStyles[geoId]) {
                    this.trackStyles[geoId] = {
                        trackColor: trackColor,
                        bearingColor: trackColor,
                        bearingWeight: 2,
                        bearingOpacity: 0.8,
                        historyVisible: true,
                        historyPointsVisible: trackHistoryPoints
                    };
                }

                var strokeStyles = this.trackStyles[geoId];
                track = new sw.gmap.Track({
                    map: map,
                    trackColor: strokeStyles.trackColor,
                    bearingColor: strokeStyles.bearingColor,
                    bearingWeight: strokeStyles.bearingWeight,
                    bearingOpacity: strokeStyles.bearingOpacity,
                    historyVisible: strokeStyles.historyVisible,
                    historyPointsVisible: strokeStyles.historyPointsVisible,
                    geoId: geoId
                });
                this.tracks[geoId] = track;
                track.on('showdetails', this.onTrackClick, this);
                track.on('contextclick', this.onTrackContextClick, this);
            } else {
                track = this.tracks[geoId];
            }
            track.update(lat, lng, serviceKey, record, title, bearing);
        }, this);

        msg = 'Plotted ' + (records.length - errCount) + ' of ' + records.length + ' track records.';
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
        for (var track in this.tracks) {
            if (this.tracks.hasOwnProperty(track)) {
                this.tracks[track].destroy();
                delete this.tracks[track];
            }
        }
    },

    onTrackClick: function (serviceKey, record) {
        this.widget.getInfoPanel(serviceKey, record.get('title'), record.data);
        this.fireEvent('click', record);
    },

    onTrackContextClick: function (track, record, event) {
        var p = this.widget.widgetCt.getPosition(),
            point = this.widget.gmapOverlay.getProjection().fromLatLngToContainerPixel(event.latLng);

        Ext.menu.MenuMgr.get({
            plain: true,
            items: [
                {
                    iconCls: 'icon-colorswatch',
                    text: 'Track Color',
                    menu: {
                        xtype: 'colormenu',
                        handler: function (p, color) {
                            var map = track.map;
                            var ll = track.marker.getPosition();
                            var title = track.marker.getTitle();

                            var icon = new google.maps.MarkerImage('images/markers/track-' + color + '.png');

                            var marker = new google.maps.Marker({
                                position: ll,
                                title: title,
                                icon: icon,
                                map: null
                            });
                            google.maps.event.addListener(marker, 'click', Ext.bind(function () {
                                this.fireEvent('showdetails', this.record, this);
                            }, track));
                            google.maps.event.addListener(marker, 'rightclick', Ext.bind(function (e) {
                                this.fireEvent('contextclick', this, this.record, e);
                            }, track));
                            track.marker.setMap(null);
                            marker.setMap(map);
                            marker.wrapperRef = track;

                            //Keep track of state
                            var styles = this.trackStyles[track.geoId];
                            styles.trackColor = color;
                            styles.bearingColor = color;

                            track.marker = marker;
                            track.icon = icon;
                            track.trackColor = styles.trackColor;
                            track.setHistoryPointsVisible(-1);
                            track.setHistoryPointsVisible(styles.historyPointsVisible);
                            track.bearingColor = styles.bearingColor;
                            track.processNewBearingStyle();
                        },
                        scope: this,
                        hideOnClick: false
                    }
                },
                /*{
                 xtype: 'menucheckitem',
                 text: 'Show History',
                 checked: overlay.cwfRef.historyVisible,
                 checkHandler: function(item, show) {
                 overlay.cwfRef.setHistoryVisible(show);
                 this.trackStyles[overlay.cwfRef.geoId].historyVisible = show;
                 if (!show) {
                 item.parentMenu.disable();
                 } else if (item.parentMenu.disabled) {
                 item.parentMenu.enable();
                 }
                 },
                 scope: this
                 },*/{
                    text: 'History Points',
                    icon: '',
                    menu: {
                        items: [
                            {
                                itemId: 'increasehistory',
                                iconCls: 'icon-sort-asc',
                                text: 'Increase Points',
                                handler: function (item) {
                                    var s = this.trackStyles[track.geoId],
                                        d = item.parentMenu.getComponent('decreasehistory');
                                    s.historyPointsVisible++;
                                    track.setHistoryPointsVisible(s.historyPointsVisible);
                                    if (d.disabled) {
                                        d.enable();
                                    }
                                },
                                scope: this,
                                hideOnClick: false
                            },
                            {
                                itemId: 'decreasehistory',
                                iconCls: 'icon-sort-desc',
                                text: 'Decrease Points',
                                handler: function (item) {
                                    var s = this.trackStyles[track.geoId];
                                    s.historyPointsVisible--;
                                    track.setHistoryPointsVisible(s.historyPointsVisible);
                                    if (track.historyPointsVisible === 0) {
                                        item.disable();
                                    }
                                },
                                scope: this,
                                hideOnClick: false,
                                disabled: track.historyPointsVisible === 0
                            }
                        ]
                    }
                },
                {
                    iconCls: 'icon-colorswatch',
                    text: 'Bearing Color',
                    menu: {
                        xtype: 'colormenu',
                        handler: function (p, color) {
                            track.bearingColor = color;
                            track.processNewBearingStyle();
                            this.trackStyles[track.geoId].bearingColor = color;
                        },
                        scope: this,
                        hideOnClick: false
                    }
                },
                {
                    iconCls: 'icon-chartline',
                    text: 'Bearing Weight',
                    menu: {
                        items: [
                            {
                                itemId: 'increaseweight',
                                iconCls: 'icon-sort-asc',
                                text: 'Increase Weight',
                                handler: function (item) {
                                    var s = this.trackStyles[track.geoId],
                                        d = item.parentMenu.getComponent('decreaseweight');
                                    s.bearingWeight++;
                                    track.bearingWeight = s.bearingWeight;
                                    track.processNewBearingStyle();
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
                                    var s = this.trackStyles[track.geoId];
                                    s.bearingWeight--;
                                    track.bearingWeight = s.bearingWeight;
                                    track.processNewBearingStyle();
                                    if (track.bearingWeight === 1) {
                                        item.disable();
                                    }
                                },
                                scope: this,
                                hideOnClick: false,
                                disabled: track.bearingWeight === 1
                            }
                        ]
                    }
                },
                {
                    iconCls: 'icon-contrast',
                    text: 'Bearing Opacity',
                    menu: {
                        items: [
                            {
                                itemId: 'increaseopacity',
                                iconCls: 'icon-sort-asc',
                                text: 'Increase Opacity',
                                handler: function (item) {
                                    var s = this.trackStyles[track.geoId],
                                        d = item.parentMenu.getComponent('decreaseopacity');
                                    s.bearingOpacity = (Math.floor(s.opacity * 10.0) + 1.0) / 10.0;
                                    track.bearingOpacity = s.bearingOpacity;
                                    track.processNewBearingStyle();
                                    if (track.bearingOpacity == 1.0) {
                                        item.disable();
                                    }
                                    if (d.disabled) {
                                        d.enable();
                                    }
                                },
                                scope: this,
                                hideOnClick: false,
                                disabled: track.bearingOpacity == 1.0
                            },
                            {
                                itemId: 'decreaseopacity',
                                iconCls: 'icon-sort-desc',
                                text: 'Decrease Opacity',
                                handler: function (item) {
                                    var s = this.trackStyles[track.geoId],
                                        d = item.parentMenu.getComponent('increaseopacity');
                                    s.bearingOpacity = (Math.floor(s.opacity * 10.0) - 1.0) / 10.0;
                                    track.bearingOpacity = s.bearingOpacity;
                                    track.processNewBearingStyle();
                                    if (track.bearingOpacity == 0.1) {
                                        item.disable();
                                    }
                                    if (d.disabled) {
                                        d.enable();
                                    }
                                },
                                scope: this,
                                hideOnClick: false,
                                disabled: track.bearingOpacity == 0.1
                            }
                        ]
                    }
                }
            ]
        }).showAt([Math.round(point.x) + p[0], Math.round(point.y) + p[1]]);
    },

    getStateConfig: function () {
        return {
            gmapTrackState: this.trackStyles
        };
    }

}, function () {
    o2e.plugin.DataPluginMgr.reg(this);
});