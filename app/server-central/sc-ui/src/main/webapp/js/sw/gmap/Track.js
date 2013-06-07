/**
 * Track class used to manage a moving marker, historical polyline and bearing.
 *
 * TODO: figure out how to change title of a marker
 * TODO: add good way to update marker icon
 * TODO: add support for changing historyIcon
 *
 * @author Aaron Smith, Google Maps v2 version
 * @author Michael Ho, Google Maps v3 adaptation (current)
 */
Ext.define('sw.gmap.Track', {
    extend: 'Ext.util.Observable',

    record: null, //This value will change because it will reflect the id of the last segment record
	map : null,
	visible : true,

	trackColor : null,
	marker : null,

	//To change set this and do manually off the marker object
	icon : null,

	bearingPolyline : null,

	//To change bearingColor, weight and opacity, update these and then call processNewBearingStyle
	bearingColor : "#CC0000",
	bearingWeight : 2,
	bearingOpacity : 1,

	historyMarkers : null,
	historyVisible : true,

	//To change call setHistoryPointsVisible or the increment/decrement functions
	historyPointsVisible : 20,
	historyIcon : 'images/markers/track-history-',

	points : null,

    constructor: function(config) {
        Ext.apply(this, config);

        this.addEvents('showdetails', 'contextclick');

        this.points = [];
        this.historyMarkers = [];
    },

    update : function(lat, lng, serviceKey, record, title, bearing) {
	    var latLng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));

		//Add to points array (at beginning!)
		this.points.unshift(latLng);

        this.serviceKey = serviceKey;
		this.record = record;

		if (this.marker) {
			//Update marker position
			this.marker.setMap(null);
			delete this.marker;
			this.marker = new google.maps.Marker({
                position: latLng,
                map: this.map,
                title: title,
                icon: this.icon
            });
			google.maps.event.addListener(this.marker, 'click', Ext.bind(function(e) {
                this.fireEvent('showdetails', this.serviceKey, this.record, this);
            }, this));
            google.maps.event.addListener(this.marker, 'rightclick', Ext.bind(function(e) {
                this.fireEvent('contextclick', this, this.record, e);
            }, this));
            this.marker.wrapperRef = this;

			//Remove bearing (if applicable)
			if (this.bearingPolyline) {
				this.bearingPolyline.setMap(null);
				delete this.bearingPolyline;
			}

			//Update historyPolyline (if applicable)
            if (this.historyPointsVisible > 0) {
				var icon = new google.maps.MarkerImage(this.historyIcon + this.trackColor + '.png');
                var hMarker = new google.maps.Marker({
                    position: this.points[1],
                    title: title,
                    icon: icon,
                    map: this.map
                });
                google.maps.event.addListener(hMarker, 'click', Ext.bind(function() {
                    this.fireEvent('showdetails', this.serviceKey, this.record, this);
                }, this));
                google.maps.event.addListener(hMarker, 'rightclick', Ext.bind(function(e) {
                    this.fireEvent('contextclick', this, this.record, e);
                }, this));
                hMarker.wrapperRef = this;
				this.historyMarkers.unshift(hMarker);
			}
			this.truncateHistoryPoints();
		} else {
			//Create the icon
			this.icon = new google.maps.MarkerImage('images/markers/track-' + this.trackColor + '.png');
			//Create the marker
			this.marker = new google.maps.Marker({
                position: latLng,
                title: title,
                icon: this.icon,
                map: this.map
            });
            google.maps.event.addListener(this.marker, 'click', Ext.bind(function() {
                this.fireEvent('showdetails', this.serviceKey, this.record, this);
            }, this));
            google.maps.event.addListener(this.marker, 'rightclick', Ext.bind(function(e) {
                this.fireEvent('contextclick', this, this.record, e);
            }, this));
			this.marker.wrapperRef = this;
		}

		//Create the bearing (if applicable)
		if (bearing && bearing !== '') {
			var R = 6371, // earth's mean radius in km
			    d = 4,
			    lat1 = latLng.y* Math.PI / 180,
			    lon1 = latLng.x* Math.PI / 180,
			    brng = bearing * Math.PI / 180;
			var lat2 = Math.asin(Math.sin(lat1)*Math.cos(d/R) + Math.cos(lat1)*Math.sin(d/R)*Math.cos(brng));
			var lon2 = lon1 + Math.atan2(Math.sin(brng)*Math.sin(d/R)*Math.cos(lat1), Math.cos(d/R)-Math.sin(lat1)*Math.sin(lat2));
			// console.debug(lat1 + '|' + lon1 + '|' + lat2 + '|' + lon2);
			var points = [ latLng, new google.maps.LatLng(lat2* 180 / Math.PI, lon2* 180 / Math.PI) ];
			this.bearingPolyline = new google.maps.Polyline({
                map: this.map, // add it to the map if necessary
                path: points,
                strokeColor: this.bearingColor,
                strokeWeight: this.bearingWeight,
                strokeOpacity: this.bearingOpacity,
                geodesic: true
            });
            //points, this.bearingColor, this.bearingWeight, this.bearingOpacity);
			this.map.addOverlay(this.bearingPolyline);
		}
	},

	decrementHistoryPointsVisible : function() {
		if (this.historyPointsVisible > 0) {
			this.setHistoryPointsVisible(this.historyPointsVisible-1);
		}
	},

	incrementHistoryPointsVisible : function() {
		if (this.historyPointsVisible >= 0) {
			this.setHistoryPointsVisible(this.historyPointsVisible+1);
		} else {
			this.setHistoryPointsVisible(1);
		}
	},

	setHistoryVisible : function(visible) {
		if (this.historyVisible != visible) {
			Ext.each(this.historyMarkers, function(marker) {
				if (visible) {
					marker.show();
				} else {
					marker.hide();
				}
			});
			this.historyVisible = visible;
		}
	},

	setHistoryPointsVisible : function(pointsVisible) {
		if (pointsVisible < 0) {
			pointsVisible = 0;
		}
		var truncate = (pointsVisible < this.historyPointsVisible);
		this.historyPointsVisible = pointsVisible;
		if (truncate) {
			this.truncateHistoryPoints();
		} else {
			this.elongateHistoryPoints();
		}
	},

	truncateHistoryPoints : function() {
		while (this.historyMarkers.length > this.historyPointsVisible) {
			this.historyMarkers.pop().setMap(null);
		}
	},

	elongateHistoryPoints : function() {
		while (this.historyMarkers.length < this.historyPointsVisible && this.points.length > this.historyMarkers.length+1) {
			var icon = new google.maps.MarkerImage(this.historyIcon + this.trackColor + '.png');
			var hMarker = new google.maps.Marker({
                position: this.points[this.historyMarkers.length+1],
                title: this.marker.getTitle(),
                icon: icon,
                map: this.map
            });
            google.maps.event.addListener(hMarker, 'click', Ext.bind(function() {
                this.fireEvent('showdetails', this.serviceKey, this.record, this);
            }, this));
            google.maps.event.addListener(hMarker, 'rightclick', Ext.bind(function(e) {
                this.fireEvent('contextclick', this, this.record, e);
            }, this));
			this.historyMarkers.push(hMarker);
			hMarker.wrapperRef = this;
		}
	},

	setBearingVisible : function(visible) {
		if (this.bearingVisible != visible && this.bearingPolyline) {
			if (visible) {
				this.bearingPolyline.show();
			} else {
				this.bearingPolyline.hide();
			}
			this.bearingVisible = visible;
		}
	},

	processNewBearingStyle : function() {
		if (this.bearingPolyline) {
			this.bearingPolyline.setStrokeStyle({
                color: this.bearingColor,
				weight: this.bearingWeight,
				opacity: this.bearingOpacity
			});
		}
	},

	destroy : function() {
		if (this.marker) {
			this.marker.setMap(null);
		}
		if (this.bearingPolyline) {
			this.bearingPolyline.setMap(null);
		}
		Ext.iterate(this.historyMarkers, function(marker) {
			marker.setMap(null);
		}, this);
	}
});