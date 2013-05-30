/**
 * @class o2e.connector.AbstractConnector
 */
Ext.define('o2e.connector.AbstractConnector', {

    extend: 'Ext.util.Observable',
	
	dedicatedSocket: false, 
	
	isConnected: Ext.emptyFn,
	
	init: Ext.emptyFn,
	
	invoke: Ext.emptyFn,

    uninvoke: Ext.emptyFn,
	
	subscribe: Ext.emptyFn,
	
	unsubscribe: Ext.emptyFn
	
});
