Ext.chart.series.Area.prototype.getBounds = function() {
        var me = this,
            chart = me.chart,
            store = chart.getChartStore(),
            areas = [].concat(me.yField),
            areasLen = areas.length,
            xValues = [],
            yValues = [],
            infinity = Infinity,
            minX = infinity,
            minY = infinity,
            maxX = -infinity,
            maxY = -infinity,
            math = Math,
            mmin = math.min,
            mmax = math.max,
            bbox, xScale, yScale, xValue, yValue, areaIndex, acumY, ln, sumValues, clipBox, areaElem;

        me.setBBox();
        bbox = me.bbox;

        // Run through the axis
        if (me.axis) {
            axis = chart.axes.get(me.axis);
            if (axis) {
                out = axis.calcEnds();
                minY = out.from || axis.prevMin;
                maxY = mmax(out.to || axis.prevMax, 0);
            }
        }

        if (me.yField && !Ext.isNumber(minY)) {
            axis = Ext.create('Ext.chart.axis.Axis', {
                chart: chart,
                fields: [].concat(me.yField)
            });
            out = axis.calcEnds();
            minY = out.from || axis.prevMin;
            maxY = mmax(out.to || axis.prevMax, 0);
        }

        if (!Ext.isNumber(minY)) {
            minY = 0;
        }
        if (!Ext.isNumber(maxY)) {
            maxY = 0;
        }

        store.each(function(record, i) {
            xValue = record.get(me.xField);
            yValue = [];
            if (typeof xValue != 'number') {
                xValue = i;
            }
            xValues.push(xValue);
            acumY = 0;
            for (areaIndex = 0; areaIndex < areasLen; areaIndex++) {
                areaElem = record.get(areas[areaIndex]);
                /*
                 * CUSTOM LOGIC TO SUPPORT STRING VALUES
                 */
                if (typeof areaElem === 'string') {
                    areaElem = parseFloat(areaElem);
                }
                if (!isNaN(areaElem)) {
                    minY = mmin(minY, areaElem);
                    yValue.push(areaElem);
                    acumY += areaElem;
                }
//                if (typeof areaElem == 'number') {
//                    minY = mmin(minY, areaElem);
//                    yValue.push(areaElem);
//                    acumY += areaElem;
//                }
                /*
                 * END CUSTOM LOGIC
                 */
            }
            minX = mmin(minX, xValue);
            maxX = mmax(maxX, xValue);
            maxY = mmax(maxY, acumY);
            yValues.push(yValue);
        }, me);

        xScale = bbox.width / ((maxX - minX) || 1);
        yScale = bbox.height / ((maxY - minY) || 1);

        ln = xValues.length;
        if ((ln > bbox.width) && me.areas) {
            sumValues = me.shrink(xValues, yValues, bbox.width);
            xValues = sumValues.x;
            yValues = sumValues.y;
        }

        return {
            bbox: bbox,
            minX: minX,
            minY: minY,
            xValues: xValues,
            yValues: yValues,
            xScale: xScale,
            yScale: yScale,
            areasLen: areasLen
        };
    };