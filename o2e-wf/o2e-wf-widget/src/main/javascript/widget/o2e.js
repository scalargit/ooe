/**
 * @class o2e
 * @singleton
 */
o2e = {
    /**
     * @property registries
     * @type Array
     */
    registries: null,
    /**
     * @property log
     * @type o2e.util.MsgHandler
     */
    log: null,
    /**
     * @property actionMgr
     * @type o2e.action.ActionMgr
     */
    actionMgr: null,
    /**
     * @property connectorMgr
     * @type o2e.connector.ConnectorMgr
     */
    connectorMgr: null,
    /**
     * @property widgetFactory
     * @type o2e.widget.WidgetFactory
     */
    widgetFactory: null,
    /**
     * @property modelFactory
     * @type o2e.data.ModelFactory
     */
    modelFactory: null,
    /**
     * @property storeFactory
     * @type o2e.data.StoreFactory
     */
    storeFactory: null,
    /**
     * @property dataPluginMgr
     * @type o2e.plugin.DataPluginMgr
     */
    dataPluginMgr: null,
    /**
     * @property configPluginMgr
     * @type o2e.plugin.ConfigPluginMgr
     */
    configPluginMgr: null,
    /**
     * @property env
     * @type o2e.Environment
     */
    env: null,
    /**
     * @property app
     * @type o2e.AbstractApplication
     */
    app: null
};

Ext.Loader.setConfig({
    enabled: true,
    disableCaching: false,
    paths: {
        'o2e': 'js/widgets/o2e'
    }
});
