<<<<<<< HEAD
var prefs = {};
function debug(s){ if(prefs.debug){ console.log('main: '+s) }}
var sto = browser.storage.local;
function loadPrefs(){
	const fetchPrefs = sto.get('prefs');
	fetchPrefs.then(function(s){
		if(!s.prefs){ s.prefs = {} }
		prefs.addHist = (s.prefs.addHist == undefined) ? 500 : s.prefs.addHist;
		prefs.debug = (s.prefs.debug == undefined) ?  false : s.prefs.debug;
		prefs.delay = (s.prefs.delay == undefined) ?  500 : s.prefs.delay;
		prefs.dstBlock = (s.prefs.dstBlock == undefined) ? '' : s.prefs.dstBlock;
		prefs.keys = (s.prefs.keys == undefined) ? true : s.prefs.keys;
		prefs.maxSize = (s.prefs.maxSize == undefined) ? 95 : s.prefs.maxSize;
		prefs.scrapeList = (s.prefs.scrapeList == undefined) ? '500px.com, artstation.com, citizenop.com, craigslist.org, deviantart.com, explosm.net, ezphotoshare.com, facebook.com, fav.me, flic.kr, flickr.com, gfycat.com, giphy.com, gifyoutube.com, gph.is, gyazo.com, imgcert.com, instagram.com, makeameme.org, mypixa.com, sli.mg, streamable.com, swirl.xyz, tumblr.com, twitter.com, vid.me, vine.co' : s.prefs.scrapeList;
		prefs.srcBlock = (s.prefs.srcBlock == undefined) ? 'craigslist.org, flickr.com, imgur.com' : s.prefs.srcBlock;
		prefs.textLoc = (s.prefs.textLoc == undefined) ? 'bottom:6px; right:8px;' : s.prefs.textLoc;
		debug('prefs loaded');
		if(JSON.stringify(prefs) != JSON.stringify(s.prefs)){
			debug('prefs have changed');
			sto.set({ 'prefs':prefs });
		}
		ports.forEach(function(p){ p.postMessage({ 'prefs':prefs }) });
	});
}
loadPrefs();

var ports = [];
var portsNum = 0;
browser.runtime.onConnect.addListener(function(p){
	p.num = portsNum;
	p.onMessage.addListener(function(m){
		debug('req: '+m.req);
		switch(m.req){
			case 'addHist':
				debug('adding to history: '+m.url);
				browser.history.addUrl({ url:m.url });
				break;
			case 'getPrefs':
				p.postMessage({ 'prefs':prefs });
				break;
			case 'resetPrefs':
				sto.clear();
				loadPrefs();
				break;
			case 'savePrefs':
				sto.set({ 'prefs':m.prefs });
				loadPrefs();
				break;
			default:
				debug('unknown request');
		}
	});
	p.onDisconnect.addListener(function(){ 
		debug('port disconnected: '+p.num);
		ports.splice(ports.findIndex(i => i.num == p.num), 1);
	});
	ports.push(p);
	++portsNum;
});
=======
var prefs = {};
function debug(s){ if(prefs.debug){ console.log('main: '+s) }}
var sto = browser.storage.local;
function loadPrefs(){
	const fetchPrefs = sto.get('prefs');
	fetchPrefs.then(function(s){
		if(!s.prefs){ s.prefs = {} }
		prefs.addHist = (s.prefs.addHist == undefined) ? 500 : s.prefs.addHist;
		prefs.debug = (s.prefs.debug == undefined) ?  false : s.prefs.debug;
		prefs.delay = (s.prefs.delay == undefined) ?  500 : s.prefs.delay;
		prefs.dstBlock = (s.prefs.dstBlock == undefined) ? '' : s.prefs.dstBlock;
		prefs.keys = (s.prefs.keys == undefined) ? true : s.prefs.keys;
		prefs.maxSize = (s.prefs.maxSize == undefined) ? 95 : s.prefs.maxSize;
		prefs.scrapeList = (s.prefs.scrapeList == undefined) ? '500px.com, artstation.com, citizenop.com, craigslist.org, deviantart.com, explosm.net, ezphotoshare.com, facebook.com, fav.me, flic.kr, flickr.com, gfycat.com, giphy.com, gifyoutube.com, gph.is, gyazo.com, imgcert.com, instagram.com, makeameme.org, mypixa.com, sli.mg, streamable.com, swirl.xyz, tumblr.com, twitter.com, vid.me, vine.co' : s.prefs.scrapeList;
		prefs.srcBlock = (s.prefs.srcBlock == undefined) ? 'craigslist.org, flickr.com, imgur.com' : s.prefs.srcBlock;
		prefs.textLoc = (s.prefs.textLoc == undefined) ? 'bottom:6px; right:8px;' : s.prefs.textLoc;
		debug('prefs loaded');
		if(JSON.stringify(prefs) != JSON.stringify(s.prefs)){
			debug('prefs have changed');
			sto.set({ 'prefs':prefs });
		}
		ports.forEach(function(p){ p.postMessage({ 'prefs':prefs }) });
	});
}
loadPrefs();

var ports = [];
var portsNum = 0;
browser.runtime.onConnect.addListener(function(p){
	p.num = portsNum;
	p.onMessage.addListener(function(m){
		debug('req: '+m.req);
		switch(m.req){
			case 'addHist':
				debug('adding to history: '+m.url);
				browser.history.addUrl({ url:m.url });
				break;
			case 'getPrefs':
				p.postMessage({ 'prefs':prefs });
				break;
			case 'resetPrefs':
				sto.clear();
				loadPrefs();
				break;
			case 'savePrefs':
				sto.set({ 'prefs':m.prefs });
				loadPrefs();
				break;
			default:
				debug('unknown request');
		}
	});
	p.onDisconnect.addListener(function(){ 
		debug('port disconnected: '+p.num);
		ports.splice(ports.findIndex(i => i.num == p.num), 1);
	});
	ports.push(p);
	++portsNum;
});
>>>>>>> 35887567d0ef280e54c55caea325cdccf3772210
