/**
 * @class o2e.data.MetadataUtils
 *
 * Provides metadata related helper functions.
 */
o2e.data.MetadataUtils = {

    metatype_service: {
        primaryKey: 'id',
        labelField: 'name',
        categoryField: 'category'
    },

    /**
     * Initializes the provided metadata object so that fields are filled out properly.
     *
     * @param {Object} metadata
     * @param {String} type
     * @return {Object} formatted metadata
     */
    initMetadata: function(metadata, type) {
        if (!this['metatype_'+type]) {
            return metadata;
        }

        var key = this['metatype_'+type].primaryKey;
        if (!metadata[key] && metadata['_'+key]) {
            metadata[key] = metadata['_'+key];
        }

        return metadata;
    }

};