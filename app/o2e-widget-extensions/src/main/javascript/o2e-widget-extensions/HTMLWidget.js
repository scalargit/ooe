/**
 * @class o2e.RssWidget
 * @extends o2e.widget.AbstractDataViewWidget
 *
 */
Ext.define('o2e.HTMLWidget', {
    extend: 'o2e.widget.AbstractWidget',

    type: 'html',

    requiredAnnotations: [],
    optionalAnnotations: ['title', 'link'],

    useOwnStores: true,
    unionData: false,
    useRawData: false,

    init: function() {
        this.miframe = this.add({
            xtype : 'miframe',
            frameName : 'MIF-'+this.id
        });
        this.setReady();
    },

    handleData: function(data, serviceKey, metadata) {
        var link, title;
		if (data.add.length > 0) {
			link = data.add[0].get('link');
            title = data.add[0].get('title') || '';
            if (link && link !== '') {
				this.miframe.setSrc(link);
				if (title && title !== '') {
					this.widgetCt.setTitle(title);
				}
			} else {
                link = data.add[0].get('url');
				this.miframe.setSrc(link);
			}
            this.fireEvent('servicestatus', serviceKey, o2e.data.DataUtils.serviceStatus.INFO, 'Loaded HTML source '+link);
		}
        this.processDataPlugins(data, serviceKey, metadata);
    }
});