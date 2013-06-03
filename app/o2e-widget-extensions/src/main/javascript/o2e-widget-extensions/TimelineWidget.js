Ext.define('o2e.TimelineWidget', {
    extend: 'o2e.widget.AbstractChartWidget',

    requiredAnnotations: ['title', 'pubDate'],
    optionalAnnotations: ['description', 'item_value'],
    requiredMetaFields: {
        titleLabel: 'Title',
        dateLabel: 'Date',
        dateFormat: [['c','c'],['n/j/Y','n/j/Y'],['D, d M Y g:i:s O','D, d M Y g:i:s O']]
    },

    //General chart configs
    type: 'timeline',
    exposeClickEvent: true,
    minAxes: NaN,
    minSeries: NaN,
    chartType: 'timeline',
    chartDefaults: {
        animate: true,
        theme: 'Base:gradients',
        insetPadding: 5,
        shadow: true
    },

    slider: null,

    getDateSteps: function() {
        var min = this.store.min('pubDate');
        var max = this.store.max('pubDate');

        if (typeof min == "undefined") {
            return [];
        }

        var sliderMin = new Date(this.slider.dateFields[0].value).getTime();
        var sliderMax = new Date(this.slider.dateFields[1].value).getTime();

        var range = sliderMax - sliderMin;

        var ticks = this.getTickSize(100, sliderMin, sliderMax, 0);
        var ticks = Math.ceil(ticks);
        // Range < 1 hour show HOURS
        if (range < 3600000)
            return [Ext.Date.MINUTE, ticks]

        // Range < 3 day show HOURS
        else if (range < (3600000 * 24 * 12) )
            return [Ext.Date.HOUR, ticks]

        // Range < 3 month show DAYS
        else if (range < (3600000 * 24 * 7 * 4.25 * 4))
            return [Ext.Date.DAY, ticks]

        // Range < 12 month
        else if (range < (3600000 * 24 * 7 * 4.5 * 24))
            return [Ext.Date.MONTH, ticks]

        // Range < 1 year than 6 months
        else if (range > (3600000 * 24 * 7 * 4.5 * 24))
            return [Ext.Date.YEAR, ticks]

        // Greater than 6 mo

        // Greater than 1 year
    },

    getMagnitude: function(x) {
        return Math.pow(10, Math.floor(Math.log(x) / Math.LN10));
    },

    getTickSize: function(noTicks, min, max, decimals) {
        var delta = (max - min) / noTicks;
        var magn = this.getMagnitude(delta);
        var norm = delta / magn; // norm is between 1.0 and 10.0

        var tickSize = 10;
        if (norm < 1.5)
            tickSize = 10;
        else if (norm < 2.25)
            tickSize = 5;
        else if (norm < 3)
            tickSize = 2.5;
        else if (norm < 7.5)
            tickSize = 2;
        else
            tickSize = 1;

        tickSize *= magn;
        tickSize = delta / tickSize;
        //debugger;
        return tickSize;
    },

    setValues: function() {
        this.store.on('add', function(thestore, records, operation, options){
            Ext.Array.each(records, function(record) {
                record.set('pubDate', new Date(record.get('pubDate')));
                matches = this.store.queryBy(function(qrecord, qid){
                    amatch = ( (new Date(qrecord.get('pubDate')).getTime() === record.get('pubDate').getTime()) ) ? true : false;
                    return amatch;
                },this); //'pubDate', record.get('pubDate'));
                matches.each(function(match, index) {
                    match.set('item_value', String (index + 1));
                    match.commit();
                }, this);

                record.commit();
            }, this);
            this.resetChart();
        }, this);
    },

    resetChart: function(keepSlider) {
        var currMin = this.store.min('pubDate'),
            currMax = this.store.max('pubDate');

        if (!keepSlider && (!this.slider || (this.currMin.getTime() !== currMin.getTime() || this.currMax.getTime() !== currMax.getTime()))) {
            this.currMin = currMin;
            this.currMax = currMax;
            if (this.slider) {
                this.removeDocked(this.slider);
            }
            this.addDocked(this.getNewSlider(
                Ext.Date.format(new Date(this.currMin), 'n/j/Y'),
                Ext.Date.format(new Date(this.currMax), 'n/j/Y')
            ));
        }
        this.remove(this.chart);
        this.chart = this.add(this.buildChart());
    },

    getNewSlider: function(min, max) {
        this.slider = Ext.create('Ext.ux.DateSlider', {
            hideLabel: false,
            useTips: true,
            flex: 1,
            dock: 'bottom',
            minDate: min,
            maxDate: max,
            values: [min, max],
            listeners: {
                changecomplete: {
                    fn: function( slider, newValue, thumb, eOpts ) {
                        var dateFilter = new Ext.util.Filter({
                            filterFn: function(item) {
                                var itemTime = new Date(item.get('pubDate'));
                                thumb0 = (itemTime.getTime() >= new Date(slider.dateFields[0].value).getTime() )?true:false;
                                thumb1 = (itemTime.getTime() <= new Date(slider.dateFields[1].value).getTime() )?true:false;
                                result = thumb0 && thumb1;
                                return result;
                            }
                        });
                        if (this.store.isFiltered()) {
                            this.store.clearFilter();
                        }
                        this.store.filter(dateFilter);
                        this.resetChart(true);
                    },
                    scope: this
                }
            }
        });

        return this.slider;
    },

    init: function() {
        this.setValues();
        this.callParent();
    },

    buildAxes: function() {
        var max = parseInt (this.store.max('item_value'))+ 1;
        var steps = this.getDateSteps();
        return [{
            type: 'Numeric',
            position: 'left',
            fields: ['item_value'],
            title: this.titleLabel,
            label: {
                display: 'none',
                color: '#ff0000',
                rotate: {
                    degrees: 90
                },
                renderer: function(v) {
                    return "";
                }
            },
            minimum: 1,
            maximum: max,
            majorTickSteps:0

            //one minor tick between two major ticks
        },{
            type: 'Time',
            position: 'bottom',
            fields: ['pubDate'],
            title: this.dateLabel,
            dateFormat: this.dateFormat,
            constrain: true,
            fromDate: Ext.Date.add(new Date(this.slider ? this.slider.dateFields[0].value : '6/1/2012'), steps[0], -1),
            toDate: Ext.Date.add(new Date(this.slider ? this.slider.dateFields[1].value : '8/1/2012'), steps[0], 1),
            step: steps,
            label: {
                rotate: {
                    degrees: 90
                }
            }
        }];
    },

    buildSeries: function() {
        return [{
            type: 'scatter',
            highlight: true,
            markerConfig: {
                radius: 5,
                size: 5
            },
            axis: ['left', 'bottom'],
            xField: 'pubDate',
            yField: 'item_value',
            color: '#a00',
            tips: {
                trackMouse: true,
                renderer: function(storeItem, item) {
                    this.setTitle(storeItem.get('title'));

                    this.update(Ext.Date.format(storeItem.get('pubDate'), 'n/j/Y') + '<br/><br/>' + storeItem.get('description') );
                }
            }
        }];
    }
});