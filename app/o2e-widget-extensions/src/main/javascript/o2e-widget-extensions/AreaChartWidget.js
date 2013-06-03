Ext.define('o2e.AreaChartWidget', {
    extend: 'o2e.widget.AbstractChartWidget',

    requiredAnnotations: ['area_x_axis', 'area_y_axis'],
    optionalAnnotations: [],
    requiredMetaFields: {
        xLabel: 'X Axis',
        yLabel: 'Y Axis',
        showSeriesLabel: false
    },

    //General Chart configs
    type: 'area',
    exposeClickEvent: true,
    minAxes: 0,
    minSeries: 1,
    chartType: 'area',
    chartDefaults: {
        animate: true,
		defaultInsets: 30,
        theme: 'Base:gradients',
        insetPadding: 5
    },

    //Chart specific configs here
    chartFields: null,
    xLabel: 'X Axis',
    yLabel: 'Y Axis',
    showSeriesLabel: false,

		getChartFields: function() {
			var serviceKey;

			if (!this.chartFields) {
				this.chartFields = [];
				for (serviceKey in this.services) {
					if (this.services.hasOwnProperty(serviceKey)) {
						this.chartFields = this.chartFields.concat(
							o2e.data.DataUtils.getFieldsWithAnnotation('area_y_axis',this.services[serviceKey].metadata
							)
						);
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
					//grid:true,				
					minimum: NaN,
					minorTickSteps: 1,
					adjustMinimumByMajorUnit: 0,
					position:'left',
					fields: this.getChartFields(),
					title:  this.yLabel,
					decimals: 0						
									
				},{
					type: 'Category',
					position: 'bottom',
					//grid: true,
					fields: ['area_x_axis'],
					title: this.xLabel,
					label: {
						rotate: {
							degrees: 315
						}
					}					

				}];
			},

		 buildSeries: function() {		
			var series = [];        
			series.push({
				type: 'area',
				highlight: true,
				axis: 'left',
				xField: 'area_x_axis',
				yField: this.getChartFields(),
				
				 tips: {
						trackMouse: true,
						width:	140,
						height: 40,
							renderer: function(storeItem, item) {
						  this.update(storeItem.get('area_x_axis')
								  + ':' + storeItem.get(item.storeField));
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
					},
				 style: {
                    lineWidth: 1,
                    stroke: '#666',
                    opacity: 0.86
                }
			});
			
			return series;
		}
	});