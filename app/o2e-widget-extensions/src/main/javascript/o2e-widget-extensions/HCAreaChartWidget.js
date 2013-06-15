Ext.define('o2e.HCAreaChartWidget', {
    extend: 'o2e.widget.AbstractWidget',

    type: 'hcarea',

    requiredAnnotations: ['hc_area_x_axis', 'hc_area_y_axis'],
    optionalAnnotations: [],

    requiredMetaFields: {
        xLabel: 'X Axis',
        yLabel: 'Y Axis',
        maxPoints: '100',
        fillOpacity: '0.5'
    },

    xLabel: 'X Axis',
    yLabel: 'Y Axis',
    maxPoints: 100,
    fillOpacity: 0.5,

    useOwnStores: true,
    unionData: false,
    useRawData: false,

    init: function() {
        var serviceKey, metadata;

        for (serviceKey in this.services) {
            if (this.services.hasOwnProperty(serviceKey)) {
                metadata = this.services[serviceKey].metadata;
                if (metadata.viz && metadata.viz.hcarea) {
                    Ext.apply(this, metadata.viz.hcarea);
                }
            }
        }

        this.getChartFields();

        this.panel = Ext.create('Ext.panel.Panel', {
            border: false,
            preventHeader: true ,
            listeners: {
                afterrender: {
                    fn: function() {
                        var x, xlen, series = [];
                        for (x=0,xlen=this.chartFields.length;x<xlen;x++) {
                            series.push({
                                name: this.chartFields[x],
                                data: []
                            });
                        }

                        this.chart = new Highcharts.Chart({
                            chart: {
                                zoomType: 'x', spacingRight: 20,
                                renderTo: this.panel.body.id,
                                type: 'area'
                            },
                            xAxis: { title: { text: this.xLabel }, type: 'datetime', maxZoom: 6000 },
                            yAxis: { title: { text: this.yLabel }},
                            title: { text: null },
                            tooltip: { shared: true },
                            plotOptions: {
                                area: {
                                    fillOpacity: Number(this.fillOpacity) || 0.5,
                                    marker: {
                                        enabled: false,
                                        symbol: 'circle',
                                        radius: 2,
                                        states: { hover: { enabled: true }}
                                    }
                                }
                            },
                            legend: this.chartFields.length > 1 ? {
                                layout: 'horizontal',
                                align: 'center',
                                verticalAlign: 'bottom',
                                borderWidth: 1
                            } : { enabled: false },
                            series: series
                        });

                        this.setReady();
                    },
                    scope: this
                },
                afterlayout: {
                    fn: function() {
                        this.chart.setSize(this.panel.body.getWidth(), this.panel.body.getHeight());
                    },
                    scope: this
                }
            }
        });

        this.add(this.panel);
    },

    handleData: function(data, serviceKey, metadata) {
        var x,xlen,y,ylen,chartSeries,series = {},record,field;

        for (x=0,xlen=this.chart.series.length;x<xlen;x++) {
            chartSeries = this.chart.series[x];
            series[chartSeries.name] = chartSeries;
        }

        if (this.chart) {
            for (x=0,xlen=data.add.length;x<xlen;x++) {
                record = data.add[x];
                for (y=0,ylen=this.chartFields.length;y<ylen;y++) {
                    field = this.chartFields[y];
                    if (record.get(field)) {
                        series[field].addPoint(
                            [record.get('timestamp'), record.get(field)],
                            false,
                            series[field].data.length >= (Number(this.maxPoints) || 100));
                    }
                }
            }

            this.chart.redraw();
        }
    },

    getChartFields: function() {
        var serviceKey;

        if (!this.chartFields) {
            this.chartFields = [];
            for (serviceKey in this.services) {
                if (this.services.hasOwnProperty(serviceKey)) {
                    this.chartFields = this.chartFields.concat(o2e.data.DataUtils.getFieldsWithAnnotation('hc_area_y_axis',this.services[serviceKey].metadata));
                }
            }
        }

        return this.chartFields;
    }
});