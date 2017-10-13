var prefs = {};
function debug(s){ if(prefs.debug){ console.log('mod: '+s) }}
var port = browser.runtime.connect();
port.onMessage.addListener(function(m){
	if(m.prefs){ 
		prefs = m.prefs;
		debug('prefs loaded');
		if(prefs.scrapeList){ scrapeList = RegExp(prefs.scrapeList.replace(/ /g,'').replace(/,/g,'|')) }
		if(prefs.scrapeListBlock){ scrapeListBlock = RegExp(prefs.scrapeListBlock.replace(/ /g,'').replace(/,/g,'|')) }
		prefs.enabled = true;
		if(prefs.srcBlock){
			if(RegExp(prefs.srcBlock.replace(/ /g,'').replace(/,/g,'|')).test(document.URL)){
				debug('page URL found in block list');
				prefs.enabled = false;
			}
		}
	}
});
port.postMessage({ req:'getPrefs' });

$.ajaxSetup({ cache:false, error:function(r){ debug('ajax error: '+r.responseText) }});

var album=[], albumIndex=0, curUrl='', hzPanel, mark, pageLoad=$.ajax(), scrapeList, scrapeListBlock, srcBlock, wait;

function albumAddImg(i){
	setTimeout(function(){
		var e = document.createElement('img');
		e.src = i;
	}, album.length * 500);
	album.push(i);
}
function albumAddVid(v){
	setTimeout(function(){
		var e = document.createElement('video');
		e.src = v;
	}, album.length * 500);
	album.push(v);
}

function keyPress(e){
	if(prefs.keys){
		if(e.ctrlKey && e.altKey && e.keyCode == 90){
			if(prefs.disabled){
				debug('enabled');
				prefs.enabled = true;
			}else{ 
				debug('disabled');
				prefs.enabled = false;
			}
		}
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

var parser = new DOMParser();
function scrape(u){
	pageLoad = $.ajax({ src:curUrl, url:u,
		success:function(r){
			debug('scrape: '+this.url);
			var m = parser.parseFromString(r,'text/html').getElementsByTagName('meta');
			for(var i=0; i<m.length; ++i){
				if(m[i].getAttribute('property') == 'og:video'){
					var c = m[i].getAttribute('content');
					if(scrapeListBlock.test(c)){ debug('blocked: '+c) }else{ albumAddVid(c) }
				}
			}
			if(album.length){ debug('scrape videos found: '+album.length) }
			else{
				for(var i=0; i<m.length; ++i){
					if(m[i].getAttribute('property') == 'og:image'){
						var c = m[i].getAttribute('content');
						if(scrapeListBlock.test(c)){ debug('blocked: '+c) }else{ albumAddImg(c) }
					}
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
			++albumIndex;
			if(albumIndex > album.length - 1){ albumIndex = 0 }
			debug('scroll next: '+(albumIndex+1)+'/'+album.length);
		}else if(e.deltaY < 0){
			--albumIndex;
			if(albumIndex < 0){ albumIndex = album.length - 1 }
			debug('scroll prev: '+(albumIndex+1)+'/'+album.length);
		}
		hzPanel.loadImg(curUrl, album[albumIndex]);
	}
}

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
		var target = document.createElement('a');
		target.href = curUrl;
		var p = target.pathname.split('.').reverse();
		if(/bmp|jpeg|jpg|mp4|png|webm/i.test(p[0])){ hzPanel.loadImg(curUrl, target.href) }
		else{
			p = target.hostname.split('.').reverse();
			switch((p[1]+'.'+p[0]).toLowerCase()){
				case 'imgflip.com':
					p = target.pathname.split('/');
					if(p.length > 2){ target.href = target.protocol+'//i.imgflip.com/'+p[2].split('#')[0]+'.jpg' }
					break;
				case 'imgur.com':
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
								$.each(r.data, function(i,v){
									if(v.animated){ albumAddVid(v.mp4) }
									else if(v.link){ albumAddImg(v.link) }
								});
							}else{
								if(r.data.animated){ albumAddVid(r.data.mp4) }
								else if(r.data.link){ albumAddImg(r.data.link) }
							}
							if(album.length){ hzPanel.loadImg(this.src, album[0]) }
						}
					});
					return;
				case 'livememe.com':
					target.href = target.protocol+'//i.lvme.me'+target.pathname+'.jpg';
					break;
				case 'redd.it': //doesn't work, reddit API requires Oath2 authorization even for public data.  leaving this stub for future possibilities.
					debug('reddit ajax: '+target.href+'.json');
					pageLoad = $.ajax({ src:curUrl, url:target.href+'.json', beforeSend:function(h){ h.setRequestHeader('Authorization','client_id QCe6ZqwvD5XQFQ') },
						success:function(r){
							console.log(r);
						}
					});
					break;
				case 'sli.mg':
					p = target.pathname.split('/');
					switch(p[1].toLowerCase()){
						case 'a':
							target.href = 'https://api.sli.mg/album/'+p[2];
							break;
						default:
							target.href = 'https://api.sli.mg/media/'+p.pop().split('.')[0];
					}
					debug('sli.mg ajax: '+target.href);
					pageLoad = $.ajax({ src:curUrl, url:target.href, beforeSend:function(h){ h.setRequestHeader('Authorization','Client-ID Q7Wvw23ezLILRB8AMZoXzinLYkLAsFAj') },
						success:function(r){
							debug('ajax success: '+r.status);
							if(r.data.length){
								$.each(r.data, function(i,v){
									if(v.animated){ albumAddVid(v.url_mp4) }
									else if(v.url_direct){ albumAddImg(v.url_direct) }
								});
							}else{
								if(r.data.animated){ albumAddVid(r.data.url_mp4) }
								else if(r.data.url_direct){ albumAddImg(r.data.url_direct) }
							}
							if(album.length){ hzPanel.loadImg(this.src, album[0]) }
						}
					});
					return;
				case 'vidble.com':
					debug('vidble ajax: '+target.href);
					pageLoad = $.ajax({ src:curUrl, url:target.href+'?json=1',
						success:function(r){
							$.each(r.pics, function(i,v){ albumAddImg(v) });
							if(album.length){ hzPanel.loadImg(this.src, album[0]) }
						}
					});
					return;
				default:
					if(scrapeList.test(target.hostname)){ scrape(target.href) }							
			}
			hzPanel.loadImg(curUrl, target.href);
		}
	}
}
function mouseOff(e){ mouseOn(null) }

document.addEventListener('DOMContentLoaded', function(){
	var alinks = document.getElementsByTagName('a');
	debug('found links: '+alinks.length);
	for (var i=0, l=alinks.length; i < l; i++) {
		if(!/^javascript:/.test(alinks[i].href)){
			alinks[i].addEventListener('mouseenter', mouseOn, false);
			alinks[i].addEventListener('mouseleave', mouseOff, false);
		}
	}

	hzPanel = document.createElement('div');
	hzPanel.show = function(width, height){
		var x = width;
		var y = height;
		var r = window.devicePixelRatio * (prefs.maxSize / 100);
		var maxX = window.innerWidth * r;
		var maxY = window.innerHeight * r;
		if((x > maxX) || (y > maxY)){
			var rX = maxX / x;
			var rY = maxY / y;
			if(rX < rY){
				x = Math.floor(x * rX);
				y = Math.floor(y * rX);
			}else{
				x = Math.floor(x * rY);
				y = Math.floor(y * rY);
			}
		}
		if(hzPanel.style.display != 'block'){
			hzPanel.style.display = 'block';
			document.addEventListener('scroll', mouseOff, false);
			document.addEventListener('wheel', wheel, false);
			debug('hzPanel show: '+x+','+y);
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
		if(prefs.addHist > 0){ wait = setTimeout(function(){ port.postMessage({ req:'addHist', url:curUrl })}, prefs.addHist) }
	}
	hzPanel.hide = function(){
		if(hzPanel.style.display != 'none'){
			hzPanel.style.display = 'none';
			document.removeEventListener('scroll', mouseOff, false);
			document.removeEventListener('wheel', wheel, false);
			debug('hzPanel hide');
		}
		album = [];
		hzPanel.vid.src = '';
		hzPanel.img.src = '';
	}
	hzPanel.img = document.createElement('img');
	hzPanel.img.addEventListener('load', function(){ hzPanel.showImg(hzPanel.img.url, hzPanel.img.src) });
	hzPanel.loadImg = function(url, src){
		if(/mp4|webm/i.test(src.split('.').pop())){ hzPanel.loadVid(url, src) }
		else if(hzPanel.img.src != src){
			hzPanel.vid.src = '';
			hzPanel.img.url = url;
			hzPanel.img.src = src;
			debug('img load: '+src);
		}
	}
	hzPanel.showImg = function(url, src){
		if(url == curUrl){
			var x = prefs.delay - (new Date().getTime() - mark);
			if(x > 0){
				wait = setTimeout( function(){ hzPanel.showImg(url, src) }, x);
			}else{
				while(hzPanel.lastChild){ hzPanel.removeChild(hzPanel.lastChild) }
				hzPanel.appendChild(hzPanel.img);
				hzPanel.show(hzPanel.img.naturalWidth, hzPanel.img.naturalHeight);
				debug('img show: '+src);
			}
		}else{
			hzPanel.hide();
		}
	}
	hzPanel.vid = document.createElement('video');
	hzPanel.vid.autoplay = true;
	hzPanel.vid.loop = true;
	hzPanel.vid.muted = true;
	hzPanel.vid.addEventListener('canplaythrough', function(){ hzPanel.showVid(hzPanel.vid.url, hzPanel.vid.src) });
	hzPanel.loadVid = function(url, src){
		if(hzPanel.vid.src != src){
			hzPanel.img.src = '';
			hzPanel.vid.url = url;
			hzPanel.vid.src = src;
			hzPanel.vid.load();
			debug('vid load: '+src);
		}
	}
	hzPanel.showVid = function(url, src){
		if(url == curUrl){
			var x = prefs.delay - (new Date().getTime() - mark);
			if(x > 0){
				wait = setTimeout( function(){ hzPanel.showVid(url, src) }, x);
			}else{
				while(hzPanel.lastChild){ hzPanel.removeChild(hzPanel.lastChild) }
				hzPanel.appendChild(hzPanel.vid);
				hzPanel.show(hzPanel.vid.videoWidth, hzPanel.vid.videoHeight);
				hzPanel.vid.play();
				debug('vid show: '+src);
			}
		}else{
			hzPanel.hide();
		}
	}
	hzPanel.id = 'hzPanel';
	hzPanel.style.width = "100px";
	hzPanel.style.height = "100px";
	document.body.appendChild(hzPanel);
	
	document.addEventListener('keydown', keyPress, false);
});