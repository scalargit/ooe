/**
 * This patch fixes a bug with Ext.Function.createBuffered whereby caller arguments are not passed to the fn in question.
 */
// TODO: Re-evaluate after ExtJS 4.1 GA. This bug should be fixed in 4.1 GA
Ext.Function.createBuffered = function(fn, buffer, scope, args) {
    return function(){
        var timerId;
        return function() {
            var me = this, lastArgs = arguments;
            if (timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
            timerId = setTimeout(function(){
                fn.apply(scope || me, lastArgs || arguments);
            }, buffer);
        };
    }();
}