/**
 * @class o2e.RssWidget
 * @extends o2e.widget.AbstractDataViewWidget
 *
 */
Ext.define('o2e.XTemplateWidget', {
    extend: 'o2e.widget.AbstractDataViewWidget',

    type: 'tpl',

    requiredAnnotations: [],
    optionalAnnotations: [],
    requiredMetaFields: {
        itemSelector: 'div.rssRow',
        overClass: 'x-list-over',
        tplId: function() {
            var arr = [], items = o2e.tplRegistry.registry.items;
            for (var x=0,xlen=items.length;x<xlen;x++) {
                arr.push([items[x].name, items[x].uuid]);
            }
            return arr;
        }
    },

    itemSelector: 'div.rssRow',
    overClass: 'x-list-over',

    dataViewCfg: {
        autoScroll: true,
        style: 'background: #FFFFFF'
    },

    init: function() {
        var serviceKey, metadata, tplMeta;
        for (serviceKey in this.services) {
            if (this.services.hasOwnProperty(serviceKey)) {
                metadata = this.services[serviceKey].metadata;
                if (metadata.viz && metadata.viz.tpl) {
                    Ext.apply(this, metadata.viz.tpl);
                }
            }
        }

        tplMeta = o2e.tplRegistry.registry.get(this.tplId);
        if (tplMeta) {
            this.tpl = new Ext.XTemplate(
                tplMeta.tplContent,
                Ext.apply({
                    countDiff: this.countDiff,
                    countDown: this.countDown
                }, Ext.decode(tplMeta.tplMethods)));
            Ext.apply(this.dataViewCfg, {
                itemSelector: this.itemSelector,
                overClass: this.overClass,
                tpl: this.tpl
            });
        }

        this.callParent();
        this.dataView.on('itemclick', this.onItemClick, this);
    },

    countDiff: function(t, direction, format, useLocalTime) {
		// t: a date-time string formatted as Y-m-dTH:i:s[OFFSET]
		// direction:
			// 1: current > t is positive
			// 0: abs value of the diff between t and now.
			// -1: current < t is positive
		// format:
			// h:m:s
			// m:s
			// s
		// useLocalTime ... if defined, expect [+/-]HH:ii, else, assume Z

		var passedInDate = Date.parseDate(t+(useLocalTime && useLocalTime.length ? useLocalTime : 'Z'), 'c'),
            containerId = Ext.id(),
            countTask = Ext.TaskManager.start({
                run : function(passedInDate, direction, format, containerId) {
                    if (!document.getElementById(containerId)) {
                        Ext.TaskManager.stop(countTask);
                    } else {
                        var now = new Date(),
                            timeDiffSecs = Math.floor(passedInDate.getElapsed()/1000),
                            diffString = '',
                            diffSecs = timeDiffSecs % 60,
                            diffMins1 = Math.floor(timeDiffSecs / 60),
                            diffMinsHours = diffMins1 % 60,
                            diffHours = Math.floor(diffMins1 / 60);

                        if (format == 's') {
                            diffString = diffString + timeDiffSecs;
                        } else if (format == 'm:s') {
                            diffString = diffString + diffMins1 + ':' + (diffSecs < 10 ? ('0'+diffSecs) : diffSecs);
                        } else {
                            diffString = diffString + diffHours + ':' + (diffMinsHours < 10 ? ('0'+diffMinsHours) : diffMinsHours) + ':' + (diffSecs < 10 ? ('0'+diffSecs) : diffSecs);
                        }

                        if ((direction === -1 && now > passedInDate) || (direction === 1 && now < passedInDate)) {
                            diffString = '-' + diffString;
                        }

                        Ext.fly(containerId).update(diffString);
                    }
                },
                interval: 1000,
                args: [passedInDate, direction, format, containerId]
            });

		return "<div id='" + containerId + "'></div>";
	},

	countDown: function(t, format) {
		var time = t.split("T")[1],
            HMS = time.split(":"),
            hrs = HMS[0] ? parseInt(HMS[0], 10) : "00",
            min = HMS[1] ? parseInt(HMS[1], 10) : "00",
            sec = HMS[2] ? parseInt(HMS[2], 10) : "00",
            containerID = Ext.id(),
            container = null,
            intervalTimer = null;

	    //Add a "0" if needed
	    sec = sec < 10 && sec.toString().length <= 2 ? sec = "0" + sec : sec;
	    min = min < 10 && min.toString().length < 2 ? min = "0" + min : min;
		hrs = hrs < 10 && hrs.toString().length < 2 ? hrs = "0" + hrs : hrs;

	    intervalTimer = setInterval(function(){
	    	sec = sec === 0 ? sec = 59 : sec-=1;
	    	sec = sec < 10 && sec.toString().length <= 2 ? sec = "0" + sec : sec;

	    	if (sec === 59) {
	    		min = min === 0 ? min = 59 : min-=1;
	    	}

	    	min = min < 10 && min.toString().length < 2 ? "0" + min : min;
	    	hrs = hrs < 10 && hrs.toString().length < 2 ? "0" + hrs : hrs;

	    	if((hrs === 0 && min === 0 && sec === 0) || (hrs === 0 && min === 0 && sec < 60)) {
	    		//Might want to change the color red or something.....
	    	}

	    	if(document.getElementById(containerID)) {
	    		container = Ext.fly(containerID);
	    		container.update(hrs + ":" + min + ":" + sec);
	    	} else {
	    		clearInterval(intervalTimer);
	    	}

	    },1000);

	    return "<div id='" + containerID + "'>" + hrs + ":" + min + ":" + sec + "</div>";
	}
});