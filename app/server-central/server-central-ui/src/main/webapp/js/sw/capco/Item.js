Ext.define('sw.capco.Item', {
    extend: 'Ext.toolbar.Item',
    requires: ['Ext.XTemplate'],
    alias: 'widget.sw-classification',

    classification: '',

    renderTpl: '&nbsp;{classification}&nbsp;',
    //
    baseCls: 'sw-classification',

    onRender : function() {
        Ext.apply(this.renderData, {
            classification: this.classification
        });
        this.callParent(arguments);
    },

    applyClassification: function(classification, className) {
        var me = this, el = me.el;

        if (me.rendered) {
            el.update(classification);
            if (me.initialConfig.cls) {
                el.removeCls(me.initialConfig.cls);
            }
            if (me.currCls) {
                el.removeCls(me.currCls);
            }
            el.addCls(className);
            me.currCls = className;
            me.ownerCt.doLayout();
        } else {
            me.classification = classification;
            me.additionalCls = [className];
            me.currCls = className;
        }
    }
});