/**
 * @class o2e.data.AbstractDataComponent
 *
 * Manages services in a widget - retrieves, preprocesses and dispatches data to the actual widget. Provides API for
 * adding, removing and updating services.
 */
Ext.define('o2e.data.AbstractDataComponent', {
    /**
     * @cfg {Array} services An array of o2e.data.Service objects.
     */
	services: null,
    /**
     * @cfg {Boolean} useRawData
     */
    useRawData: false,
    /**
     * @cfg {Array} requiredAnnotations
     *
     * Note: Annotations not defined as required may appear in your data model! So iterating over a dataset and
     * presuming that only your annotations will be there is not an acceptable approach.
     */
    requiredAnnotations: null,
    /**
     * @cfg {Array} optionalAnnotations
     */
    optionalAnnotations: null,
    /**
     * @cfg {Array} fields
     */
    fields: null,
    /**
     * @cfg {Boolean} restrictFields Set to true to limit the data model to only annotations.
     *
     * Note: This will only actually limit the fields in the data model if all plugins for the service restrict
     * them. So iterating over a dataset and presuming that only your annotations will be there is not an
     * acceptable approach.
     */
    restrictFields: true,
    /**
     * @cfg {Boolean} useOwnStores
     */
    useOwnStores: false,
    /**
     * @cfg {Boolean} unionData
     */
    unionData: false,
    /**
     * @cfg {Boolean} locked
     */
    locked: false,

    /**
     * @property {Object} models The modelId for each serviceKey.
     */
    models: null,
    /**
     * @property {Object} stores The store objects for each serviceKey. Only available when useOwnStores is false and unionData is false.
     */
    stores: null,
    /**
     * @property {Object} readers The json reader for each serviceKey.
     */
    readers: null,
    /**
     * @property {Object} currentRecords The current model objects for each serviceKey.
     */
    currentRecords: null,
    /**
     * @property {String} modelId The id of the common model used for the view. Only available when unionData is true.
     */
    modelId: null,
    /**
     * @property {Ext.data.Store} store The common store used for the view. Only available when unionData is true and useOwnStores is false.
     */
    store: null,

    //Private
    pendingData: null,


    /**
     *
     * @param cfg
     */
	constructor: function(cfg) {
		Ext.apply(this, cfg);

        this.addEvents(
            /**
             * @event servicestatus
             * Fires when the status of one of the widgets services changes
             * @param {String} id The id of the widget
             * @param {String} serviceKey The serviceKey for which status is being reported
             * @param {int} statusCode The current rollup status of the widget
             * @param {String} message The message
             */
            'servicestatus',
            /**
             * @event metadataupdate
             * Fires when metadata for a service used in this widget has changed
             * @param {String} id The id of the widget
             * @param {Array} serviceKeys The keys to the effected services
             * @param {Object} metadata The new metadata
             */
            'metadataupdate',
            /**
             * @event metadataremove
             * Fires when metadata for a service used in this widget has been removed
             * @param {String} id The id of the widget
             * @param {Array} serviceKeys The keys to the effected services
             */
            'metadataremove',
            /**
             * @event serviceadd
             * Fires when a service has been added to the widget
             * @param {String} id The id of the widget
             * @param {String} serviceKey The key of the service added
             */
            'serviceadd',
            /**
             * @event serviceremove
             * Fires when a service has been removed from the widget
             * @param {String} id The id of the widget
             * @param {String} serviceKey The key of the service removed
             */
            'serviceremove',
            /**
             * @event serviceactivate
             * Fires when a service has been activated within the widget
             * @param {String} id The id of the widget
             * @param {String} serviceKey The key of the service activated
             */
            'serviceactivate',
            /**
             * @event servicedeactivate
             * Fires when a service has been deactivated within the widget
             * @param {String} id The id of the widget
             * @param {String} serviceKey The key of the service deactivated
             */
            'servicedeactivate',
            /**
             * @event ready
             * Fires when setReady is called (usually called after initialization is completed)
             */
            'ready'
        );

        this.stores = {};
        this.models = {};
        this.readers = {};
        this.currentRecords = {};
        this.pendingData = {};
	},

    /**
     *
     */
	initDataComponent: function() {
        var serviceKey, me = this;

        for (serviceKey in me.services) {
            if (me.services.hasOwnProperty(serviceKey)) {
                if (!me.getUseRawData(serviceKey)) {
                    me.buildModel(serviceKey);
                }
                me.pendingData[serviceKey] = [];
                me.currentRecords[serviceKey] = [];
            }
        }

        if (me.unionData) {
            me.buildCommonModel();
        }
	},

    /**
     *
     */
    loadData: function() {
        this.execOnEachServiceKey(this.subscribe);
    },

    /**
     * Will remove data for a particular service from the view and suspend its subscription. With respect to unionData
     * widgets, this will not attempt to rebuild the common model. To make this change one would need to be careful not
     * to impact the behavior of add/remove/updateService methods.
     *
     * @param {String} serviceKey Required. The service to effect.
     * @param {Boolean} active Required. True to show the data and False to hide it.
     */
	setServiceActive: function(serviceKey, active) {
        var me = this;

		if (me.services[serviceKey].active !== active) {
			me.services[serviceKey].active = active;
            if (active === false) {
				// unregister from RequestMgr
                me.unsubscribe(serviceKey);
                me.removeCurrentData(serviceKey, true);
                me.fireEvent('servicedeactivate', me.id, serviceKey);
                me.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Inactive.');
			} else {
                me.subscribe(serviceKey);
                me.pushCurrentData(serviceKey);
                me.fireEvent('serviceactivate', me.id, serviceKey);
                me.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.LOADING, 'Waiting for data...');
			}
		}
	},

    /**
     * Will suspend subscriptions for all services in this widget so that no new data is retrieved or added. Not that
     * append style services may have gaps in data as a result of locking. It is possible to change this without
     * too much pain, but that is not assumed to be the desired behavior.
     *
     * @param {Boolean} locked
     */
    setLocked: function(locked) {
        var serviceKey, me = this;

        if (me.locked !== locked) {
            if (locked) {
                for (serviceKey in me.services) {
                    if (me.services.hasOwnProperty(serviceKey) && me.services[serviceKey].active) {
                        me.unsubscribe(serviceKey);
                        me.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Locked.');
                    }
                }
            } else {
                for (serviceKey in me.services) {
                    if (me.services.hasOwnProperty(serviceKey) && me.services[serviceKey].active) {
                        me.pushPendingData(serviceKey);
                        me.subscribe(serviceKey);
                        me.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.LOADING, 'Waiting for data...');
                    }
                }

            }
        }
        me.locked = locked;
    },

    /**
     * This will not subscribe the given service. Call this.subscribe(serviceKey) afterwards to get it started.
     * @param {o2e.data.Service} serviceCfg The configuration for the new service
     */
    addService: function(serviceCfg) {
        var serviceKey = o2e.connectorMgr.getServiceKey(serviceCfg.serviceId, serviceCfg.params),
            previousAnnotations, me = this;

        if (me.unionData) {
            previousAnnotations = me.getAllAnnotations();
        }

        if (!me.services[serviceKey]) {
            me.services[serviceKey] = serviceCfg;
        }
        if (!me.getUseRawData(serviceKey)) {
            me.buildModel(serviceKey);
        }
        me.pendingData[serviceKey] = [];
        me.currentRecords[serviceKey] = [];

        if (me.unionData && (!this.restrictFields || me.requiresNewCommonModel(serviceKey, previousAnnotations))) {
            me.buildCommonModel();
            me.portCurrentData();
            me.removeCurrentData(null, true);
            me.pushCurrentData();
        }

        me.buildModel(serviceKey);

        if (me.unionData) {
            me.readers[serviceKey].setViewModel(Ext.ModelManager.getModel(this.modelId));
        }

        me.fireEvent('serviceadd', me.id, serviceKey);
    },

    /**
     * Removes the given service from the widget completely and removes all of its state.
     *
     * @param {String} serviceKey
     */
    removeService: function(serviceKey) {
        var me = this, previousAnnotations, newAnnotations;

        if (me.unionData) {
            previousAnnotations = me.getAllAnnotations();
        }
        me.services[serviceKey].active = false;
        me.unsubscribe(serviceKey);
        me.removeCurrentData(serviceKey, true);
        me.killModel(serviceKey);
        delete me.pendingData[serviceKey];
        delete me.currentRecords[serviceKey];

        if (me.unionData && (!this.restrictFields || me.requiresNewCommonModel(serviceKey, previousAnnotations))) {
            me.buildCommonModel();
            me.portCurrentData();
            me.removeCurrentData(null, true);
            me.pushCurrentData();
        }

        me.fireEvent('serviceremove', me.id, serviceKey);

        delete me.services[serviceKey];
    },

    /**
     * This will make the given service inactive. You must call this.setServiceActive(serviceKey, true) afterwards to reactivate.
     *
     * Note: that there is a limitation with this approach. If a new field is added, the old data when ported will not
     * include this field.
     *
     * @param {o2e.data.Service} serviceCfg The new configuration for the service
     */
    updateService: function(serviceCfg) {
        var serviceKey = o2e.connectorMgr.getServiceKey(serviceCfg.serviceId, serviceCfg.params),
            previousAnnotations, newAnnotations, me = this;

        if (me.unionData) {
            previousAnnotations = me.getAllAnnotations(serviceKey);
        }

        this.setzServiceActive(serviceKey, false);
        if (!me.services[serviceKey]) {
            me.services[serviceKey] = serviceCfg;
        }
        this.buildModel(serviceKey, serviceCfg.metadata);
        this.pendingData[serviceKey] = [];

        if (me.unionData) {
            newAnnotations = me.getAllAnnotations(serviceKey);
            if (newAnnotations.length === 0 || o2e.util.ArrayUtils.equals(previousAnnotations, newAnnotations)) {
                me.buildCommonModel();
                me.portCurrentData();
            }
        }
    },

    /**
     *
     * @param {String} oldServiceKey
     * @param {Object} params
     */
    changeInputs: function(oldServiceKey, params) {
        var newServiceKey, service, me = this;

        service = me.services[oldServiceKey];
        newServiceKey = o2e.connectorMgr.getServiceKey(service.serviceId, params);

        // Remove existing and pending data and kill the subscription
        me.setServiceActive(oldServiceKey, false);
        me.pendingData[oldServiceKey] = me.pendingData[newServiceKey] = [];
        me.currentRecords[oldServiceKey] = me.currentRecords[newServiceKey] = [];

        // Move all the state
        me.services[newServiceKey] = me.services[oldServiceKey];
        delete me.services[oldServiceKey];

        me.models[newServiceKey] = me.models[oldServiceKey];
        delete me.models[oldServiceKey];

        if (!me.useOwnStores) {
            me.stores[newServiceKey] = me.stores[oldServiceKey];
            delete me.stores[oldServiceKey];
        }

        if (!me.useRawData) {
            me.readers[newServiceKey] = me.readers[oldServiceKey];
            delete me.readers[oldServiceKey];
        }

        delete me.pendingData[oldServiceKey];
        delete me.currentRecords[oldServiceKey];

        // Set the new params
        me.services[newServiceKey].params = params;

        // Now reestablish the subscription
        me.setServiceActive(newServiceKey, true);

        return newServiceKey;
    },

    /**
     * This function should be called whenever the widget is done its initialization and is ready to visualize data.
     * Any data that was received beforehand will be pushed to the widget.
     */
    setReady: function() {
        this.ready = true;
        this.fireEvent('ready');
        this.pushCurrentData();
    },

    /**
     *
     */
    getStateConfig: function() {
        var property, serviceKey, serviceState = {}, service, me = this;

        for (serviceKey in me.services) {
            if (me.services.hasOwnProperty(serviceKey)) {
                service = me.services[serviceKey]; // NOTE: tried using Ext.clone here but cannot because service is a CLASS, not an Object.
                serviceState[serviceKey] = {};
                for (property in service) {
                    if (service.hasOwnProperty(property) && property !== 'metadata') {
                        serviceState[serviceKey][property] = Ext.clone(service[property]);
                    }
                }
            }
        }

        return {
            services: serviceState,
            locked: me.locked
        };
    },

    //Private
    pushPendingData: function(serviceKey) {
        var i, len, metadata, me = this;
        metadata = me.services[serviceKey].metadata;
        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Processing '+me.pendingData[serviceKey].length+' records');
        for (i=0, len=me.pendingData[serviceKey].length; i<len; i++) {
            if (!me.useRawData && !me.useOwnStores) {
                if (me.unionData) {
                    me.currentRecords[serviceKey] = me.store.add(me.pendingData[serviceKey][i]);
                } else {
                    me.currentRecords[serviceKey] = me.stores[serviceKey].add(me.pendingData[serviceKey][i]);
                }
                me.processStoreFilters(serviceKey, metadata);
            } else {
                me[me.services[serviceKey].filters.length ? 'handleDataWithFilters' : 'handleData'](me.pendingData[serviceKey][i], serviceKey, metadata);
            }
        }
        me.pendingData[serviceKey] = [];
    },

    //Private
	receiveData: function(serviceKey, data, forceRefresh) {
        var errorMsg, metadata, records, categorizedData, store, me = this;

        if (data.error) {
            if (typeof data.error === 'string' && data.error !== '') {
                errorMsg = 'Details: '+data.error;
            } else if (typeof data.error === 'object' && data.error.message && data.error.message !== '') {
                errorMsg = 'Details: '+data.error.message;
            }
            this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'An error occurred retrieving data. Please contact your administrator.');
            if (errorMsg) {
                this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, errorMsg);
            }
            return;
        }

        metadata = me.services[serviceKey].metadata;

        // Don't process the data if we're locked, unless it's append data, which we want to cache
        if (!me.locked || metadata.append || !me.ready) {

            // Check if there's a reader first
            // Else we know it's raw data only
            if (me.readers[serviceKey]) {
                try {
                    records = me.readers[serviceKey].readRecords(data).records;
                } catch (e) {
                    this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'An error occurred while processing data. Please contact your administrator.');
                    this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, 'Details: '+e.name+': '+e.message);
                }

                if (metadata.append) {
                    categorizedData = me.categorizeAppendData(serviceKey, records, forceRefresh, metadata);
                } else {
                    categorizedData = me.categorizeRefreshData(serviceKey, records, metadata);
                }

                // But it could require both raw and categorized/modeled data
                if (me.getUseRawData(serviceKey)) {
                    Ext.apply(categorizedData, {
                        raw: data
                    });
                }
            } else {
                //TODO: need currentRecords to account for rawData
                categorizedData = {
                    raw: data
                };
            }

            // We just want currentRecords set until widgets are not ready so no need to set pendingData
            if (me.ready) {
                // If it's locked we know it must be append data so cache it
                // Else pass it on to the widget data handler
                if (me.locked) {
                    me.pendingData[serviceKey].push(categorizedData);
                } else if (me.useOwnStores || me.useRawData) {
                    if (categorizedData.clear) {
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing all records');
                    }
                    if (categorizedData.remove.length > 0) {
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing '+categorizedData.remove.length+' records');
                    }
                    if (categorizedData.add.length > 0) {
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Adding '+categorizedData.add.length+' records');
                    }
                    if (categorizedData.update.length > 0) {
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Updating '+categorizedData.update.length+' records');
                    }
                    this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Total records: '+this.currentRecords[serviceKey].length);
                    if (me.services[serviceKey].filters.length) {
                        me.handleDataWithFilters(categorizedData, serviceKey, metadata);
                    } else {
                        me.handleData(categorizedData, serviceKey, metadata);
                    }
                } else {
                    if (me.unionData) {
                        store = me.store;
                    } else {
                        store = me.stores[serviceKey];
                    }
                    if (categorizedData.clear) {
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing all records');
                        store.removeAll();
                    }
                    if (categorizedData.remove.length > 0) {
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Removing '+categorizedData.remove.length+' records');
                        store.remove(categorizedData.remove);
                    }
                    if (categorizedData.add.length > 0) {
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Adding '+categorizedData.add.length+' records');
                        store.add(categorizedData.add);
                    }
                    //TODO: test me.. may have problems with currentRecords due to this logic
                    if (categorizedData.update.length > 0) {
                        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Updating '+categorizedData.update.length+' records');
                        Ext.each(categorizedData.update, function(record) {
                            var index = store.findExact('uid', record.get('uid'));
                            store.removeAt(index);
                            store.insert(index, record);
                        });
                    }
                    this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Total records: '+this.currentRecords[serviceKey].length);
                    this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Overall records: '+store.getCount());

                    // Filtering for store

                    // Putting this in because plugins need access to the serviceKey and
                    // can't get it by listening to events on this.store
                    if (me.services[serviceKey].filters.length) {
                        // store filters
                        me.processStoreFilters(serviceKey, metadata);
                        // useOwnStores filtering
                        me.handleDataWithFilters(categorizedData, serviceKey, metadata);
                    } else {
                        me.handleData(categorizedData, serviceKey, metadata);
                    }
                }
            }
        }
	},

    //Private
    receiveFailure: function(serviceKey, message) {
        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.ERROR, message);
    },

    //Private
    receiveStatus: function(serviceKey, statusCode, status) {
        this.fireEvent('servicestatus', serviceKey, statusCode, status);
    },

    //Private
    subscribe: function(serviceKey) {
        o2e.connectorMgr.subscribe({
            serviceKey: serviceKey,
            serviceId: this.services[serviceKey].serviceId,
            params: this.services[serviceKey].params,
            componentId: this.id,
            success: this.receiveData,
            failure: this.receiveFailure,
            status: this.receiveStatus,
            scope: this
        });
    },

    //Private
    unsubscribe: function(serviceKey) {
        var unsubInfo;

        if (!serviceKey) {
            this.execOnEachServiceKey(this.unsubscribe);
            return;
        }

        unsubInfo = this.services[serviceKey];
        unsubInfo.serviceKey = serviceKey;
        unsubInfo.componentId = this.id;

        o2e.connectorMgr.unsubscribe(unsubInfo);
    },

    //Private
    buildModel: function(serviceKey) {
        var serviceId, metadata, annotations, modelId, restrictFields, reader, me = this;

        serviceId = me.services[serviceKey].serviceId;
        metadata = me.services[serviceKey].metadata;
        annotations = me.getAllAnnotations(serviceKey);

        // If the widget AND all this service's plugins DO NOT, we can create a simple data model
        // Otherwise we need an annotation data model (possibly with normal data model fields)
        if (annotations.length === 0) {
            modelId = o2e.modelFactory.createDataModel(me.id, serviceId, metadata, me.fields);
        } else {
            restrictFields = me.getRestrictFields(serviceKey);
            modelId = o2e.modelFactory.createAnnotationModel(me.id, serviceId, metadata, annotations, restrictFields);
        }

        me.models[serviceKey] = modelId;

        if (!me.useOwnStores && !me.unionData) {
            me.stores[serviceKey] = o2e.storeFactory.create(me.id, modelId);
        }

        if (!me.useRawData) {
            if (this.unionData) {
                reader = Ext.create('o2e.data.UnionJsonReader', {
                    root: metadata.recordBreak
                });
            } else {
                reader = Ext.create('Ext.data.reader.JsonFlattener', {
                    root: metadata.recordBreak
                });
            }
            reader.setModel(Ext.ModelManager.getModel(modelId));
            me.readers[serviceKey] = reader;
        }
    },

    //Private
    buildCommonModel: function() {
        var annotations, me = this, metadata, restrictFields, serviceKey, fields;

        annotations = me.getAllAnnotations();
        if (annotations.length === 0) {
            metadata = me.getAllMetadata();
            this.modelId = o2e.modelFactory.createCommonDataModel(me.type, me.id, metadata, me.fields);
        } else {
            restrictFields = me.getRestrictFields();
            fields = Ext.Array.unique(annotations.concat(me.getUnrestrictedFields()));
            this.modelId = o2e.modelFactory.createCommonAnnotationModel(me.type, me.id, fields, annotations);
        }

        if (!me.useRawData && !me.useOwnStores) {
            me.store = o2e.storeFactory.create(me.id, me.modelId);
        }
        for (serviceKey in me.services) {
            if (me.services.hasOwnProperty(serviceKey) && me.readers[serviceKey]) {
                me.readers[serviceKey].setViewModel(Ext.ModelManager.getModel(this.modelId));
            }
        }
    },

    //Private
    killModel: function(serviceKey) {
        var me = this;

        if (!me.useOwnStores && me.stores[serviceKey]) {
            me.stores[serviceKey].destroyStore();
        }
        if (!me.useRawData) {
            delete me.readers[serviceKey];
        }
        Ext.ModelManager.unregister(me.models[serviceKey]);
        delete me.models[serviceKey];
    },

    //Private
    requiresNewCommonModel: function(serviceKey, oldAnnotations) {
        var newAnnotations = Ext.Array.difference(this.getAllAnnotations(serviceKey), oldAnnotations);

        return ((oldAnnotations.length === 0 && newAnnotations.length === 0) || newAnnotations.length > 0);
    },

    //Private
    categorizeAppendData: function(serviceKey, records, forceRefresh, metadata) {
        var add, remove = [], removeField, removeVal, clear = false, i;

        //TODO: we should do update matching here too. Append is the data flow style, not an indicator as to how to treat the stores

        if (forceRefresh) {
            this.currentRecords[serviceKey] = records;
            add = records;
            clear = true;
        } else {
            if (metadata.removeFlagAnnotationIdx !== -1) {
                removeField = o2e.data.DataUtils.getFieldWithAnnotation('removeFlag', metadata);
                for (i=0; i<records.length;) {
                    removeVal = records[i].get(removeField);
                    if (removeVal && removeVal !== 'false') {
                        // TODO: might need to do store matching for !this.useOwnStores. See "diff and collect" below
                        remove.push(records.splice(i, 1)[0]);
                    } else {
                        i++;
                    }
                }
            }
            if (remove.length > 0) {
                o2e.log.info("Removing records marked for deletion", false, remove);
            }
            add = records;
            this.currentRecords[serviceKey] = this.currentRecords[serviceKey].concat(records);
        }

        return {
            clear: clear,
            remove: remove,
            update: [],
            add: add
        };
    },

    //Private
    categorizeRefreshData: function(serviceKey, records, metadata) {
        var old, add = [], update = [], recs = [].concat(records), uidField, i, len, currRecord, found, oldRecord, clear, svc;

        //diff and collect add/remove/updates
        if (this.useOwnStores) {
            old = [].concat(this.currentRecords[serviceKey]);
        } else if (this.unionData) {
            old = [].concat(this.store.snapshot ? this.store.snapshot.items : this.store.data.items);
            // also need to add all other services' records to "records" for comparison, because we're unioned
            // TODO: this may not be the most efficient way to handle client side mashups!
            for (svc in this.currentRecords) {
                if (this.currentRecords.hasOwnProperty(svc) && this.services[svc].active && svc !== serviceKey) {
                    recs = recs.concat(this.currentRecords[svc]);
                }
            }
        } else {
            old = [].concat(this.stores[serviceKey].snapshot ? this.stores[serviceKey].snapshot.items : this.stores[serviceKey].data.items);
        }

        uidField = o2e.data.DataUtils.getFieldWithAnnotation('uid', metadata);

        for (i=0, len=recs.length; i<len; i++) {
            currRecord = recs[i];
            found = o2e.data.DataUtils.findMatchingRecord(old, uidField, currRecord);

            if (found !== false && found >= 0) {
                oldRecord = old.splice(found, 1)[0];
                if (uidField !== null && !o2e.data.DataUtils.isStrictMatch(oldRecord, currRecord)) {
                    update.push(currRecord);
                    if (!this.useOwnStores) {
                        this.updateRecord(oldRecord, currRecord);
                    }
                }
            } else {
                add.push(currRecord);
            }
        }

        this.currentRecords[serviceKey] = records;

        // is this correct?
        clear = records.length === old.length;

        return {
            clear: false,
            remove: old,
            update: update,
            add: add
        };
    },

    //Private
    updateRecord: function(oldRecord, newRecord) {
        var i, len, fields = oldRecord.fields, fieldName;
        oldRecord.beginEdit();
        for (i=0, len=fields.getCount(); i<len; i++) {
            fieldName = fields.getAt(i);
            oldRecord.set(fieldName, newRecord.get(fieldName));
        }
        oldRecord.endEdit(true);
        oldRecord.commit();
    },

    processStoreFilters: function(serviceKey, metadata) {
        var beforeFilterCount, store = this.unionData ? this.store : this.stores[serviceKey], filters = this.services[serviceKey].filters;
        if (store) {
            if (filters.length) {
                beforeFilterCount = store.getCount();
                store.filterBy(Ext.bind(this.matchesFilters, this, [filters, serviceKey], 1));
                this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Filtered '+(beforeFilterCount-store.getCount())+' of '+this.currentRecords[serviceKey].length+' records.');
            } else {
                store.clearFilter();
            }
        }
    },

    handleDataWithFilters: function(data, serviceKey, metadata) {
        var filterCount = 0, i, ilen, toRemove = [], add = [].concat(data.add), update = [].concat(data.update), filters = this.services[serviceKey].filters;

        // looks messy to use a tracker but need to do this to avoid concurrent modification
        for (i=0,ilen=add.length; i<ilen; i++) {
            if (!this.matchesFilters(add[i], filters, serviceKey)) {
                toRemove.push(add[i]);
            }
        }
        filterCount = filterCount + toRemove.length;
        for (i=0,ilen=toRemove.length; i<ilen; i++) {
            Ext.Array.remove(add, toRemove[i]);
        }

        for (toRemove=[],i=0,ilen=update.length; i<ilen; i++) {
            if (!this.matchesFilters(update[i], filters, serviceKey)) {
                toRemove.push(update[i]);
            }
        }
        filterCount = filterCount + toRemove.length;
        for (i=0,ilen=toRemove.length; i<ilen; i++) {
            Ext.Array.remove(update, toRemove[i]);
        }

        this.handleData({
            clear: false,
            remove: [],
            update: update,
            add: add
        }, serviceKey, metadata);

        this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Filtered '+(data.add.length-add.length)+' of '+data.add.length+' records.');
    },

    matchesFilters: function(record, filters, serviceKey) {
        var i, start = 0, dateVal, ilen, x, xlen, recordVal, operator, filter, meetsFilters = true, found, uidField;

        if (!Ext.isEmpty(serviceKey)) {
            // if serviceKey is provided, check to make sure the record is a match to one of the currentRecords.
            uidField = o2e.data.DataUtils.getFieldWithAnnotation('uid', this.services[serviceKey].metadata);
            found = o2e.data.DataUtils.findMatchingRecord(this.currentRecords[serviceKey], uidField, record);
            if (found === false || found < 0) {
                // return true if it's not found because it is ineligible for filtering
                return true;
            }
        }

        if (filters.length) {
            if (filters[0].operator === 'daterange' || filters[0].operator === 'agelimit') {
                start = 1;
                dateVal = Ext.Date.parse(record.get(filters[0].field), 'c');
                if (!dateVal) {
                    return false;
                }
                if (filters[0].operator === 'agelimit') {
                    if (!Ext.Date.between(
                            dateVal, // parsed date value
                            Ext.Date.add(new Date(), Ext.Date.SECOND, -1*filters[0].limit), // "from limit"
                            new Date()) // now
                        ) {
                        return false;
                    }
                } else if (filters[0].operator === 'daterange') {
                    if (!Ext.Date.between(
                            dateVal, // parsed date value
                            new Date(filters[0].from), // "from limit"
                            new Date(filters[0].to)) // "to limit"
                        ) {
                        return false;
                    }
                }
            }
            if (filters[1] && (filters[1].operator === 'daterange' || filters[1].operator === 'agelimit')) {
                start = 2;
                dateVal = Ext.Date.parse(record.get(filters[1].field), 'c');
                if (!dateVal) {
                    return false;
                }
                if (filters[1].operator === 'agelimit') {
                    if (!Ext.Date.between(
                            dateVal, // parsed date value
                            Ext.Date.add(new Date(), Ext.Date.SECOND, -1*filters[1].limit), // "from limit"
                            new Date()) // now
                        ) {
                        return false;
                    }
                } else if (filters[1].operator === 'daterange') {
                    if (!Ext.Date.between(
                            dateVal, // parsed date value
                            new Date(filters[1].from), // "from limit"
                            new Date(filters[1].to)) // "to limit"
                        ) {
                        return false;
                    }
                }
            }
            if (filters[start] && filters[start].useAnd) {
                meetsFilters = true;
                for (i=start,ilen=filters.length; i<ilen && meetsFilters; i++) {
                    recordVal = '';
                    filter = filters[i];
                    operator = filter.operator;
                    filter.value = filter.value.toLowerCase();

                    for (x=0,xlen=record.fields.keys.length; x<xlen; x++)  {
                        recordVal = recordVal + ' ' + Ext.String.trim(String(record.get(record.fields.keys[x])).toLowerCase());
                    }

                    recordVal = recordVal.replace(/\s/g,' ').replace(/'/g,'\\\'');
                    if ((operator === 'contains' && recordVal.indexOf(filter.value) === -1) ||
                        (operator === 'does not contain' && recordVal.indexOf(filter.value) !== -1)) {
                     // ||  (operator.indexOf('contain') === -1 && !eval('\''+recordVal+'\''+operator+'\''+filter.value+'\''))) {
                        meetsFilters = false;
                    }
                }
                return meetsFilters;
            } else if (filters[start]) {
                meetsFilters = false;
                for (i=start,len=filters.length; i<len && !meetsFilters; i++) {
                    recordVal = '';
                    filter = filters[i];
                    operator = filter.operator;
                    filter.value = filter.value.toLowerCase();

                    for (x=0,xlen=record.fields.keys.length; x<xlen; x++)  {
                        recordVal = recordVal + ' ' + Ext.String.trim(String(record.get(record.fields.keys[x])).toLowerCase());
                    }

                    recordVal = recordVal.replace(/\s/g,' ').replace(/'/g,'\\\'');
                    if ((operator === 'contains' && recordVal.indexOf(filter.value) !== -1) ||
                        (operator === 'does not contain' && recordVal.indexOf(filter.value) === -1)){
                    // || (operator.indexOf('contain') === -1 && eval('\''+recordVal+'\''+operator+'\''+filter.value+'\''))) {
                        meetsFilters = true;
                    }
                }
                return meetsFilters;
            } else {
                return true;
            }
        } else {
            return true;
        }
    },

    //Private
    portCurrentData: function(serviceKey) {
        var me = this, i, len, records = me.currentRecords[serviceKey], newRecords = [];

        if (serviceKey === undefined) {
            this.execOnEachServiceKey(me.portCurrentData);
        } else {
            if (records) {
                for (i=0, len=records.length; i<len; i++) {
                    newRecords.push(Ext.ModelManager.create(records[i].data, me.modelId));
                }
                me.currentRecords[serviceKey] = newRecords;
            }
        }
    },

    //Private
    pushCurrentData: function(serviceKey, excludeKey) {
        var records, metadata, me = this;
        if (serviceKey === undefined || serviceKey === null) {
            me.execOnEachServiceKey(Ext.bind(me.pushCurrentData, me, [excludeKey], 1));
        } else if (excludeKey !== serviceKey && me.services[serviceKey].active && me.currentRecords[serviceKey].length > 0) {
            metadata = me.services[serviceKey].metadata;
            records = me.currentRecords[serviceKey];
            if (!me.useOwnStores) {
                if (me.unionData) {
                    me.currentRecords[serviceKey] = me.store.add(records);
                } else {
                    me.currentRecords[serviceKey] = me.stores[serviceKey].add(records);
                }
                me.processStoreFilters(serviceKey, metadata);
            } else {
                me[me.services[serviceKey].filters.length ? 'handleDataWithFilters' : 'handleData']({
                    clear: false,
                    remove: [],
                    update: [],
                    add: records
                }, serviceKey, metadata);
            }
        }
    },

    //Private
    removeCurrentData: function(serviceKey, widgetOnly) {
        var me = this;

        if (serviceKey === undefined || serviceKey === null) {
            me.execOnEachServiceKey(Ext.bind(me.removeCurrentData, me, [widgetOnly], 1));
        } else {
            if (!me.useOwnStores) {
                if (me.unionData) {
                    me.store.removeAll();
                    me.pushCurrentData(null, serviceKey);
                } else {
                    me.stores[serviceKey].removeAll();
                }
            } else {
                me.handleData({
                    clear: widgetOnly ? 'widget' : true,
                    remove: [],
                    update: [],
                    add: []
                }, serviceKey, me.services[serviceKey].metadata);
            }
        }
    },

    //Private
    getAnnotations: function(serviceKey, annotationType) {
        var annotations, plugins, i, len;

        //Start with what the widget itself wants
        annotations = this[annotationType] || [];

        plugins = this.services[serviceKey].plugins;

        //Add in those that the plugins want
        for (i=0, len=plugins.length; i<len; i++) {
            annotations = Ext.Array.merge(annotations, this.dataPlugins[plugins[i]][annotationType]);
        }

        return annotations;
    },

    //Private
    getAllAnnotations: function(serviceKey) {
        var annotations, me = this, key;
        if (serviceKey !== undefined) {
            return Ext.Array.merge(me.getRequiredAnnotations(serviceKey), me.getOptionalAnnotations(serviceKey));
        } else {
            annotations = [];
            for (key in me.services) {
                if (me.services.hasOwnProperty(key) && me.services[key].active) {
                    annotations = Ext.Array.merge(annotations, me.getAllAnnotations(key));
                }
            }
            return annotations;
        }
    },

    //Private
    getRequiredAnnotations: function(serviceKey) {
        return this.getAnnotations(serviceKey, 'requiredAnnotations');
    },

    //Private
    getOptionalAnnotations: function(serviceKey) {
        return this.getAnnotations(serviceKey, 'optionalAnnotations');
    },

    //Private
    getUseRawData: function(serviceKey) {
        var plugins, i, len;

        //If either the widget or ANY of this service's plugins are NOT using rawData return false

        if (this.useRawData) {
            plugins = this.services[serviceKey].plugins;

            for (i=0, len=plugins.length; i<len; i++) {
                if (!plugins[i].useRawData) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    },

    //Private
    getRestrictFields: function(serviceKey) {
        var plugins, i, len, services = this.services, key, plugin;

        //Return true if the widget and all its plugins use annotations exclusively

        if (serviceKey === undefined) {
            for (key in services) {
                if (services.hasOwnProperty(key)) {
                    if (!this.getRestrictFields(key)) {
                        return false;
                    }
                }
            }
            return true;
        }

        if (this.restrictFields && this.requiredAnnotations.length === 0 && this.optionalAnnotations.length === 0) {
            plugins = services[serviceKey].plugins;
            for (i=0, len=plugins.length; i<len; i++) {
                plugin = this.dataPlugins[plugins[i]];
                if (plugin.restrictFields === false ||
                    (plugin.requiredAnnotations.length === 0 && plugin.optionalAnnotations.length === 0))
                {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    },

    //Private
    getUnrestrictedFields: function() {
        var fields = [], serviceKey, i, len, tempFields, me = this;

        for (serviceKey in me.services) {
            if (me.services.hasOwnProperty(serviceKey) && me.services[serviceKey].active && !me.getRestrictFields(serviceKey)) {
                tempFields = Ext.ModelManager.getModel(me.models[serviceKey]).prototype.fields.getRange();
                for (i=0, len=tempFields.length; i<len; i++) {
                    fields.push(tempFields[i].name);
                }
            }
        }

        return fields;
    },

    //Private
    _onMetadataUpdate: function(serviceId, metadata) {
        var services = this.getServicesWithId(serviceId);

        if (services.length > 0) {
            this.fireEvent('metadataupdate', this.id, services, metadata);
        }
    },

    //Private
    _onMetadataRemove: function(serviceId) {
        var services = this.getServicesWithId(serviceId);

        if (services.length > 0) {
            this.fireEvent('metadataremove', this.id, services);
        }
    },

    //Private
    getServicesWithId: function(serviceId) {
        var serviceKey, services = [];

        for (serviceKey in this.services) {
            if (this.services.hasOwnProperty(serviceKey)) {
                if (this.services[serviceKey].serviceId === serviceId) {
                    services.push(serviceKey);
                }
            }
        }

        return services;
    },

    //Private
    getAllMetadata: function() {
        var serviceKey, metadata = [];

        for (serviceKey in this.services) {
            if (this.services.hasOwnProperty(serviceKey)) {
                metadata.push(this.services[serviceKey].metadata);
            }
        }

        return metadata;
    },

    //Private
    execOnEachServiceKey: function(fn) {
        var serviceKey;
        for (serviceKey in this.services) {
            if (this.services.hasOwnProperty(serviceKey)) {
                fn.call(this, serviceKey);
            }
        }
    }

});
