/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/**
 * @class Ext.app.PortalDropZone
 * @extends Ext.dd.DropTarget
 * Internal class that manages drag/drop for {@link Ext.app.PortalPanel}.
 */
Ext.define('Ext.app.PortalDropZone', {
    extend: 'Ext.dd.DropTarget',

    constructor: function(portal, cfg) {
        this.portal = portal;
        Ext.dd.ScrollManager.register(portal.body);
        Ext.app.PortalDropZone.superclass.constructor.call(this, portal.body, cfg);
        portal.body.ddScrollConfig = this.ddScrollConfig;
    },

    ddScrollConfig: {
        vthresh: 50,
        hthresh: -1,
        animate: true,
        increment: 200
    },

    createEvent: function(dd, e, data, col, c, pos) {
        return {
            portal: this.portal,
            panel: data.panel,
            columnIndex: col,
            column: c,
            position: pos,
            data: data,
            source: dd,
            rawEvent: e,
            status: this.dropAllowed
        };
    },

    notifyOver: function(dd, e, data) {
        var xy = e.getXY(),
            portal = this.portal,
            proxy = dd.proxy;

        // case column widths
        if (!this.grid) {
            this.grid = this.getGrid();
        }

        // handle case scroll where scrollbars appear during drag
        var cw = portal.body.dom.clientWidth;
        if (!this.lastCW) {
            // set initial client width
            this.lastCW = cw;
        } else if (this.lastCW != cw) {
            // client width has changed, so refresh layout & grid calcs
            this.lastCW = cw;
            //portal.doLayout();
            this.grid = this.getGrid();
        }

        // determine column
        var colIndex = 0,
            colRight = 0,
            cols = this.grid.columnX,
            len = cols.length,
            cmatch = false;

        for (len; colIndex < len; colIndex++) {
            colRight = cols[colIndex].x + cols[colIndex].w;
            if (xy[0] < colRight) {
                cmatch = true;
                break;
            }
        }
        // no match, fix last index
        if (!cmatch) {
            colIndex--;
        }

        // find insert position
        var overPortlet, pos = 0,
            h = 0,
            w = 0,
            match = false,
            overColumn = portal.items.getAt(colIndex),
            portlets = overColumn.items.items,
            overSelf = false,
            proxyHpos = null;

        len = portlets.length;

        for (len; pos < len; pos++) {
            overPortlet = portlets[pos];
            h = overPortlet.el.getHeight();
            w = overPortlet.el.getWidth();
            // check 1: if height is 0, that means I'm over myself
            if (h === 0) {
                overSelf = true;
            // check 2: else if my Y position is less than (overPortlet Y + overPortletHeight/3), match = true
            } else if ((overPortlet.el.getY() + (h / 4)) > xy[1]) {
                match = true;
                break;
            // check 3: else if my Y position is less than (overPortlet Y + overPortletHeight*2/3)
            } else if ((overPortlet.el.getY() + (h * 3 / 4)) > xy[1] && (overPortlet !== dd.panel.ownerCt || overPortlet.items.getCount() > 1)) {
                match = true;
                // if my X position is less than (overPortlet X + overPortletWidth/2)
                if ((overPortlet.el.getX() + (w / 2)) > xy[0]) {
                    proxyHpos = 'left'
                } else {
                    proxyHpos = 'right'
                }
                break;
            }
        }

        pos = (match && overPortlet ? pos : overColumn.items.getCount()) + (overSelf ? -1 : 0);
        var overEvent = this.createEvent(dd, e, data, colIndex, overColumn, pos);

        if (portal.fireEvent('validatedrop', overEvent) !== false && portal.fireEvent('beforedragover', overEvent) !== false) {

            // make sure proxy width is fluid in different width columns
            proxy.getProxy().setWidth('auto');

            var parentNode, sibling = null, siblings;

            if (overPortlet) {
                if (proxyHpos !== null ) {
                    // first hide regular proxy
                    proxy.getProxy().setVisibilityMode(Ext.Element.DISPLAY);
                    proxy.getProxy().hide();

                    // do special proxy representation inside of widgets
                    if (this.proxyHposItem && this.proxyHposItemPos !== proxyHpos) {
                        this.proxyHposItem.ownerCt.remove(this.proxyHposItem);
                        this.proxyHposItem = null;
                    }

                    if (!this.proxyHposItem) {
                        this.proxyHposItem = Ext.create('Ext.panel.Panel', {
                            flex: 1,
                            style: {
                                border: '2px dashed #99bbe8',
                                borderRadius: '4px',
                                marginBottom: '10px',
                                marginRight: '5px'
                            },
                            border: 0,
                            bodyStyle: { background: '#f6f6f6' }
                        });
                        this.proxyHposItemPos = proxyHpos;
                        if (proxyHpos === 'left') {
                            overPortlet.insert(0, this.proxyHposItem);
                        } else {
                            overPortlet.add(this.proxyHposItem);
                        }
                    }
                } else {
                    // no proxyHpos, so parentNode is the column (overPortlet's parentNode)
                    parentNode = overPortlet.el.dom.parentNode;
                    if (match) {
                        // if there was a match, then "before" needs to be the overPortlet
                        sibling = overPortlet.el.dom;
                    } // else null
                }
            } else {
                // no overPortlet, so just add it to the overColumn
                parentNode = overColumn.el.dom;
            }

            if (parentNode) {
                proxy.getProxy().show();
                proxy.moveProxy(parentNode, sibling);
                if (this.proxyHposItem) {
                    this.proxyHposItem.ownerCt.remove(this.proxyHposItem);
                    this.proxyHposItem = null;
                }
            }

            this.lastPos = {
                c: overColumn,
                col: colIndex,
                p: overSelf || (match && overPortlet) ? pos : false,
                pHpos: proxyHpos,
                pHposItem: this.proxyHposItem
            };
            this.scrollPos = portal.body.getScroll();

            portal.fireEvent('dragover', overEvent);
            return overEvent.status;
        } else {
            return overEvent.status;
        }

    },

    notifyOut: function() {
        delete this.grid;
    },

    notifyDrop: function(dd, e, data) {
        delete this.grid;
        if (!this.lastPos) {
            return;
        }
        var c = this.lastPos.c,
            col = this.lastPos.col,
            pos = this.lastPos.p,
            hpos = this.lastPos.pHpos,
            panel = dd.panel,
            origOwner = panel.ownerCt,
            dropEvent = this.createEvent(dd, e, data, col, c, pos !== false ? pos : c.items.getCount());

        if (this.portal.fireEvent('validatedrop', dropEvent) !== false && this.portal.fireEvent('beforedrop', dropEvent) !== false) {

            // make sure panel is visible prior to inserting so that the layout doesn't ignore it
            panel.el.dom.style.display = '';

            if (pos !== false) {
                if (hpos !== null) {
                    var insertInto = c.items.getAt(pos),
                        sibCount = insertInto.items.getCount();
                    insertInto.remove(this.lastPos.pHposItem);
                    this.proxyHposItem = null;
                    if (hpos === 'left' && sibCount > 0) {
                        insertInto.insert(0, panel);
                    } else {
                        insertInto.add(panel);
                    }
                } else {
                    c.insert(pos, {
                        xtype: 'sw-hboxwrapper',
                        height: origOwner.getHeight(),
                        items: [panel]
                    });
                }
            } else {
                c.add({
                    xtype: 'sw-hboxwrapper',
                    height: origOwner.getHeight(),
                    items: [panel]
                });
            }

            dd.proxy.hide();
            this.portal.fireEvent('drop', dropEvent);

            // cleanup ownerCt if necessary
            if (origOwner.items.getCount() === 0) {
                origOwner.ownerCt.remove(origOwner);
            }

            // scroll position is lost on drop, fix it
            var st = this.scrollPos.top;
            if (st) {
                var d = this.portal.body.dom;
                setTimeout(function() {
                    d.scrollTop = st;
                },
                10);
            }

        }
        delete this.lastPos;
        return true;
    },

    // internal cache of body and column coords
    getGrid: function() {
        var box = this.portal.body.getBox();
        box.columnX = [];
        this.portal.items.each(function(c) {
            box.columnX.push({
                x: c.el.getX(),
                w: c.el.getWidth()
            });
        });
        return box;
    },

    // unregister the dropzone from ScrollManager
    unreg: function() {
        Ext.dd.ScrollManager.unregister(this.portal.body);
        Ext.app.PortalDropZone.superclass.unreg.call(this);
    }
});

