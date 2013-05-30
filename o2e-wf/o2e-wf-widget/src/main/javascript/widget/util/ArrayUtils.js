Ext.define('o2e.util.ArrayUtils', {
    singleton: true,

    equals: function(array1, array2) {
        var i, len, j, found;

        if (array1.length !== array2.length) {
            return false;
        }

        for (i=0, len=array1.length; i<len; i++) {
            found = false;
            for (j=0; j<len; j++) {
                if (array1[i] === array2[j]) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                return false;
            }
        }
        return true;
    }
});