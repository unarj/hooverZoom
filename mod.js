function hzDebug(s){ if(hzPrefs.debug){ console.log('mod: '+s) }}
const port = browser.runtime.connect();

var hzPrefs={}, hzScrapeList='', hzScrapeListBlock='';
port.onMessage.addListener((m)=>{
	function rform(x){
		y = [];
		x.split(',').forEach(function(i){ if(i=='.'){ y.push(i) }else{ y.push(i.trim().replace(/[/\-\\^$*+?.()|[\]{}]/g,'\\$&')+'$') }});
		return y.join(',');
	}
	if(m.prefs){
		hzDebug('prefs loading');
		hzPrefs = m.prefs;
		if(hzPrefs.scrapeList){
			if(hzPrefs.regexAutoFormat){ hzPrefs.scrapeList = rform(hzPrefs.scrapeList) }
			hzScrapeList = RegExp(hzPrefs.scrapeList.replace(/ /g,'').replace(/,/g,'|')),'i'
		}else{ hzScrapeList = RegExp('^\s\S') }
		hzDebug('scrapeList: '+hzScrapeList);
		if(hzPrefs.scrapeListBlock){
			if(hzPrefs.regexAutoFormat){ hzPrefs.scrapeListBlock = rform(hzPrefs.scrapeListBlock) }
			hzScrapeListBlock = RegExp(hzPrefs.scrapeListBlock.replace(/ /g,'').replace(/,/g,'|')),'i' 
		}else{ hzScrapeListBlock = RegExp('^\s\S') }
		hzDebug('scrapeListBlock: '+hzScrapeListBlock);
		hzPrefs.enabled = true;
		if(hzPrefs.srcBlock){
			if(hzPrefs.regexAutoFormat){ hzPrefs.srcBlock = rform(hzPrefs.srcBlock) }
			hzDebug('srcBlock: '+hzPrefs.srcBlock);
			if(RegExp(hzPrefs.srcBlock.replace(/ /g,'').replace(/,/g,'|'),'i').test(location.hostname)){
				hzDebug('page URL found in block list');
				if(!hzPrefs.srcBlockInvert){
					hzDebug('disabled (normal blocklist)');
					hzPrefs.enabled = false;
				}
			}else if(hzPrefs.srcBlockInvert){
				hzDebug('disabled (inverted blocklist)');
				hzPrefs.enabled = false;
			}
		}else if(hzPrefs.srcBlockInvert){
			hzDebug('disabled (inverted empty blocklist)');
			hzPrefs.enabled = false;
		}
	}
});
port.postMessage({ req:'getPrefs' });

var hzAlbum=[], hzAlbumIndex=0;
function hzWheel(e){
	if(hzAlbum.length > 1){
		e.preventDefault();
		if(e.deltaY > 0){ 
			++hzAlbumIndex;
			if(hzAlbumIndex > hzAlbum.length - 1){ hzAlbumIndex = 0 }
			hzDebug('scroll next: '+(hzAlbumIndex+1)+'/'+hzAlbum.length);
		}else if(e.deltaY < 0){
			--hzAlbumIndex;
			if(hzAlbumIndex < 0){ hzAlbumIndex = hzAlbum.length - 1 }
			hzDebug('scroll prev: '+(hzAlbumIndex+1)+'/'+hzAlbum.length);
		}
		hzPanel.loadImg(curUrl, hzAlbum[hzAlbumIndex]);
	}
}
function keyPress(e){
	if(hzPrefs.keys){
		if(e.ctrlKey && e.altKey && e.keyCode == 90){
			if(hzPrefs.enabled){
				hzDebug('disabled');
				hzPrefs.enabled = false;
				hzPanel.hide();
			}else{ 
				hzDebug('enabled');
				hzPrefs.enabled = true;
			}
		}else if(hzPrefs.enabled){
			if(!(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)){
				switch(e.keyCode){
					case 37: //left
						e.deltaY = -1;
						break;
					case 39: //right
						e.deltaY = 1;
						break;
				}
				if(e.deltaY){ hzWheel(e) }
			}
		}
	}
}

var hzXmlr = new XMLHttpRequest();
hzXmlr.parser = new DOMParser();
hzXmlr.albumAdd = function(src){
	if(this.orig == curUrl){
		hzDebug('album add: '+src);
		setTimeout(function(){
			var e;
			if(/mp4|webm/i.test(src.split('.').pop())){
				e = document.createElement('video');
				e.crossorigin = '';
			}
			else{
				e = document.createElement('img');
				e.referrerPolicy = 'no-referrer';
			}
			e.src = src;
		}, hzAlbum.length * 500);
		hzAlbum.push(src);
	}
}
hzXmlr.onerror = function(e){ hzDebug('scrape error :'+this.response) }
hzXmlr.scrape = function(e){
	hzDebug('scrape: '+this.responseURL)
	var data = this.parser.parseFromString(this.responseText,'text/html').getElementsByTagName('meta');
	for(let i of ['og:video:secure_url','og:video:url','og:video','og:image:secure_url','og:image:url','og:image']){
		for(let d of data){
			if(d.getAttribute('property') == i){
				var x = d.getAttribute('content');
				if(hzScrapeListBlock && hzScrapeListBlock.test(x)){ hzDebug('blocked media: '+x) }
				else{ this.albumAdd(x) }
			}
		}
		if(hzAlbum.length){
			hzPanel.loadImg(this.orig, hzAlbum[0]);
			return;
		}
	}
}
hzXmlr.scrapeImgur = function(e){
	try{
		var r = JSON.parse(this.response);
		hzDebug('scrape imgur: '+this.responseURL);
	}catch(e){
		hzDebug('scrape imgur: '+this.responseURL+' response is not JSON');
	}
	if(r.data.length){
		for(let d of r.data){
			if(d.animated){ this.albumAdd(d.mp4) }
			else if(d.link){ this.albumAdd(d.link) }
		}
	}else{
		if(r.data.animated){ this.albumAdd(r.data.mp4) }
		else if(r.data.link){ this.albumAdd(r.data.link) }
		else{
			hzDebug('scrape imgur: no hits');
			hzScrape(this.orig);
		}
	}
	if(hzAlbum.length){ hzPanel.loadImg(this.orig, hzAlbum[0]) }
}
hzXmlr.scrapeReddit = function(e){
	try{
		var r = JSON.parse(this.response);
		hzDebug('scrape reddit: '+this.responseURL);
	}catch(e){
		hzDebug('scrape reddit: '+this.responseURL+' response is not JSON');
	}
	if(r){
		var d = r[0].data.children[0].data;
		if(d.gallery_data){
			for(let i in d.gallery_data.items){
				var p = d.media_metadata[d.gallery_data.items[i].media_id];
				switch(p.m){
					case 'image/gif':
						this.albumAdd(p.s.gif);
						break;
					default:
						this.albumAdd(p.s.u.split('?')[0].replace('\/\/preview\.','//i.'));
				}
			}
			hzPanel.loadImg(this.orig, hzAlbum[0])
		}else if(d.media){
			hzPanel.loadVid(this.orig, d.media.reddit_video.fallback_url.split('?')[0])
		}else if(d.url){
			hzPanel.loadImg(this.orig, d.url)
		}else{ 
			hzDebug('scrape reddit: no hits');
			hzScrape(this.orig);
		}
	}
}
hzXmlr.scrapeVReddit = function(e){
	hzDebug('scrape vreddit: '+this.responseURL);
	var data = this.parser.parseFromString(this.responseText,'text/html').getElementsByTagName('link');
	for(let d of data){
		if(d.rel == 'canonical'){
			hzXmlr.onload = hzXmlr.scrapeReddit;
			hzXmlr.open('GET', d.href+'.json');
			hzXmlr.send();
		}
	}
}
hzXmlr.scrapeTinypic = function(e){
	hzDebug('scrape tinypic: '+this.orig);
	var data = this.parser.parseFromString(this.responseText,'text/html').getElementsByTagName('input');
	for(let d of data){
		if(d.getAttribute('id') == 'direct-url'){ this.albumAdd(d.getAttribute('value')) }
	}
	if(hzAlbum.length){
		hzPanel.loadImg(this.orig, hzAlbum[0]);
	}else{
		hzDebug('scrape tinypic: no hits');
		hzScrape(this.orig);
	}
}
function hzScrape(url, src){
	if(!src){ src = url }
	hzXmlr.onload = hzXmlr.scrape;
	hzXmlr.open('GET', src);
	hzXmlr.orig = url;
	hzXmlr.send();
}

var curUrl='', mark='', hzTarget = document.createElement('a');
function hzMouseOn(e){
	if(hzPrefs.enabled){
		mark = new Date().getTime();
		curUrl = e.target.toString();
		hzTarget.href = curUrl;
		var h = hzTarget.hostname.toLowerCase().split('.').reverse();
		var p = hzTarget.pathname.split('/');
		out:
			switch((h[1]+'.'+h[0])){
				case 'imgur.com':
					if(hzPrefs.hImgur){
						switch(p[1]){
							case 'a':
								hzXmlr.open('GET', 'https://api.imgur.com/3/album/'+p[2]+'/images');
								break;
							case 'gallery':
								hzXmlr.open('GET', 'https://api.imgur.com/3/gallery/'+p[2]+'/images');
								break;
							case 'r': //doesn't seem to work, Imgur API returns bad data...
								hzXmlr.open('GET', 'https://api.imgur.com/3/gallery/r/'+p[2]+'/'+p[3]);
								break;
							default:
								hzXmlr.open('GET', 'https://api.imgur.com/3/image/'+p.pop().split('.')[0]);
						}
						hzXmlr.onload = hzXmlr.scrapeImgur;
						hzXmlr.orig = curUrl;
						hzXmlr.setRequestHeader('Authorization','Client-ID a70d05102a4b4f7');
						hzXmlr.send();
						break out;
					}
				case 'redd.it':
				case 'reddit.com':
					if(hzPrefs.hReddit){
						switch(h[2]){
							case 'i': //direct image links
								break out;
							case 'v': //special handler for video links
								hzXmlr.open('GET', hzTarget.href);
								hzXmlr.onload = hzXmlr.scrapeVReddit;
								break;
							default:
								switch(p[1]){
									case 'gallery':
										hzXmlr.open('GET', 'https://www.reddit.com/comments/'+p[2]+'.json');
										break;
									default:
										hzXmlr.open('GET', hzTarget.href+'.json');
										hzXmlr.onload = hzXmlr.scrapeReddit;
								}	
						}
						hzXmlr.orig = curUrl;
						hzXmlr.send();
						break out;
					}
				case 'tinypic.com':
					if(hzPrefs.hTinypic){
						hzXmlr.onload = hzXmlr.scrapeTinypic;
						hzXmlr.open('GET', hzTarget.href);
						hzXmlr.orig = curUrl;
						hzXmlr.send();
						break out;
					}
				default:
					if(hzScrapeList.test(hzTarget.hostname)){ hzScrape(hzTarget.href) }
			}
		hzPanel.loadImg(hzTarget.href);
	}
}
function hzMouseOff(e){
	clearTimeout(hzWait);
	hzXmlr.abort();
	curUrl = '';
	hzPanel.hide();
	hzAlbum = [];
	hzAlbumIndex = 0;
}

var hzPanel, hzWait;
document.addEventListener('DOMContentLoaded', function(e){
	hzPanel = document.createElement('div');
	hzPanel.id = 'hzPanel';
	hzPanel.show = function(width, height){
		var x=width, y=height, r=window.devicePixelRatio*(hzPrefs.maxSize/100), maxX=window.innerWidth*r, maxY=window.innerHeight*r;
		if((x > maxX) || (y > maxY)){
			var rX=maxX/x, rY=maxY/y;
			if(rX < rY){
				x = Math.floor(x * rX);
				y = Math.floor(y * rX);
			}else{
				x = Math.floor(x * rY);
				y = Math.floor(y * rY);
			}
		}
		hzPanel.style.width = x+'px';
		hzPanel.style.height = y+'px';
		hzPanel.style.marginLeft = Math.floor(x / -2)+'px';
		hzPanel.style.marginTop = Math.floor(y / -2)+'px';
		if(hzAlbum.length > 1){
			var d = document.createElement('div');
			d.appendChild(document.createTextNode((hzAlbumIndex+1)+'/'+hzAlbum.length));
			d.setAttribute('style', hzPrefs.textLoc);
			hzPanel.appendChild(d);
		}
		if(hzPanel.style.display != 'block'){
			hzDebug('hzPanel show: '+x+','+y);
			hzPanel.style.display = 'block';
			document.addEventListener('scroll', hzMouseOff);
			document.addEventListener('wheel', hzWheel, {passive:false});
		}
		if(hzPrefs.addHist > 0){ hzWait = setTimeout(function(){ port.postMessage({ req:'addHist', url:curUrl })}, hzPrefs.addHist) }
	}
	hzPanel.hide = function(){
		if(hzPanel.style.display != 'none'){
			hzDebug('hzPanel hide');
			hzPanel.style.display = 'none';
			document.removeEventListener('scroll', hzMouseOff);
			document.removeEventListener('wheel', hzWheel);
		}
	}
	hzPanel.loadImg = function(url, src){
		if(!src){ src = url }
		if(/mp4|webm/i.test(src.split('.').pop())){ hzPanel.loadVid(url, src) }
		else{
			hzDebug('img load: '+src);
			hzPanel.img = document.createElement('img');
			hzPanel.img.addEventListener('load', function(){ hzPanel.showImg(url, src) });
			hzPanel.img.referrerPolicy = 'no-referrer';
			hzPanel.img.src = src;
		}
	}
	hzPanel.showImg = function(url, src){
		if(url == curUrl){
			var x = hzPrefs.delay - (new Date().getTime() - mark);
			if(x > 0){
				hzWait = setTimeout(function(){ hzPanel.showImg(url, src) }, x);
			}else{
				hzDebug('img show: '+src);
				while(hzPanel.lastChild){ hzPanel.removeChild(hzPanel.lastChild) }
				hzPanel.appendChild(hzPanel.img);
				hzPanel.show(hzPanel.img.naturalWidth, hzPanel.img.naturalHeight);
			}
		}
	}
	hzPanel.loadVid = function(url, src){
		hzDebug('vid load: '+src);
		hzPanel.vid = document.createElement('video');
		hzPanel.vid.addEventListener('canplaythrough', function(){ hzPanel.showVid(url, src) });
		hzPanel.vid.autoplay = true;
		hzPanel.vid.crossorigin = '';
		hzPanel.vid.loop = true;
		hzPanel.vid.muted = true;
		hzPanel.vid.src = src;
		hzPanel.vid.load();
	}
	hzPanel.showVid = function(url, src){
		if(url == curUrl){
			var x = hzPrefs.delay - (new Date().getTime() - mark);
			if(x > 0){
				hzWait = setTimeout(function(){ hzPanel.showVid(url, src) }, x);
			}else{
				hzDebug('vid show: '+src);
				while(hzPanel.lastChild){ hzPanel.removeChild(hzPanel.lastChild) }
				hzPanel.appendChild(hzPanel.vid);
				hzPanel.show(hzPanel.vid.videoWidth, hzPanel.vid.videoHeight);
				hzPanel.vid.play();
			}
		}
	}
	document.body.appendChild(hzPanel);
	document.addEventListener('keydown', keyPress, false);
});

function hzTag(){
	if(hzPrefs.enabled){
		var alinks = document.getElementsByTagName('a');
		var x = 0;
		for(let a of alinks){
			if(!a.hzTagged && !/^javascript:/.test(a.href)){
				a.addEventListener('mouseenter', hzMouseOn, false);
				a.addEventListener('mouseleave', hzMouseOff, false);
				a.hzTagged = true;
				++x;
			}
		}
		hzDebug('tagged '+x+' links');
	}
}
var domo = new MutationObserver(hzTag);
domo.observe(document.documentElement,{characterData:true,childlist:true,subtree:true});
window.addEventListener('DOMContentLoaded', hzTag);
//window.addEventListener('load', hzTag);
//window.addEventListener('loadend', hzTag);
//window.addEventListener('loadstart', hzTag);
//window.addEventListener('progress', hzTag);
//EOF