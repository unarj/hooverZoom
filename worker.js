function debug(str){ if(prefs.debug){ console.log(str) } }

if(document.URL != 'about:blank'){
	debug('checking: '+document.URL);
	var imgs = [];
	var vids = [];
	var els = document.getElementsByTagName('meta');
	for(var i=0, l=els.length; i < l; i++){
		switch(els[i].getAttribute('property')){
			case 'og:image':
				imgs.push(els[i].getAttribute('content'));
				debug('img found: '+els[i].getAttribute('content'));
				break;
			case 'og:video':
				vids.push(els[i].getAttribute('content'));
				debug('video found: '+els[i].getAttribute('content'));
				break;
			case 'og:video:type':
				if(!/mp4|webm/i.test(els[i].getAttribute('content'))){
					vids.pop();
					debug('previous video removed');
				}
				break;
		}
	}
	if(!vids.length){
		for(var i=0, l=els.length; i < l; i++){
			switch(els[i].getAttribute('name')){
				case 'twitter:player:stream':
					vids.push(els[i].getAttribute('content'));
					debug('video found: '+els[i].getAttribute('content'));
					break;
				case 'twitter:player:stream:content_type':
					if(!/mp4|webm/i.test(els[i].getAttribute('content'))){
						vids.pop();
						debug('previous video removed');
					}
					break;
			}
		}
	}
	if(vids.length){
		browser.runtime.sendMessage({ found: vids });
		debug('returning video(s)');
	}
	else if(imgs.length){
		browser.runtime.sendMessage({ found: imgs });
		debug('returning image(s)');
	}
	window.location.href = 'about:blank';
}