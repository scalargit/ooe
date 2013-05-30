Ext.define('o2e.dashboard.workspace.WidgetWorkspace', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.o2e-widgetworkspace',

    mixins: {
        workspace: 'o2e.dashboard.workspace.AbstractWorkspace'
    },

    containerClass: 'o2e-framedpnlct',
    isTransient: false,
    closable: true,

    toolbar: 'o2e.dashboard.workspace.WidgetToolbar',
    layout: 'absolute',

    posCount : 0,
	widgetPositions : [],
    defaultWidth: 350,
    defaultHeight: 300,
    defaultX: 50,
    defaultY: 50,
    currentX: 50,
    currentY: 50,
    cascadeDistance: 30,
    cascadeXWrapDistance: 25,
    xWrapCount: 1,

    initComponent: function() {
        var me = this, i, len;

        this.mixins.workspace.initComponent.call(this);
        this.callParent();

        if (me.hasOwnProperty('widgets') && me.widgets.length > 0) {
            for (i=0, len=me.widgets.length; i<len; i++) {
                this.addWidget(me.widgets[i]);
            }
        }
    },

    getContainerCfg: function() {
        var cfg = this.mixins.workspace.getContainerCfg.call(this);

        Ext.apply(cfg, {
            x: this.currentX,
            y: this.currentY,
            width: this.defaultWidth,
            height: this.defaultHeight
        });

        return cfg;
    },

    getStateConfig: function() {
        var widgets = [], i, len;
        for (i=0, len=this.items.getCount(); i<len; i++) {
            widgets.push(this.items.getAt(i).getStateConfig());
        }
        return {
            xtype: 'o2e-widgetworkspace',
            title: this.title,
            widgets: widgets
        };
    },

	getDefaultWidgetPos : function() {
		if(this.getActiveTab() && this.posCount < 1) {
			this.getActiveTab().items.each(function(item, index, len){
				item.currentX = item.getPosition(true)[0];
				item.currentY = item.getPosition(true)[1];
			}, this);
		}
	},

	positionWidgets : function(cPanel, adjW, adjH, rawW, rawH) {
		if(this.getActiveTab()) {
			this.getActiveTab().items.each(function(item, index, len){
				item.setPosition(item.currentX, item.currentY);
			}, this);
		}
	},

	cascadeWindows: function() {
		var me = this;

		me.currentX = me.defaultX;
		me.currentY = me.defaultY;

		me.items.each(function(window) {
			window.setSize(me.defaultWidth, me.defaultHeight);
			window.setPosition(me.currentX, me.currentY);
			window.currentX = me.currentX;
			window.currentY = me.currentY;

			me.updateCurrentWindowPosition(me);
		}, me);
	},

	updateCurrentWindowPosition: function(tab) {
		if ((tab.currentX + tab.cascadeDistance + tab.defaultWidth) < (tab.getWidth())) {
			if((tab.currentY + tab.cascadeDistance + tab.defaultHeight) < (tab.getHeight())) {
				// x and y are good to go
				tab.currentX += tab.cascadeDistance;
				tab.currentY += tab.cascadeDistance;
			} else if ((tab.defaultX + (tab.cascadeDistance * tab.xWrapCount) + tab.defaultWidth) < (tab.getWidth())) {
				// x was good, y was bad
				// new x wrap is good so we fall here, which is really a y reset and x wrap
				tab.currentX = tab.defaultX + (tab.cascadeDistance * tab.xWrapCount);
				tab.currentY = tab.defaultY;
				tab.xWrapCount++;
			} else {
				// x was good, y was bad. new x wrap was bad. just reset.
				tab.currentX = tab.defaultX;
				tab.currentY = tab.defaultY;
			}
		} else if ((tab.currentY + tab.cascadeDistance + tab.defaultHeight) < (tab.getHeight())) {
			// x is bad, y is good
			if ((tab.defaultX + (tab.cascadeDistance * tab.xWrapCount) + tab.defaultWidth) < (tab.getWidth())) {
				// new x wrap is good so we fall here, which is really a y reset and x wrap
				tab.currentX = tab.defaultX + (tab.cascadeDistance * tab.xWrapCount);
				tab.currentY = tab.defaultY;
				tab.xWrapCount++;
			} else {
				// x was bad, ywas good, new x wrap was bad. just reset.
				tab.currentX = tab.defaultX;
				tab.currentY = tab.defaultY;
			}
		} else {
			// x and y are bad. just reset.
			tab.currentX = tab.defaultX;
			tab.currentY = tab.defaultY;
		}
	},

	tileWindows : function() {
        var me = this, width, height, count, numRows, numAcross, wWidth, wHeight, tileX, tileY;

		if (me.items.getCount() === 0) {
			return;
		}

		width = me.getInnerWidth();
		height = me.getInnerHeight();
		count = me.items.getCount();

		numRows = Math.round(Math.sqrt(count));
		numAcross = Math.ceil(count/numRows);
		wWidth = Math.floor(width/numAcross);
		wHeight = Math.floor(height/numRows);
		tileX = 0;
		tileY = 0;

		me.items.each(function(window) {
			window.setSize(wWidth, wHeight);
			window.setPosition(tileX, tileY);
			window.currentX = tileX;
			window.currentY = tileY;

			if ((tileX + (wWidth*2)) <= width) {
				tileX += wWidth;
			} else {
				tileX = 0;
				tileY += wHeight;
			}
		});
	},

    getInnerWidth: function() {
        return this.getWidth() - this.frameSize.right - this.frameSize.left;
    },

    getInnerHeight: function() {
        return this.getHeight() - this.frameSize.top - this.frameSize.bottom;
    }
});
