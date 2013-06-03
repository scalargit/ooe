Ext.define('o2e.GinHandWidget', {
    extend: 'o2e.widget.AbstractWidget',
    type: 'gin-hand',

    useRawData: false,
    useOwnStores: false,
    unionData: true,

    requiredAnnotations: ['face','suit'],
    optionalAnnotations: [],

    suits: ['clubs', 'hearts', 'diamonds', 'spades'],
    numbers: ['a', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'j', 'q', 'k'],

    init: function() {
        this.add({
            xtype: 'dataview',
            store: this.store,
            multiSelect: true,
            emptyText: 'No images to display',
            overItemCls: 'x-item-over',
            itemSelector: 'div.card',
            tpl: new Ext.XTemplate(
                '<tpl for=".">',
                    '<div class="card" style="position: absolute; top:{[values.suit % 4 * 30]}px; left: {[values.face % 13 * 17]}px; z-index:{[values.suit % 4 * 10 + values.face % 13]}">',
                        '<img src="/images/cards/{[this.hand.suits[values.suit % 4]]}-{[this.hand.numbers[values.face % 13]]}-75.png"/>',
                    '</div>',
                '</tpl>',
                {
                    hand: this
                }
            ),
            listeners: {
                itemclick: {
                    fn: function(v, rec) {
                        var suit = rec.get('suit') % 4,
                            face = rec.get('face') % 13;
                        Ext.Msg.alert('Card clicked', 'You clicked the '+this.numbers[face]+' of '+this.suits[suit]);
                    },
                    scope: this
                }
            }
        });

        this.setReady();
    },

    handleData: function(data, serviceKey, metadata) {
        this.processDataPlugins(data, serviceKey, metadata);
    },

    getStateConfig: function() {
        return Ext.apply({}, this.callParent());
    }
});
