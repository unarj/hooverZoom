var hzImg = new Image;
	hzImg.onerror = function() { self.port.emit('hide') }
	hzImg.onload = function() {
		var i = self.options.delay - (new Date().getTime() - hzMark);
		if(i <= 0) {
			var txt = "";
			if(hzImgs.length > 0) {
				txt += " "+(hzImgNum+1)+"/"+hzImgs.length;
				self.port.emit('album', true);
			}
			self.port.emit('image', this.src, this.width, this.height, txt);
		} else {
			var cur = this.src;
			hzCurWait = setTimeout( function(){ hzImg.src = cur }, i);
		}
	}

var hzCurWait = false;
var hzImgNum = 0;
var hzImgs = [];
var hzMark = new Date().getTime();
var hzTarget = document.createElement('a');

function hzLoadVideo() {
	var els = document.getElementsByTagName('meta');		
	for(var i=0, l=els.length; i < l; i++) {
		switch(els[i].getAttribute('property')) {
			case "og:video":
				if(els[i].getAttribute('content').split('.').pop() == "mp4") { var video = els[i].getAttribute('content') }
				break;
			case "og:video:width":
				var width = els[i].getAttribute('content');
				break;
			case "og:video:height":
				var height = els[i].getAttribute('content');
				break;					
		}
	}
	if(video && width && height) {
		hzCurWait = setTimeout( function(){ self.port.emit('video', video, width, height) }, self.options.delay);
	}
}

self.port.on('inspect', function(url) {
	clearTimeout(hzCurWait);
	if(url) {
		hzMark = new Date().getTime();
		hzImgNum = 0;
		hzImgs = [];
		hzTarget.href = url;
		var p = hzTarget.hostname.split('.').reverse();
		switch(p[1]+"."+p[0]) {
			case "gfycahzTarget.com":
				self.port.emit('load', hzTarget.href);
				hzTarget.href = null;
				break;
			case "imgflip.com":
				p = hzTarget.pathname.split('/');
				if(p.length > 2) {
					p = p[2].split('#');
					hzTarget.href = hzTarget.protocol+"//i.imgflip.com/"+p[0]+".jpg";
				}
				break;
			case "imgur.com":
				hzTarget.pathname = hzTarget.pathname.split('#')[0];
				p = hzTarget.pathname.split('/');
				if((p[1] == "a") || (p[1] == "gallery")) {
					self.port.emit('load', hzTarget.protocol+"//imgur.com/a/"+p[2]+"?gallery");
					hzTarget.href = null;
					break;
				} else {
					hzTarget.href = hzTarget.protocol+"//i.imgur.com/"+p.pop();
				}
				p = hzTarget.pathname.split('.');
				if(p.length == 1) { hzTarget.href += ".jpg"}
				else switch(p.pop()) {
					case "gif":
						self.port.emit('load', hzTarget.href+"v");
						hzTarget.href = null;
						break;
					case "gifv":
						self.port.emit('load', hzTarget.href);
						hzTarget.href = null;
						break;
				}
				break;
			case "livememe.com":
				p = hzTarget.pathname.split('.');
				if(p.length == 1) {	hzTarget.href = hzTarget.protocol+"//i.lvme.me"+p.pop()+".jpg" }
				break;
		}
		if(hzTarget.href) { hzImg.src = hzTarget.href }
//		console.log(hzImg.src);
	} else {
		self.port.emit('load', 'about:blank');
	}
});

self.port.on('wheel', function(delta) {
	if(delta > 0) {
		hzImgNum++;
		if(hzImgNum > hzImgs.length-1) { hzImgNum = 0 }
	} else {
		hzImgNum--;
		if(hzImgNum < 0) { hzImgNum = hzImgs.length-1 }
	}
	hzImg.src = hzImgs[hzImgNum];
//	console.log("pageWorker sending: "+hzImgs[hzImgNum]+" ("+(hzImgNum+1)+" of "+hzImgs.length+")");
});

if(document.URL != 'about:blank') {
	hzTarget.href = document.URL;
	console.log("pageWorker loading: "+hzTarget.href);
	var p = hzTarget.hostname.split('.').reverse();
	switch(p[1]+"."+p[0]) {
		case "gfycahzTarget.com":
			hzLoadVideo();
			break;
		case "imgur.com":
			p = hzTarget.pathname.split('.');
			if(p.pop() == "gifv") {
				hzLoadVideo();
			} else {
				var delay = 0;
				var els = document.getElementsByTagName('div');
				for(var i=0, l=els.length; i < l; i++) {
					if(els[i].getAttribute('class') == "image" || els[i].getAttribute('class') == "post") {
						var img = hzTarget.protocol+"//i.imgur.com/"+els[i].getAttribute('id')+".jpg";
						hzImgs.push(img);
						setTimeout( function(){ new Image().src = img }, delay);
						delay += 500;
					}
				}
			}
			break;
	}
	if(hzImgs.length > 0) { console.log(hzImgs.length); hzImg.src = hzImgs[hzImgNum] }
} else {
	self.port.emit('hide');
}