Ext.define('sw.plugin.HtmlAutoRefresh', {
    extend: 'o2e.plugin.AbstractConfigPlugin',

    pluginId: 'htmlAutoRefresh',
    widgetType: 'html',

    interval: null,

    init: function() {
        if (this.interval !== null) {
            if (this.widget.ready) {
                this.startRefresh(this.interval);
            } else {
                this.widget.on('ready', function() {
                    this.startRefresh(this.interval);
                }, this);
            }
        }
    },

    createItem: function() {
        return Ext.create('Ext.menu.Item', {
            iconCls: 'icon-refresh',
            text: 'Auto Refresh',
            menu: {
                defaults: {
                    xtype: 'menucheckitem',
                    group: 'refresh'
                },
                items:[{
                    text: 'None',
                    handler: this.stopRefresh,
                    scope: this,
                    checked: this.interval === null ? true: false
                },{
                    text: 'Every 5 seconds',
                    handler: Ext.Function.bind(this.startRefresh, this, [5000], 0),
                    checked: this.interval === 5000 ? true: false
                },{
                    text: 'Every 10 seconds',
                    handler: Ext.Function.bind(this.startRefresh, this, [10000], 0),
                    checked: this.interval === 10000 ? true: false
                },{
                    text: 'Every 15 seconds',
                    handler: Ext.Function.bind(this.startRefresh, this, [15000], 0),
                    checked: this.interval === 15000 ? true: false
                },{
                    text: 'Every 30 seconds',
                    handler: Ext.Function.bind(this.startRefresh, this, [30000], 0),
                    checked: this.interval === 30000 ? true: false
                },{
                    text: 'Every minute',
                    handler: Ext.Function.bind(this.startRefresh, this, [60000], 0),
                    checked: this.interval === 60000 ? true: false
                },{
                    text: 'Every 5 minutes',
                    handler: Ext.Function.bind(this.startRefresh, this, [300000], 0),
                    checked: this.interval === 300000 ? true: false
                },{
                    text: 'Every 10 minutes',
                    handler: Ext.Function.bind(this.startRefresh, this, [600000], 0),
                    checked: this.interval === 600000 ? true: false
                },{
                    text: 'Every 15 minutes',
                    handler: Ext.Function.bind(this.startRefresh, this, [900000], 0),
                    checked: this.interval === 900000 ? true: false
                },{
                    text: 'Every 30 minutes',
                    handler: Ext.Function.bind(this.startRefresh, this, [1800000], 0),
                    checked: this.interval === 1800000 ? true: false
                }]
            }
        });
    },

    startRefresh: function(interval) {
        if (this.interval !== null) {
            this.stopRefresh();
        }
        this.interval = interval;
        this.task = Ext.TaskManager.start({
            run: function() {
                this.widget.miframe.setSrc();
            },
            scope: this,
            interval: this.interval
        });
    },

    stopRefresh: function() {
        if (this.task) {
            Ext.TaskManager.stop(this.task);
            this.interval = null;
            delete this.task;
        }
    },

    getStateConfig: function() {
        return Ext.apply({
            interval: this.interval
        }, this.callParent());
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});