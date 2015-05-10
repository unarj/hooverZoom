var imgs = [];
vid = {};
var els = document.getElementsByTagName('meta');
for(var i=0, l=els.length; i < l; i++) {
	switch(els[i].getAttribute('property')) {
		case 'og:image':
			imgs.push(els[i].getAttribute('content'));
			break;
		case 'og:video':
			if(els[i].getAttribute('content').split('.').pop() == "mp4") { vid.src = els[i].getAttribute('content') }
			break;
		case 'og:video:width':
			vid.width = els[i].getAttribute('content');
			break;
		case 'og:video:height':
			vid.height = els[i].getAttribute('content');
			break;					
	}
}
if(vid.src) { self.port.emit('video', self.options.url, vid) }
else if(imgs.length > 0) { self.port.emit('image', self.options.url, imgs) }
