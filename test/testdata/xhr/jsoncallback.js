(function() {
//this is really really dirty
if (document.body.lastChild.nodeName.toLowerCase() != "script") return;
var callbackName = /callback=([^&]+)/.exec(document.body.lastChild.src)[1];
eval(callbackName + '({hello:"world"});');
})();