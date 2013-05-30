/**
 * @class o2e.widget.WidgetFactory
 * @singleton
 */
Ext.define('o2e.widget.WidgetFactory', {

    singleton: true,

    widgets: null,

    constructor: function() {
        this.widgets = {};
    },
	
	reg: function(type, cfg) {
		if (this.widgets.hasOwnProperty(type)) {
			o2e.log.info("Duplicate widget type \""+type+"\" found. Original is being overridden.");
		}
		this.widgets[type] = cfg;
	},

    convertMetadata: function(serviceId, metadata, widgetType) {
        var params = {}, serviceKey, widget, services = {};
        Ext.each(metadata.request, function(reqCol) {
            params[reqCol.name] = reqCol.defaultValue;
        });

        serviceKey = o2e.connectorMgr.getServiceKey(serviceId, params);
        services[serviceKey] = Ext.create('o2e.data.Service', {
            serviceId: serviceId,
            params: params,
            active: true,
            filters: [],
            metadata: metadata
        });

        return {
            services : services,
            title : metadata.name || '',
            widgetTitle : metadata.viz[widgetType] ? metadata.viz[widgetType].widgetTitle : '',
            locked : false
        };
    },
	
	createFromService: function(serviceId, widgetType, containerType, callback, scope) {
        o2e.serviceRegistry.get(serviceId, function(metadata) {
            this.create(widgetType || metadata.widget, this.convertMetadata(serviceId, metadata, widgetType), containerType, null, callback, scope);
        }, this);
	},

    /**
     *
     * @param {Object} cfg
     * @param {String} containerType Optional. Only if no container object is part of the cfg parameter. This should be a container xtype.
     * @return {Object} Returns a config object that is appropriate for adding to a Ext Component.
     */
	create: function(widgetType, widgetCfg, containerClass, containerCfg, callback, scope) {
        var container;

        if (!containerCfg) {
            containerCfg = {};
        }

        if (widgetCfg.widgetCt) {
            Ext.apply(containerCfg, widgetCfg.widgetCt);
        }

        if (!containerCfg.title || containerCfg.title === '') {
            containerCfg.title = widgetCfg.title || '';
        }

        //Create the container for the widget and return it
        container = Ext.create('widget.'+containerClass, containerCfg);

        widgetCfg.widgetCt = container;

        o2e.widgetTypeRegistry.get(widgetType, function(metadata) {
            var widgetClass = metadata.className;
            widgetCfg.widgetTypeId = metadata.widgetTypeId;
            widgetCfg.widgetIcon = metadata.icon;

            Ext.require(widgetClass, function() {
                //Create widget
                var widget = Ext.create(widgetClass, widgetCfg);
                container.add(widget);
                if (callback) {
                    callback.call(scope || this, container);
                } else {
                    throw 'No callback provided to WidgetFactory create!';
                }
            }, this);
        }, this);
	}
});
