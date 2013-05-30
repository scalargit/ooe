Ext.define('o2e.plugin.LockButton', {

    extend: 'o2e.plugin.AbstractConfigPlugin',

    /**
     * @cfg iconCls
     */
    iconCls: 'icon-unlocked',
    /**
     * @cfg text
     */
    text: '',
    /**
     * @cfg pluginId
     */
    pluginId: 'lock',

    locked: false,

    handleMenuItemClick: function(item, e) {
        this.locked = !this.locked;
        this.widget.setLocked(this.locked);
        this.updateIcon();
    },

    updateIcon: function() {
        if (this.locked) {
            this.itemRef.setIconCls('icon-locked');
        } else {
            this.itemRef.setIconCls('icon-unlocked');
        }
    }

}, function() {
    o2e.plugin.ConfigPluginMgr.reg(this);
});