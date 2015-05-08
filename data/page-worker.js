var hzUrl = document.URL;
var hzImgs = [];
var hzVideo = false;
var els = document.getElementsByTagName('meta');
for(var i=0, l=els.length; i < l; i++) {
	switch(els[i].getAttribute('property')) {
		case 'og:image':
			hzImgs.push(els[i].getAttribute('content'));
			break;
		case 'og:video':
			if(els[i].getAttribute('content').split('.').pop() == "mp4") { hzVideo.src = els[i].getAttribute('content') }
			break;
		case 'og:video:width':
			hzVideo.width = els[i].getAttribute('content');
			break;
		case 'og:video:height':
			hzVideo.height = els[i].getAttribute('content');
			break;					
	}
}
if(hzVideo) { console.log("loading video: "+hzVideo); self.port.emit('video', hzUrl, hzVideo) }
else if(hzImgs.length > 0) { console.log("loading image: "+hzImgs); self.port.emit('image', hzUrl, hzImgs) }
