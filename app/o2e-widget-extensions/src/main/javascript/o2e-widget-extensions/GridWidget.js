Ext.define('o2e.GridWidget', {
    extend: 'o2e.widget.AbstractWidget',
    type: 'grid',

    useRawData: false,
    useOwnStores: true,
    unionData: true,

    restrictFields: false,

    requiredAnnotations: [],
    optionalAnnotations: [],

    init: function() {
        // setup for infinite scroll
        this.store = Ext.create('Ext.data.Store', {
            model: this.modelId,
            storeId: 'store.'+this.id,
            buffered: true,
            purgePageCount: 0,
            pageSize: 50,
            proxy: { type: 'memory' }
        });

        this.createColumnModel();
        this.restoreFromState();
        this.grid = Ext.create('Ext.grid.Panel', {
            border: 0,
            store: this.store,
            columnLines: true,
            columns: this.columnModel,
            verticalScroller: {
                xtype: 'paginggridscroller',
                activePrefetch: false
            },
            invalidateScrollerOnRefresh: false,
            viewConfig: {
                stripeRows: true,
                plugins: {
                    ddGroup: 'CAWidgets',
                    ptype: 'gridviewdragdrop',
                    enableDrop: false
                }
            }
        });
        this.add(this.grid);

        this.addAvailableEventSource({
            name: 'selects a row',
            source: this.grid.getSelectionModel(),
            event: 'select',
            args: [{
                name: 'Entire record',
                index: 1
            },{
                name: 'record',
                getValues: Ext.Function.bind(function() {
                    var x, xlen, vals = [];
                    // TODO: support column grouping here
                    for (x=0,xlen=this.columnModel.length;x<xlen;x++) {
                        vals.push(this.columnModel[x].text);
                    }
                    return vals;
                }, this),
                processor: function(record, field) {
                    return record.get(field);
                }
            }]
        });

        this.addAvailableEventAction({
            name: 'highlight',
            callback: function(srcRecord) {
                var match = this.store.findBy(function(rec) {
                    for (var col,srcVal,x=0,xlen=this.columnModel.length;x<xlen;x++) {
                        col = this.columnModel[x].dataIndex;
                        srcVal = srcRecord.get(col);
                        if (srcVal === undefined || srcVal !== rec.get(col)) {
                            return false;
                        }
                    }
                    return true;
                }, this),
                    selModel = this.grid.getSelectionModel();
                if (match >= 0) {
                    selModel.select(match, false, true);
                } else {
                    selModel.deselectAll(true);
                }
            },
            scope: this,
            args: ['sourceRecord']
        });

        this.on('serviceadd', this.redraw, this);
        this.on('serviceremove', this.redraw, this);

        this.on('ready', function() {
            this.store.on('datachanged', Ext.Function.createBuffered(function() {
                this.store.sort();
            }, 500, this));
        }, this);

        this.setReady();
    },

    updateCache: function(records) {
//        o2e.log.debug('Executing UPDATE CACHE with ', false, records);
        this.store.prefetchData.clear();
        delete this.store.totalCount;
        delete this.store.guaranteedEnd;
        delete this.store.guaranteedStart;
//        o2e.log.debug('Cache reset: ', false, this.store.prefetchData);
        this.store.cacheRecords(records);
//        o2e.log.debug('Cache loaded: ', false, this.store.prefetchData);
        if (records.length) {
            var start = this.store.requestStart || 0,
                end = this.store.requestEnd ? Math.max(this.store.requestEnd, (start + 49)) : (start + 49);

            this.store.guaranteeRange(start, end);
        }
        this.grid.verticalScroller.invalidate();
//        o2e.log.debug('COMPLETE UPDATE CACHE ', false, this.store.prefetchData);
    },

    addData: function(records, serviceKey, metadata) {
//        o2e.log.debug('Attempting to add ', false, records);
        this.updateCache(this.store.prefetchData.getRange().concat(records));
    },

    updateData: function(records, serviceKey, metadata) {
        var uidField = o2e.data.DataUtils.getFieldWithAnnotation('uid', metadata),
            pfd = this.store.prefetchData;
        for (var x=0,xlen=records.length; x<xlen; x++) {
            this.updateRecord(pfd.getAt(pfd.findIndex(uidField, records[x].get(uidField))), records[x]);
        }
        this.updateCache(this.store.prefetchData.getRange());
    },

    removeData: function(records, serviceKey, metadata) {
        var x, xlen, found, uidField = o2e.data.DataUtils.getFieldWithAnnotation('uid', metadata),
            old = this.store.prefetchData.getRange();
//        o2e.log.debug('Attempting to remove ', false, records);
//        o2e.log.debug('from ', false, old);
        for (x=0,xlen=records.length; x<xlen; x++) {
            found = o2e.data.DataUtils.findMatchingRecord(old, uidField, records[x]);
            if (found !== false && found >= 0) {
//                o2e.log.debug('spliced ' , false, old.splice(found, 1));
                old.splice(found, 1);
            }
        }
//        o2e.log.debug('Updating cache with ', false, old);
        this.updateCache(old);
    },

    clearData: function(serviceKey, widgetOnly) {
        var r = this.currentRecords[serviceKey];

        delete this.store.requestStart;
        delete this.store.requestEnd;

        if (Ext.isEmpty(serviceKey)) {
            this.store.removeAll();
            this.store.prefetchData.clear();
            delete this.store.totalCount;
            delete this.store.guaranteedStart;
            delete this.store.guaranteedEnd;
        } else if (!Ext.isEmpty(r)) {
            this.removeData(r, serviceKey, this.services[serviceKey].metadata);
        }

        if (widgetOnly === 'widget') {
            if (!Ext.isEmpty(r)) {
                this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Filtered '+r.length+' of '+r.length+' records');
            }
        } else {
            this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing all records');
            this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Total records: 0');
            delete this.currentRecords[serviceKey];
            this.currentRecords[serviceKey] = [];
        }
    },

    redraw: function() {
        this.remove(this.grid);
        this.createColumnModel();
        this.grid = Ext.create('Ext.grid.Panel', {
            border: 0,
            store: this.store,
            columnLines: true,
            columns: this.columnModel,
            verticalScroller: {
                xtype: 'paginggridscroller',
                activePrefetch: false
            },
            invalidateScrollerOnRefresh: false,
            viewConfig: {
                stripeRows: true
            }
        });
        this.insert(0, this.grid);
    },

    createColumnModel: function() {
        var x, xlen, field, fields = Ext.ModelManager.getModel(this.modelId).prototype.fields,
            col, group, name;
        this.columnModel = [];
        for (x=0, xlen=fields.getCount(), col = {}, group = ''; x<xlen; x++) {
            field = fields.getAt(x);
            if (!field.ignore) {
                name = field.header || field.name;
                if (typeof name !== 'string') {
                    group = name.group;
                    name = name.text;
                }
                col = {
                    text: name,
                    flex: 1,
                    sortable: true,
                    renderer: field.renderer,
                    dataIndex: field.name
                }
                if (group && group !== '') {
                    this.findColModelGroup(group).push(col);
                } else {
                    this.columnModel.push(col);
                }
            }
        }
    },

    findColModelGroup: function(group) {
        var x, xlen;
        for (x=0, xlen = this.columnModel.length; x<xlen; x++) {
            if (this.columnModel[x].text === group) {
                return this.columnModel[x].columns;
            }
        }
        // got here so it was not found
        this.columnModel.push({
            text: group,
            columns: []
        });
        return this.columnModel[this.columnModel.length - 1].columns;
    },

    getStateConfig: function() {
        var x,xlen,columns = [];
        for (x=0,xlen=this.grid.columns.length;x<xlen;x++) {
            columns.push(Ext.copyTo({},this.grid.columns[x],['text', 'hidden', 'flex', 'width']));
        }
        return Ext.apply({
            gwState: Ext.copyTo({
                columns: columns
            }, this.grid.getState(), ['sort'])
        }, this.callParent());
    },

    restoreFromState: function() {
        // TODO: may need to adjust this for grouping. untested
        // first, update hidden columns
        if (this.gwState) {
            var x,xlen,i,cols = Ext.Array.pluck(this.columnModel, 'text');
            for (x=0,xlen=this.gwState.columns.length;x<xlen;x++) {
                i = Ext.Array.indexOf(cols, this.gwState.columns[x].text);
                if (i >= 0) {
                    if (this.gwState.columns[x].hidden === true) {
                        this.columnModel[i].hidden = true;
                    }
                    if (this.gwState.columns[x].flex === undefined) {
                        delete this.columnModel[i].flex;
                        this.columnModel[i].width = this.gwState.columns[x].width;
                    }
                }
            }
            // next, update sorting
            if (this.gwState.sort) {
                this.store.sort(this.gwState.sort.property, this.gwState.sort.direction);
            }
        }
    }
});
