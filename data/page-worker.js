var imgs = [];
var vid = '';

var els = document.getElementsByTagName('meta');
find:for(var i=0, l=els.length; i < l; i++) {
	switch(els[i].getAttribute('property')) {
		case 'og:image':
			imgs.push(els[i].getAttribute('content'));
			break;
		case 'og:video':
			vid = els[i].getAttribute('content');
			break;
		case 'og:video:type':
			if(/mp4|webm/i.test(els[i].getAttribute('content'))) { break find } else { vid = '' }
			break;
	}
	switch(els[i].getAttribute('name')) {
		case 'twitter:player:stream':
			vid = els[i].getAttribute('content');
			break;
		case 'twitter:player:stream:content_type':
			if(/mp4|webm/i.test(els[i].getAttribute('content'))) { break find } else { vid = '' }
			break;
	}
}

if(vid != '') {
	self.port.emit('video', vid);
//console.log("vid found: " + vid);
}
else if(imgs.length > 0) {
	self.port.emit('image', imgs);
//console.log("img found: " + img);
}
self.port.emit('done');