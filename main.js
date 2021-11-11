function hzDebug(s){ if(prefs.debug){ window.console.log('main: '+s) }}

const defs = {
	addHist:'500',
	debug:false,
	delay:'500',
	dstBlock:'',
	hImgur:true,
	hReddit:true,
	hTinypic:true,
	keys:true,
	maxSize:'95',
	scrapeList:'500px.com, artstation.com, craigslist.org, deviantart.com, dropbox.com, explosm.net, facebook.com, fav.me, flic.kr, flickr.com, gfycat.com, gifly.org, giphy.com, goo.gl, ibb.co, imdb.com, imgflip.com, imgly.org, imgtc.com, imly.me, instagram.com, livememe.com, makeameme.org, redgifs.com, streamable.com, tumblr.com, twitter.com, vid.me, vidble.com, vine.co, wikipedia.org',
	scrapeListBlock:'icon.png, profile_images',
	srcBlock:'craigslist.org, flickr.com, imgur.com',
	textLoc:'bottom:6px; left:50%;'
}

var prefs = {}
const sto = browser.storage.sync;
function checkPrefs(p){
	if(!p){ var p = {} }
	var	op = JSON.stringify(prefs);
	for(let [k,v] of Object.entries(defs)){
		prefs[k] = (p[k] == undefined) ? v : p[k]
		hzDebug(k+" : "+prefs[k])
	}
	if(JSON.stringify(prefs) != op){
		hzDebug('prefs have changed');
		ports.forEach(function(p){ p.postMessage({ 'prefs':prefs }) });
		var w = sto.set({ 'prefs':prefs });
		w.then(function(){ hzDebug('prefs saved to storage') });
	}else{
		hzDebug('prefs checked, no changes');
	}
}

var ports = [];
var portsNum = 0;
browser.runtime.onConnect.addListener(function(p){
	p.num = portsNum;
	p.onMessage.addListener(function(m){
		hzDebug('req: '+m.req);
		switch(m.req){
			case 'addHist':
				hzDebug('adding to history: '+m.url);
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
				hzDebug('unknown request');
		}
	});
	p.onDisconnect.addListener(function(){ 
		hzDebug('port disconnected: '+p.num);
		ports.splice(ports.findIndex(i => i.num == p.num), 1);
	});
	ports.push(p);
	++portsNum;
});

sto.get('prefs').then(function(s){
	if(s.prefs){ prefs = s.prefs }
	checkPrefs(s.prefs);
});