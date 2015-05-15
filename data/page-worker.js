const vidTypes = [ 'video/mp4', 'video/ogg', 'video/webm' ];
var imgs = [];
var vid = {};
var els = document.getElementsByTagName('meta');
for(var i=0, l=els.length; i < l; i++) {
	switch(els[i].getAttribute('property')) {
		case 'og:image':
			imgs.push(els[i].getAttribute('content'));
			break;
		case 'og:video':
			vid.src = els[i].getAttribute('content');
			find: while(i < l && !(vid.type && vid.width && vid.height)) {
				i++;
				switch(els[i].getAttribute('property')) {
					case 'og:video':
						i--;
						break find;
					case 'og:video:type':
						vid.type = els[i].getAttribute('content');
						break;
					case 'og:video:width':
						vid.width = els[i].getAttribute('content');
						break;
					case 'og:video:height':
						vid.height = els[i].getAttribute('content');
						break;
				}
			}		
			if(vidTypes.indexOf(vid.type) > -1) { i = l } else { vid = {} }
			break;
	}
}
if(vid.src) { self.port.emit('video', vid) }
else if(imgs.length > 0) { self.port.emit('image', imgs) }
