Ext.define('sw.notify.NotifyManager', {
    mixins: { observable: 'Ext.util.Observable' },

    connector: null,

    constructor: function(cfg) {
        Ext.apply(this, cfg);
        this.mixins.observable.constructor.call(this, cfg);
        this.connector.subscribe('/sw/broadcast/**', this.notify, this);
    },

    notify: function(d) {
        if (d.data.fromUser !== o2e.env.username) {
            var type = d.channel.split('/')[3];
            this[type+'Handler'](d.data);
        }
    },

    send: function(type, payload) {
        this.connector.cometd.publish('/sw/broadcast/'+type, { fromUser: o2e.env.username, payload: payload });
    },

    alertHandler: function(d) {
        this.showGeneralNotification(d.payload+'<br/><br/>'+Ext.Date.format(new Date(), 'Y M d, H:i:s'), 15000);
    },

    serviceHandler: function(d) {
        var service = d.payload.metadata, action = d.payload.action;
        if (action === 'add') {
            o2e.serviceRegistry.insert(service._id, service, function() {
                o2e.log.debug('NotifyMgr: Added service');
            }, this, true);
        } else if (action === 'update') {
            o2e.serviceRegistry.update(service._id, service, function() {
                o2e.log.debug('NotifyMgr: Updated service');
            }, this, true);
        } else if (action === 'remove') {
            o2e.serviceRegistry.remove(service._id, function() {
                o2e.log.debug('NotifyMgr: Removed service');
            }, this, true);
        }
    },

    mapLayerHandler: function(d) {
        var maplayer = d.payload.metadata, action = d.payload.action;
        if (action === 'add') {
            o2e.kmlRegistry.insert(maplayer.uuid, maplayer, function() {
                o2e.log.debug('NotifyMgr: Added map layer');
            }, this, true);
        } else if (action === 'update') {
            o2e.kmlRegistry.update(maplayer.uuid, maplayer, function() {
                o2e.log.debug('NotifyMgr: Updated map layer');
            }, this, true);
        } else if (action === 'remove') {
            o2e.kmlRegistry.remove(maplayer.uuid, function() {
                o2e.log.debug('NotifyMgr: Removed map layer');
            }, this, true);
        }
    },

    udopHandler: function(d) {
        var udop = d.payload.metadata, action = d.payload.action;
        if (action === 'add') {
            if (udop.public) {
                o2e.udopRegistry.insert(udop.uuid, udop, function() {
                    o2e.log.debug('NotifyMgr: Added UDOP');
                }, this, true);
            }
        } else if (action === 'update') {
            if (udop.public) {
                o2e.udopRegistry.update(udop.uuid, udop, function(md) {
                    var uuid, openUdop;
                    o2e.log.debug('NotifyMgr: Updated UDOP');
                    uuid = md.uuid;
                    openUdop = o2e.app.findOpenUdop(uuid);
                    if (openUdop != null) {
                        this.showGeneralNotification(
                            'The UDOP '+openUdop.udopTitle+' has been updated by another user. Please click here to see changes.',
                            10000,
                            function() {
                                this.closeUdop();
                                o2e.app.viewport.getComponent('mainContentPanel').loadUdop(Ext.clone(md));
                            },
                            openUdop
                        );
                    }
                }, this, true);
            }
        } else if (action === 'remove') {
            if (udop.public) {
                o2e.udopRegistry.remove(udop.uuid, function() {
                    o2e.log.debug('NotifyMgr: Removed UDOP');
                }, this, true);
            }
        }
    },

    showGeneralNotification: function(message, delay, handler, scope) {
        var notification = Ext.create('widget.uxNotification', {
            corner: 'tr',
            manager: o2e.app.viewport.getId(),
            cls: 'ux-notification-light',
            iconCls: 'ux-notification-icon-information',
            html: message,
            autoDestroyDelay: delay,
            slideDownDelay: 500,
            slideInAnimation: 'bounceOut',
            slideDownAnimation: 'easeIn'
        });
        if (handler) {
            notification.on('afterrender', function() {
                notification.getEl().on('click', handler, scope || this);
            }, this);
        }
        notification.show();
    }
});