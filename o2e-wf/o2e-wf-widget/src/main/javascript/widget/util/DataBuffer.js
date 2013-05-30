Ext.define('o2e.util.DataBuffer', {
    serviceKey: null,
    metadata: null,

    constructor: function(cfg) {
        Ext.apply(this, cfg);

        this.dump = Ext.Function.createThrottled(function() {
            o2e.connectorMgr.receiveData(this.serviceKey, this.data, false);
            delete this.pointer;
            delete this.curr;
            delete this.data;
        }, 500, this);
    },

    add: function(data) {
        var d = data, curr, rb = this.metadata.recordBreak.split('.');

        while (rb.length > 0) {
            curr = rb.shift();

            if (rb.length === 0) {
                this.curr = this.curr || curr;
                this.pointer = this.pointer || d;
                if (!Ext.isArray(d[curr])) {
                    d = d[curr] = [d[curr]];
                }
            } else {
                d = d[curr];
            }
        }

        if (this.data) {
            this.pointer[curr] = this.pointer[curr].concat(d);
        } else {
            this.data = data;
        }
    }
});