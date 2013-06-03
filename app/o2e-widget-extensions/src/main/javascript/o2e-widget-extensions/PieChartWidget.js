Ext.define('o2e.PieChartWidget', {
    extend: 'o2e.widget.AbstractChartWidget',

    requiredAnnotations: ['pie_segment', 'pie_label'],
    optionalAnnotations: [],
    requiredMetaFields: {
        showSeriesLabel: false
    },

    //General chart configs
    type: 'pie',
    exposeClickEvent: true,
    minAxes: 0,
    minSeries: 1,
    chartType: 'pie',
    chartDefaults: {
        animate: true,
        theme: 'Base:gradients',
        insetPadding: 10,
        shadow: true,
        legend: {
            position: 'right'
        }
    },

    //Chart specific configs here
    showSeriesLabel: false,

    buildAxes: function() {
        return [];
    },

    buildSeries: function() {
        return [{
            type: 'pie',
            field: 'pie_segment',
            showInLegend: true,
            donut: false,
            label: {
                field: 'pie_label',
                display: this.showSeriesLabel === true ? 'rotate' : 'none',
                contrast: true,
                font: '12px Arial'
            },
            tips: {
                trackMouse: true,
                renderer: function(storeItem, item) {
                    //calculate percentage.
                    var total = 0;
                    storeItem.store.each(function(rec) {
                        total += Number(rec.get('pie_segment'));
                    });
                    this.update(storeItem.get('pie_label') + ': ' + Math.round(storeItem.get('pie_segment') / total * 100) + '% (' + storeItem.get('pie_segment') + ')');
                }
            },
            highlight: {
                segment: {
                    margin: 20
                }
            },
            listeners: {
                itemmouseup: function(item) {
                    item.series.unHighlightItem();
                    item.series.cleanHighlights();
                    item.series.highlightItem(item);
                }
            }
        }];
    }
});