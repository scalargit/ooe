Ext.ns('meta.system');

meta.system.services = [
    {
        id: 'SYSTEM_service_list',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'metadata/findAll'
    },
    {
        id: 'SYSTEM_service_get',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'metadata/get'
    },
    {
        id: 'SYSTEM_service_save',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'metadata/save'
    },
    {
        id: 'SYSTEM_service_remove',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'metadata/remove'
    },
    {
        id: 'SYSTEM_widget_list',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'widget/findAll'
    },
    {
        id: 'SYSTEM_widget_get',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'widget/get'
    },
    {
        id: 'SYSTEM_widget_save',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'widget/save'
    },
    {
        id: 'SYSTEM_widget_remove',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'widget/remove'
    },
    {
        id: 'SYSTEM_collection_list',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'collection/find'
    },
    {
        id: 'SYSTEM_collection_get',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'collection/get'
    },
    {
        id: 'SYSTEM_collection_save',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'collection/save'
    },
    {
        id: 'SYSTEM_collection_remove',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'collection/remove'
    },
    {
        id: 'SYSTEM_data_listen',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'data/shared/listen'
    },
    {
        id: 'SYSTEM_data_get',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'data/cache/get'
    },
    {
        id: 'SYSTEM_data_getSynch',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'data/transient/listen'
    },
    {
        id: 'SYSTEM_xmpp_connect',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'xmpp/connect'
    },
    {
        id: 'SYSTEM_xmpp_disconnect',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'xmpp/disconnect'
    },
    {
        id: 'SYSTEM_xmpp_listMucs',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'xmpp/listMucs'
    },
    {
        id: 'SYSTEM_xmpp_joinMuc',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'xmpp/joinMuc'
    },
    {
        id: 'SYSTEM_xmpp_sendToMuc',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'xmpp/sendToMuc'
    },
    {
        id: 'SYSTEM_xmpp_sendToUser',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'xmpp/sendToUser'
    },
    {
        id: 'SYSTEM_messaging_listTopics',
        clientConnector: 'comet',
        connectorAction: 'invoke',
        connectionType: 'em/listTopics'
    }
];