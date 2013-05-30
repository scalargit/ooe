Ext.define('o2e.demo.plugin.GoogleMapAddressMarkerPlugin', {

    extend: 'o2e.plugin.AbstractDataPlugin',

    pluginId: 'gmapAddressMarker',
    widgetType: 'gmap',
    requiredAnnotations: ['marker_address', 'title'],
    optionalAnnotations: ['uid'],

    markers: null,

    init: function() {
        this.callParent();
        this.markers = {};
    },

    addData: function(records, serviceKey, metadata) {
        var i, len, geo = new google.maps.Geocoder();

        if (!this.markers.hasOwnProperty(serviceKey)) {
            this.markers[serviceKey] = [];
        }

        for (i=0, len=records.length; i<len; i++) {
            geo.geocode({ address: records[i].get('marker_address') }, Ext.Function.bind(this.geocoderHandler, this, [serviceKey, records[i].get('title'), this.getIcon(metadata)], true));
        }
    },

    geocoderHandler: function(results, status, serviceKey, title, icon) {
        var i, len, marker;
        if (results && results.length) {
            for (i=0, len=results.length; i<len; i++) {
                marker = new google.maps.Marker({
                    position: results[i].geometry.location,
                    map: this.widget.gmap,
                    title: title,
                    icon: icon
                });
                this.markers[serviceKey].push(marker);
            }
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
            markers.clear();
        }
    },

    getIcon: function(metadata) {
        var prefix = '';
        if (metadata.viz !== undefined && metadata.viz.gmap !== undefined && metadata.viz.gmap.marker !== undefined) {
            if (metadata.viz.gmap.marker.indexOf('http') !== 0) {
                prefix = window.location.protocol + '//' + window.location.host + window.location.pathname;
            }
            return new google.maps.MarkerImage(prefix + metadata.viz.gmap.marker);
        }
    }

}, function() {
    o2e.plugin.DataPluginMgr.reg(this);
});