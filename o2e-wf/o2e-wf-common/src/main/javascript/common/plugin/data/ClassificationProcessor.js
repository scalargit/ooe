Ext.define('o2e.plugin.ClassificationProcessor', {
    extend: 'o2e.plugin.AbstractDataPlugin',

    pluginId: 'classificationProcessor',

    requiredAnnotations: ['classification'],
    optionalAnnotations: ['classificationCaveat'],
    restrictFields: true


});