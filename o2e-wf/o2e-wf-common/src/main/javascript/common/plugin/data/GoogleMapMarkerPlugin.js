Ext.define('o2e.demo.plugin.GoogleMapMarkerPlugin', {

    extend: 'o2e.plugin.AbstractDataPlugin',

    pluginId: 'gmapMarker',
    widgetType: 'gmap',
    requiredAnnotations: ['title', 'marker_id'],
    optionalAnnotations: ['marker_lat', 'marker_lng', 'marker_lat,lng', 'marker_lng,lat', 'marker_url', 'uid'],
    requiredMetaFields: {
        marker: 'images/markers/FFFF00.png',
        markerColor: [
            ['Pink', 'pink'],
            ['Red', 'red'],
            ['Orange', 'orange'],
            ['Yellow', 'yellow'],
            ['Green', 'green'],
            ['Light Blue', 'lightBlue'],
            ['Blue', 'blue'],
            ['Purple', 'purple'],
            ['Black', 'black'],
            ['Earthquake', 'earthquake'],
            ['Tropical Storm', 'tropicalStorm'],
            ['Tsunami', 'tsunami'],
            ['Red 1', 'red1'],
            ['Red 2', 'red2'],
            ['Red 3', 'red3'],
            ['Red 4', 'red4'],
            ['Red 5', 'red5'],
            ['Red 6', 'red6'],
            ['Red 7', 'red7'],
            ['Red 8', 'red8'],
            ['Red 9', 'red9'],
            ['Red 10', 'red10']
        ]
    },

    marker: 'images/markers/FFFF00.png',
    markers: null,

    init: function() {
        this.callParent();
        this.markers = {};

        this.addEvents('click');

        this.widget.addAvailableEventSource({
            name: 'clicks a marker',
            source: this,
            event: 'click',
            args: [{
                name: 'Entire record'
            },{
                name: 'record',
                index: 0,
                getValues: Ext.Function.bind(function() {
                    var serviceKey, x, xlen, vals = [], fields;
                    for (serviceKey in this.markers) {
                        if (this.markers.hasOwnProperty(serviceKey) && this.markers[serviceKey].length) {
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
        var keys, msg, errCount = 0, i, len, lat, lng, ll, latLng, marker, iconUrl, icon = this.getIcon(metadata);

        if (!this.markers.hasOwnProperty(serviceKey)) {
            this.markers[serviceKey] = [];
        }

        if (records.length) {
            keys = records[0].fields.keys;
            if ((Ext.Array.indexOf(keys, 'marker_lat') === -1 ||
                Ext.Array.indexOf(keys, 'marker_lng') === -1) &&
                Ext.Array.indexOf(keys, 'marker_lat,lng') === -1 &&
                Ext.Array.indexOf(keys, 'marker_lng,lat') === -1) {
                this.widget.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'Could not locate data required to plot markers. Please check data mappings.');
                return;
            }
        }

        for (i=0, len=records.length; i<len; i++) {
            lat = records[i].get('marker_lat');
            lng = records[i].get('marker_lng');
            if (!lat || !lng) {
                ll = records[i].get('marker_lat,lng');
                if (ll) {
                    ll = ll.split(ll.indexOf(',') === -1 ? ' ' : ',');
                    lat = ll[0];
                    lng = ll[1];
                } else {
                    ll = records[i].get('marker_lng,lat');
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
                    iconUrl = records[i].get('marker_url');
                    marker = new google.maps.Marker({
                        position: latLng,
                        map: this.widget.gmap,
                        title: records[i].get('title'),
                        // uid: records[i].get('uid'),
                        icon: (iconUrl && iconUrl !== '') ? new google.maps.MarkerImage(iconUrl) : icon
                    });
                    google.maps.event.addListener(marker, 'click', Ext.bind(this.onMarkerClick, this, [serviceKey, records[i]], 0));
                    google.maps.event.addListener(marker, 'rightclick', Ext.bind(this.onMarkerContextClick, this, [marker], 0));

                    this.markers[serviceKey].push(marker);
                }
            } catch (e) {
                errCount = errCount + 1;
            }
        }

        msg = 'Plotted '+(records.length - errCount)+' of '+records.length+' marker records.';
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
        var i, len, markers = this.markers[serviceKey];
        if (Ext.isArray(markers)) {
            for (i=0, len=markers.length; i<len; i++) {
                markers[i].setMap(null);
            }
            markers = [];
        }
    },

    getIcon: function(metadata) {
        // defaults to yellow marker
        var path = window.location.protocol + '//' + window.location.host + window.location.pathname + this.marker;
        // safety check
        if (metadata.viz !== undefined && metadata.viz.gmap !== undefined) {
            // first, we let gmap.marker take precedence
            // if there is no gmap.marker defined, then we go for gmap.markerColor
            if (metadata.viz.gmap.markerColor !== undefined && metadata.viz.gmap.markerColor !== null && metadata.viz.gmap.markerColor !== '') {
                path = 'images/markers/' + sw.gmap.Utils.getColorHexValue(metadata.viz.gmap.markerColor) + '.png';
            } else if (metadata.viz.gmap.marker !== undefined && metadata.viz.gmap.marker !== null && !Ext.isEmpty(metadata.viz.gmap.marker)) {
                path = metadata.viz.gmap.marker;
            }
            // prefix it if there's no protocol
            if (path.indexOf('http') !== 0) {
                path = window.location.protocol + '//' + window.location.host + window.location.pathname + path;
            }
        }
        return new google.maps.MarkerImage(path);
    },

    onMarkerClick: function(serviceKey, record, event) {
        this.widget.getInfoPanel(serviceKey, record.get('title'), record.data);
        this.fireEvent('click', record);
    },

    onMarkerContextClick: function(marker, event) {
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
                        marker.setIcon(new google.maps.MarkerImage(window.location.protocol + '//' + window.location.host + window.location.pathname + 'images/markers/' + color + '.png'));
                    },
                    scope: this,
                    hideOnClick: false
                }
            }]
        }).showAt([Math.round(point.x) + p[0], Math.round(point.y) + p[1]]);
    }

}, function() {
    o2e.plugin.DataPluginMgr.reg(this);
});