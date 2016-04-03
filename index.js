const { Cc, Ci } = require('chrome');
//const array = require('sdk/util/array');
const history = Cc["@mozilla.org/browser/history;1"].getService(Ci.mozIAsyncHistory);
const uri = Cc["@mozilla.org/docshell/urifixup;1"].createInstance(Ci.nsIURIFixup).createFixupURI;

var curUrl;

var prefs = require('sdk/simple-prefs').prefs;
function addHist(url){
	if(url && prefs.addHist){	history.updatePlaces({ uri:uri(url, 0), visits:[{transitionType:1, visitDate:Date.now()*1000}] }) }
}
function setPrefs(){
	if(prefs.blacklist){
		var inc = ['*'];
		var exc = prefs.domainlist.split(',');
	}else{
		var inc = prefs.domainlist.split(',');
		var exc = [];
	}
	pageMod = require('sdk/page-mod').PageMod({
		include:inc, exclude:exc,
		contentScriptFile:["./jquery-2.1.3.min.js", "./page-mod.js"],
		contentScriptOptions:{ 'delay':prefs.delay, 'keys':prefs.keys, 'maxSize':prefs.maxSize },
		contentScriptWhen:'ready',
		contentStyleFile:"./page-mod.css",
		attachTo:['existing', 'top'],
		onAttach:function(w){
			w.port.on('load', function(url, src){ curUrl = url; pageWorker.contentURL = src }),
			w.port.on('visit', addHist);
		}
	});
	pageWorker = require('sdk/page-worker').Page({
		contentScriptFile:"./page-worker.js",
		contentScriptWhen:'ready'
	});
	pageWorker.port.on('done', function(){ if(pageWorker.contentURL != 'about:blank'){ pageWorker.contentURL = 'about:blank' } });
	pageWorker.port.on('image', function(imgs){ pageMod.port.emit('image', curUrl, imgs) });
	pageWorker.port.on('video', function(vid){ pageMod.port.emit('video', curUrl, vid) });
}

require('sdk/simple-prefs').on('', setPrefs);
setPrefs();