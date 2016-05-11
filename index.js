var { Cc, Ci } = require('chrome');
var history = Cc['@mozilla.org/browser/history;1'].getService(Ci.mozIAsyncHistory);
var uri = Cc['@mozilla.org/docshell/urifixup;1'].createInstance(Ci.nsIURIFixup).createFixupURI;

var curUrl = '';
var pageMod = require('sdk/page-mod').PageMod;
var pageWorker = require('sdk/page-worker').Page({ contentScriptFile:'./page-worker.js', contentScriptWhen:'ready' });
var prefs = require('sdk/simple-prefs').prefs;

pageWorker.port.on('done', function(){ pageWorker.contentURL = 'about:blank' });
pageWorker.port.on('image', function(imgs){ pageMod.port.emit('image', curUrl, imgs) });
pageWorker.port.on('video', function(vid){ pageMod.port.emit('video', curUrl, vid); console.log('relaying found video: '+vid) });

function addHist(url){
	if(url){ history.updatePlaces({ uri:uri(url, 0), visits:[{transitionType:1, visitDate:Date.now()*1000}] }) }
//	console.log("add to history : "+url)
}

function setPrefs(){
	if(prefs.blacklist){
		var inc = ['*'];
		var exc = prefs.domainlist.split(',');
	}else{
		var inc = prefs.domainlist.split(',');
		var exc = [];
	}
	if(pageMod.destroy){ pageMod.destroy() }
	pageMod = require('sdk/page-mod').PageMod({
		include:inc, exclude:exc,
		contentScriptFile:['./jquery-2.2.3.min.js', './page-mod.js'],
		contentScriptOptions:{ 'prefs':prefs },
		contentScriptWhen:'ready',
		contentStyleFile:"./page-mod.css",
		attachTo:['existing', 'top'],
		onAttach:function(w){
			w.port.on('load', function(url, src){ curUrl = url; pageWorker.contentURL = src });
			w.port.on('visit', addHist);
		}
	});
}

require('sdk/simple-prefs').on('', setPrefs);
setPrefs();