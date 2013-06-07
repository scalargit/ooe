Ext.define('sw.quickpanel.Apps', {
    extend: 'o2e.widget.MetadataRegistryCategoryTreePanel',
    alias: 'widget.appstree',
    ddGroup: 'apps',
    emptyText: 'No Presto Apps found.',
    textField: 'name',
    categoryField: 'category',

    handler: function(pk, metadata) {
        var me = this,
            type = 'html',
            prestoUrl = (o2e.env.prestoSecure ? 'https' : 'http') + '://' + o2e.env.prestoHost + ':' + o2e.env.prestoPort,
            prestoFiles = prestoUrl + '/presto/files/system/mashlets/' + metadata.id + '/index.html',
            appLauncher = prestoUrl + '/presto/hub/applauncher.html?mid=' + metadata.id,
            mdid = 'PrestoApp_' + metadata.id;

        this.testUrl(prestoFiles, function(customApp) {
            var url = customApp ? prestoFiles : appLauncher,
                md = {
                    "_id": mdid,
                    "id": mdid,
                    "clientConnector":"ungoverned",
                    "connectorAction":"invoke",
                    "connectionType":"HTML",
                    "name":metadata[me.textField],
                    "description":metadata[me.descriptionField],
                    "category":metadata[me.categoryField],
                    "tags":metadata.tags,
                    "recordBreak":"html.info",
                    "request":[{"name":"url","header":"URL","defaultValue":url}],
                    "response":[{"name":"url","header":"URL","defaultValue":"","annotations":[],"ignore":false}],
                    "refreshIntervalSeconds":60,
                    "type":type,
                    "viz":{"html":{}}
                };

            o2e.serviceRegistry.registry.replace(mdid, md);
            o2e.app.viewport.getComponent('mainContentPanel').addWidget(type, o2e.widgetFactory.convertMetadata(mdid, md, type));
        });
    },

    testUrl: function(url, callback) {
        Ext.Ajax.request({
            url: url ,
            success: function() { callback(true); },
            failure: function() { callback(false); }
        });
    },

    //@override
    // overriding to support presto's array of categories
    normalizeData: function(metadata) {
        if (Ext.isEmpty(metadata[this.categoryField])) {
            if (metadata.categories && metadata.categories.length) {
                metadata[this.categoryField] = metadata.categories[0];
            } else {
                metadata[this.categoryField] = 'Uncategorized';
            }
        }

        if (Ext.isEmpty(metadata[this.descriptionField])) {
            metadata[this.descriptionField] = 'No description provided.';
        }

        return metadata;
    },

    onItemContextMenu: function(v, r, i, idx, e) {
        e.preventDefault();
    }
});