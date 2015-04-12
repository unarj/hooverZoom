var hzCurImg, hzCurUrl = false;
var hzImg = new Image;
	hzImg.onerror = function() { self.port.emit('hide') }
	hzImg.onload = function() {
		if(this.src == hzCurImg) {
			var i = self.options.delay - (new Date().getTime() - hzMark);
			if(i <= 0) {
				var txt = this.src;
				if(hzImgs.length > 0) { txt += " "+(hzImgNum+1)+"/"+hzImgs.length }
				self.port.emit('image', this.src, this.width, this.height, txt);
//				console.log("pageWorker showing: "+this.src);
			} else {
				var cur = this.src;
				setTimeout( function(){ hzImg.src = cur }, i);
//				console.log("pageWorker delaying: "+cur+" for: "+i);
			}
		} else {
			console.log("pageWorker img blocked loading of: "+this.src);
		}
	}
var hzImgNum = 0;
var hzImgs = [];
var hzMark = new Date().getTime();

var t = document.createElement('a');
t.href = document.URL;
//console.log("pageWorker loading: "+t.href)

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
//		delays displaying video create wierdness since there's no "mouseout" call to clear the timer...
		self.port.emit('video', video, width, height);
	}
//	console.log("pageWorker: loading "+video+" ("+width+"x"+height+")");
}

self.port.on('inspect', function(url) {
	if(!url) { self.port.emit('load', 'about:blank') }
	else if(url != hzCurUrl) {
		hzMark = new Date().getTime();	
		var t = document.createElement('a');
		t.href = hzCurUrl = url;
		var p = t.hostname.split('.').reverse();
		switch(p[1]+"."+p[0]) {
			case "gfycat.com":
				win.URL = t.href;
				t.href = '';
				break;
			case "imgflip.com":
				p = t.pathname.split('/');
				if(p.length > 2) {
					p = p[2].split('#');
					t.href = t.protocol+"//i.imgflip.com/"+p[0]+".jpg";
				}
				break;
			case "imgur.com":
				p = t.pathname.split('/');
				if((p[1] == "a") || (p[1] == "gallery")) {
					self.port.emit('load', t.protocol+"//imgur.com/a/"+p[2]+"?gallery");
					t.href = null;
					break;
				} else {
					t.href = t.protocol+"//i.imgur.com/"+p.pop();
				}
				p = t.pathname.split('.');
				if(p.length == 1) { t.href += ".jpg"}
				else switch(p.pop()) {
					case "gif":
						self.port.emit('load', t.href+"v");
						t.href = null;
						break;
					case "gifv":
						self.port.emit('load', t.href);
						t.href = null;
						break;
				}
				break;
			case "livememe.com":
				p = t.pathname.split('.');
				if(p.length == 1) {	t.href = t.protocol+"//i.lvme.me"+p.pop()+".jpg" }
				break;
		}
		if(t.href) { hzImg.src = hzCurImg = t.href }
//		console.log(hzImg.src);
//		document.removeChild(t);
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
	hzImg.src = hzCurImg = hzImgs[hzImgNum];
//	console.log("pageWorker sending: "+hzImgs[hzImgNum]+" ("+(hzImgNum+1)+" of "+hzImgs.length+")");
});

var p = t.hostname.split('.').reverse();
switch(p[1]+"."+p[0]) {
	case "gfycat.com":
		hzLoadVideo();
		break;
	case "imgur.com":
		p = t.pathname.split('.');
		if(p.pop() == "gifv") {
			hzLoadVideo();
		} else {
			var delay = 0;
			var els = document.getElementsByTagName('div');
			for(var i=0, l=els.length; i < l; i++) {
				if(els[i].getAttribute('class') == "image") {
					var img = t.protocol+"//i.imgur.com/"+els[i].getAttribute('id')+".jpg";
					hzImgs.push(img);
					setTimeout( function(){new Image().src = img}, delay)
					delay += 500;
				}
			}
			if(hzImgs.length > 0) {	hzImg.src = hzCurImg = hzImgs[hzImgNum] }
		}
		break;
}
