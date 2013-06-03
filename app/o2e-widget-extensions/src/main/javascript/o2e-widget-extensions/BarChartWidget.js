Ext.define('o2e.BarChartWidget', {
    extend: 'o2e.widget.AbstractChartWidget',

    requiredAnnotations: ['bar_x_axis', 'bar_y_axis'],
    optionalAnnotations: [],
    requiredMetaFields: {
        direction: [['horizontal','horizontal'], ['vertical','vertical']],
        stacked: false,
        xLabel: 'X Axis',
        yLabel: 'Y Axis',
        showSeriesLabel: false
    },

    //General Chart configs
    type: 'bar',
    exposeClickEvent: true,
    minAxes: 2,
    minSeries: 1,
    chartType: 'bar',
    chartDefaults: {
        animate: true,
        theme: 'Base:gradients',
        insetPadding: 10
    },

    //Chart specific configs here
    chartFields: null,
    direction: 'horizontal',
    stacked: false,
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
                        o2e.data.DataUtils.getFieldsWithAnnotation(
                            (this.direction === 'horizontal' ? 'bar_x_axis' : 'bar_y_axis'),
                            this.services[serviceKey].metadata
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
            minimum: 0,
            position: this.direction === 'horizontal' ? 'bottom' : 'left',
            fields: this.getChartFields(),
            title: this.direction === 'horizontal' ? this.xLabel : this.yLabel,
            decimals: 1,
            grid: true
        },{
            type: 'Category',
            position: this.direction === 'horizontal' ? 'left' : 'bottom',
            fields: [this.direction === 'horizontal' ? 'bar_y_axis' : 'bar_x_axis'],
            title: this.direction === 'horizontal' ? this.yLabel : this.xLabel
        }];
    },

    buildSeries: function() {
        var series = {
            type: this.direction === 'horizontal' ? 'bar' : 'column',
            axis: this.direction === 'horizontal' ? 'bottom' : 'left',
            gutter: 80,
            xField: this.direction === 'horizontal' ? 'bar_y_axis' : 'bar_x_axis',
            yField: this.getChartFields(),
            displayName: this.direction === 'horizontal' ? this.xLabel : this.yLabel,
            stacked: this.stacked,
            tips: {
                trackMouse: true,
                renderer: function(storeItem, item) {
                    this.update(item.value[0]+': '+item.value[1]);
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
        };

        if (this.showSeriesLabel) {
            series.label = {
                display: 'insideEnd',
                field: this.getChartFields(),
                renderer: Ext.util.Format.numberRenderer('0'),
                orientation: 'horizontal',
                color: '#FFF',
                'text-anchor': 'middle'
            }
        }

        return [series];
    }
});