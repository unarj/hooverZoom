function debug(s){ if(prefs.debug){ console.log('main: '+s) }}

const defs = {
	addHist:'500',
	debug:false,
	delay:'500',
	dstBlock:'',
	keys:true,
	maxSize:'95',
	scrapeList:'500px.com, artstation.com, craigslist.org, deviantart.com, explosm.net, facebook.com, fav.me, flic.kr, flickr.com, gfycat.com, giphy.com, instagram.com, makeameme.org, streamable.com, tumblr.com, twitter.com, vid.me, vine.co',
	scrapeListBlock:'icon.png',
	srcBlock:'craigslist.org, flickr.com, imgur.com',
	textLoc:'bottom:6px; left:50%;'
}
var prefs = {}

function checkPrefs(p){
	var	op = JSON.stringify(prefs);
	if(!p){ p = {} }
	prefs.addHist = (p.addHist == undefined) ? defs.addHist : p.addHist;
	prefs.debug = (p.debug == undefined) ? defs.debug : p.debug;
	prefs.delay = (p.delay == undefined) ? defs.delay : p.delay;
	prefs.dstBlock = (p.dstBlock == undefined) ? defs.dstBlock : p.dstBlock;
	prefs.keys = (p.keys == undefined) ? defs.keys : p.keys;
	prefs.maxSize = (p.maxSize == undefined) ? defs.maxSize : p.maxSize;
	prefs.scrapeList = (p.scrapeList == undefined) ? defs.scrapeList : p.scrapeList;
	prefs.scrapeListBlock = (p.scrapeListBlock == undefined) ? defs.scrapeListBlock : p.scrapeListBlock;
	prefs.srcBlock = (p.srcBlock == undefined) ? defs.srcBlock : p.srcBlock;
	prefs.textLoc = (p.textLoc == undefined) ? defs.textLoc : p.textLoc;
	if(JSON.stringify(prefs) != op){
		debug('prefs have changed');
		ports.forEach(function(p){ p.postMessage({ 'prefs':prefs }) });
		var w = sto.set({ 'prefs':prefs });
		w.then(function(){ debug('prefs saved to storage') });
	}else{
		debug('prefs checked, no changes');
	}
}

const sto = browser.storage.sync;
var initPrefs = sto.get('prefs');
initPrefs.then(function(s){
	if(s.prefs){ prefs = s.prefs }
	checkPrefs(s.prefs);
});

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
				var w = sto.clear();
				w.then(function(){
					prefs = {}
					checkPrefs(prefs);
				});
				break;
			case 'savePrefs':
				checkPrefs(m.prefs);
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