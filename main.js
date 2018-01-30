function debug(s){ if(prefs.debug){ console.log('main: '+s) }}

const defs = {
	addHist:'500',
	debug:false,
	delay:'500',
	dstBlock:'',
	hImgur:true,
	hTinypic:true,
	keys:true,
	maxSize:'95',
	scrapeList:'500px.com, artstation.com, craigslist.org, deviantart.com, dropbox.com, explosm.net, goo.gl, imdb.com, imgflip.com, imgtc.com, facebook.com, fav.me, flic.kr, flickr.com, gifly.org, gfycat.com, giphy.com, imgly.org, imly.me, instagram.com, livememe.com, makeameme.org, streamable.com, tumblr.com, twitter.com, vid.me, vidble.com, vine.co, wikipedia.org',
	scrapeListBlock:'icon.png, profile_images',
	srcBlock:'craigslist.org, flickr.com, imgur.com',
	textLoc:'bottom:6px; left:50%;'
}

var prefs = {}
const sto = browser.storage.sync;
function checkPrefs(p){
	var	op = JSON.stringify(prefs);
	if(!p){ p = {} }
	for(var k in defs){ prefs[k] = (p[k] == undefined) ? defs[k] : p[k]	}
	if(JSON.stringify(prefs) != op){
		debug('prefs have changed');
		ports.forEach(function(p){ p.postMessage({ 'prefs':prefs }) });
		var w = sto.set({ 'prefs':prefs });
		w.then(function(){ debug('prefs saved to storage') });
	}else{
		debug('prefs checked, no changes');
	}
}

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

sto.get('prefs').then(function(s){
	if(s.prefs){ prefs = s.prefs }
	checkPrefs(s.prefs);
});