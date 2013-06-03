Ext.define('sw.WidgetContainer', {

    extend: 'Ext.app.Portlet',
    alias: 'widget.sw-widgetcontainer',
    mixins: {
        container: 'o2e.widget.AbstractContainer'
    },

    dockedItems: [
        {
            xtype: 'toolbar',
            itemId: 'toolbar',
            dock: 'bottom'
        }
    ],
    height: 200,
    flex: 1,

    desiredPlugins: ['refresh', 'lock', 'status', 'widgetTitle', 'manageServices', 'filters', 'inputs', 'wiring', 'embedUrl', 'launchInOzone'],

    init: function() {
        var me = this;
        me.dropTargetDDGroups = [];
        me.mixins.container.init.call(this);

        me.addListener('afterlayout', function() {
            this.trackedHeight = this.getHeight();
        }, me);

        me.addListener('afterlayout', function() {
            this.setSize(this.getWidth(), this.getHeight());
            /****
            * Setup Drop Targets
            ***/
            if (!this.dropTarget) {
                // Use body DOM to make sure we only drop to the view container
                this.dropTarget = Ext.create('Ext.dd.DropTarget', me.body.dom, {
                    ddGroup: 'services',
                    notifyEnter: function(ddSource, e, data) {
                        if (ddSource.ddGroup === 'services') {
                            var r = ddSource.dragData.records[0], viz = r.get('metadata').viz, typeMatch = false;
                            for (var type in viz) {
                                if (viz.hasOwnProperty(type) && type === me.widget.widgetTypeId) {
                                    typeMatch = true;
                                    break;
                                }
                            }

                            if (typeMatch === false) {
                                ddSource.serviceDropAllowed = false;
                                return this.dropNotAllowed;
                            } else {
                                ddSource.serviceDropAllowed = true;
                                me.body.stopAnimation();
                                me.body.highlight();
                                return this.dropAllowed;
                            }
                        } else {
                            ddSource.serviceDropAllowed = true;
                            me.body.stopAnimation();
                            me.body.highlight();
                            return this.dropAllowed;
                        }
                    },
                    notifyOver: function(ddSource, e, data) {
                        return ddSource.serviceDropAllowed === true ? this.dropAllowed : this.dropNotAllowed;
                    },
                    notifyDrop  : function(ddSource, e, data){
                        if (ddSource.ddGroup === 'services') {
                            // Reference the record (single selection) for readability
                            var r = ddSource.dragData.records[0], params = {}, sid = r.get('id'), metadata = r.get('metadata'), viz = metadata.viz, typeMatch = false;

                            // First, make sure the record is compatible with this widget type
                            for (var type in viz) {
                                if (viz.hasOwnProperty(type) && type === me.widget.widgetTypeId) {
                                    typeMatch = true;
                                    break;
                                }
                            }
                            if (typeMatch === false) {
                                return false;
                            }

                            // Then, make sure we don't allow users to duplicate services
                            for (var serviceKey in me.widget.services) {
                                if (me.widget.services.hasOwnProperty(serviceKey) && me.widget.services[serviceKey].serviceId === sid) {
                                    return true;
                                }
                            }

                            Ext.each(metadata.request, function(reqCol) {
                                params[reqCol.name] = reqCol.defaultValue;
                            });
                            me.widget.addService(Ext.create('o2e.data.Service', {
                                serviceId: sid,
                                params: params,
                                active: true,
                                filters: [],
                                metadata: metadata
                            }));
                            return true;
                        } else {
                            return me.configPlugins[ddSource.ddGroup].onContainerDrop(ddSource, e, data);
                        }
                    }
                });
                if (this.dropTargetDDGroups.length > 0) {
                    for (var x=0,xlen=this.dropTargetDDGroups.length; x<xlen; x++) {
                        this.dropTarget.addToGroup(this.dropTargetDDGroups[x]);
                    }
                }
            }
        }, me, { single: true });
    },

    initPlugins: function() {
        var i, ilen, toolbar, plugins, me = this;

        me.mixins.container.initPlugins.call(this);

        plugins = me.configPlugins;
//        plugins.search.createItem();
        toolbar = me.getComponent('toolbar');

        toolbar.add('->');
        toolbar.add({
            iconCls: 'icon-manage',
            itemId: 'gear',
            menu: [
                // WidgetCt config items here
                plugins.widgetTitle.createItem(),
                plugins.launchInOzone.createItem(),
                plugins.embedUrl.createItem(),
                '-',
                // Widget config items here
                plugins.manageServices.createItem(),
                plugins.filters.createItem(),
                plugins.inputs.createItem(),
                plugins.wiring.createItem()
                // this.widgetPlugins will be added here
            ]
        });
        toolbar.add(plugins.refresh.createItem());
        toolbar.add(plugins.lock.createItem());
        toolbar.add(plugins.status.createItem());

        for (i=0,ilen=me.widgetPlugins.length; i<ilen; i++) {
            if (i === 0) {
                toolbar.getComponent('gear').menu.add('-');
            }
            toolbar.getComponent('gear').menu.add(me.widgetPlugins[i].createItem());
        }

        this.widget.on('ready', function() {
            this.doComponentLayout();
        }, this, {single: true});
    },

    getStateConfig: function() {
        return Ext.apply({
            height: this.trackedHeight,
            heightRatio: this.trackedHeight / this.up('portalpanel').getHeight(),
            collapsed: this.collapsed
        }, this.mixins.container.getStateConfig.call(this));
    }
});