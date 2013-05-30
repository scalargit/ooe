Ext.define('o2e.widget.MetadataRegistryCategoryTreePanel', {
    extend: 'Ext.tree.Panel',
    alias: 'widget.o2e-mdrtree',

    border: 0,
    rootVisible: false,

    ddGroup: null,
    handler: Ext.emptyFn,
    onItemContextMenu: Ext.emptyFn,
    scope: null,
    refreshQuery: null,

    registry: null,
    categoryField: 'category',
    textField: 'name',
    descriptionField: 'description',
    searchFields: null,

    constructor: function(cfg) {
        Ext.apply(this, cfg);
        this.searchFields = this.searchFields || [];
        this.callParent([cfg]);
    },

    initComponent: function() {
        var tools = [{
            baseCls: 'quickpanel',
            type: 'search',
            itemId: 'search',
            qtip: 'Toggle search box',
            handler: function(event, el, header, tool) {
                var box = this.getDockedComponent('searchBox');
                if (box) {
                    this.removeDocked(box);
                    this.resetTree();
                } else {
                    this.addDocked({
                        itemId: 'searchBox',
                        dock: 'top',
                        xtype: 'panel',
                        border: 0,
                        layout: 'hbox',
                        items: [{
                            xtype: 'textfield',
                            flex: 1,
                            listeners: {
                                change: {
                                    fn: Ext.Function.createBuffered(function(f, v) {
                                        v = Ext.String.trim(v).toLowerCase();
                                        if (v === '') {
                                            this.resetTree();
                                            return;
                                        }
                                        this.collapseAll();
                                        var root = this.getRootNode();
                                        root.cascadeBy(function(node) {
                                            if (node.get('leaf') && this.isMatch(node, v)) {
                                                this.expandPath(node.getPath());
                                            }
                                        }, this);
                                        root.eachChild(Ext.Function.bind(this.checkExpandedMatches, this, [v], true));
                                    }, 500, this)
                                },
                                afterrender: {
                                    fn: function(f) {
                                        f.focus();
                                    },
                                    single: true
                                }
                            }
                        }]
                    });
                }
            },
            scope: this
        },{
            baseCls: 'quickpanel',
            type: 'expand',
            itemId: 'expand',
            qtip: 'Expand all',
            handler: function(event, el, header, tool) {
                header.getComponent('collapse').show();
                tool.hide();
                this.expandAll();
            },
            scope: this
        },{
            baseCls: 'quickpanel',
            type: 'collapse',
            itemId: 'collapse',
            qtip: 'Collapse all',
            hidden: true,
            handler: function(event, el, header, tool) {
                header.getComponent('expand').show();
                tool.hide();
                this.collapseAll();
            },
            scope: this
        }];

        if (this.refreshQuery !== null) {
            tools.push({
                baseCls: 'quickpanel',
                type: 'refresh',
                qtip: 'Refresh this list',
                handler: function(event, el, header, tool) {
                    this.body.mask('Refreshing, please wait...');
                    this.getRootNode().removeAll();
                    delete this.categories;
                    this.categories = {};
                    o2e.connectorMgr.query(Ext.apply(this.refreshQuery, {
                        componentId: this.id,
                        success: function(serviceKey, data, forceRefresh) {
                            var a = data.results || data.records || data.response || data, r, o, y=0, ylen=a.length, tmp = [];
                            if (Ext.isArray(a)) {
                                // checking that primaryKey is present
                                for (; y<ylen; y++) {
                                    r = o =a[y];
                                    // accommodating generic resultset structure from mongodb here
                                    if (r.record && r.record[this.registry.insertKey]) {
                                        o = r.record;
                                        r = r.record[this.registry.insertKey];
                                    }
                                    if (!r[this.registry.primaryKey]) {
                                        r[this.registry.primaryKey] = o[this.registry.primaryKey];
                                    }
                                    tmp.push(r);
                                }
                            }
                            this.registry.load(tmp);
                            this.body.unmask();
                        },
                        failure: function() {
                            Ext.Msg.alert('Error', 'Error refreshing, please contact your administrator.');
                            this.body.unmask();
                        },
                        scope: this
                    }));
                },
                scope: this
            });
        }

        Ext.apply(this, {
            categories: {},
            store: Ext.create('Ext.data.TreeStore', {
                folderSort: true,
                root: {
                    text: this.title,
                    expanded: true,
                    children: []
                }
            }),
            viewConfig: {
                emptyText: this.emptyText,
                deferEmptyText: false,
                plugins: {
                    ddGroup: this.ddGroup || 'TreeDD',
                    ptype: 'treeviewdragdrop',
                    enableDrop: false
                }
            },
            tools: tools
        });

        this.registry.on('insert', this.doNodeInsert, this);
        this.registry.on('update', this.doNodeUpdate, this);
        this.registry.on('remove', this.doNodeRemove, this);
        this.registry.on('load', this.doNodeLoad, this);

        this.callParent();

        this.store.sort('text', 'ASC');
        this.on('itemclick', this.onItemClick, this);
        this.on('itemcontextmenu', this.onItemContextMenu, this);
    },

    doNodeInsert: function(metadata, suppressSort) {
        // don't display SYSTEM data or invalid data
        if (Ext.isEmpty(metadata[this.registry.primaryKey]) ||
            metadata[this.registry.primaryKey].indexOf('SYSTEM') !== -1 ||
            Ext.isEmpty(metadata[this.textField]) ||
            Ext.String.trim(metadata[this.textField]) === '') {

            return;
        }

        // normalize data
        metadata = this.normalizeData(metadata);

        // get category node
        var category = metadata[this.categoryField],
            categoryNode = this.categories.hasOwnProperty(category) ?
                this.categories[category] : this.getParentCategoryNode(category);

        // insert leaf node under category node
        categoryNode.appendChild({
            expandable: false,
            iconCls: 'mdrtree-leaf', // TODO: maybe do "new-ness" test here?
            leaf: true,
            loaded: true,
            qtip: '<b>'+metadata[this.textField]+'</b><br/>'+metadata[this.descriptionField],
            root: false,
            text: metadata[this.textField],
            id: metadata[this.registry.primaryKey],
            metadata: metadata
        });

        if (suppressSort !== true) {
            this.store.sort();
        }
    },

    doNodeUpdate: function(metadata) {
        metadata = this.normalizeData(metadata);

        var tmp, needSort = false,
            node = this.getRootNode().findChild('id', metadata[this.registry.primaryKey], true),
            originalParentNode = node.parentNode,
            targetParentNode = this.getParentCategoryNode(metadata[this.categoryField]);

        // handle category change
        if (targetParentNode !== originalParentNode) {
            targetParentNode.appendChild(node);
            if (!originalParentNode.hasChildNodes()) {
                this.doNodeRemove(originalParentNode.get('id'));
            }
            needSort = true;
        }

        // handle text change
        if (node.get('text') !== metadata[this.textField]) {
            node.set('text', metadata[this.textField]);
            this.getView().refreshNode(node.get('index'));
            needSort = true;
        }

        // update the metadata for the node
        node.set('qtip', '<b>'+metadata[this.textField]+'</b><br/>'+metadata[this.descriptionField]);
        node.set('metadata', metadata);
        node.commit();

        // re-sort if changes were detected
        if (needSort === true) {
            this.store.sort();
        }
    },

    doNodeRemove: function(id) {
        var node = this.getRootNode().findChild('id', id, true);
            if (node != null) {
                var parent = node.parentNode;
    
            // first handle categories if node is not a leaf
            if (!node.get('leaf')) {
                delete this.categories[node.get('fullText')];
            }
    
            // remove node
            parent.removeChild(node, true);
    
            // handle empty category
            if (!parent.hasChildNodes()) {
                this.doNodeRemove(parent.get('id'));
            }
        }
    },

    doNodeLoad: function(metadata) {
        Ext.Array.each(metadata, Ext.Function.bind(this.doNodeInsert, this, [true], true));
    },

    getParentCategoryNode: function(category) {
        var i, ilen, fullCategory = '', last = this.getRootNode(), nest = category.split('.');
        for (i=0,ilen=nest.length; i<ilen; i++) {
            fullCategory = fullCategory + nest[i];
            if (!this.categories.hasOwnProperty(fullCategory)) {
                this.categories[fullCategory] = last.appendChild({
                    children: [],
                    expandable: true,
                    leaf: false,
                    id: nest[i],
                    loaded: true,
                    qtip: nest[i],
                    root: false,
                    text: nest[i],
                    fullText: fullCategory
                });
            }
            last = this.categories[fullCategory];
            fullCategory = fullCategory + '.';
        }
        return last;
    },

    onItemClick: function(v, r, i, idx, e, opts) {
        if (r.get('leaf')) {
            this.handler.apply(this.scope || this, [r.get('id'), r.get('metadata')]);
        }
    },

    normalizeData: function(metadata) {
        if (Ext.isEmpty(metadata[this.categoryField])) {
            metadata[this.categoryField] = 'Uncategorized';
        }

        if (Ext.isEmpty(metadata[this.descriptionField])) {
            metadata[this.descriptionField] = 'No description provided.';
        }

        return metadata;
    },

    resetTree: function() {
        var header = this.down('header');
        this.collapseAll();
        this.getView().refresh();
        header.getComponent('expand').show();
        header.getComponent('collapse').hide();
    },

    isMatch: function(node, value) {
        var x = 0, xlen = this.searchFields.length, searchField,
            meta = node.get('metadata'), match,
            compare = [
                node.get('id').toLowerCase(),
                meta[this.textField].toLowerCase(),
                meta[this.categoryField].toLowerCase(),
                meta[this.descriptionField].toLowerCase()
            ];
        for (; x<xlen; x++) {
            searchField = meta[this.searchFields[x]];
            compare.push((Ext.isArray(searchField) ? searchField.toString() : searchField).toLowerCase());
        }
        return Ext.Array.each(compare, function(v) {
            if (v.indexOf(value) !== -1) {
                return false;
            }
        }, this) !== true;
    },

    checkExpandedMatches: function(node, value) {
        if (node.isExpanded()) {
            node.eachChild(function(n) {
                if (n.get('leaf')) {
                    if (!this.isMatch(n, value)) {
                        this.hideNode(n);
                    }
                } else {
                    this.checkExpandedMatches(n, value);
                }
            }, this);
        } else {
            this.hideNode(node);
        }
    },

    hideNode: function(node) {
        var el = Ext.fly(this.getView().getNode(node));
        el.setVisibilityMode(Ext.Element.DISPLAY);
        el.hide();
    }
});