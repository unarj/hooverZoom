var hzTarget = document.createElement('a');

var hzDiv = document.createElement('div');
hzDiv.id = "hzDiv"
hzDiv.setSize = function(width, height) {
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
var hzImg = document.createElement('img');
hzImg.onload = function() {
	hzDiv.setSize(this.naturalWidth, this.naturalHeight);
	hzText.set();
}
hzDiv.appendChild(hzImg);
var hzText = document.createElement('div');
hzText.set = function() {
	while(this.firstChild) { this.removeChild(this.firstChild) }
	if(hzAlbumImgs.length > 1) {
		this.appendChild(document.createTextNode((hzAlbumImgIndex+1)+"/"+hzAlbumImgs.length));
	} else {
		this.appendChild(document.createTextNode(""));
	}
}
hzDiv.appendChild(hzText);
var hzVideo = document.createElement('video');
hzVideo.show = function(url, vid) {
	if(url == hzCurUrl) {
		var i = self.options.delay - (new Date().getTime() - hzMark);
		if(i > 0) {
			hzWait = setTimeout( function(){ hzVideo.show(url, vid) }, i);
		} else {
			hzImg.style.display = 'none';
			hzVideo.style.display = 'inline';
			hzDiv.style.display = 'inline';
			hzText.set();
			hzDiv.setSize(vid.width*1.6, vid.height*1.6);
			hzVideo.src = vid.src;
			self.port.emit('visit', hzCurUrl);
		}
	}
}
hzVideo.autoplay = true;
hzVideo.loop = true;
hzVideo.muted = true;
hzDiv.appendChild(hzVideo);
document.body.appendChild(hzDiv);

var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length; i < l; i++) {
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
	hzLinks[i].addEventListener('mouseleave', hzMouseOff, false);
}
window.addEventListener('scroll', function(e){ hzMouseOff(null) }, false);
window.addEventListener('wheel', hzWheel, false);

var hzWait;
function hzLoadImg(url, src) {
	var img = new Image();
	img.url = url;
	img.onload = function() {
		if(this.url == hzCurUrl) {
			var i = self.options.delay - (new Date().getTime() - hzMark);
			if(i > 0) {
				hzWait = setTimeout( function(){ hzLoadImg(url,src) }, i);
			} else {
				hzImg.src = this.src;
				hzVideo.style.display = 'none';
				hzImg.style.display = 'inline';
				hzDiv.style.display = 'inline';
				self.port.emit('visit', this.url);
			}
		}
	}
	img.src = src;
}

var hzAlbumImgs = [];
var hzAlbumImgIndex;
function hzLoadAlbum(d) {
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
	if(hzAlbumImgs) {
		hzLoadImg(hzCurUrl, hzAlbumImgs[0]);
		hzAlbumImgIndex = 0;
	}
}
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
		hzImg.src = hzAlbumImgs[hzAlbumImgIndex];
	}
}

var hzCurUrl, hzMark;
function hzMouseOn(e) {
	clearTimeout(hzWait);
	if(e && e.target) {
		hzMark = new Date().getTime();
		hzTarget.href = e.target.toString();
		hzCurUrl = hzTarget.href;
		var p = hzTarget.hostname.split('.').reverse();
		switch(p[1]) {
			case 'deviantart':
				self.port.emit('load', hzCurUrl, hzTarget.href);
				break;
			case 'flickr':
				self.port.emit('load', hzCurUrl, hzTarget.href);
				break;
			case 'gfycat':
				self.port.emit('load', hzCurUrl, hzTarget.protocol+"//gfycat.com/"+hzTarget.pathname.split('.')[0]);
				break;
			case 'imgflip':
				p = hzTarget.pathname.split('/');
				if(p.length > 2) { hzTarget.href = hzTarget.protocol+"//i.imgflip.com/"+p[2].split('#')[0]+".jpg" }
				break;
			case 'imgur':
				var alb = "";
				hzTarget.href = hzTarget.href.split('?')[0].split('#')[0].split(',')[0];
				p = hzTarget.pathname.split('/');
				switch(p[1]) {
					case 'a':
						alb = "https://api.imgur.com/3/album/"+p[2];
					case 'gallery':
						alb = alb || "https://api.imgur.com/3/gallery/"+p[2];
						hzCurWait = $.ajax({ url:alb, type:'GET', datatype:'json', success:hzLoadAlbum, beforeSend:function(h){ h.setRequestHeader('Authorization', 'Client-ID f781dcd19302057') } });
						break;
					default:
						if(hzTarget.pathname.split('.').length == 1) { hzTarget.href += ".jpg" }
						switch(hzTarget.pathname.split('.').reverse()[0]) {
							case 'gif':
								hzTarget.href += "v";
							case 'gifv':
								self.port.emit('load', hzCurUrl, hzTarget.href);
								break;
							default:
								hzTarget.href = hzTarget.protocol+"//i.imgur.com/"+hzTarget.pathname.split('/').pop();
						}
				}
				break;
			case 'instagram':
				self.port.emit('load', hzCurUrl, hzTarget.href);
				break;
			case 'livememe':
				p = hzTarget.pathname.split('.');
				if(p.length == 1) { hzTarget.href = hzTarget.protocol+"//i.lvme.me"+p.pop()+".jpg" }
				break;
		}
		if(hzTarget.href) { hzLoadImg(hzCurUrl, hzTarget.href) }
	} else {
		hzCurUrl = '';
		hzDiv.style.display = 'none';
		hzAlbumImgs = [];
		self.port.emit('load', '', 'about:blank');
	}
}
function hzMouseOff(e) { hzMouseOn(null) }

self.port.on('image', function(url, imgs){
	hzAlbumImgs = imgs;
	hzAlbumImgIndex = 0;
	hzLoadImg(url, hzAlbumImgs[0]);
});

self.port.on('video', function(url, vid){ hzVideo.show(url, vid) });
