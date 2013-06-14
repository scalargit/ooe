/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.app.Portlet
 * @extends Ext.panel.Panel
 * A {@link Ext.panel.Panel Panel} class that is managed by {@link Ext.app.PortalPanel}.
 */
Ext.define('Ext.app.Portlet', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.portlet',
    layout: 'fit',
    anchor: '100%',
    frame: true,
    closable: true,
    collapsible: true,
    animCollapse: true,
    //resizable: true,
    //resizeHandles: 'n s',
    draggable: true,
    height: 300,
    cls: 'x-portlet',

    // CUSTOM LOGIC FOR SW HERE
    initComponent: function() {
        if (this.preventMaximize !== true) {
            this.tools = [{
                type: 'restore',
                itemId: 'restore',
                hidden: true,
                handler: this.onRestore,
                scope: this
            },{
                type: 'maximize',
                itemId: 'maximize',
                handler: function(e, el, header, btn) {
                    btn.hide();
                    header.getComponent('restore').show();

                    var tab = this.up('portalpanel');
                    tab.items.each(function(col) {
                        col.items.each(function(hbox) {
                            if (Ext.Array.indexOf(hbox.items.items, this) === -1) {
                                hbox.hide();
                            } else {
                                hbox.items.each(function(portlet) {
                                    if (portlet !== this) {
                                        portlet.hide();
                                    }
                                }, this);
                            }
                        },this);
                    }, this);
                    this.ownerCt.restoreSize = this.getSize();
                    this.ownerCt.restorePosition = this.getPosition(true);
                    this.ownerCt.setSize(tab.body.getWidth() - 28, tab.body.getHeight() - 15);
                    this.ownerCt.setPagePosition(tab.body.getX() + 5, tab.body.getY() + 5, true);
                    this.maximized = true;
                },
                scope: this
            }]
        }

        this.callParent();
    },

    onRestore: function(e, el, header, btn) {
        btn.hide();
        header.getComponent('maximize').show();
        this.ownerCt.setSize(this.ownerCt.restoreSize);
        this.ownerCt.setPosition(this.ownerCt.restorePosition[0], this.ownerCt.restorePosition[1], true);
        this.maximized = false;

        var tab = this.up('portalpanel');
        tab.items.each(function(col) {
            col.items.each(function(hbox) {
                if (Ext.Array.indexOf(hbox.items.items, this) === -1) {
                    hbox.show();
                } else {
                    hbox.items.each(function(portlet) {
                        if (portlet !== this) {
                            portlet.show();
                        }
                    }, this);
                }
            }, this);
        }, this);
    },

    // Override Panel's default doClose to provide a custom fade out effect
    // when a portlet is removed from the portal
    doClose: function() {
        if (this.maximized) {
            this.onRestore(null, null, this.header, this.header.getComponent('restore'));
        }
        this.el.animate({
            opacity: 0,
            callback: function(){
                //this.fireEvent('close', this);
                var ownerCt = this.ownerCt;
                if (ownerCt) {
                    ownerCt.remove(this, true);
                    if (ownerCt.items.getCount() === 0) {
                        ownerCt.ownerCt.remove(ownerCt);
                    }
                } else {
                    this[this.closeAction]();
                }
            },
            scope: this
        });
    }
});
