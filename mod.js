function debug(s){ if(prefs.debug){ console.log('mod: '+s) }}
const port = browser.runtime.connect();
port.onMessage.addListener(function(m){
	if(m.prefs){ 
		prefs = m.prefs;
		debug('prefs loaded');
		if(prefs.scrapeList){ scrapeList = RegExp(prefs.scrapeList.replace(/ /g,'').replace(/,/g,'|')) }
		if(prefs.scrapeListBlock){ scrapeListBlock = RegExp(prefs.scrapeListBlock.replace(/ /g,'').replace(/,/g,'|')) }
		prefs.enabled = true;
		if(prefs.srcBlock){
			if(RegExp(prefs.srcBlock.replace(/ /g,'').replace(/,/g,'|')).test(location.hostname)){
				debug('page URL found in block list');
				prefs.enabled = false;
			}
		}
	}
});
port.postMessage({ req:'getPrefs' });

$.ajaxSetup({ cache:false, error:function(r){ debug('ajax error: '+r.responseText) }});

var album=[], albumIndex=0, curUrl='', hzPanel, mark, pageLoad=$.ajax(), prefs = {}, scrapeList, scrapeListBlock, srcBlock, wait;

function albumAddImg(i){
	if(scrapeListBlock.test(i)){ 
		debug('blocked: '+i);
	}else{
		setTimeout(function(){
			var e = document.createElement('img');
			e.src = i;
		}, album.length * 500);
		album.push(i);
	}
}
function albumAddVid(v){
	if(scrapeListBlock.test(v)){ 
		debug('blocked: '+v);
	}else{
		setTimeout(function(){
			var e = document.createElement('video');
			e.src = v;
		}, album.length * 500);
		album.push(v);
	}
}

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

var parser = new DOMParser();
function scrape(u){
	pageLoad = $.ajax({ src:curUrl, url:u,
		success:function(r){
			debug('scrape: '+this.url);
			var m = parser.parseFromString(r,'text/html').getElementsByTagName('meta');
			var j = m.length;
			for(var i=0; i<j; ++i){
				if(m[i].getAttribute('property') == 'og:video'){ albumAddVid(m[i].getAttribute('content')) }
			}
			if(album.length){ debug('scrape videos found: '+album.length) }
			else{
				for(var i=0; i<j; ++i){
					if(m[i].getAttribute('property') == 'og:image'){ albumAddImg(m[i].getAttribute('content')) }
				}
				if(album.length){ debug('scrape images found: '+album.length) }
			}
			if(album.length){ hzPanel.loadImg(this.src, album[0]) }
		}
	});
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

var target = document.createElement('a');
function mouseOn(e){
	clearTimeout(wait);
	pageLoad.abort();
	curUrl = '';
	hzPanel.hide();
	album = [];
	albumIndex = 0;
	if(e && prefs.enabled){
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
						default:
							target.href = 'https://api.imgur.com/3/image/'+p.pop().split('.')[0];
					}
					debug('imgur ajax: '+target.href);
					pageLoad = $.ajax({ src:curUrl, url:target.href, beforeSend:function(h){ h.setRequestHeader('Authorization','Client-ID 7353f63c8f28d05') },
						success:function(r){
							if(r.data.length){
								for(var i=0; i<r.data.length; ++i){
									if(r.data[i].animated){ albumAddVid(r.data[i].mp4) }
									else if(r.data[i].link){ albumAddImg(r.data[i].link) }
								}
							}else{
								if(r.data.animated){ albumAddVid(r.data.mp4) }
								else if(r.data.link){ albumAddImg(r.data.link) }
							}
							if(album.length){ hzPanel.loadImg(this.src, album[0]) }
						}
					});
					return;
				}
				break;
			case 'redd.it': //doesn't work, reddit API requires Oath2 authorization even for public data.  leaving this stub for future possibilities.
				debug('reddit ajax: '+target.href+'.json');
				pageLoad = $.ajax({ src:curUrl, url:target.href+'.json', beforeSend:function(h){ h.setRequestHeader('Authorization','client_id QCe6ZqwvD5XQFQ') },
					success:function(r){
//							console.log(r);
					}
				});
				break;
		}
		if(scrapeList.test(target.hostname)){ scrape(target.href) }							
		hzPanel.loadImg(curUrl, target.href);
	}
}
function mouseOff(e){ mouseOn() }

document.addEventListener('DOMContentLoaded', function(){
	var alinks = document.getElementsByTagName('a');
	debug('found links: '+alinks.length);
	for(var i=0; i<alinks.length; ++i){
		if(!/^javascript:/.test(alinks[i].href)){
			alinks[i].addEventListener('mouseenter', mouseOn, false);
			alinks[i].addEventListener('mouseleave', mouseOff, false);
		}
	}

	hzPanel = document.createElement('div');
	hzPanel.id = 'hzPanel';
	hzPanel.show = function(width, height){
		var x=width, y=height;
		const r=window.devicePixelRatio*(prefs.maxSize/100), maxX=window.innerWidth*r, maxY=window.innerHeight*r;
		if((x > maxX) || (y > maxY)){
			var rX = maxX / x, rY = maxY / y;
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