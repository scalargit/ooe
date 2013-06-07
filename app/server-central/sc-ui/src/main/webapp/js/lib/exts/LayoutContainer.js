Ext.override(Ext.layout.container.Box, {
    calculateChildBoxes: function(visibleItems, targetSize) {
        var me = this,
            math = Math,
            mmax = math.max,
            infiniteValue = Infinity,
            undefinedValue,

            parallelPrefix = me.parallelPrefix,
            parallelPrefixCap = me.parallelPrefixCap,
            perpendicularPrefix = me.perpendicularPrefix,
            perpendicularPrefixCap = me.perpendicularPrefixCap,
            parallelMinString = 'min' + parallelPrefixCap,
            perpendicularMinString = 'min' + perpendicularPrefixCap,
            perpendicularMaxString = 'max' + perpendicularPrefixCap,

            parallelSize = targetSize[parallelPrefix] - me.scrollOffset,
            perpendicularSize = targetSize[perpendicularPrefix],
            padding = me.padding,
            parallelOffset = padding[me.parallelBefore],
            paddingParallel = parallelOffset + padding[me.parallelAfter],
            perpendicularOffset = padding[me.perpendicularLeftTop],
            paddingPerpendicular =  perpendicularOffset + padding[me.perpendicularRightBottom],
            availPerpendicularSize = mmax(0, perpendicularSize - paddingPerpendicular),

            isStart = me.pack == 'start',
            isCenter = me.pack == 'center',
            isEnd = me.pack == 'end',

            constrain = Ext.Number.constrain,
            visibleCount = visibleItems.length,
            nonFlexSize = 0,
            totalFlex = 0,
            desiredSize = 0,
            minimumSize = 0,
            maxSize = 0,
            boxes = [],
            minSizes = [],
            calculatedWidth,

            i, child, childParallel, childPerpendicular, childMargins, childSize, minParallel, tmpObj, shortfall,
            tooNarrow, availableSpace, minSize, item, length, itemIndex, box, oldSize, newSize, reduction, diff,
            flexedBoxes, remainingSpace, remainingFlex, flexedSize, parallelMargins, calcs, offset,
            perpendicularMargins, stretchSize;


        // FIX FOR CAPANEL ACCORDION UDOP IE ISSUE
        if (typeof me.innerCt !== 'undefined') {
            var innerCtBorderWidth = me.innerCt.getBorderWidth(me.perpendicularLT + me.perpendicularRB);
        }

        for (i = 0; i < visibleCount; i++) {
            child = visibleItems[i];
            childPerpendicular = child[perpendicularPrefix];
            if (!child.flex || !(me.align == 'stretch' || me.align == 'stretchmax')) {
                if (child.componentLayout.initialized !== true) {
                    me.layoutItem(child);
                }
            }

            childMargins = child.margins;
            parallelMargins = childMargins[me.parallelBefore] + childMargins[me.parallelAfter];


            tmpObj = {
                component: child,
                margins: childMargins
            };


            if (child.flex) {
                totalFlex += child.flex;
                childParallel = undefinedValue;
            }

            else {
                if (!(child[parallelPrefix] && childPerpendicular)) {
                    childSize = child.getSize();
                }
                childParallel = child[parallelPrefix] || childSize[parallelPrefix];
                childPerpendicular = childPerpendicular || childSize[perpendicularPrefix];
            }

            nonFlexSize += parallelMargins + (childParallel || 0);
            desiredSize += parallelMargins + (child.flex ? child[parallelMinString] || 0 : childParallel);
            minimumSize += parallelMargins + (child[parallelMinString] || childParallel || 0);


            if (typeof childPerpendicular != 'number') {


                childPerpendicular = child['get' + perpendicularPrefixCap]();
            }



            maxSize = mmax(maxSize, mmax(childPerpendicular, child[perpendicularMinString]||0) + childMargins[me.perpendicularLeftTop] + childMargins[me.perpendicularRightBottom]);

            tmpObj[parallelPrefix] = childParallel || undefinedValue;
            tmpObj.dirtySize = child.componentLayout.lastComponentSize ? (tmpObj[parallelPrefix] !== child.componentLayout.lastComponentSize[parallelPrefix]) : false;
            tmpObj[perpendicularPrefix] = childPerpendicular || undefinedValue;
            boxes.push(tmpObj);
        }


        if (!me.autoSize) {
            shortfall = desiredSize - parallelSize;
            tooNarrow = minimumSize > parallelSize;
        }


        availableSpace = mmax(0, parallelSize - nonFlexSize - paddingParallel - (me.reserveOffset ? me.availableSpaceOffset : 0));

        if (tooNarrow) {
            for (i = 0; i < visibleCount; i++) {
                box = boxes[i];
                minSize = visibleItems[i][parallelMinString] || visibleItems[i][parallelPrefix] || box[parallelPrefix];
                box.dirtySize = box.dirtySize || box[parallelPrefix] != minSize;
                box[parallelPrefix] = minSize;
            }
        }
        else {


            if (shortfall > 0) {

                for (i = 0; i < visibleCount; i++) {
                    item = visibleItems[i];
                    minSize = item[parallelMinString] || 0;



                    if (item.flex) {
                        box = boxes[i];
                        box.dirtySize = box.dirtySize || box[parallelPrefix] != minSize;
                        box[parallelPrefix] = minSize;
                    } else if (me.shrinkToFit) {
                        minSizes.push({
                            minSize: minSize,
                            available: boxes[i][parallelPrefix] - minSize,
                            index: i
                        });
                    }
                }


                Ext.Array.sort(minSizes, me.minSizeSortFn);


                for (i = 0, length = minSizes.length; i < length; i++) {
                    itemIndex = minSizes[i].index;

                    if (itemIndex == undefinedValue) {
                        continue;
                    }
                    item = visibleItems[itemIndex];
                    minSize = minSizes[i].minSize;

                    box = boxes[itemIndex];
                    oldSize = box[parallelPrefix];
                    newSize = mmax(minSize, oldSize - math.ceil(shortfall / (length - i)));
                    reduction = oldSize - newSize;

                    box.dirtySize = box.dirtySize || box[parallelPrefix] != newSize;
                    box[parallelPrefix] = newSize;
                    shortfall -= reduction;
                }
                tooNarrow = (shortfall > 0);
            }
            else {
                remainingSpace = availableSpace;
                remainingFlex = totalFlex;
                flexedBoxes = [];


                for (i = 0; i < visibleCount; i++) {
                    child = visibleItems[i];
                    if (isStart && child.flex) {
                        flexedBoxes.push(boxes[Ext.Array.indexOf(visibleItems, child)]);
                    }
                }



                Ext.Array.sort(flexedBoxes, me.flexSortFn);


                for (i = 0; i < flexedBoxes.length; i++) {
                    calcs = flexedBoxes[i];
                    child = calcs.component;
                    childMargins = calcs.margins;

                    flexedSize = math.ceil((child.flex / remainingFlex) * remainingSpace);


                    flexedSize = Math.max(child['min' + parallelPrefixCap] || 0, math.min(child['max' + parallelPrefixCap] || infiniteValue, flexedSize));


                    remainingSpace -= flexedSize;
                    remainingFlex -= child.flex;

                    calcs.dirtySize = calcs.dirtySize || calcs[parallelPrefix] != flexedSize;
                    calcs[parallelPrefix] = flexedSize;
                }
            }
        }

        if (isCenter) {
            parallelOffset += availableSpace / 2;
        }
        else if (isEnd) {
            parallelOffset += availableSpace;
        }





        if (me.owner.dock && (Ext.isIE6 || Ext.isIE7 || Ext.isIEQuirks) && !me.owner.width && me.direction == 'vertical') {

            calculatedWidth = maxSize + me.owner.el.getPadding('lr') + me.owner.el.getBorderWidth('lr');
            if (me.owner.frameSize) {
                calculatedWidth += me.owner.frameSize.left + me.owner.frameSize.right;
            }

            availPerpendicularSize = Math.min(availPerpendicularSize, targetSize.width = maxSize + padding.left + padding.right);
        }


        for (i = 0; i < visibleCount; i++) {
            child = visibleItems[i];
            calcs = boxes[i];

            childMargins = calcs.margins;

            perpendicularMargins = childMargins[me.perpendicularLeftTop] + childMargins[me.perpendicularRightBottom];


            parallelOffset += childMargins[me.parallelBefore];

            calcs[me.parallelBefore] = parallelOffset;
            calcs[me.perpendicularLeftTop] = perpendicularOffset + childMargins[me.perpendicularLeftTop];

            if (me.align == 'stretch') {
                stretchSize = constrain(availPerpendicularSize - perpendicularMargins, child[perpendicularMinString] || 0, child[perpendicularMaxString] || infiniteValue);
                calcs.dirtySize = calcs.dirtySize || calcs[perpendicularPrefix] != stretchSize;
                calcs[perpendicularPrefix] = stretchSize;
            }
            else if (me.align == 'stretchmax') {
                stretchSize = constrain(maxSize - perpendicularMargins, child[perpendicularMinString] || 0, child[perpendicularMaxString] || infiniteValue);
                calcs.dirtySize = calcs.dirtySize || calcs[perpendicularPrefix] != stretchSize;
                calcs[perpendicularPrefix] = stretchSize;
            }
            else if (me.align == me.alignCenteringString) {



                diff = mmax(availPerpendicularSize, maxSize) - innerCtBorderWidth - calcs[perpendicularPrefix];
                if (diff > 0) {
                    calcs[me.perpendicularLeftTop] = perpendicularOffset + Math.round(diff / 2);
                }
            }


            parallelOffset += (calcs[parallelPrefix] || 0) + childMargins[me.parallelAfter];
        }

        return {
            boxes: boxes,
            meta : {
                calculatedWidth: calculatedWidth,
                maxSize: maxSize,
                nonFlexSize: nonFlexSize,
                desiredSize: desiredSize,
                minimumSize: minimumSize,
                shortfall: shortfall,
                tooNarrow: tooNarrow
            }
        }
    }
});

Ext.override(Ext.layout.container.Box, {

    updateInnerCtSize: function(tSize, calcs) {
        var me = this,
            mmax = Math.max,
            align = me.align,
            padding = me.padding,
            width = tSize.width,
            height = tSize.height,
            meta = calcs.meta,
            innerCtWidth,
            innerCtHeight;

        if (me.direction == 'horizontal') {
            innerCtWidth = width;
            // FIX FOR CAPANEL ACCORDION UDOP IE ISSUE
            if (typeof me.innerCt !== 'undefined') {
                innerCtHeight = meta.maxSize + padding.top + padding.bottom + me.innerCt.getBorderWidth('tb');
            }

            if (align == 'stretch') {
                innerCtHeight = height;
            }
            else if (align == 'middle') {
                innerCtHeight = mmax(height, innerCtHeight);
            }
        } else {
            innerCtHeight = height;
            if (typeof me.innerCt !== 'undefined') {
                innerCtWidth = meta.maxSize + padding.left + padding.right + me.innerCt.getBorderWidth('lr');
            }

            if (align == 'stretch') {
                innerCtWidth = width;
            }
            else if (align == 'center') {
                innerCtWidth = mmax(width, innerCtWidth);
            }
        }
        me.getRenderTarget().setSize(innerCtWidth || undefined, innerCtHeight || undefined);



        if (meta.calculatedWidth && me.owner.el.getWidth() > meta.calculatedWidth) {
            me.owner.el.setWidth(meta.calculatedWidth);
        }

        if (me.innerCt.dom.scrollTop) {
            me.innerCt.dom.scrollTop = 0;
        }
    }
});