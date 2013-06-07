Ext.define('o2e.widget.AbstractChartWidget', {
    extend: 'o2e.widget.AbstractWidget',

    useOwnStores: false,
    unionData: true,
    useRawData: false,

    chart: null,

    minAxes: 2,
    minSeries: 1,
    chartType: null,
    chartDefaults: {},

    requiredAnnotations: [],
    optionalAnnotations: [],

    isSWVersion: true,

    init: function() {
        var chartPanel = this.buildChart();
        this.chart = this.add(chartPanel);

        if (this.exposeClickEvent) {
            this.addEvents('itemmouseup');
            this.addAvailableEventSource({
                name: 'selects a chart item',
                source: this,
                event: 'itemmouseup',
                args: [{
                    name: 'record',
                    getValues: function() { return ['Entire Record']; },
                    processor: function(item) { return item.storeItem; }
                },{
                    name: 'recordVal',
                    index: 0,
                    getValues: Ext.Function.bind(function() {
                        var x, xlen, vals = [], fields = Ext.ModelManager.getModel(this.modelId).prototype.fields.getRange();
                        for (x=0,xlen=fields.length;x<xlen;x++) {
                            vals.push(fields[x].name);
                        }
                        return vals;
                    }, this),
                    processor: function(item, field) {
                        return item.storeItem.get(field);
                    }
                }]
            });

            this.addAvailableEventAction({
                name: 'highlight',
                callback: function(srcRecord) {
                    var x, xlen, y, ylen, z, zlen, series = this.chart.items.getAt(0).series.items, isMatch, s, item, fields, origHighlight;
                    for (x=0,xlen=series.length;x<xlen;x++) {
                        s = series[x];
                        for (y=0,ylen=s.items.length;y<ylen;y++) {
                            item = s.items[y];
                            fields = Ext.ModelManager.getModel(this.modelId).prototype.fields.getRange();
                            isMatch = true;
                            for (z=0,zlen=fields.length;z<zlen && isMatch;z++) {
                                if (fields[z].ignore) {
                                    continue;
                                } else if (!srcRecord.get(fields[z].name) || srcRecord.get(fields[z].name) !== item.storeItem.get(fields[z].name)) {
                                    isMatch = false;
                                }
                            }
                            if (isMatch) {
                                origHighlight = (s.highlight !== false);
                                if (!origHighlight) { s.highlight = true; }
                                s.unHighlightItem();
                                s.cleanHighlights();
                                s.highlightItem(item);
                                if (!origHighlight) { s.highlight = false; }
                            }
                        }
                    }
                },
                scope: this,
                args: ['sourceRecord']
            });
        }
        this.on('serviceadd', this.onServiceAdd, this);
        this.on('serviceremove', this.onMetadataUpdate, this);
        this.on('serviceactivate', this.onMetadataUpdate, this);
        this.on('servicedeactivate', this.onMetadataUpdate, this);
        this.on('metadataupdate', this.onMetadataUpdate, this);
        this.setReady();
    },

    onMetadataUpdate: function() {
        if (this.getCountOfActiveServices() > 0) {
            if (this.chart === null) {
                var chartPanel = this.buildChart();
                this.chart = this.add(chartPanel);
            } else {
                this.chart.items.getAt(0).redraw();
            }
        } else {
            this.remove(this.chart);
            this.chart = null;
        }
    },

    onServiceAdd: function() {
        if (this.chart === null) {
            var chartPanel = this.buildChart();
            this.chart = this.add(chartPanel);
        }
    },

    buildChart: function() {
        var x, xlen, serviceKey, metadata, viz, chartCfg;

        for (serviceKey in this.services) {
            if (this.services.hasOwnProperty(serviceKey)) {
                metadata = this.services[serviceKey].metadata;
                if (metadata.viz && metadata.viz[this.chartType]) {
                    Ext.apply(this, metadata.viz[this.chartType]);
                }
            }
        }

        chartCfg = Ext.apply({}, {
            style: 'background:#fff',
            animate: {
                easing: 'bounceOut',
                duration: 500
            },
            store: this.store,
            axes: this.buildAxes(),
            series: this.buildSeries()
        }, this.chartDefaults);

        if (this.exposeClickEvent) {
            for (x=0,xlen=chartCfg.series.length;x<xlen;x++) {
                var series = chartCfg.series[x];
                series.listeners = series.listeners || {};
                series.listeners.afterrender = {
                    fn: function() {
                        var i, len, s = this.chart.items.getAt(0).series.items;
                        for (i=0,len=s.length;i<len;i++) {
                            if (s[i].seriesId === series.seriesId) {
                                this.relayEvents(s[i], ['itemmouseup']);
                            }
                        }
                    },
                    scope: this,
                    single: true
                };
            }
        }

        return {
            xtype: 'panel',
            layout: 'fit',
            border: 0,
            padding: 0,
            margin: 0,
            items: [chart = Ext.create('Ext.chart.Chart', chartCfg)]
        };
    },

    handleData: function(data, serviceKey, metadata) {
        this.processDataPlugins(data, serviceKey, metadata);
    },

    getStateConfig: function() {
        return Ext.apply({
            viz: this.viz
        }, this.callParent());
    },

    getCountOfActiveServices: function() {
        var count = 0, service;
        for (service in this.services) {
            if (this.services.hasOwnProperty(service) && this.services[service].active) {
                count = count + 1;
            }
        }
        return count;
    }
});