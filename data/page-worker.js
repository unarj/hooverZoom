var hzImg = new Image();
//hzImg.onerror = function() { console.log("pageWorker error loading: "+this.src); self.port.emit('hide') }
hzImg.onload = function() {
//	console.log("this: "+this.curUrl+" - that: "+hzCurUrl);
	if(this.curUrl = hzCurUrl) {
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
	} else {
		this.src = "";
		hzImgNum = 0;
		hzImgs = [];
	}
}

var hzCurUrl, hzCurWait = false;
var hzImgNum = 0;
var hzImgs = [];
var hzMark = new Date().getTime();
var hzTarget = document.createElement('a');

function hzLoadAlbum(d) {
	var delay = 0;
	if(d['data']['images']) {
		$.each(d['data']['images'], function(i,v){
			var i = hzTarget.protocol+"//i.imgur.com/"+v['id']+".jpg";
			hzImgs.push(i);
			setTimeout( function(){ new Image().src = i }, delay);
			delay += 500;
		});
	} else if(d['data']['id']) {
		hzImg.src = hzTarget.protocol+"//i.imgur.com/"+d['data']['id']+".jpg";
	}
	if(hzImgs.length > 0) { hzImg.src = hzImgs[hzImgNum] }
}

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
	hzCurUrl = url;
	hzImg.src = "";
//	hzImg.curUrl = url;
	if(url) {
		hzMark = new Date().getTime();
		hzTarget.href = url;
		var p = hzTarget.hostname.split('.').reverse();
		switch(p[1]+"."+p[0]) {
			case "gfycat.com":
				p = hzTarget.pathname.split('.')[0];
				self.port.emit('load', hzTarget.protocol+"//gfycat.com/"+p);
				hzTarget.href = "";
				break;
			case "imgflip.com":
				p = hzTarget.pathname.split('/');
				if(p.length > 2) {
					p = p[2].split('#')[0];
					hzTarget.href = hzTarget.protocol+"//i.imgflip.com/"+p+".jpg";
				}
				break;
			case "imgur.com":
				var alb = "";
				hzTarget.href = hzTarget.href.split('?')[0].split('#')[0].split(',')[0];
				p = hzTarget.pathname.split('/');
				switch(p[1]) {
					case "a":
						alb = "https://api.imgur.com/3/album/"+p[2];
					case "gallery":
						alb = alb || "https://api.imgur.com/3/gallery/"+p[2];
//						console.log("loading: "+alb);
						$.ajax({
							url: alb,
							type: 'GET',
							datatype: 'json',
							success: hzLoadAlbum,
							beforeSend: function(h){ h.setRequestHeader('Authorization', 'Client-ID f781dcd19302057') }
						});
						hzTarget.href = "";
						break;
					default:
						if(p[p.length-1] == 'new') { p.pop() }
						hzTarget.pathname.split('/')
						p = hzTarget.pathname.split('.');
						if(p.length == 1) { hzTarget.href += ".jpg" }
						else switch(p.pop()) {
							case "gif":
								self.port.emit('load', hzTarget.href+"v");
								hzTarget.href = "";
								break;
							case "gifv":
								self.port.emit('load', hzTarget.href);
								hzTarget.href = "";
								break;
						}
						hzTarget.href = hzTarget.protocol+"//i.imgur.com/"+hzTarget.pathname.split('/').pop();
						console.log(hzTarget.href);
				}
				break;
			case "livememe.com":
				p = hzTarget.pathname.split('.');
				if(p.length == 1) { hzTarget.href = hzTarget.protocol+"//i.lvme.me"+p.pop()+".jpg" }
				break;
		}
		if(hzTarget.href) {
			hzImg.src = hzTarget.href;
			hzImg.curUrl = url;
		}
//		console.log("img.src: "+hzImg.curUrl+" - curimg: "+hzCurUrl);
	} else {
		hzImgNum = 0;
		hzImgs = [];
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
			if(p.pop() == "gifv") { hzLoadVideo() }
// shouldn't need this anymore, loading through API now...
//			else {
//				var delay = 0;
//				var els = document.getElementsByTagName('div');
//				for(var i=0, l=els.length; i < l; i++) {
//					if(els[i].getAttribute('class') == "image" || els[i].getAttribute('class') == "post") {
//						var img = hzTarget.protocol+"//i.imgur.com/"+els[i].getAttribute('id')+".jpg";
//						hzImgs.push(img);
//						setTimeout( function(){ new Image().src = img }, delay);
//						delay += 500;
//					}
//				}
//				if(hzImgs.length > 0) { hzImg.src = hzImgs[hzImgNum] }
//			}
			break;
	}
}
