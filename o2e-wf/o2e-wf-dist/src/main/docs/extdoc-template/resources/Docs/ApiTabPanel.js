Ext.ns('Docs');



Docs.ApiTabPanel = Ext.extend( Ext.TabPanel, {
    constructor : function(cfg){

        cfg = Ext.applyIf(cfg || {}, {
            minTabWidth: 135,
            tabWidth: 135,
            enableTabScroll: true,
            activeTab: 0,
            resizeTabs: true,
            items   : this.buildItems(),
            plugins : [
                new Ext.ux.TabCloseMenu(),
                new Ext.ux.TabScrollerMenu({
                    maxText  : 15,
                    pageSize : 5
                })
            ]
        });
        
        Docs.ApiTabPanel.superclass.constructor.call(this, cfg);
    },
    buildItems : function() {
        return {
            title: 'API Home',
            iconCls:'icon-docs',
            autoScroll: true,
            autoLoad: {
                url: 'welcome.html',
                callback: this.onWelcomeLoadInitSearch,
                scope: this
            }
		};
    },
    initEvents : function(){
        Docs.ApiTabPanel.superclass.initEvents.call(this);
        this.body.on('click', this.onBodyClick, this);
    },
    onBodyClick: function(e, target){
        if(target = e.getTarget('a:not(.exi)', 3)){
            var cls = Ext.fly(target).getAttributeNS('ext', 'cls');
            e.stopEvent();
            if(cls){
                var member = Ext.fly(target).getAttributeNS('ext', 'member');
                this.loadClass(target.href, cls, member);
            }
            else if(target.className == 'inner-link'){
                this.getActiveTab().scrollToSection(target.href.split('#')[1]);
            }
            else{
                window.open(target.href);
            }
        }
        else if(target = e.getTarget('.micon', 2)){
            e.stopEvent();
            var tr = Ext.fly(target.parentNode);
            if(tr.hasClass('expandable')){
                tr.toggleClass('expanded');
            }
        }
    },

    loadClass : function(href, cls, member){
        var id  = 'docs-' + cls,
            tab = this.getComponent(id);
        if(tab){
            this.setActiveTab(tab);
            if(member){
                tab.scrollToMember(member);
            }
        }
        else{
            var autoLoad = {url: href};
            if(member){
                autoLoad.scope = this;
                autoLoad.callback = function(){
                    this.getComponent(id).scrollToMember(member);
                }
            }
            var p = this.add({
                xtype : 'docpanel',
                itemId : id,
                cclass : cls,
                autoLoad: autoLoad,
                iconCls: Docs.icons[cls]
            });
            this.setActiveTab(p);
        }
    },
	
	onWelcomeLoadInitSearch : function(){
		
	},
	
	doSearch : function(e){
		var k = e.getKey();
		if(!e.isSpecialKey()){
			var text = e.target.value;
			if(!text){
				this.searchStore.baseParams.q = '';
				this.searchStore.removeAll();
			}else{
				this.searchStore.baseParams.q = text;
				this.searchStore.reload();
			}
		}
	},
    onSearchStoreBeforeLoad : function(store) {
        store.baseParams.qt = this.getTopToolbar().getComponent('search-type').getValue();
    }
});

Ext.reg('apitabpanel', Docs.ApiTabPanel);
