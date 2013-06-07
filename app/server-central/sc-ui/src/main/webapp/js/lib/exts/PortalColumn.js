/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.app.PortalColumn
 * @extends Ext.container.Container
 * A layout column class used internally be {@link Ext.app.PortalPanel}.
 */
Ext.define('Ext.app.PortalColumn', {
    extend: 'Ext.container.Container',
    alias: 'widget.portalcolumn',
    layout: {
        type: 'anchor'
    },
    defaultType: 'portlet',
    cls: 'x-portal-column',
    autoHeight: true,
    listeners: {
        afterlayout: {
            fn: function(col) {
                if (col.getHeight() < col.ownerCt.ownerCt.getHeight()) {
                    col.setHeight(col.ownerCt.ownerCt.getHeight());
                }
            }
        },
        afterrender: {
            fn: function(col) {
                if (Ext.isArray(col.widgets)) {
                    var lastPos = null, lastInserted;
                    for (var x=0,xlen=col.widgets.length; x<xlen; x++) {
                        o2e.widgetFactory.create(col.widgets[x].widgetTypeId, col.widgets[x], col.widgets[x].widgetCt.xtype, null, function(w) {
                            if (lastPos !== undefined && lastPos !== null && w.trackedColPosition === lastPos) {
                                lastInserted.add(w);
                            } else {
                                lastInserted = this.add({
                                    xtype: 'sw-hboxwrapper',
                                    height: w.collapsed ? 30 : w.height, // is there a way for this to not be hard coded?
                                    lastTrackedHeight: w.height,
                                    heightRatio: w.heightRatio,
                                    itemsCollapsed: w.collapsed,
                                    items: [w]
                                });
                            }
                            lastPos = w.trackedColPosition;
                        }, col);
                    }
                }
            }
        },
        add: {
            fn: function(col, widget) {
                var tabpanel = col.ownerCt.ownerCt, w = widget.items;
                if (w) {
                    tabpanel.relayEvents(w, ['alertstart', 'alertend']);
                }
            }
        }
    }
    //
    // This is a class so that it could be easily extended
    // if necessary to provide additional behavior.
    //
});
