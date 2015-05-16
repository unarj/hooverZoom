const vidTypes = [ 'mp4', 'webm' ];
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
			if(vidTypes.indexOf(vid.split('.').reverse()[0]) < 0) { vid = '' }
			else { break find }
			break;
	}
}
if(vid != '') { self.port.emit('video', vid) }
else if(imgs.length > 0) { self.port.emit('image', imgs) }
