 Ext.chart.series.Scatter.prototype.getBounds = function() {
        var me = this,
            chart = me.chart,
            store = chart.getChartStore(),
            axes = [].concat(me.axis),
            bbox, xScale, yScale, ln, minX, minY, maxX, maxY, i, axis, ends;

        me.setBBox();
        bbox = me.bbox;

        for (i = 0, ln = axes.length; i < ln; i++) {
            axis = chart.axes.get(axes[i]);
            if (axis) {
                ends = axis.calcEnds();
                if (axis.position == 'top' || axis.position == 'bottom') {
                    minX = ends.from;
                    maxX = ends.to;
                }
                else {
                    minY = ends.from;
                    maxY = ends.to;
                }
            }
        }
        // If a field was specified without a corresponding axis, create one to get bounds
        if (me.xField && !Ext.isNumber(minX)) {
            axis = Ext.create('Ext.chart.axis.Axis', {
                chart: chart,
                fields: [].concat(me.xField)
            }).calcEnds();
            minX = axis.from;
            maxX = axis.to;
        }
        if (me.yField && !Ext.isNumber(minY)) {
            axis = Ext.create('Ext.chart.axis.Axis', {
                chart: chart,
                fields: [].concat(me.yField)
            }).calcEnds();
            minY = axis.from;
            maxY = axis.to;
        }

        if (isNaN(minX)) {
            minX = 0;
            maxX = store.getCount() - 1;
            xScale = bbox.width / (store.getCount() - 1);
        }
        else {
            xScale = bbox.width / (maxX - minX);
        }

        if (isNaN(minY)) {
            minY = 0;
            maxY = store.getCount() - 1;
            yScale = bbox.height / (store.getCount() - 1);
        }
        else {
            yScale = bbox.height / (maxY - minY);
        }

        return {
            bbox: bbox,
            minX: minX,
            minY: minY,
            xScale: xScale,
            yScale: yScale
        };
    };
Ext.chart.series.Scatter.prototype.getPaths = function() {
        var me = this,
            chart = me.chart,
            enableShadows = chart.shadow,
            store = chart.getChartStore(),
            group = me.group,
            bounds = me.bounds = me.getBounds(),
            bbox = me.bbox,
            xScale = bounds.xScale,
            yScale = bounds.yScale,
            minX = bounds.minX,
            minY = bounds.minY,
            boxX = bbox.x,
            boxY = bbox.y,
            boxHeight = bbox.height,
            items = me.items = [],
            attrs = [],
            x, y, xValue, yValue, sprite;

        store.each(function(record, i) {
            xValue = record.get(me.xField);
            yValue = record.get(me.yField);
            //skip undefined values
            if (typeof yValue == 'undefined' || (typeof yValue == 'string' && !yValue)) {
                //<debug warn>
                if (Ext.isDefined(Ext.global.console)) {
                    Ext.global.console.warn("[Ext.chart.series.Scatter]  Skipping a store element with an undefined value at ", record, xValue, yValue);
                }
                //</debug>
                return;
            }
            // Ensure a value
			/*
					 * CUSTOM LOGIC TO SUPPORT NUMBER VALUES
					 */
            if (typeof xValue == 'number' || typeof xValue == 'object' && !Ext.isDate(xValue)) {
                xValue = i;
            }
					
            if (typeof yValue == 'number' || typeof yValue == 'object' && !Ext.isDate(yValue)) {
                yValue = i;
            }
            x = boxX + (xValue - minX) * xScale;
            y = boxY + boxHeight - (yValue - minY) * yScale;
            attrs.push({
                x: x,
                y: y
            });

            me.items.push({
                series: me,
                value: [xValue, yValue],
                point: [x, y],
                storeItem: record
            });

            // When resizing, reset before animating
            if (chart.animate && chart.resizing) {
                sprite = group.getAt(i);
                if (sprite) {
                    me.resetPoint(sprite);
                    if (enableShadows) {
                        me.resetShadow(sprite);
                    }
                }
            }
        });
        return attrs;
    };