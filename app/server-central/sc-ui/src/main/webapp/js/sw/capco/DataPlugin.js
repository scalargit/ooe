Ext.define('sw.capco.DataPlugin', {

    extend: 'o2e.plugin.AbstractDataPlugin',

    pluginId: 'classification',
    widgetType: '*',
    dataIndependent: true,

    requiredAnnotations: [],
    optionalAnnotations: ['classification', 'classificationCaveat'],
    restrictFields: false,

    rollups: null,
    rollup: null,

    receivedData: null,
    defaults: {},

    init: function() {
        this.callParent();

        var me = this, services = me.widget.services, serviceKey;

        me.widget.addEvents('classification');

        me.rollups = [];
        me.rollup = Ext.create('sw.capco.Rollup');
        me.receivedData = {};

        for (serviceKey in services) {
            if (services.hasOwnProperty(serviceKey)) {
                me.receivedData[serviceKey] = false;
                me.defaults[serviceKey] = me.getDefaultClassification(services[serviceKey].metadata);
                me.rollup.add(me.defaults[serviceKey]);
            }
        }
        me.checkRollup();

        me.widget.on('serviceadd', this.onServiceAdd, this);
        me.widget.on('serviceremove', this.onServiceRemove, this);
    },

    onServiceAdd: function(widgetId, serviceKey) {
        var me = this;
        me.receivedData[serviceKey] = false;
        me.defaults[serviceKey] = me.getDefaultClassification(me.widget.services[serviceKey].metadata);
        me.rollup.add(me.defaults[serviceKey]);
        me.checkRollup();
    },

    onServiceRemove: function(widgetId, serviceKey) {
        var me = this;
        if (me.receivedData[serviceKey]) {
            me.rollup.remove(me.rollups[serviceKey].getClassification(), me.rollups[serviceKey].getStyle());
            delete me.rollups[serviceKey];
        } else {
            me.rollup.remove(me.defaults[serviceKey]);
        }
        delete me.receivedData[serviceKey];
        delete me.defaults[serviceKey];
        this.checkRollup();
    },

    handleData: function(data, serviceKey, metadata) {
        var me = this, rollup, currClassification;

        if (!me.receivedData[serviceKey]) {
            me.receivedData[serviceKey] = true;
            me.rollups[serviceKey] = Ext.create('sw.capco.Rollup');
        }

        rollup = me.rollups[serviceKey];
        currClassification = rollup.getCount() > 0 ? rollup.getClassification() : me.defaults[serviceKey];

        if (data.update.length) {
            // there's no such thing as updating the rollup, so we have to clear it and process all the data
            rollup.clear();
            me.addData(me.widget.currentRecords[serviceKey], serviceKey, metadata);
        } else {
            // no update, so just process clear, remove and add normally
            if (data.clear) {
                rollup.clear();
            }
            if (data.remove.length) {
                me.removeData(data.remove, serviceKey, metadata);
            }
            if (data.add.length) {
                me.addData(data.add, serviceKey, metadata);
            }
        }

        // This is weird because we initialize me.rollup to the service default
        // while me.rollups[serviceKey] is not created until data is received
        if (rollup.isDirty()) {
            //Add before removing because it's very fast if they are the same
            me.rollup.add(rollup.getClassification());
            me.rollup.remove(currClassification);
            if (me.rollup.isDirty()) {
                me.widget.fireEvent('classification', me, me.rollup.getClassification(), me.rollup.getStyle());
            }
        }

        return true;
    },

    addData: function(records, serviceKey, metadata) {
        var i, len, action = 'add';
        for (i=0, len=records.length; i<len; i++) {
            this.processRecord(this.rollups[serviceKey], action, records[i], metadata);
        }
    },

    removeData: function(records, serviceKey, metadata) {
        var i, len, action = 'remove';
        for (i=0, len=records.length; i<len; i++) {
            this.processRecord(this.rollups[serviceKey], action, records[i], metadata);
        }
    },

    clearData: function(serviceKey) {
        this.rollups[serviceKey].clear();
    },

    //Private
    checkRollup: function() {
        var me = this;
        if (me.rollup.isDirty()) {
            me.widget.fireEvent('classification', me, me.rollup.getClassification(), me.rollup.getStyle());
        }
    },

    //Private
    processRecord: function(rollup, action, record, metadata) {
        var i, len, classifications = this.getClassifications(record, metadata);
        for (i=0, len=classifications.length; i<len; i++) {
            rollup[action].call(rollup, classifications[i]);
        }
    },

    //Private
    getClassifications: function(record, metadata) {
        var classifications = [], classification, caveat;

        classification = record.get('classification');

        if (classification) {
        caveat = record.get('classificationCaveat');
            if (caveat) {
                classification = classification + '//' + caveat;
            }
            classifications.push(classification);
        }

        classifications = Ext.Array.merge(classifications, this.getEmbeddedClassifications(record, metadata));

        if (classifications.length === 0) {
            return [this.getDefaultClassification(metadata)];
        }
        return classifications;
	},

    //Private
    getEmbeddedClassifications: function(record, metadata) {
        var classifications = [], response = metadata.response, classification, i, len, j, jLen, column, annotation;

        for (i=0, len=response.length; i<len; i++) {
            column = response[i];
            if (Ext.isArray(column.annotations)) {
                for (j=0, jLen=column.annotations.length; j<jLen; j++) {
                    annotation = column.annotations[j];
                    if (annotation === "embeddedClassification") {
                        classification = this.findEmbeddedClassifications(record.get(column.name));
                        if (classification !== null) {
                            classifications.push(classification);
                        }
                    }
                }
            }
        }

        return classifications;
    },

    //Private
	getDefaultClassification: function(metadata) {
		if (Ext.isEmpty(metadata.classification)) {
			return o2e.env.defaultClassification;
		}
		return metadata.classification;
	},

    //Private
	findEmbeddedClassifications: function(value) {
        if (typeof value !== 'string') {
            return null;
        }

        var openParenIdx, closeParenIdx, classification, currChar, len;

	    for (openParenIdx = value.indexOf("("), closeParenIdx = value.indexOf(")");
	         openParenIdx !== -1 && closeParenIdx !== -1;
	         value = value.substring(openParenIdx+1),
	         	openParenIdx = value.indexOf("("),
	         	closeParenIdx = value.indexOf(")"))
	    {
	        if (closeParenIdx < openParenIdx) {
	            closeParenIdx = value.substring(openParenIdx).indexOf(")");
	            if (closeParenIdx === -1) {
	                return null;
	            }
	            closeParenIdx += openParenIdx;
	        }

	        classification = value.substring(openParenIdx+1, closeParenIdx);
            currChar = classification.charAt(0);
            len = classification.length;
	        if (currChar === 'T') {
                currChar = classification.charAt(1);
                if (currChar === 'S' && (len === 2 || classification.charAt(3) === '/')) {
                    return classification;
                }
            } else if (currChar === 'S' || currChar === 'C' || currChar == 'U') {
                currChar = classification.charAt(1);
                if (len === 1 || classification.charAt(1) === '/') {
                    return classification;
                }
	        }
	    }
	    return null;
	}

}, function() {
    o2e.plugin.DataPluginMgr.reg(this);
});