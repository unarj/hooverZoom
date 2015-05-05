var hzCurWait = false;
var hzImgNum = 0;
var hzImgs = [];
var hzMark = new Date().getTime();
var hzTarget = document.createElement('a');
var hzImg = new Image();
hzImg.onload = function() {
	var i = self.options.delay - (new Date().getTime() - hzMark);
	if(i <= 0) {
		var txt = "";
		if(hzImgs.length > 0) {
			txt += " "+(hzImgNum+1)+"/"+hzImgs.length;
			self.port.emit('album', true);
		}
		self.port.emit('image', this.src, this.curUrl, this.width, this.height, txt);
	} else {
		var cur = this.src;
		hzCurWait = setTimeout( function(){ hzImg.src = cur }, i);
	}
}
hzImg.curUrl = false;

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
		hzImg.src = hzCurImg = hzTarget.protocol+"//i.imgur.com/"+d['data']['id']+".jpg";
	}
	if(hzImgs.length > 0) {	hzImg.src = hzImgs[hzImgNum] }
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
//		console.log("pageworker video: "+video+" ("+hzCurUrl+") "+width+","+height);
		hzCurWait = setTimeout( function(){ self.port.emit('video', video, width, height, "") }, self.options.delay)
	}
}

self.port.on('inspect', function(url) {
	clearTimeout(hzCurWait);
	hzMark = new Date().getTime();
	hzImg.curUrl = url;
	hzImg.src = null;
	hzImgNum = 0;
	hzImgs = [];
	if(url) {
		hzTarget.href = url;
		var p = hzTarget.hostname.split('.').reverse();
// loading an image URL is handled different than others...
		if((/\.(bmp|gif|jpg|jpeg|tiff|png)$/i).test(hzTarget.pathname)) {
			switch(p[1]) {
				case "imgur":
					hzTarget.href = hzTarget.href.split('?')[0].split('#')[0].split(',')[0];
					switch(hzTarget.pathname.split('.').reverse()[0]) {
						case "gif":
							self.port.emit('load', url, hzTarget.href+"v");
							hzTarget.href = null;
							break;
					}
			}
		} else {
			switch(p[1]) {
				case "deviantart":
					self.port.emit('load', url, hzTarget.href);
					hzTarget.href = null;
					break;
				case "gfycat":
					self.port.emit('load', url, hzTarget.protocol+"//gfycat.com/"+hzTarget.pathname.split('.')[0]);
					hzTarget.href = null;
					break;
				case "imgflip":
					p = hzTarget.pathname.split('/');
					if(p.length > 2) {
						hzTarget.href = hzTarget.protocol+"//i.imgflip.com/"+p[2].split('#')[0]+".jpg";
					}
					break;
				case "imgur":
					var alb = "";
					hzTarget.href = hzTarget.href.split('?')[0].split('#')[0].split(',')[0];
					p = hzTarget.pathname.split('/');
					switch(p[1]) {
						case "a":
							alb = "https://api.imgur.com/3/album/"+p[2];
						case "gallery":
							alb = alb || "https://api.imgur.com/3/gallery/"+p[2];
							hzCurWait = $.ajax({
								url: alb, type: 'GET', datatype: 'json',
								success: hzLoadAlbum,
								beforeSend: function(h){ h.setRequestHeader('Authorization', 'Client-ID f781dcd19302057') }
							});
							hzTarget.href = null;
							break;
						default:
							if(hzTarget.pathname.split('.').length == 1) { hzTarget.href += ".jpg" }
							switch(hzTarget.pathname.split('.').reverse()[0]) {
								case "gifv":
									self.port.emit('load', url, hzTarget.href);
									hzTarget.href = null;
									break;
								default:
									hzTarget.href = hzTarget.protocol+"//i.imgur.com/"+hzTarget.pathname.split('/').pop();
							}
					}
					break;
				case "instagram":
					self.port.emit('load', url, hzTarget.href);
					hzTarget.href = null;
					break;
				case "livememe":
					p = hzTarget.pathname.split('.');
					if(p.length == 1) { hzTarget.href = hzTarget.protocol+"//i.lvme.me"+p.pop()+".jpg" }
					break;
			}
		}
		if(hzTarget.href) { hzImg.src = hzTarget.href }
//		console.log("img.src: "+hzImg.curUrl+" - curimg: "+hzCurUrl);
	} else {
		self.port.emit('load', false, 'about:blank');
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
	switch(hzTarget.hostname.split('.').reverse()[1]) {
		case "gfycat":
			hzLoadVideo();
			break;
		case "imgur":
			if(hzTarget.pathname.split('.').pop() == "gifv") {
				hzLoadVideo();
				break;
			}
		default:
			var els = document.getElementsByTagName('meta');
				for(var i=0, l=els.length; i < l; i++) {
				if(els[i].getAttribute('property') == "og:image") {
					hzImg.src = els[i].getAttribute('content');
				}
			}
	}
}
