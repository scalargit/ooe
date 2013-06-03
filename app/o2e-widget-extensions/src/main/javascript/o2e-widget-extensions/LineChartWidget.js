Ext.define('o2e.LineChartWidget', {
    extend: 'o2e.widget.AbstractChartWidget',

    requiredAnnotations: ['line_x_axis', 'line_y_axis'],
    optionalAnnotations: [],
    requiredMetaFields: {
        xLabel: 'X Axis',
        yLabel: 'Y Axis',
        markerStyle: [['cross','cross'],['circle','circle']],
        markerSize: '4',
        markerRadius: '4',
        markerStrokeWidth: '0'
    },

    //General chart configs
    type: 'line',
    exposeClickEvent: true,
    minAxes: NaN,
    minSeries: NaN,
    chartType: 'line',
    chartDefaults: {
        animate: true,
        theme: 'Base:gradients',
        insetPadding: 5,
        shadow: true
    },

    //Chart specific configs here
    xLabel: 'X Axis',
    yLabel: 'Y Axis',
    markerStyle: 'cross',
    markerSize: '4',
    markerRadius: '4',
    markerStrokeWidth: '0',
    chartFields: null,

    getChartFields: function() {
        var serviceKey;

        if (!this.chartFields) {
            this.chartFields = [];
            for (serviceKey in this.services) {
                if (this.services.hasOwnProperty(serviceKey)) {
                    this.chartFields = this.chartFields.concat(o2e.data.DataUtils.getFieldsWithAnnotation('line_y_axis',this.services[serviceKey].metadata));
                }
            }
            if (this.chartFields.length > 1) {
                this.chartDefaults.legend = { position: 'bottom' };
            }
        }

        return this.chartFields;
    },

    buildAxes: function() {
        return [{
            type: 'Numeric',
			minimum: NaN,
            position: 'left',
            fields: this.getChartFields(),
            title: this.yLabel,
            decimals: 0
           
        },{
            type: 'Category',
            position: 'bottom',
			fields: ['line_x_axis'],
            title: this.xLabel,
			label: {
						rotate: {
							degrees: 315
						}
					}		
        }];
    },

    buildSeries: function() {
        var i, len, fields = this.getChartFields(), series = [];
        for (i=0,len=fields.length;i<len;i++) {
            series.push({
                type: 'line',
                axis: 'left',
				minimum: NaN,
				smooth: true,
				fill: true,
                fillOpacity: 0.5,
                xField: 'line_x_axis',
                yField: fields[i],
                markerConfig: {
                    type: this.markerStyle,
                    size: parseInt(this.markerSize) || 4,
                    radius: parseInt(this.markerRadius) || 4,
                    'stroke-width': parseInt(this.markerStrokeWidth) || 0
                },
                tips: {
                    trackMouse: true,
                    renderer: function(storeItem, item) {
                        this.update(storeItem.get('line_x_axis')+':'+item.value[1]);
                    }
                },
                listeners: {
                    itemmouseup: function(item) {
                        item.series.highlight = true;
                        item.series.unHighlightItem();
                        item.series.cleanHighlights();
                        item.series.highlightItem(item);
                        item.series.highlight = false;
                    	}
					}
					
				});
			}
			return series;
    }
});