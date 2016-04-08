var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length; i < l; i++) {
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
	hzLinks[i].addEventListener('mouseleave', hzMouseOff, false);
	//console.log('hook added: '+hzLinks[i]);
}

var hzDiv = document.createElement('div');
hzDiv.resize = function(width, height){
	var x = width;
	var y = height;
	var r = window.devicePixelRatio * (self.options.prefs.maxSize / 100);
	var maxX = document.documentElement.clientWidth * r;
	var maxY = document.documentElement.clientHeight * r;
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
	this.style.width = x+"px";
	this.style.height = y+"px";
	this.style.marginLeft = Math.floor(x / -2)+"px";
	this.style.marginTop = Math.floor(y / -2)+"px";
}
hzDiv.show = function(el){
	switch(el){
		case 'image':
			hzVideo.style.display = 'none';
			hzImg.style.display = 'block';
			break;
		case 'video':
			hzImg.style.display = 'none';
			hzVideo.style.display = 'block';
			break;
		default:
			console.log('panel "show" called with no valid options, oops!');
			return;
	}
	if(this.style.display != 'block'){
		if(self.options.prefs.keys){ window.addEventListener('keydown', hzKey, false) }
		window.addEventListener('scroll', hzMouseOff, false);
		window.addEventListener('wheel', hzWheel, false);
	}
	this.style.display = 'block';
	hzText.set();
	if(self.options.prefs.addHist > 0){
		var url = hzCurUrl;
		hzWait = window.setTimeout(function(){ self.port.emit('visit', url) }, self.options.prefs.addHist);
//		console.log('add to history: '+url);
	}
}
hzDiv.hide = function(){
	hzDiv.style.display = 'none';
	window.removeEventListener('keydown', hzKey, false);
	window.removeEventListener('scroll', hzMouseOff, false);
	window.removeEventListener('wheel', hzWheel, false);
	hzImg.src = null;
	hzVideo.src = null;
	hzAlbumImgs = [];
}
hzDiv.id = 'hzDiv';
hzDiv.style.width = "100px";
hzDiv.style.height = "100px";
document.body.appendChild(hzDiv);

var hzImg = document.createElement('img');
hzImg.load = function(url, src){
	var i = document.createElement('img');
	i.addEventListener('load', function(){ hzImg.show(this.url, this.src) });
	i.url = url;
	i.src = src;
}
hzImg.show = function(url, src){
	if(url == hzCurUrl){
		var i = self.options.prefs.delay - (new Date().getTime() - hzMark);
		if(i > 0) {
			hzWait = window.setTimeout( function(){ hzImg.show(url, src) }, i);
//			console.log("delaying popup: "+i);
		} else if(this.src != src){
			this.src = src;
		}
	}
}
hzImg.addEventListener('load', function(e){
	hzDiv.resize(this.naturalWidth, this.naturalHeight);
	hzDiv.show('image');
});
hzDiv.appendChild(hzImg);

var hzText = document.createElement('div');
hzText.set = function(){
	while(this.firstChild){ this.removeChild(this.firstChild) }
	if(hzAlbumImgs.length > 1){
		this.appendChild(document.createTextNode((hzAlbumImgIndex+1)+"/"+hzAlbumImgs.length));
	}else{
		this.appendChild(document.createTextNode(''));
	}
}
hzText.setAttribute('style', self.options.prefs.textLoc);
hzDiv.appendChild(hzText);

var hzVideo = document.createElement('video');
hzVideo.load = function(url, src){
	var v = document.createElement('video');
	v.addEventListener('canplaythrough', function(){ hzVideo.show(this.url, this.src) });
	v.autoplay = true;
	v.muted = true;
	v.url = url;
	v.src = src;
//	console.log("hzVideo.load: "+src);
}
hzVideo.show = function(url, src){
	if(url == hzCurUrl) {
		var i = self.options.prefs.delay - (new Date().getTime() - hzMark);
		if(i > 0) {
			hzWait = window.setTimeout( function(){ hzVideo.show(url, src) }, i);
//			console.log("delaying popup: "+i);
		} else if(this.src != src){
			this.src = src
//			console.log("hzVideo.show: "+src);
		}
	}
}
hzVideo.addEventListener('canplaythrough', function(e){
	hzDiv.resize(this.videoWidth, this.videoHeight);
	hzDiv.show('video');
//	console.log("hzVideo.canplaythrough");
});
hzVideo.addEventListener('stalled', function(e){
	this.src = this.src;
	console.log('video stalled');
});
hzVideo.addEventListener('waiting', function(e){
	this.src = this.src;
	console.log('video waiting');
});
hzVideo.autoplay = true;
hzVideo.loop = true;
hzVideo.muted = true;
hzDiv.appendChild(hzVideo);

function hzKey(e){
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
function hzWheel(e){
	if(hzAlbumImgs.length > 1){
		e.preventDefault();
		e.stopPropagation();
		if(e.deltaY > 0){ 
			++hzAlbumImgIndex;
			if(hzAlbumImgIndex > hzAlbumImgs.length - 1) { hzAlbumImgIndex = 0 }
		} else if(e.deltaY < 0){
			--hzAlbumImgIndex;
			if(hzAlbumImgIndex < 0){ hzAlbumImgIndex = hzAlbumImgs.length - 1 }
		}
		hzImg.show(hzCurUrl, hzAlbumImgs[hzAlbumImgIndex]);
	}
}

var hzAlbumImgs = [];
var hzAlbumImgIndex = 0;
var hzCurUrl = '';
var hzLoad = $.ajax();
var hzMark, hzWait;
function hzMouseOn(e){
	clearTimeout(hzWait);
	hzLoad.abort();
	hzCurUrl = null;
	hzDiv.hide();
	if(e){
		hzMark = new Date().getTime();
		hzCurUrl = e.target.toString();
		var hzTarget = document.createElement('a');
		hzTarget.href = hzCurUrl;
		var p = hzTarget.pathname.split('.').reverse();
		if(/bmp|jpeg|jpg|png/i.test(p[0])){ hzImg.load(hzCurUrl, hzTarget.href) }
		else if(/mp4|webm/i.test(p[0])){ hzVideo.load(hzCurUrl, hzTarget.href) }
		else{
			p = hzTarget.hostname.split('.').reverse();
			switch((p[1]+"."+p[0]).toLowerCase()){
				case 'gfycat.com':
					self.port.emit('load', hzCurUrl, hzTarget.protocol+"//gfycat.com/"+hzTarget.pathname.split('.')[0]);
					break;
				case 'imgflip.com':
					p = hzTarget.pathname.split('/');
					if(p.length > 2){ hzTarget.href = hzTarget.protocol+"//i.imgflip.com/"+p[2].split('#')[0]+".jpg" }
					break;
				case 'imgur.com':
					var alb = "";
	 				p = hzTarget.pathname.split('/');
					switch(p[1].toLowerCase()){
						case 'a':
							alb = "https://api.imgur.com/3/album/"+p[2]
						case 'gallery':
							alb = alb || "https://api.imgur.com/3/gallery/"+p[2]
							hzLoad = $.ajax({ src:hzCurUrl, url:alb, type:'GET', datatype:'json', beforeSend:function(h){ h.setRequestHeader('Authorization', 'Client-ID f781dcd19302057') },
								success:function(d){
									var i = 0;
									if(d['data']['images']){
										$.each(d['data']['images'], function(i,v){
											window.setTimeout( function(){ new Image().src = v['link'] }, i);
											i += 1000;
											hzAlbumImgs.push(v['link']);
										});
									} else if(d['data']['link']){
										hzAlbumImgs.push(d['data']['link']);
									}
									if(hzAlbumImgs.length > 0){
										hzImg.load(this.src, hzAlbumImgs[0]);
										hzAlbumImgIndex = 0;
									}
								}
							});
							return;
					}
					hzTarget.pathname = hzTarget.pathname.split('/').pop();
					hzTarget.href = hzTarget.href.split('?')[0].split(',')[0].split('#')[0];
					if(hzTarget.pathname.split('.').length == 1){ hzTarget.href += ".jpg" }
					switch(hzTarget.pathname.split('.').reverse()[0].toLowerCase()) {
						case 'gif':
							hzTarget.href += "v";
						case 'gifv':
							self.port.emit('load', hzCurUrl, hzTarget.href);
							break;
					}
					break;
				case 'livememe.com':
					hzTarget.href = hzTarget.protocol+"//i.lvme.me"+hzTarget.pathname+".jpg";
					break;
				case 'vidble.com':
					hzLoad = $.ajax({ src:hzCurUrl, url:hzTarget.href+'?json=1', type:'GET', datatype:'json',
						success:function(d){
							var i = 0;
							$.each(d['pics'], function(i,v){
								window.setTimeout( function(){ new Image().src = v }, i);
								i += 1000;
								hzAlbumImgs.push(v);
							});
							if(hzAlbumImgs.length > 0) {
								hzImg.load(this.src, hzAlbumImgs[0]);
								hzAlbumImgIndex = 0;
							}
						}
					});
					return;
				case '500px.com':
				case 'artstation.com':
				case 'craigslist.org':
				case 'deviantart.com':
				case 'explosm.net':
				case 'facebook.com':
				case 'flic.kr':
				case 'flickr.com':
				case 'gifyoutube.com':
				case 'gyazo.com':
				case 'instagram.com':
				case 'makeameme.org':
				case 'mypixa.com':
//				case 'pinterest.com':
				case 'swirl.xyz':
				case 'tumblr.com':
				case 'twitter.com':
				case 'vid.me':
				case 'vine.co':
					self.port.emit('load', hzCurUrl, hzTarget.href);
					break;
			}
			hzImg.load(hzCurUrl, hzTarget.href);
//			console.log(hzTarget.href);
		}
	}
}
function hzMouseOff(e){ hzMouseOn(null) }

self.port.on('image', function(url, imgs){
	hzAlbumImgs = imgs;
	hzAlbumImgIndex = 0;
	hzImg.load(url, hzAlbumImgs[0]);
//	console.log("loading image: " + url);
});

self.port.on('video', function(url, vid){
	hzVideo.load(url, vid);
//	console.log("loading video: " + url);
});