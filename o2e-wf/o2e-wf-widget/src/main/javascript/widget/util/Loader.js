/**
 * @class o2e.util.Loader
 *
 * Loads Javascript and CSS dependencies. Because the Ext.Loader mechanism only supports Javascript and ties
 * the className and filePath together (e.g. Ext.data.reader.Json would be retrieved from ./ext/data/reader/Json.js), it
 * is not sufficient for all widgets - specifically for 3rd party libraries (e.g. Google Maps) and custom CSS.
 *
 * This will allow for inclusion of cross-domain resources and care should be taken to vet those resources prior to
 * configuring widgets that use them.
 *
 *
 * TODO: support pending JS to prevent multiple widgets from calling requireJs at the same time
 */
Ext.define('o2e.util.Loader', {
    singleton: true,

    /**
     * @property cssHistory
     * @type Object
     * Read only. Keeps track of CSS files that have been loaded through this mechanism to prevent duplicate fetches.
     */
    cssHistory: {},

    /**
     * Dynamically loads a Javascript file at the given filePath and checks to make sure the given className was
     * defined in the process. Will invoke the given callback in the given scope upon successful completion with the
     * original className and filePath as parameters.
     *
     * @param {String} className
     * @param {String} filePath
     * @param {Function} callback
     * @param {Object} scope
     */
    requireJs: function(className, filePath, callback, scope) {
        var me = this;

        if (me.objectExists(className)) {
            o2e.log.debug('JS dependency: '+className+' has already been loaded.');
            callback.call(scope || me, className, filePath);
            return;
        }

        Ext.Loader.loadScriptFile(
            filePath,
            Ext.Function.pass(me._onJsLoaded, [className, filePath, callback, scope], me),
            Ext.Function.pass(me._onJsFailure, [className, filePath], me),
            me,
            Ext.Loader.syncModeEnabled
        );
    },

    /**
     * Dynamically loads a CSS file at the given filePath. No notification is given as to the success or completion
     *
     * @param {String} filePath
     */
    requireCss: function(filePath) {
        if (this.cssHistory[filePath]) {
            o2e.log.debug('CSS dependency: '+filePath+' has already been loaded.');
            return;
        }
        this.injectCssElement(filePath);
    },

    //Private
    _onJsLoaded: function(className, filePath, callback, scope) {
        if (this.objectExists(className)) {
            o2e.log.debug('JS dependency: '+className+' was loaded successfully from '+filePath+'.');
            if (callback) {
                callback.call(scope || this, className, filePath);
            }
        } else {
            o2e.log.error('JS dependency: '+filePath+' was loaded but '+className+' was not found.');
        }
    },

    //Private
    _onJsFailure: function(className, filePath) {
        o2e.log.error('JS dependency error: '+className+' could not be loaded!');
    },

    //Private
    objectExists: function(className, parent) {
        var classNames = className.split("."), i, len = classNames.length, obj = window;
        for (i=0; i<len; i++) {
            if (obj[classNames[i]]) {
                obj = obj[classNames[i]];
            } else {
                return false;
            }
        }
        return true;
    },

    //Private
    injectCssElement: function(url) {
        var stylesheet = document.createElement('link');
        stylesheet.type = 'text/css';
        stylesheet.rel = 'stylesheet';
        stylesheet.media = 'screen';
        stylesheet.src = url;
        document.getElementsByTagName('head')[0].appendChild(stylesheet);
    }

});