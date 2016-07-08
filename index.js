function debug(str){ if(prefs.debug){ console.log(str) } }

const { Cc, Ci } = require('chrome');
const history = Cc['@mozilla.org/browser/history;1'].getService(Ci.mozIAsyncHistory);
const uri = Cc['@mozilla.org/docshell/urifixup;1'].createInstance(Ci.nsIURIFixup).createFixupURI;

var prefs = require('sdk/simple-prefs').prefs;
prefs.enabled = true;
prefs.debug = false;

var curUrl = '';
var pageMod = require('sdk/page-mod').PageMod;
var pageWorker = require('sdk/page-worker').Page;
var tabs = require('sdk/tabs');

function addHist(url){
	if(url){ history.updatePlaces({ uri:uri(url, 0), visits:[{transitionType:1, visitDate:Date.now()*1000}] }) }
	debug('add to history: '+url)
}

function setPrefs(){
	var loaded = true;
	if(prefs.blacklist){
		inc = ['*'];
		exc = prefs.domainlist.split(',');
	}else{
		inc = prefs.domainlist.split(',');
		exc = [];
	}
	if(pageMod.destroy){ pageMod.destroy() }else{ loaded = false }
	pageMod = require('sdk/page-mod').PageMod({
		include:inc, exclude:exc,
		contentScriptFile:['./jquery-2.2.3.min.js', './page-mod.js'],
		contentScriptOptions:{ 'prefs':prefs },
		contentScriptWhen:'ready',
		contentStyleFile:"./page-mod.css",
		attachTo:['existing', 'top'],
		onAttach:function(w){
			w.port.on('load', function(url, src){ curUrl = url; pageWorker.contentURL = src });
			w.port.on('toggle', toggle);
			w.port.on('visit', addHist);
		}
	});
	if(pageWorker.destroy){ pageWorker.destroy() }else{ loaded = false }
	pageWorker = require('sdk/page-worker').Page({
		contentScriptFile:'./page-worker.js',
		contentScriptOptions:{ 'prefs':prefs },
		contentScriptWhen:'ready'
	});
	pageWorker.port.on('done', function(){ pageWorker.contentURL = 'about:blank' });
	pageWorker.port.on('found', function(imgs){ pageMod.port.emit('found', curUrl, imgs); });
	if(loaded){ for(let tab of tabs){ if(tab.url != 'about:addons'){ tab.reload() } } }
}

function toggle(){
	if(prefs.enabled){ prefs.enabled = false }else{ prefs.enabled = true }
	setPrefs();
}

require('sdk/simple-prefs').on('', setPrefs);
setPrefs();