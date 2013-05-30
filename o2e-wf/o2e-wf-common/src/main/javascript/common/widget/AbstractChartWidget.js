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

    init: function() {
        this.chart = this.buildChart();
        this.add(this.chart);
        this.on('metadataupdate', this.onMetadataUpdate, this);
        this.setReady();
    },

    onMetadataUpdate: function() {
        this.remove(this.chart);
        this.chart = this.buildChart();
        this.add(this.chart);
    },

    buildChart: function() {
        var axes = [], series = [], title = '', desc = '', pnlCfg, serviceKey, metadata, viz, chartCfg,
            titleHandler = function() {
                this.store.each(this[this.titleCfg.fn], this);
            };

        // setup panel first
        pnlCfg = {
            xtype: 'panel',
            border: false,
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            defaults: {
                xtype: 'panel',
                border: false,
                margins: '0',
                padding: '0'
            },
            items: [],
            listeners: {
                afterlayout: {
                    fn: function() {
                        if (this.store.getCount() === 0) {
                            if (this.getEl().isMasked()) {
                                this.getEl().unmask();
                            } else {
                                this.store.on('add', function() {
                                    this.getEl().unmask();
                                }, this, {single:true});
                            }
                            this.getEl().mask('Loading...', 'x-mask-loading');
                        }
                    },
                    scope: this
                }
            }
        };

        for (serviceKey in this.services) {
            if (this.services.hasOwnProperty(serviceKey)) {
                metadata = this.services[serviceKey].metadata;
                if (metadata.viz) {
                    if (metadata.viz[this.chartType]) {
                        viz = metadata.viz[this.chartType];
                        if (axes.length < 2 && Ext.isArray(viz.axes)) {
                            axes = axes.concat(viz.axes);
                        }
                        if (Ext.isArray(viz.series)) {
                            series = series.concat(viz.series);
                        }
                    }
                    if (metadata.viz.chartDesc) {
                        desc = desc + metadata.viz.chartDesc + '<br/>';
                    }
                    if (metadata.viz[this.chartType].titleCfg) {
                        this.titleCfg = metadata.viz[this.chartType].titleCfg;
                        this.store.on('add', titleHandler, this);
                    } else if (metadata.viz.chartTitle) {
                        title = metadata.viz.chartTitle;
                    }
                }
            }
        }

        if (title !== '' || this.titleCfg) {
            pnlCfg.items.push({
                itemId: 'chartTitle',
                tpl: new Ext.XTemplate('<span style="font-size:20px;width:100%;text-align:center;"><center>{title}</center></span>'),
                data: { title: title }
            });
        }

        if (axes.length < this.minAxes || series.length < this.minSeries) {
            //TODO: if axes.length < 2 || series.length === 0 need to popup config
            return new Ext.Component({
                html: '<span style="text-indent: 10px">No visualization configured.</span>'
            });
        } else {
            this.viz = {
                axes: axes,
                series: series,
                legend: metadata.viz[this.chartType].legend || false
            };

            chartCfg = Ext.apply({}, {
                itemId: 'o2eChart',
                flex: 1,
                style: 'background:#fff',
                animate: {
                    easing: 'bounceOut',
                    duration: 500
                },
                store: this.store,
                axes: axes,
                series: series
            }, this.chartDefaults);

            pnlCfg.items.push(new Ext.chart.Chart(chartCfg));
        }

        if (desc === '') {
            desc = 'No description provided.';
        }

        pnlCfg.items.push({
            itemId: 'o2eDescription',
            hidden: true,
            margins: '10 0',
            padding: '10',
            html: '<span style="font-size:14px">'+desc+'</span>'
        });

        return pnlCfg;
    },

    handleData: function(data, serviceKey, metadata) {
        this.processDataPlugins(data, serviceKey, metadata);
    },

    getStateConfig: function() {
        return Ext.apply({
            viz: this.viz
        }, this.callParent());
    },

    setTitle: function(title) {
        this.items.getAt(0).getComponent('chartTitle').update({ title: title });
    },

    sum: function(record) {
        this.titleSum = this.titleSum || 0;
        this.titleSum += Number(record.get(this.titleCfg.field));
        this.setTitle(this.titleCfg.label + ': ' + Ext.util.Format.number(this.titleSum, '0,0'));
    }
});