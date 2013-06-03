Ext.define('Ext.data.reader.JsonFlattener', {
	extend: 'Ext.data.reader.Json',
	alias: 'reader.jsonflattener',

	inheritFields: true,

	//inherit docs
	buildExtractors : function() {
		var me = this;

	    // workaround so that Ext.data.reader.Json doesn't try to create a root accessor
        me.tmpRoot = me.root;
        me.root = null;
		me.callParent(arguments);
        me.root = me.tmpRoot;
        delete me.tmpRoot;
	
		if (me.root) {
			me.getRoot = me.createAccessor(me.root.split('.')[0]);
		} else {
			me.getRoot = function(root) {
				return root;
			};
		}
	},

	extractData: function(data) {
		var x=0,xlen,records,node,recordBreak,models = [], me = this,
		    steps = me.root.split('.'),
            model = me.viewModel || me.model;
		steps.shift();
		recordBreak = steps.pop() || '';
		records = me.processData({}, data, steps, recordBreak, 0);

		for (xlen=records.length; x<xlen; x++) {
			// adapted from Ext.data.reader.Reader
            node = records[x];
            models.push(new model(me.extractValues(node), me.getId(node), node));
		}
		return models;
	},

	/**
	 * @private
	 */
	processData: function(data, r, s, rb, i) {
		var recs = [], d, i, ilen, t;

		if (i === s.length) {
			d = (rb === '') ? r : r[rb];
			if (Ext.isArray(d)) {
				for (i=0,ilen=d.length; i<ilen; i++) {
					t = Ext.clone(data);
					Ext.apply(t, d[i]);
					recs.push(t);	
				}
			} else {
				Ext.apply(data, d);
				recs.push(data);
			}
			return recs;	
		}
	
		var step = s[i];
	
		if (Ext.isArray(r[step])) {
			for (var rec,tmp,x=0,xlen=r[step].length; x<xlen; x++) {
				tmp = Ext.clone(data);
				if (this.inheritFields === true) {
					for (var el in r[step][x]) {
						if (r[step][x].hasOwnProperty(el) && typeof(r[step][x][el]) !== 'object' && !Ext.isArray(r[step][x][el])) {
							tmp[step+'_'+el] = r[step][x][el];				
						}
					}
				}
				recs = recs.concat(this.processData(tmp, r[step][x], s, rb, i+1));
			}
		} else {
			if (this.inheritFields === true) {
				for (var el in r[step]) {
					if (r[step].hasOwnProperty(el) && typeof(r[step][el]) !== 'object' && !Ext.isArray(r[step][el])) {
						data[step+'_'+el] = r[step][el];
					}
				}
			}
			recs = recs.concat(this.processData(data, r[step], s, rb, i+1));
		}
	
		return recs;
	}
});