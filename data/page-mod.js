var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length; i < l; i++) {
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
	hzLinks[i].addEventListener('mouseleave', hzMouseOff, false);
}
hzFocus = true;
window.addEventListener('blur', function(e){ hzFocus = false; hzMouseOff(null) }, false);
window.addEventListener('focus', function(e){ hzFocus = true }, false);

var hzDiv = document.createElement('div');
hzDiv.id = 'hzDiv';
hzDiv.resize = function(width, height) {
	var x = width;
	var y = height;
	var maxX = document.documentElement.clientWidth * window.devicePixelRatio * (self.options.maxSize / 100);
	var maxY = document.documentElement.clientHeight * window.devicePixelRatio * (self.options.maxSize / 100);
	if((x > maxX) || (y > maxY)) {
		var rX = maxX / x;
		var rY = maxY / y;
		if(rX < rY) {
			x = Math.floor(x * rX);
			y = Math.floor(y * rX);
		} else {
			x = Math.floor(x * rY);
			y = Math.floor(y * rY);
		}
	}
	this.style.width = x+"px";
	this.style.height = y+"px";
	this.style.marginLeft = Math.floor(x / -2)+"px";
	this.style.marginTop = Math.floor(y / -2)+"px";
}
hzDiv.show = function(el) {
	switch(el) {
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
	this.style.display = 'block';
	hzText.set();
	window.addEventListener('scroll', hzMouseOff, false);
	window.addEventListener('wheel', hzWheel, false);
	hzWait = setTimeout( function(){ self.port.emit('visit', hzCurUrl) }, self.options.delay);
}
hzDiv.hide = function() {
	window.removeEventListener('scroll', hzMouseOff, false);
	window.removeEventListener('wheel', hzWheel, false);
	hzDiv.style.display = 'none';
	hzImg.src = null;
	hzVideo.src = null;
}
document.body.appendChild(hzDiv);

var hzImg = document.createElement('img');
hzImg.load = function(url, src) {
	var i = document.createElement('img');
	i.url = url;
	i.addEventListener('load', function(){ hzImg.show(this.url, this.src) });
	i.src = src;
}
hzImg.show = function(url, src) {
	if(url == hzCurUrl) {
		var i = self.options.delay - (new Date().getTime() - hzMark);
		if(i > 0) {
			hzWait = setTimeout( function(){ hzImg.show(url, src) }, i);
		} else {
			this.src = src;
		}
	}
}
hzImg.addEventListener('load', function(){
	hzDiv.show('image');
	hzDiv.resize(this.naturalWidth, this.naturalHeight);
//	console.log("showing img: "+this.src);
});
hzDiv.appendChild(hzImg);

var hzText = document.createElement('div');
hzText.set = function() {
	while(this.firstChild){ this.removeChild(this.firstChild) }
	if(hzAlbumImgs.length > 1) {
		this.appendChild(document.createTextNode((hzAlbumImgIndex+1)+"/"+hzAlbumImgs.length));
	} else {
		this.appendChild(document.createTextNode(""));
	}
}
hzDiv.appendChild(hzText);

var hzVideo = document.createElement('video');
hzVideo.load = function(url, src) {
	var v = document.createElement('video');
	v.url = url;
	v.addEventListener('canplay', function(e){ hzVideo.show(this.url, this.src) });
	v.src = src;
}
hzVideo.show = function(url, vid) {
	if(url == hzCurUrl) {
		var i = self.options.delay - (new Date().getTime() - hzMark);
		if(i > 0) {
			hzWait = setTimeout( function(){ hzVideo.show(url, vid) }, i);
		} else {
			this.src = vid;
		}
	}
}
hzVideo.addEventListener('canplay', function(e){
	hzDiv.show('video');
	hzDiv.resize(this.videoWidth, this.videoHeight);
//	console.log("showing vid: "+this.src);
});
hzVideo.autoplay = true;
hzVideo.loop = true;
hzVideo.muted = true;
hzDiv.appendChild(hzVideo);

function hzWheel(e) {
	if(hzAlbumImgs.length > 1) {
		e.preventDefault();
		e.stopPropagation();
		if(e.deltaY > 0) { 
			++hzAlbumImgIndex;
			if(hzAlbumImgIndex > hzAlbumImgs.length - 1) { hzAlbumImgIndex = 0 }
		} else if(e.deltaY < 0) {
			--hzAlbumImgIndex;
			if(hzAlbumImgIndex < 0) { hzAlbumImgIndex = hzAlbumImgs.length - 1 }
		}
		hzImg.show(hzCurUrl, hzAlbumImgs[hzAlbumImgIndex]);
	}
}

var hzTarget = document.createElement('a');
var hzAlbumImgs, hzAlbumImgIndex, hzCurUrl, hzMark, hzWait;
function hzMouseOn(e) {
	if(hzWait) { if(hzWait.abort) { hzWait.abort() } else { clearTimeout(hzWait) } }
	hzDiv.hide();
	hzCurUrl = '';
	hzAlbumImgs = [];
	if(hzFocus && e) {
		hzMark = new Date().getTime();
		hzCurUrl = e.target.toString();
		hzTarget.href = hzCurUrl;
		var p = hzTarget.pathname.split('.').reverse();
		if(/bmp|jpeg|jpg|png/i.test(p[0])){ hzImg.load(hzCurUrl, hzTarget.href) }
		else if(/mp4|webm/i.test(p[0])){ hzVideo.load(hzCurUrl, hzTarget.href) }
		else {
			p = hzTarget.hostname.split('.').reverse();
			switch(p[1]+"."+p[0]) {
				case 'gfycat.com':
//					self.port.emit('load', hzCurUrl, hzTarget.protocol+"//gfycat.com/"+hzTarget.pathname.split('.')[0]);
					hzTarget.href = hzTarget.protocol+"//gfycat.com/"+hzTarget.pathname.split('.')[0];
					break;
				case 'imgflip.com':
					p = hzTarget.pathname.split('/');
					if(p.length > 2) { hzTarget.href = hzTarget.protocol+"//i.imgflip.com/"+p[2].split('#')[0]+".jpg" }
					break;
				case 'imgur.com':
					var alb = "";
					p = hzTarget.pathname.split('/');
					switch(p[1]) {
						case 'a':
							alb = "https://api.imgur.com/3/album/"+p[2];
						case 'gallery':
							alb = alb || "https://api.imgur.com/3/gallery/"+p[2];
							hzWait = $.ajax({ src:hzCurUrl, url:alb, type:'GET', datatype:'json', beforeSend:function(h){ h.setRequestHeader('Authorization', 'Client-ID f781dcd19302057') },
								success:function(d) {
									var delay = 0;
									if(d['data']['images']) {
										$.each(d['data']['images'], function(i,v){
											var h = hzTarget.protocol+"//i.imgur.com/"+v['id']+".jpg";
											setTimeout( function(){ new Image().src = h }, delay);
											delay += 500;
											hzAlbumImgs.push(h);
										});
									} else if(d['data']['id']) {
										hzAlbumImgs.push(hzTarget.protocol+"//i.imgur.com/"+d['data']['id']+".jpg");
									}
									if(hzAlbumImgs.length > 0) {
										hzImg.load(this.src, hzAlbumImgs[0]);
										hzAlbumImgIndex = 0;
									}
								}
							});
							return;
					}
					hzTarget.href = hzTarget.href.split('?')[0].split(',')[0].split('#')[0];
					if(hzTarget.pathname.split('.').length == 1){ hzTarget.href += ".jpg" }
					if(hzTarget.pathname.split('.').reverse()[0] == 'gif'){ hzTarget.href += "v" }
					hzTarget.href = hzTarget.protocol+"//i.imgur.com/"+hzTarget.pathname.split('/').pop();
//					switch(hzTarget.pathname.split('.').reverse()[0]) {
//						case 'gif':
//							hzTarget.href += "v";
//						case 'gifv':
//							self.port.emit('load', hzCurUrl, hzTarget.href);
//							break;
//						default:
//							hzTarget.href = hzTarget.protocol+"//i.imgur.com/"+hzTarget.pathname.split('/').pop();
//							break;
//					}
					break;
				case 'livememe.com':
					hzTarget.href = hzTarget.protocol+"//i.lvme.me"+hzTarget.pathname+".jpg";
					break;
				case 'craigslist.org':
				case 'deviantart.com':
				case 'gyazo.com';
				case 'explosm.net':
				case 'flic.kr':
				case 'flickr.com':
				case 'gifyoutube.com':
				case 'instagram.com':
				case 'makeameme.org':
				case 'mypixa.com':
				case 'tumblr.com':
				case 'twitter.com':
				case 'vid.me':
				case 'vine.co':
//					self.port.emit('load', hzCurUrl, hzTarget.href);
					break;
			}
			self.port.emit('load', hzCurUrl, hzTarget.href);
			hzImg.load(hzCurUrl, hzTarget.href);
		}
	}
}
function hzMouseOff(e) { hzMouseOn(null) }

self.port.on('image', function(url, imgs){
	hzAlbumImgs = imgs;
	hzAlbumImgIndex = 0;
	hzImg.load(url, hzAlbumImgs[0]);
});

self.port.on('video', hzVideo.load);
