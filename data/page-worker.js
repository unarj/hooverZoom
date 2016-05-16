if(document.URL != 'about:blank'){
//	function debug(str){ console.log('pageWorker: '+str) }

	debug('checking: '+document.URL);
	var imgs = [];
	var vids = [];

	var els = document.getElementsByTagName('meta');
	find:for(var i=0, l=els.length; i < l; i++){
		switch(els[i].getAttribute('name')){
			case 'twitter:player:stream':
				vids.push(els[i].getAttribute('content'));
				break;
			case 'twitter:player:stream:content_type':
				if(!/mp4|webm/i.test(els[i].getAttribute('content'))){ vids.pop() }
				break;
		}
		switch(els[i].getAttribute('property')){
			case 'og:image':
				imgs.push(els[i].getAttribute('content'));
				break;
			case 'og:video':
				vids.push(els[i].getAttribute('content'));
				break;
			case 'og:video:type':
				if(!/mp4|webm/i.test(els[i].getAttribute('content'))){ vids.pop() }
				break;
		}
	}

	if(vids.length){
		self.port.emit('found', vids);
		debug('video found: '+vids[0]);
	}
	else if(imgs.length){
		self.port.emit('found', imgs);
		debug('img found: '+imgs[0]);
	}
	self.port.emit('done');
}