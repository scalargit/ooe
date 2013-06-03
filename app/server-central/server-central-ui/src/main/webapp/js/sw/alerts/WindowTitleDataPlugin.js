/**
 * Here is the data plugin for alerts that will take actions only on the container.
 *
 * For each widget that supports alerting within its view, you should create a separate plugin:
 * Don't forget to set widgetType accordingly! They should keep dataIndependent true.
 */
Ext.define('sw.plugin.WindowTitleDataPlugin', {

    extend: 'o2e.plugin.AbstractDataPlugin',

    pluginId: 'windowTitleAlert',
    widgetType: '*',
    dataIndependent: true,

    requiredAnnotations: [],
    optionalAnnotations: [], //'alertable'],

    init: function() {
        this.callParent();

        var widget = this.widget;

        widget.addEvents('alertstart', 'alertend');
        if (widget.rendered) {
            this.hookEvents();
        } else {
            widget.on('afterrender', this.hookEvents, this);
        }
    },

    hookEvents: function() {
        this.widget.widgetCt.header.on('click', this.endAlert, this);
    },

    endAlert: function() {
        var ct = this.widget.widgetCt, header = ct.header.getEl().down('.x-panel-header-text-default-framed');
        if (ct.blinkTask) {
            Ext.TaskManager.stop(ct.blinkTask);
            ct.blinkTask = null;
        }
        if (header.hasCls('sw-alert-header')) {
            header.removeCls('sw-alert-header');
        }
        this.widget.fireEvent('alertend', this.widget);
    },

    startAlert: function() {
        var ct = this.widget.widgetCt;
        ct.blinkTask = ct.blinkTask || Ext.TaskManager.start({
            run: function() {
                var btn = this.header.getEl().down('.x-panel-header-text-default-framed');
                if (btn.hasCls('sw-alert-header')) {
                    btn.removeCls('sw-alert-header')
                } else {
                    btn.addCls('sw-alert-header');
                }
            },
            scope: ct,
            interval: 500
        });
        this.widget.fireEvent('alertstart', this.widget);
    },

    handleData: function(data, serviceKey, metadata) {
        if (serviceKey && this.widget.services[serviceKey].alertActive) {
            this.startAlert();
        }
    }

}, function() {
    o2e.plugin.DataPluginMgr.reg(this);
});