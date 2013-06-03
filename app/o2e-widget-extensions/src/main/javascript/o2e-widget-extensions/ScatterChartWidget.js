Ext.define('o2e.ScatterChartWidget', {
		extend: 'o2e.widget.AbstractChartWidget',

		requiredAnnotations: ['scatter_x_axis', 'scatter_y_axis'],
		optionalAnnotations: [],
		requiredMetaFields: {
			xLabel: 'X Axis',
			yLabel: 'Y Axis'     
		},

		//General chart configs
		type: 'scatter',
		exposeClickEvent: true,
		minAxes: NaN,
		minSeries: 1,
		chartType: 'scatter',
		chartDefaults: {
			animate: true,
			theme: 'Base:gradients',
			insetPadding: 10,
			shadow: true
		},

		//Chart specific configs here
		xLabel: 'X Axis',
		yLabel: 'Y Axis',
		chartFields: null,

		getChartFields: function() {
			var serviceKey;

			if (!this.chartFields) {
				this.chartFields = [];
				for (serviceKey in this.services) {
					if (this.services.hasOwnProperty(serviceKey)) {
						this.chartFields = this.chartFields.concat(o2e.data.DataUtils.getFieldsWithAnnotation('scatter_y_axis',this.services[serviceKey].metadata));
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
				decimals: 1,
				grid: true
			},{
				type: 'Category',
				position: 'bottom',
				fields: ['scatter_x_axis'],
				title: this.xLabel
			}];
		},

		buildSeries: function() {
			var i, len, fields = this.getChartFields(),  series = [];			
			for (i=0,len=fields.length;i<len;i++) {			
				series.push({				
					type: 'scatter',
					axis: 'left',
					xField: 'scatter_x_axis',
					yField: fields[i],			
									
					tips: {
						trackMouse: true,
						width:	140,
						height: 40,
						renderer: function(storeItem, item) {
							this.update(storeItem.get('scatter_x_axis')+': '+item.value[1]);
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