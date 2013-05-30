/**
 * @class o2e.util.Logger
 *
 * @singleton
 */
Ext.define('o2e.util.Logger', {

    singleton: true,
	
    //TODO: make statics
	ERROR : 0,
	WARN : 1,
	INFO : 2,
	DEBUG : 3,
	MESSAGE_LEVELS : ["Error", "Warning", "Info", "Debug"],
	LOG_LEVEL_ICONS : [
		"images/icons/exclamation.png",
		"images/icons/error.png",
		"images/icons/information.png",
		"images/icons/bug.png"
	],
    
    /**
     * @cfg {Number} logLevel
     */
	logLevel : 2,
    /**
     * @cfg {Number} messageBoxLevel
     */
	messageBoxLevel : 1,
    /**
     * @cfg {Boolean} useFirebug
     */
	useFirebug : false,

    store: null,
	
	constructor : function() {
        Ext.define('Logger', {
            extend: 'Ext.data.Model',
            fields: [
                {name: 'level', type: 'int'},
                {name: 'message', type: 'string'},
                {name: 'date', type: 'date'}
            ],
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json'
                }
            }
        });
        this.store = Ext.create('Ext.data.Store', {
            storeId: 'Logger',
            model: 'Logger'
        });
	},
	
	setLogLevel : function(level) {
		if (level <= this.DEBUG && level >= this.ERROR) {
			this.logLevel = level;
		} else {
			throw "Invalid log level specified: "+level;
		}
	},
	
	setMessageBoxLevel : function(level) {
		if (level <= this.DEBUG && level >= this.ERROR) {
			this.messageBoxLevel = level;
		} else {
			throw "Invalid message box level specified: "+level;
		}
	},
	
	setUseFirebug : function(useFirebug) {
		if (useFirebug === true || useFirebug === false) {
			this.useFirebug = useFirebug;
		} else {
			throw "Invalid useFirebug setting specified: "+useFirebug;
		}
	},
	
	add: function(level, msg, forceShowPopup, debugObj) {
        var me = this;

		if (level <= me.logLevel) {
			if (me.useFirebug) {
				if (window.hasOwnProperty && window.hasOwnProperty("console")) {
					switch(level) {
						case me.DEBUG: console.debug(msg, debugObj); break;
						case me.INFO: console.info(msg, debugObj); break;
						case me.WARN: console.warn(msg, debugObj); break;
						case me.ERROR: console.error(msg, debugObj); break;
						default: console.log(msg, debugObj); break;
					}
				}
			}
			me.store.add({
                level: level,
                message: msg,
                date: new Date()
            });
		}
		if (level <= me.messageBoxLevel || forceShowPopup) {
			Ext.Msg.alert(me.MESSAGE_LEVELS[level], msg);
		}
	},

    clear: function() {
        this.store.removeAll();
    },
	
	isDebugEnabled : function() {
		return (this.logLevel === this.DEBUG);
	},
	
	isInfoEnabled : function() {
		return (this.logLevel >= this.INFO);
	},
    
    debug: function(msg, forceShowPopup, debugObj) {
        this.add(this.DEBUG, msg, forceShowPopup, debugObj);
    },
    
    info: function(msg, forceShowPopup, debugObj) {
        this.add(this.INFO, msg, forceShowPopup, debugObj);
    },
    
    warn: function(msg, forceShowPopup, debugObj) {
        this.add(this.WARN, msg, forceShowPopup, debugObj);
    },
    
    error: function(msg, forceShowPopup, debugObj) {
        this.add(this.ERROR, msg, forceShowPopup, debugObj);
    }
	
});
