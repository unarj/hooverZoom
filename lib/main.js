const { Cc, Ci } = require('chrome');
const history = Cc["@mozilla.org/browser/history;1"].getService(Ci.mozIAsyncHistory);
const uri = Cc["@mozilla.org/docshell/urifixup;1"].createInstance(Ci.nsIURIFixup).createFixupURI;
//const pageModLib = require('sdk/page-mod');
//const pageWorkerLib = require('sdk/page-worker');
//const 
var pageMod, pageWorker;

function loader(url,src) {
//	pageWorker.destroy();
	pageWorker = require('sdk/page-worker').Page({
		contentURL:src,
		contentScriptFile:"./page-worker.js",
		contentScriptOptions:{ 'url':url },
		contentScriptWhen:'ready'
	});
	pageWorker.port.on('image', function(url,imgs){ pageMod.port.emit('image',url,imgs) });
	pageWorker.port.on('video', function(url,vid){ pageMod.port.emit('video',url,vid) });
}

var prefs = require('sdk/simple-prefs').prefs;
require('sdk/simple-prefs').on('', setPrefs);
function setPrefs() {
	if(prefs.blacklist) {
		var inc = ['*'];
		var exc = prefs.domainlist.split(',');
	} else {
		var inc = prefs.domainlist.split(',');
		var exc = [];
	}
	pageMod = require('sdk/page-mod').PageMod({
		include:inc, exclude:exc,
		contentScriptFile:["./jquery-2.1.3.min.js", "./page-mod.js"],
		contentScriptOptions:{ 'delay':prefs.delay, 'maxSize':prefs.maxSize },
		contentScriptWhen:'ready',
		contentStyleFile:"./page-mod.css",
		attachTo:['existing', 'top'],
		onAttach:function(worker) {
			worker.port.on('load', function(url,src) { loader(url,src) }),
			worker.port.on('visit', function(url) { history.updatePlaces({ uri:uri(url, 0), visits:[{transitionType:1, visitDate:Date.now()*1000}] }) })
		}
	});

}
setPrefs();
