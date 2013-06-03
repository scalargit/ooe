/**
 *  Polyline class used to manage multple google.maps.Polyline Segments in order to avoid google.maps.Polyline redraw issue.
 *  Adapted from Google Maps v2 version cwf.Polyline
 * @author Michael Ho
 */
Ext.define('sw.gmap.Polyline', {
    extend: 'Ext.util.Observable',

    record: null, //This value will change because it will reflect the id of the last segment record

	/**
	 * The google.maps.Map object to which to add the polyline segments.
	 */
	map : null,
	/**
	 * Read-only. Use setVisible to modify.
	 * True to render segments upon creation. False to keep them hidden. This will
	 * only add the polylines to the map if set to true.
	 */
	visible : true,
	/**
	 * Read-only. Use setColor to modify.
	 * The color to use in creation of the google.maps.Polylines created herein. Changes made to
	 * this after instantiation will NOT update existing segments.
	 */
	color : "#CC0000",
	/**
	 * Read-only. Use setWeight to modify.
	 * The weight (width of line) to use in creation of the google.maps.Polylines created herein.
	 * Changes made to this after instantiation will NOT update existing segments.
	 */
	weight : 2,
	/**
	 * Read-only. Use setOpacity to modify.
	 * The opacity to use in creation of the google.maps.Polylines created herein. Changes made to
	 * this after instantiation will NOT update existing segments.
	 */
	opacity : 1,
	/**
	 * The number of points that can be placed in a segment. Once this number is reached
	 * a new segment will be created the next time a vertex is added.
	 */
	maxSegmentPoints : 5,
	/**
	 * Array of google.maps.Polyline objects representing each segment in the line.
	 */
	segments : null,
	/**
	 * Array of booleans denoting whether or not a particular segment has been rendered.
	 * Segments are only rendered when visible is true. So if visible is false when a
	 * segment is created we need this to determine whether to add it or show it when/if
	 * visible is set to true.
	 */
	segmentsRendered : null,
	/**
	 * Keeps track of all the GLatLng objects in the last segment in the polyline. This
	 * is needed to recreate the last segment until it reaches capacity (as defined by
	 * this.maxSegmentPoints).
	 */
	lastSegmentPoints : null,
	/**
	 * Read-only. This can only be overridden on instantiation.
	 * Allows updates to opacity, weight and color on the fly. This has a performance
	 * impact so it can be turned on and off.
	 */
	allowOptionEditing : false,
	/**
	 * Keeps track of all points in the line. This is only populated for the sake of
	 * allowing option editing so it will be empty if allowOptionEditing is turned off.
	 */
	points : null,

    constructor: function(config) {
        Ext.apply(this, config);

        this.addEvents('showdetails', 'contextclick');

        this.segments = [];
        this.segmentsRendered = [];
        this.lastSegmentPoints = [];
        this.points = []; //Unused for now
    },

    /**
	 * Adds a latitude and longitude to the polyline. If the last segment in the polyline
	 * has reached capacity (as determined by this.maxSegmentPoints) or if no vertices
	 * exist for this line yet, it will create and add a new segment. Otherwise it will
	 * recreate the last segment.
	 */
	addVertex : function(lat, lng, serviceKey, record) {

        this.serviceKey = serviceKey;
		this.record = record;

		var latLng = new google.maps.LatLng(parseFloat(lat), parseFloat(lng));

		//store off every point in the polyline in order to be able to recreate the line
		if (this.allowOptionEditing) {
			this.points.push(latLng);
		}

		//check last segment length to see if you need a new segment
		if (this.lastSegmentPoints.length < this.maxSegmentPoints) {
			//remove segment from persistance storage and remove from UI.
			var segment = this.segments.pop();
			var isRendered = this.segmentsRendered.pop();
			//If there are not yet segments
			if (segment && this.visible && isRendered) {
				segment.setMap(null);
			}
            //add in new vertex to lastSegmentPoints
			this.lastSegmentPoints.push(latLng);
		} else {
			var lastPoint = this.lastSegmentPoints.pop();
			//clear out lastSegmentPoints
			delete this.lastSegementPoints;
			//fresh array with new vertex
			this.lastSegmentPoints = [lastPoint, latLng];
		}

		if (this.lastSegmentPoints.length > 1) {
			//and now we render
			return this.createPolyline();
		} else {
			return null;
		}
	},

	/**
	 * Shows or hides all segments in the polyline based on the visible parameter.
	 */
	setVisible : function(visible) {
		var i;
		//if visible is same as before we don't need to do anything
		if (visible === this.visible) {
			return;
		}
		//if visible add all segments to the map else remove them all
		if (visible) {
			for (i=0; i<this.segments.length; i++) {
				this.segments[i].setMap(this.map);
				this.segmentsRendered[i] = true;
			}
		} else {
			for (i=0; i<this.segments.length; i++) {
				this.segments[i].setMap(null);
			}
		}
		//keep track of visible status
		this.visible = visible;
	},

	/**
	 * Modifies the opactiy of all segments in this polyline.
	 */
	setOpacity : function(opacity) {
		if (!this.allowOptionEditing) {
			throw "Polyline: Cannot modify opacity with allowOptionEditing flag set to false.";
		}
		this.opacity = opacity;
		this.processNewStrokeStyle();
	},

	/**
	 * Modifies the weight of all segments in this polyline.
	 */
	setWeight : function(weight) {
		if (!this.allowOptionEditing) {
			throw "Polyline: Cannot modify weight with allowOptionEditing flag set to false.";
		}
		this.weight = weight;
		this.processNewStrokeStyle();
	},

	/**
	 * Modifies the color of all segments in this polyline.
	 */
	setColor : function(color) {
		if (!this.allowOptionEditing) {
			throw "Polyline: Cannot modify color with allowOptionEditing flag set to false.";
		}
		this.color = color;
		this.processNewStrokeStyle();
	},

	processNewStrokeStyle : function() {
		for (var i=0; i<this.segments.length; i++) {
			this.segments[i].setOptions({
				strokeColor: this.color,
				strokeWeight: this.weight,
				strokeOpacity: this.opacity
			});
		}
	},

	onClick : function(e) {
		this.fireEvent("showdetails", this.serviceKey, this.record);
	},

    onContextClick: function(e) {
        this.fireEvent('contextclick', this, this.record, e);
    },

	destroy : function() {
		Ext.iterate(this.segments, function(item, idx) {
			if (this.segmentsRendered[idx]) {
				item.setMap(null);
			}
		}, this);
	},

	// Private
	createPolyline : function() {
		//create the google.maps.Polyline with the lastSegmentPoints
		var polyline = new google.maps.Polyline({
            map: this.visible ? this.map : null, // add it to the map if necessary
            path: this.lastSegmentPoints,
            strokeColor: this.color,
            strokeWeight: this.weight,
            strokeOpacity: this.opacity,
            geodesic: true
        });
		polyline.wrapperRef = this;
		//now store off this as a segment
		this.segments.push(polyline);
        //add click handlers
		google.maps.event.addListener(polyline, 'click', Ext.bind(this.onClick, this));
        google.maps.event.addListener(polyline, 'rightclick', Ext.bind(this.onContextClick, this));
		this.segmentsRendered.push(this.visible);
		return polyline;
	},

	// Private
	refreshSegments : function() {
		//Efficient-ish implementation here so that segments are recreated all at once.
		//A shorter, simpler impl using addVertex would have worked, but would be silly.
		for (var i=0; i<this.segments.length; i++) {
			//Get the existing overlay off the map
			if (this.segmentsRendered[i]) {
				var seg = this.segments[i];
				seg.setMap(null);
			}
			//Determine segment start/end indices
			var start = i * this.maxSegmentPoints;
			var end = this.points.length;
			if (start + this.maxSegmentPoints < this.points.length) {
				end = start + this.maxSegmentPoints;
			}
			//Set up variables for createPolyline
			this.lastSegmentPoints = this.points.slice(start, end);
			this.segments.pop();
			this.segmentsRendered.pop();
			//And now we rerender the segment
			this.createPolyline();
		}
	}
});
