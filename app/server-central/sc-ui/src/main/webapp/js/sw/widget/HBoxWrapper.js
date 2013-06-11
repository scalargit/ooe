Ext.define('sw.widget.HBoxWrapper', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.sw-hboxwrapper'],
    border: 0,
    layout: {
        type: 'hbox',
        align: 'stretch'
    },
    height: 400,
    anchor: '100%',
    resizable: { transparent: true },
    resizeHandles: 'n s',
    listeners: {
        added: {
            fn: function(box, column) {
                column.on('afterlayout', function() {
                    var pp = box.up('portalpanel');
                    if (!box.itemsCollapsed && pp && box.heightRatio) {
                        var calcHeight = box.heightRatio * pp.getHeight();
                        if ((box.getHeight() < (calcHeight * .9)) || (box.getHeight() > (calcHeight * 1.1))) {
                            box.setHeight(calcHeight);
                        }
                    }
                }, this);
            }
        },
        add: {
            fn: function(box, widget, idx) {
                box.mon(widget, 'collapse', function(panel) {
                    var found = false, x, xlen, heightDiff;
                    if (this.items.getCount() > 1) {
                        for (x=0,xlen=this.items.getCount();!found && x<xlen;x++) {
                            found = !this.items.getAt(x).collapsed;
                        }
                    }
                    if (!found) {
                        this.lastTrackedHeight = this.getHeight();
                        heightDiff = this.lastTrackedHeight - panel.getHeight();
                        this.setHeight(panel.getDockedItems('header')[0].getHeight() + heightDiff);
                        this.itemsCollapsed = true;
                    }
                }, box);
                box.mon(widget, 'expand', function(panel) {
                    this.setHeight(this.lastTrackedHeight);
                    this.itemsCollapsed = false;
                }, box);
            }
        }
    }
});