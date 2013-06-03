/**
 * @class o2e.RssWidget
 * @extends o2e.widget.AbstractDataViewWidget
 *
 */
Ext.define('o2e.RssWidget', {
    extend: 'o2e.widget.AbstractDataViewWidget',

    type: 'rss',

    requiredAnnotations: ['title', 'link', 'description'],
    optionalAnnotations: ['pubDate', 'author'],

    dataViewCfg: {
        autoScroll: true,
        itemSelector: 'div.rssRow',
        overClass: 'x-list-over',
        enableDragDrop: true,
        plugins: {
            ddGroup: 'CAWidgets',
            ptype: 'gridviewdragdrop',
            enableDrop: false
        },
        tpl: [
            '<tpl for=".">',
                '<div class="rssRow {[values.highlight ? "highlighted" : ""]}" style="padding:5px;border-bottom:1px solid #DDD;{[values.highlight ? "background-color:#FFDFDF;" : ""]}">',
                    '<div style="position:relative">',
                        '<img src="images/icons/bullet_toggle_plus.png" style="position:absolute;cursor:pointer;" class="toggleDetails"/>',
                        '<div style="margin:0px 16px 0px 16px;font-weight:bold;position:relative;">{title}</div>',
                        '<tpl if="link.length">',
                            ' <a href="{link}" target="_blank" style="position:absolute;right:0px;top:0px;"><img src="images/icons/go-to-post.gif" alt="Go to Post" title="Go to Post"/></a>',
                        '</tpl>',
                    '</div>',
                    '<div class="rssDetails" style="padding-top:5px;display:none;">',
                        '<tpl if="author.length">',
                            '<span style="color:#515151">by {author}</span><br/>',
                        '</tpl>',
                        '<tpl if="pubDate">',
                            '<span style="color:#515151">on {[isNaN(Ext.Date.parse(values.pubDate, "c", true)) ? values.pubDate : Ext.Date.format(Ext.Date.parse(values.pubDate, "c", true), "D d M Y H:i:s O")]}</span><br/>',
                        '</tpl><br/>',
                        '<div>{description}</div>',
                    '</div>',
                '</div>',
            '</tpl>'
        ],
        style: 'background: #FFFFFF'
    },

    init: function() {
        this.callParent();
        this.dataView.on('itemclick', this.onItemClick, this);
    },

    onItemClick: function(view, record, item, idx, e) {
        var n = Ext.get(item), t = e.getTarget(), d;
        if (n.hasCls('highlighted')) {
            this.store.suspendEvents();
            record.set('highlight', false);
            record.commit();
            this.store.resumeEvents();
            n.removeClass('highlighted');
            n.setStyle('background-color', 'transparent');
        }
        if (t.className === 'toggleDetails' || t.parentNode.className === 'toggleDetails') {
            d = n.down('div.rssDetails');
            d.setVisibilityMode(Ext.Element.DISPLAY);
            if (d.isVisible()) {
                n.down('img.toggleDetails').dom.src = 'images/icons/bullet_toggle_plus.png';
            } else {
                n.down('img.toggleDetails').dom.src = 'images/icons/bullet_toggle_minus.png';
            }
            d.setVisible(!d.isVisible(), true);
        }
    }
});