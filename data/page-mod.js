var hzAlbumImgIndex, hzMark, hzWait, hzWindowSize = false;
var hzTarget = document.createElement('a');
var hzDiv = document.createElement('div');
hzDiv.id = "hzDiv"
var hzImg = document.createElement('img');
hzImg.id = "hzImg";
hzImg.onload = function() {
//	if(this.curUrl == hzTarget.href) {
		var i = self.options.delay - (new Date().getTime() - hzMark);
		if(i <= 0) {
			this.width = this.naturalWidth;
			this.height = this.naturalHeight;
			maxX = document.documentElement.clientWidth * window.devicePixelRatio * (self.options.maxSize / 100);
			maxY = document.documentElement.clientHeight * window.devicePixelRatio * (self.options.maxSize / 100);
			if((this.width > maxX) || (this.height > maxY)) {
				var rX = maxX / this.width;
				var rY = maxY / this.height;
				if(rX < rY) {
					this.width = Math.floor(this.width * rX);
					this.height = Math.floor(this.height * rX);
				} else {
					this.width = Math.floor(this.width * rY);
					this.height = Math.floor(this.height * rY);
				}
			}
			this.style.marginLeft = Math.floor(this.width / -2)+"px";
			this.style.marginTop = Math.floor(this.height / -2)+"px";
			while(hzImgText.firstChild) { hzImgText.removeChild(hzImgText.firstChild) }
			if(hzAlbumImgs.length > 1) {
				hzImgText.appendChild(document.createTextNode((hzAlbumImgIndex+1)+"/"+hzAlbumImgs.length));
			} else {
				hzImgText.appendChild(document.createTextNode("!!TEST!!"));
			}
	//		console.log("showing: "+this.src+" "+this.width+","+this.height);
			hzDiv.style.display = 'block';
			self.port.emit('visit', this.curUrl);
		} else {
			var cur = this.src;
			hzWait = setTimeout( function(){ hzImg.src = cur }, i);
		}
//	}
}
hzDiv.appendChild(hzImg);
var hzImgText = document.createElement('div');
hzImgText.id = "hzImgText";
hzDiv.appendChild(hzImgText);
var hzVideo = document.createElement('video');
hzVideo.id = "hzVideo";
hzDiv.appendChild(hzVideo);
document.body.appendChild(hzDiv);

var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length; i < l; i++) {
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
	hzLinks[i].addEventListener('mouseleave', hzMouseOff, false);
}
window.addEventListener('scroll', function(e){ hzMouseOff(null) }, false);
window.addEventListener('wheel', hzWheel, false);

var hzAlbumImgs = [];
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
		hzImg.src = hzAlbumImgs[0];
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

function hzMouseOn(e) {
	hzMark = new Date().getTime();
	clearTimeout(hzWait);
	hzTarget.href = e.target.toString();
	hzCurUrl = hzTarget.href;
	if(hzTarget.href) {
		hzImg.curUrl = hzTarget.href;
		var p = hzTarget.hostname.split('.').reverse();
		switch(p[1]) {
			case 'deviantart':
				self.port.emit('load', hzImg.curUrl, hzTarget.href);
				break;
			case 'gfycat':
				self.port.emit('load', hzImg.curUrl, hzTarget.protocol+"//gfycat.com/"+hzTarget.pathname.split('.')[0]);
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
								hzTarget.href = hzTarget.href+"v";
							case 'gifv':
								self.port.emit('load', hzImg.curUrl, hzTarget.href);
								break;
							default:
								hzTarget.href = hzTarget.protocol+"//i.imgur.com/"+hzTarget.pathname.split('/').pop();
						}
				}
				break;
			case 'instagram':
				self.port.emit('load', hzImg.curUrl, hzTarget.href);
				break;
			case 'livememe':
				p = hzTarget.pathname.split('.');
				if(p.length == 1) { hzTarget.href = hzTarget.protocol+"//i.lvme.me"+p.pop()+".jpg" }
				break;
		}
	}
	if(hzTarget.href) {
		hzImg.src = hzTarget.href;
		hzImg.curSrc = hzTarget.href;
	}
//	console.log("img.src: "+hzImg.curUrl+" - curimg: "+hzCurUrl);
}

function hzMouseOff(e) {
	clearTimeout(hzWait);
	hzDiv.style.display = 'none';
	hzImg.src = null;
	hzImg.curUrl = "";
	hzTarget.href = false;
	hzAlbumImgs = [];
	self.port.emit('load', 'about:blank');
}

