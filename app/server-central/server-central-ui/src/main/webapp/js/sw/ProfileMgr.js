Ext.define('o2e.dashboard.ProfileMgr', {
    singleton: true,

    mixins: {
        observable: 'Ext.util.Observable'
    },

    userProfileId: null,

    constructor: function(cfg) {
        this.addEvents('userprofilefound', 'userprofileloaded');
    },

    loadUserProfile: function() {
         Ext.Function.defer(o2e.connectorMgr.query, 500, o2e.connectorMgr, [{
             componentId: 'profileMgr',
             serviceId: 'SYSTEM_collection_list',
             params: {
                 query: { 'json.username': o2e.env.username },
                 pageSize: '1',
                 pageNumber: '0',
                 collection: 'profile'
             },
             success: function(serviceKey, data, fr) {
                 if (data && data.records && data.records.length) {
                     var r, meta, z = 0, zlen = data.records.length, arr = [];
                     for (; z < zlen; z++) {
                         r = data.records[z].record;
                         meta = r.json;
                         if (!meta.uuid) {
                             meta.uuid = r.uuid;
                         }
                         this.userProfileId = meta.uuid
                         arr.push(meta);
                     }
                     o2e.profileRegistry.load(arr);
                     o2e.profileRegistry.get(this.userProfileId, this.doLoadUserProfile, this);
                 } else {
                     this.doLoadUserProfile({});
                 }
             },
             failure: function() {
                this.doLoadUserProfile({});
             },
             scope: this
         }]);
    },

    setUserProfile: function(profile) {
        profile.username = o2e.env.username;
        o2e.profileRegistry[this.userProfileId ? 'update' : 'insert'](this.userProfileId || null, profile, function(meta) {
            if (!this.userProfileId) {
                this.userProfileId = meta.uuid;
            }
            o2e.log.debug('User profile was successfully updated.');
        }, this);
    },

    loadSharedProfile: function(profileId) {
        o2e.profileRegistry.get(profileId, o2e.app.applyStateConfig, o2e.app);
    },

    //Private
    doLoadUserProfile: function(userProfile) {
        var i, len, count = 0, profiles = userProfile.profiles, onGetProfileFn;

        this.fireEvent('userprofilefound');

        if (Ext.isArray(profiles) && profiles.length > 0) {
            onGetProfileFn = function(profile) {
                profile.isTransient = true;
                o2e.app.applyStateConfig(profile);
                count++;
                if (count === profiles.length) {
                    this.fireEvent('userprofileloaded');
                }
            };

            o2e.app.applyStateConfig(userProfile);

            for (i=0, len=profiles.length; i<len; i++) {
                o2e.profileRegistry.get(profiles[i], onGetProfileFn, this);
            }
        } else {
            o2e.app.applyStateConfig(userProfile);
            this.fireEvent('userprofileloaded');
        }
    }
});