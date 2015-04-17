var hzImg = new Image();
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
		hzCurWait = setTimeout( function(){ self.port.emit('video', video, width, height) }, self.options.delay)
	}
}

self.port.on('inspect', function(url) {
	clearTimeout(hzCurWait);
	hzImg.src = null;
	if(url) {
		hzMark = new Date().getTime();
		hzTarget.href = url;
		var p = hzTarget.hostname.split('.').reverse();
		switch(p[1]+"."+p[0]) {
			case "gfycat.com":
				p = hzTarget.pathname.split('.')[0];
				self.port.emit('load', hzTarget.protocol+"//gfycat.com/"+p);
				hzTarget.href = null;
				break;
			case "imgflip.com":
				p = hzTarget.pathname.split('/');
				if(p.length > 2) {
					p = p[2].split('#')[0];
					hzTarget.href = hzTarget.protocol+"//i.imgflip.com/"+p+".jpg";
				}
				break;
			case "imgur.com":
				p = hzTarget.pathname.split('/');
				switch(p[1]) {
					case "a":
						// albums seem to need the ?gallery tag to return all image handles, otherwise only get first 10...
						self.port.emit('load', hzTarget.protocol+"//imgur.com/a/"+p[2]+"?gallery");
						hzTarget.href = null;
						break;
					case "gallery":
						// galleries seem to act diferent than albums, can be a single image so /a/ fails...
						self.port.emit('load', hzTarget.protocol+"//imgur.com/gallery/"+p[2]);
						hzTarget.href = null;
						break;
					default:
						// imgur uses lots of different access URLs, trying to normalize them is difficult...
						if(p[p.length-1] == 'new') { p.pop() }
						hzTarget.href = hzTarget.protocol+"//i.imgur.com/"+p.pop().split('?')[0].split('#')[0];
						// if there's no extension we'll guess JPG (safe), if there's a GIF load the MP4 version (much faster/smaller)...
						p = hzTarget.pathname.split('.');
						if(p.length == 1) { hzTarget.href += ".jpg" }
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
				}
				break;
			case "livememe.com":
				p = hzTarget.pathname.split('.');
				if(p.length == 1) { hzTarget.href = hzTarget.protocol+"//i.lvme.me"+p.pop()+".jpg" }
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
	} else if(delta < 0) {
		hzImgNum--;
		if(hzImgNum < 0) { hzImgNum = hzImgs.length-1 }
	}
	hzImg.src = hzImgs[hzImgNum];
//	console.log("pageWorker sending: "+hzImgs[hzImgNum]+" ("+(hzImgNum+1)+" of "+hzImgs.length+")");
});

if(document.URL != 'about:blank') {
	hzTarget.href = document.URL;
//	console.log("pageWorker loading: "+hzTarget.href);
	var p = hzTarget.hostname.split('.').reverse();
	switch(p[1]+"."+p[0]) {
		case "gfycat.com":
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
	if(hzImgs.length > 0) { hzImg.src = hzImgs[hzImgNum] }
}
