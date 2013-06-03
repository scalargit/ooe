Ext.define('o2e.GaugeChartWidget', {
    extend: 'o2e.widget.AbstractChartWidget',

    requiredAnnotations: ['gauge_value','gauge_maximum'],
    optionalAnnotations: [],
    requiredMetaFields: {
        minimum: '0',
        maximum: '100',
        steps: '10',
        donut: '50',
        donutColor: '#3AA8CB',
        needle: true,
        highlight: true
    },

    //General Chart configs
    type: 'gauge',

    minAxes: 0,
    minSeries: 1,
    chartType: 'gauge',
    chartDefaults: {
        animate: true,
        theme: 'Base:gradients',
        insetPadding: 10,
        shadow: true
    },

    init: function() {
        var chartCfg = this.buildChart();
        this.chart = this.add(chartCfg);
        this.on('metadataupdate', this.onMetadataUpdate, this);
        this.store.on('add', function(store, recs) {
            this.handleRedraw();
        }, this);
        this.on('activate', function() {
            this.chart.items.getAt(this.isSWVersion ? 0 : 1).redraw();
        }, this);
        this.setReady();
    },

    handleRedraw: function() {
        var i, len, records = this.store.getRange(), val = 0, max = 0;

        for (i=0, len=records.length; i<len; i++) {
            val = val + (parseInt(records[i].get('gauge_value')) || 0);
            max = max + (parseInt(records[i].get('gauge_maximum')) || 0);
        }

        this.chart.items.getAt(this.isSWVersion ? 0 : 1).axes.getAt(0).maximum = max;
        this.chart.items.getAt(this.isSWVersion ? 0 : 1).redraw();
        this.store.getAt(0).set('gauge_value', val);
    },

    //Chart specific configs here
    minimum: '0',
    maximum: '100',
    steps: '10',
    donut: '50',
    donutColor: '#3AA8CB',
    needle: true,
    highlight: true,

    buildAxes: function() {
        return [{
            type: 'gauge',
            position: 'gauge',
            minimum: Number(this.minimum) || 0,
            maximum: Number(this.maximum) || 100,
            steps: Number(this.steps) || 10,
            margin: -10
        }];
    },

    buildSeries: function() {
        return [{
            type: 'gauge',
            donut: Number(this.donut) || 50,
            needle: this.needle,
            highlight: this.highlight,
            field: 'gauge_value',
            colorSet: [this.donutColor, '#ddd'],
            tips: {
                trackMouse: true,
                renderer: function(storeItem, item) {
                    this.update(storeItem.get('gauge_value'));
                }
            }
        }];
    }
});