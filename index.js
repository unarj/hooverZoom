const { Cc, Ci } = require('chrome');
//const array = require('sdk/util/array');
const history = Cc['@mozilla.org/browser/history;1'].getService(Ci.mozIAsyncHistory);
const uri = Cc['@mozilla.org/docshell/urifixup;1'].createInstance(Ci.nsIURIFixup).createFixupURI;

var prefs = require('sdk/simple-prefs').prefs;
var curUrl = '';
var pageMod = require('sdk/page-mod').PageMod;

var pageWorker = require('sdk/page-worker').Page();
function loadPage(url){
	pageWorker = require('sdk/page-worker').Page({ contentScriptFile:'./page-worker.js', contentScriptWhen:'ready', contentURL:url });
	pageWorker.port.on('done', function(){ pageWorker.destroy() });
	pageWorker.port.on('image', function(imgs){ pageMod.port.emit('image', curUrl, imgs) });
	pageWorker.port.on('video', function(vid){ pageMod.port.emit('video', curUrl, vid) });
}

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
		contentScriptFile:["./jquery-2.2.3.min.js", "./page-mod.js"],
		contentScriptOptions:{ 'prefs':prefs },
		contentScriptWhen:'ready',
		contentStyleFile:"./page-mod.css",
		attachTo:['existing', 'top'],
		onAttach:function(w){
			w.port.on('load', function(url, src){ curUrl = url; loadPage(src) }),
			w.port.on('visit', addHist);
//			console.log('attached: '+w.tab.url)
		}
	});
}

require('sdk/simple-prefs').on('', setPrefs);
setPrefs();
