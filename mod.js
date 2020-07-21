function debug(s){ if(prefs.debug){ console.log('mod: '+s) }}
const port = browser.runtime.connect();

var prefs={}, scrapeList, scrapeListBlock, srcBlock
port.onMessage.addListener(function(m){
	if(m.prefs){ 
		debug('prefs loading');
		prefs = m.prefs;
		if(prefs.scrapeList){ scrapeList = RegExp(prefs.scrapeList.replace(/ /g,'').replace(/,/g,'|')),'i' }else{ scrapeList = RegExp('^\s\S') }
		debug('scrapeList: '+scrapeList);
		if(prefs.scrapeListBlock){ scrapeListBlock = RegExp(prefs.scrapeListBlock.replace(/ /g,'').replace(/,/g,'|')),'i' }else{ scrapeListBlock = RegExp('^\s\S') }
		debug('scrapeListBlock: '+scrapeListBlock);
		prefs.enabled = true;
		if(prefs.srcBlock && RegExp(prefs.srcBlock.replace(/ /g,'').replace(/,/g,'|'),'i').test(location.hostname)){
			debug('page URL found in block list');
			prefs.enabled = false;
		}
	}
});
port.postMessage({ req:'getPrefs' });

function keyPress(e){
	if(prefs.keys){
		if(e.ctrlKey && e.altKey && e.keyCode == 90){
			if(prefs.enabled){
				debug('disabled');
				prefs.enabled = false;
				hzPanel.hide();
			}else{ 
				debug('enabled');
				prefs.enabled = true;
			}
		}else if(prefs.enabled){
			if(!(e.ctrlKey || e.shiftKey || e.altKey || e.metaKey)){
				switch(e.keyCode){
					case 37: //left
						e.deltaY = -1;
						break;
					case 39: //right
						e.deltaY = 1;
						break;
				}
				if(e.deltaY){ wheel(e) }
			}
		}
	}
}

var xmlr = new XMLHttpRequest();
xmlr.parser = new DOMParser();
xmlr.albumAdd = function(src){
	if(this.orig == curUrl){
		debug('album add: '+src);
		setTimeout(function(){
			var e;
			if(/mp4|webm/i.test(src.split('.').pop())){	e = document.createElement('video')	}
			else{ e = document.createElement('img') }
			e.src = src;
		}, album.length * 500);
		album.push(src);
	}
}
xmlr.onerror = function(e){ debug(this.response) }
xmlr.scrape = function(e){
	debug('scrape: '+this.orig)
	var data = this.parser.parseFromString(this.responseText,'text/html').getElementsByTagName('meta');
	for(let i of ['og:video:secure_url','og:video:url','og:video','og:image:secure_url','og:image:url','og:image']){
		for(let d of data){
			if(d.getAttribute('property') == i){
				var x = d.getAttribute('content');
				if(scrapeListBlock && scrapeListBlock.test(x)){ debug('blocked media: '+x) }
				else{ this.albumAdd(x) }
			}
		}
		if(album.length){
			hzPanel.loadImg(this.orig, album[0]);
			return;
		}
	}
}
xmlr.scrapeImgur = function(e){
	debug('scrape imgur: '+this.orig);
	var r = JSON.parse(this.response);
	if(r.data.length){
		for(let d of r.data){
			if(d.animated){ this.albumAdd(d.mp4) }
			else if(d.link){ this.albumAdd(d.link) }
		}
	}else{
		if(r.data.animated){ this.albumAdd(r.data.mp4) }
		else if(r.data.link){ this.albumAdd(r.data.link) }
		else{
			debug('scrape imgur: no hits');
			hzScrape(this.orig);
		}
	}
	if(album.length){ hzPanel.loadImg(this.orig, album[0]) }
}
xmlr.scrapeReddit = function(e){
	debug('scrape reddit: '+this.orig);
	var r = JSON.parse(this.response);
	var d = r[0].data.children[0].data;
	if(d.media){
		hzPanel.loadImg(this.orig, d.media.reddit_video.fallback_url.split('?')[0])
	}else if(d.url){
		hzPanel.loadImg(this.orig, d.url)
	}else{ 
		debug('scrape reddit: no hits');
		hzScrape(this.orig);
	}
}
xmlr.scrapeVReddit = function(e){
	debug('scrape vreddit: '+this.orig);
	var data = this.parser.parseFromString(this.responseText,'text/html').getElementsByTagName('link');
	for(let d of data){
		if(d.rel == 'canonical'){
			xmlr.open('GET', d.href+'.json');
			xmlr.onload = xmlr.scrapeReddit;
			xmlr.send();
		}
	}
}
xmlr.scrapeTinypic = function(e){
	debug('scrape tinypic: '+this.orig);
	var data = this.parser.parseFromString(this.responseText,'text/html').getElementsByTagName('input');
	for(let d of data){
		if(d.getAttribute('id') == 'direct-url'){ this.albumAdd(d.getAttribute('value')) }
	}
	if(album.length){
		hzPanel.loadImg(this.orig, album[0]);
	}else{
		debug('scrape tinypic: no hits');
		hzScrape(this.orig);
	}
}
function hzScrape(url, src){
	if(!src){ src = url }
	xmlr.open('GET', src);
	xmlr.orig = url;
	xmlr.onload = xmlr.scrape;
	xmlr.send();
}

function wheel(e){
	if(album.length > 1){
		e.preventDefault();
		e.stopPropagation();
		if(e.deltaY > 0){ 
			debug('scroll next: '+(albumIndex+1)+'/'+album.length);
			++albumIndex;
			if(albumIndex > album.length - 1){ albumIndex = 0 }
		}else if(e.deltaY < 0){
			debug('scroll prev: '+(albumIndex+1)+'/'+album.length);
			--albumIndex;
			if(albumIndex < 0){ albumIndex = album.length - 1 }
		}
		hzPanel.loadImg(curUrl, album[albumIndex]);
	}
}

var album=[], albumIndex=0, curUrl='', mark, target = document.createElement('a');
function mouseOn(e){
	if(prefs.enabled){
		mark = new Date().getTime();
		curUrl = e.target.toString();
		target.href = curUrl;
		var p = target.hostname.split('.').reverse();
		switch((p[1]+'.'+p[0]).toLowerCase()){
			case 'imgur.com':
				if(prefs.hImgur){
					p = target.pathname.split('/');
					switch(p[1].toLowerCase()){
						case 'a':
							target.href = 'https://api.imgur.com/3/album/'+p[2]+'/images';
							break;
						case 'gallery':
							target.href = 'https://api.imgur.com/3/gallery/'+p[2]+'/images';
							break;
						case 'r': //doesn't seem to work, Imgur API returns bad data...
							target.href = 'https://api.imgur.com/3/gallery/r/'+p[2]+'/'+p[3];
							break;
						default:
							target.href = 'https://api.imgur.com/3/image/'+p.pop().split('.')[0];
					}
					xmlr.open('GET', target.href);
					xmlr.orig = curUrl;
					xmlr.setRequestHeader('Authorization','Client-ID a70d05102a4b4f7');
					xmlr.onload = xmlr.scrapeImgur;
					xmlr.send();
				}
				break;
			case 'redd.it':
			case 'reddit.com':
				if(prefs.hReddit){
					if(p[2] == 'v'){
						xmlr.open('GET', target.href);
						xmlr.orig = curUrl;
						xmlr.onload = xmlr.scrapeVReddit;
						xmlr.send();
					}else{
						xmlr.open('GET', target.href+'.json');
						xmlr.orig = curUrl;
						xmlr.onload = xmlr.scrapeReddit;
						xmlr.send();
					}
				}
				break;
			case 'tinypic.com':
				if(prefs.hTinypic){
					xmlr.open('GET', target.href);
					xmlr.orig = curUrl;
					xmlr.onload = xmlr.scrapeTinypic;
					xmlr.send();
				}
				break;
		}
		if(scrapeList.test(target.hostname)){ hzScrape(target.href) }
		hzPanel.loadImg(target.href);
	}
}
function mouseOff(e){
	clearTimeout(wait);
	xmlr.abort();
	curUrl = '';
	hzPanel.hide();
	album = [];
	albumIndex = 0;
}

var hzPanel, wait;
document.addEventListener('DOMContentLoaded', function(e){
	hzPanel = document.createElement('div');
	hzPanel.id = 'hzPanel';
	hzPanel.show = function(width, height){
		var x=width, y=height, r=window.devicePixelRatio*(prefs.maxSize/100), maxX=window.innerWidth*r, maxY=window.innerHeight*r;
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
		if(album.length > 1){
			var d = document.createElement('div');
			d.appendChild(document.createTextNode((albumIndex+1)+'/'+album.length));
			d.setAttribute('style', prefs.textLoc);
			hzPanel.appendChild(d);
		}
		if(hzPanel.style.display != 'block'){
			debug('hzPanel show: '+x+','+y);
			hzPanel.style.display = 'block';
			document.addEventListener('scroll', mouseOff, false);
			document.addEventListener('wheel', wheel, false);
		}
		if(prefs.addHist > 0){ wait = setTimeout(function(){ port.postMessage({ req:'addHist', url:curUrl })}, prefs.addHist) }
	}
	hzPanel.hide = function(){
		if(hzPanel.style.display != 'none'){
			debug('hzPanel hide');
			hzPanel.style.display = 'none';
			document.removeEventListener('scroll', mouseOff, false);
			document.removeEventListener('wheel', wheel, false);
		}
	}
	hzPanel.loadImg = function(url, src){
		if(!src){ src = url }
		if(/mp4|webm/i.test(src.split('.').pop())){ hzPanel.loadVid(url, src) }
		else{
			debug('img load: '+src);
			hzPanel.img = document.createElement('img');
			hzPanel.img.addEventListener('load', function(){ hzPanel.showImg(url, src) });
			hzPanel.img.src = src;
		}
	}
	hzPanel.showImg = function(url, src){
		if(url == curUrl){
			var x = prefs.delay - (new Date().getTime() - mark);
			if(x > 0){
				wait = setTimeout(function(){ hzPanel.showImg(url, src) }, x);
			}else{
				debug('img show: '+src);
				while(hzPanel.lastChild){ hzPanel.removeChild(hzPanel.lastChild) }
				hzPanel.appendChild(hzPanel.img);
				hzPanel.show(hzPanel.img.naturalWidth, hzPanel.img.naturalHeight);
			}
		}
	}
	hzPanel.loadVid = function(url, src){
		debug('vid load: '+src);
		hzPanel.vid = document.createElement('video');
		hzPanel.vid.addEventListener('canplaythrough', function(){ hzPanel.showVid(url, src) });
		hzPanel.vid.autoplay = true;
		hzPanel.vid.loop = true;
		hzPanel.vid.muted = true;
		hzPanel.vid.src = src;
		hzPanel.vid.load();
	}
	hzPanel.showVid = function(url, src){
		if(url == curUrl){
			var x = prefs.delay - (new Date().getTime() - mark);
			if(x > 0){
				wait = setTimeout(function(){ hzPanel.showVid(url, src) }, x);
			}else{
				debug('vid show: '+src);
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
	var alinks = document.getElementsByTagName('a');
	var x = 0;
	for(let a of alinks){
		if(!a.hzTagged && !/^javascript:/.test(a.href)){
			a.addEventListener('mouseenter', mouseOn, false);
			a.addEventListener('mouseleave', mouseOff, false);
			a.hzTagged = true;
			++x;
		}
	}
	debug('tagged '+x+' links');
}
var domo = new MutationObserver(hzTag);
domo.observe(document.documentElement,{characterData:true,childlist:true,subtree:true});
window.addEventListener('load', hzTag);
