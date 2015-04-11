var hzImgs = [];
var hzImgNum = 0;
var hzImage = new Image;
hzImage.onerror = function() { self.port.emit('hide') }
hzImage.onload = function() {
	self.port.emit('image', this.src, this.width, this.height, (hzImgNum+1)+"/"+hzImgs.length);
}

var t = document.createElement('a');
t.href = document.URL;
console.log("pageWorker loading: "+t.href)

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
	if(video && width && height) { self.port.emit('video', video, width, height) }
	console.log("pageWorker: loading "+video+" ("+width+"x"+height+")");
}

self.port.on('wheel', function(delta) {
	if(delta > 0) {
		hzImgNum++;
		if(hzImgNum > hzImgs.length-1) { hzImgNum = 0 }
	} else {
		hzImgNum--;
		if(hzImgNum < 0) { hzImgNum = hzImgs.length-1 }
	}
	hzImage.src = hzImgs[hzImgNum];
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
			if(hzImgs.length > 0) {	hzImage.src = hzImgs[hzImgNum] }
		}
		break;
}
