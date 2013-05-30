/**
 * @class o2e.data.ModelFactory
 *
 * <p>The Model is at the core of O2E. Building a model is what maps the needs
 * of the widget to a particular service. In all situations a model must be
 * bound to a service. For generic widgets this is done by specifying 
 * annotations. For purposeful widgets the data fields are well known and 
 * therefore annotations are not necessary.</p>
 *
 * <p>When plugins are used by widgets (and they are by default), you might
 * have a blend of purposeful and generic data processors. In this case, a
 * hybrid model will be built that includes both normal data fields and
 * annotated fields.</p>
 *
 * <p>When raw data is required by a widget or plugin it of course does not
 * use these models at all.</p>
 *
 * <p>Model objects generally should not need to be created directly by widget
 * developers as they are setup automatically by AbstractDataComponent. Instead
 * it is critical for developers to make sure to specify the widget and plugin
 * configuration correctly.</p>
 *
 * @singleton
 */
Ext.define('o2e.data.ModelFactory', {
    
    singleton: true,

    /**
     * Create a model for use by generic widgets - i.e. those that use annotations
     * 
     * @param {String} widgetType The type of widget being used
     * @param {String} serviceId The service to use to build the model
     * @param {Object} metadata The metadata to use to build the model
     * @param {Array} annotations An required list of annotations to be used by the model
     * @param {Boolean} restrictFields Restrict fields in model to only those in the provided annotations list. Defaults to true iff annotations specified.
     * @return {String} The id of the model it created
     */
    createAnnotationModel: function(widgetId, serviceId, metadata, annotations, restrictFields) {
        var metaFields, fields = [], fieldNames = {}, i, len, j, jLen, field, found, modelId, annotationCache = {};
        
        metaFields = metadata.response;
        jLen = metaFields.length;
        for (i=0, len=annotations.length; i<len; i++) {                   
            for (j=0, found=false; j<jLen && !found; j++) {
                field = metaFields[j];
                if (field.annotations && Ext.Array.indexOf(field.annotations, annotations[i]) !== -1) {
                    // Include this field but change its name to the annotation name
                    fields.push(Ext.applyIf({
                        name: annotations[i],
                        mapping: field.mapping || field.name,
                        ignore: true
                    }, field));
                    fieldNames[annotations[i]] = true;
                    found = true;
                }
            }
            annotationCache[annotations[i]] = true;
        }
        // If we're not restricting fields we put in those fields which do 
        // not clash with existing annotations normally and remap those
        // that do clash.
        if (!restrictFields) {
            for (i=0, len=metaFields.length; i<len; i++) {
                field = metaFields[i];
                if (!fieldNames.hasOwnProperty(field.name)) {
                    fields.push(field);
                } else {
                    fields.push(Ext.applyIf({
                        name: 'rm_'+field.name,
                        mapping: field.mapping || field.name
                    }, field));
                }
            }
        }

        modelId = 'model-'+widgetId+'-'+serviceId;

        Ext.define(modelId, {
            extend: 'Ext.data.Model',
            fields: fields,
            annotations: annotationCache,
            isAnnotation: this.annotationIsAnnotationImpl,
            getAnnotationMap: this.getAnnotationMap
        });

        return modelId;
    },
    
    /**
     * Create a model for use by widgets that DO NOT USE ANNOTATIONS.
     * 
     * @param {String} widgetType The type of widget being used
     * @param {String} serviceId The service to use to build the model
     * @param {Object} metadata The metadata to use to build the model
     * @param {Object} fields An optional array of field names to use in the model. This enables the widget to only store what it needs even if other widgets need other parts of a message.
     * @return {String} The id of the model it created
     */
    createDataModel: function(widgetId, serviceId, metadata, fields) {
        var metaFields, newFields, fieldName, i, len, j, jLen, found, modelId;
        
        if (Ext.isArray(fields)) {
            metaFields = metadata.response;
            jLen = metaFields.length;
            for (i=0, len=fields.length, newFields=[]; i<len; i++) {
                fieldName = fields[i];                   
                for (j=0, found=false; j<jLen && !found; j++) {
                    if (fieldName === metaFields[j].name) {
                        newFields.push(metaFields[j]);
                        found = true;
                    }
                }
            }
        } else {
            newFields = metadata.response;
        }

        modelId = 'model-'+widgetId+'-'+serviceId;

        Ext.define(modelId, {
            extend: 'Ext.data.Model',
            fields: newFields,
            isAnnotation: this.dataIsAnnotationImpl,
            getAnnotationMap: this.getAnnotationMap
        });

        return modelId;
    },

    /**
     * Creates a common data model for widgets that DO NOT USE ANNOTATIONS but data from multiple services unioned.
     *
     * Note: this does not propagate additional metadata information from service metadata.
     *
     * @param {String} widgetType The type of widget being used
     * @param {String} widgetId The id of the widget being used
     * @param {Array} metadata An array of service metadata
     * @param {Array} fields An array of field names
     * @return {String} Returns the id of the model created.
     */
    createCommonDataModel: function(widgetType, widgetId, metadata, fields) {
        var metaFields, newFields, fieldNames, fieldName, i, len, j, jLen, modelId;

        //Note: in the future we'll want to propagate additional field metadata

        if (Ext.isArray(fields)) {
            for (j=0, jLen=fields.length, newFields = []; j<jLen; j++) {
                newFields.push({
                    name: fields[i]
                });
            }
        } else {
            for (i=0, len=metadata.length, fieldNames={}, newFields = []; i<len; i++) {
                metaFields = metadata[i].response;
                for (j=0, jLen=metaFields.length; j<jLen; j++) {
                    fieldName = metaFields[j].name || 'field-'+j;
                    if (!fieldNames.hasOwnProperty(fieldName)) {
                        newFields.push(metaFields[j]);
                        fieldNames[fieldName] = true;
                    }
                }
            }
        }

        modelId = 'model-'+widgetType+'-'+widgetId;
        Ext.define(modelId, {
            extend: 'Ext.data.Model',
            fields: newFields,
            isAnnotation: this.dataIsAnnotationImpl,
            getAnnotationMap: this.getAnnotationMap
        });

        return modelId;
    },

    /**
     * Creates a common data model for widgets that use annotations and need data from multiple services unioned. Unlike
     * in the service specific annotation models this does not allow appending of unannotated fields to the model. The
     * assumption is that any solution to this problem would lead to unacceptable performance for all common annotation
     * models.
     *
     * Note: this does not propagate additional metadata information from service metadata.
     *
     * @param {String} widgetType The type of widget being used
     * @param {String} widgetId The id of the widget being used
     * @param {Array} fieldNames A list of fields and annotations to be used by the model
     * @param {Array} annotations A list of the annotations (subset of fieldNames)
     * @return {String} Returns the id of the model created.
     */
    createCommonAnnotationModel: function(widgetType, widgetId, fieldNames, annotations) {
        var i, len, newFields=[], modelId;

        modelId = 'model-'+widgetType+'-'+widgetId;

        for (i=0, len=fieldNames.length; i<len; i++) {
            newFields.push({
                name: fieldNames[i],
                ignore: Ext.Array.indexOf(annotations, fieldNames[i]) !== -1
            });
        }

        Ext.define(modelId, {
            extend: 'Ext.data.Model',
            fields: newFields,
            isAnnotation: this.commonAnnotationIsAnnotationImpl,
            getAnnotationMap: this.getAnnotationMap
        });

        return modelId;
    },

    //Private
    annotationIsAnnotationImpl: function(fieldName) {
        return this.annotations.hasOwnProperty(fieldName);
    },

    //Private
    dataIsAnnotationImpl: function() {
        return false;
    },

    commonAnnotationIsAnnotationImpl: function() {
        return true;
    },

    getAnnotationMap: function() {
        //TODO: implement getAnnotationMap - where is the metadata?
    }
   
});
