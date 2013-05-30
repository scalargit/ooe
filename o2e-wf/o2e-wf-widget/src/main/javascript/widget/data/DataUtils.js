/**
 * @class o2e.data.DataUtils
 */
o2e.data.DataUtils = {

    serviceStatus: {
        ERROR: 3,
        WARN: 2,
        INFO: 1,
        LOADING: 0
    },

    /**
     * Finds the first field in the metadata with the given annotation.
     *
     * @param annotation
     * @param metadata
     */
    getFieldWithAnnotation: function(annotation, metadata) {
        var i, len, column, j, jLen, colAnnotation;

		for (i=0, len=metadata.response.length; i<len; i++) {
			column = metadata.response[i];
			for (j=0, jLen=column.annotations.length; j<jLen; j++) {
				colAnnotation = column.annotations[j];
				if (colAnnotation === annotation) {
					return column.name;
				}
			}
		}
		return null;
    },

    /**
     * Finds all fields in the metadata with the given annotation.
     *
     * @param annotation
     * @param metadata
     */
    getFieldsWithAnnotation: function(annotation, metadata) {
        var i, len, column, j, jLen, colAnnotation, cols = [];

        for (i=0, len=metadata.response.length; i<len; i++) {
			column = metadata.response[i];
			for (j=0, jLen=column.annotations.length; j<jLen; j++) {
				colAnnotation = column.annotations[j];
				if (colAnnotation === annotation) {
					cols.push(column.name);
				}
			}
		}
        return cols;
    },

    /**
     * Finds the index of the matching record in the provided array of records using the uidField if it is not null.
     *
     * @param records
     * @param uidField
     * @param matchRecord
     *
     */
    findMatchingRecord: function(records, uidField, matchRecord) {
        var i, len, isMatch, oldRecord;

        for (i=0, len=records.length; i<len; i++) {
            isMatch = true;
            oldRecord = records[i];
            if (uidField === null) {
                // If there is no UID field, we do a strict match on all fields
                isMatch = this.isStrictMatch(oldRecord, matchRecord);
            } else {
                isMatch = (matchRecord.get(uidField) === oldRecord.get(uidField));
            }
            if (isMatch) {
                return i;
            }
        }

        return -1;
    },

    /**
     * Tests whether the records have identical values. They must be from the same Model for this to work.
     *
     * @param record1
     * @param record2
     */
    isStrictMatch: function(record1, record2) {
        var i, len, field;
        for (i=0, len=record2.fields.getCount(); i<len; i++) {
            field = record2.fields.getAt(i).name;
            if (record1.get(field) === undefined || record2.get(field) !== record1.get(field)) {
                return false;
            }
        }
        return true;
    }
};