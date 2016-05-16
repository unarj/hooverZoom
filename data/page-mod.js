if(document.body){
	function debug(str){ console.log(str) }
	
	var hzLinks = document.getElementsByTagName('a');
	for (var i=0, l=hzLinks.length; i < l; i++) {
		hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
		hzLinks[i].addEventListener('mouseleave', hzMouseOff, false);
		debug('hook added: '+hzLinks[i]);
	}

	var hzDiv = document.createElement('div');
	hzDiv.show = function(width, height){
		var x = width;
		var y = height;
		var r = window.devicePixelRatio * (self.options.prefs.maxSize / 100);
		var maxX = document.documentElement.clientWidth * r;
		var maxY = document.documentElement.clientHeight * r;
		if((x > maxX) || (y > maxY)){
			var rX = maxX / x;
			var rY = maxY / y;
			if(rX < rY){
				x = Math.floor(x * rX);
				y = Math.floor(y * rX);
			}else{
				x = Math.floor(x * rY);
				y = Math.floor(y * rY);
			}
		}
		if(hzDiv.style.display != 'block'){
			hzDiv.style.display = 'block';
			if(self.options.prefs.keys){ document.addEventListener('keydown', hzKey, false) }
			document.addEventListener('scroll', hzMouseOff, false);
			document.addEventListener('wheel', hzWheel, false);
			debug('hzDiv show: '+x+','+y);
		}
		hzDiv.style.width = x+"px";
		hzDiv.style.height = y+"px";
		hzDiv.style.marginLeft = Math.floor(x / -2)+"px";
		hzDiv.style.marginTop = Math.floor(y / -2)+"px";
		if(self.options.prefs.addHist > 0){ hzWait = setTimeout(function(){ self.port.emit('visit', hzCurUrl) }, self.options.prefs.addHist) }
	}
	hzDiv.hide = function(){
		if(hzDiv.style.display != 'none'){
			hzDiv.style.display = 'none';
			document.removeEventListener('keydown', hzKey, false);
			document.removeEventListener('scroll', hzMouseOff, false);
			document.removeEventListener('wheel', hzWheel, false);
			debug('hzDiv hide');
		}
		hzDiv.loadImg('','about:blank');
		hzDiv.loadVid('','about:blank');
	}
	hzDiv.img = document.createElement('img');
	hzDiv.img.addEventListener('load', function(){ hzDiv.showImg(hzDiv.img.url, hzDiv.img.src) });
	//hzDiv.img.addEventListener('progress', function(){ debug('img progress') });
	//hzDiv.img.addEventListener('loadstart', function(){ debug('img loadstart') });
	hzDiv.loadImg = function(url, src){
		if(hzDiv.img.src != src){
			hzDiv.img.url = url;
			hzDiv.img.src = src;
			debug('img load: '+src);
		}
	}
	hzDiv.showImg = function(url, src){
		if(url == hzCurUrl){
			var x = self.options.prefs.delay - (new Date().getTime() - hzMark);
			if(x > 0){
				hzWait = setTimeout( function(){ hzDiv.showImg(url, src) }, x);
			}else{
				while(hzDiv.lastChild){ hzDiv.removeChild(hzDiv.lastChild) }
				if(hzAlbumImgs.length > 1){
					var d = document.createElement('div');
					d.appendChild(document.createTextNode((hzAlbumImgIndex+1)+'/'+hzAlbumImgs.length));
					d.setAttribute('style', self.options.prefs.textLoc);
					hzDiv.appendChild(d);
				}
				hzDiv.appendChild(hzDiv.img);
				hzDiv.show(hzDiv.img.naturalWidth, hzDiv.img.naturalHeight);
				debug('img show: '+src);
			}
		}else{
			hzDiv.hide();
		}
	}
	hzDiv.vid = document.createElement('video');
	hzDiv.vid.addEventListener('canplaythrough', function(){ hzDiv.showVid(hzDiv.vid.url, hzDiv.vid.src) });
	hzDiv.vid.autoplay = true;
	hzDiv.vid.loop = true;
	hzDiv.vid.muted = true;
	hzDiv.loadVid = function(url, src){
		if(hzDiv.vid.src != src){
			hzDiv.vid.url = url;
			hzDiv.vid.src = src;
			hzDiv.vid.load();
			debug('vid load: '+src);
		}
	}
	hzDiv.showVid = function(url, src){
		if(url == hzCurUrl){
			var x = self.options.prefs.delay - (new Date().getTime() - hzMark);
			if(x > 0){
				hzWait = setTimeout( function(){ hzDiv.showVid(url, src) }, x);
			}else{
				while(hzDiv.lastChild){ hzDiv.removeChild(hzDiv.lastChild) }
				hzDiv.appendChild(hzDiv.vid);
				hzDiv.show(hzDiv.vid.videoWidth, hzDiv.vid.videoHeight);
				hzDiv.vid.play();
				debug('vid show: '+src);
			}
		}else{
			hzDiv.hide();
		}
	}
	hzDiv.id = 'hzDiv';
	hzDiv.style.width = "100px";
	hzDiv.style.height = "100px";
	document.body.appendChild(hzDiv);

	function hzKey(e){
		switch(e.keyCode){
			case 37: //left
				e.deltaY = -1;
				break;
			case 39: //right
				e.deltaY = 1;
				break;
		}
		if(e.deltaY){ hzWheel(e) }
	}
	function hzWheel(e){
		if(hzAlbumImgs.length > 1){
			e.preventDefault();
			e.stopPropagation();
			if(e.deltaY > 0){ 
				++hzAlbumImgIndex;
				if(hzAlbumImgIndex > hzAlbumImgs.length - 1) { hzAlbumImgIndex = 0 }
			} else if(e.deltaY < 0){
				--hzAlbumImgIndex;
				if(hzAlbumImgIndex < 0){ hzAlbumImgIndex = hzAlbumImgs.length - 1 }
			}
			hzDiv.loadImg(hzCurUrl, hzAlbumImgs[hzAlbumImgIndex]);
		}
	}

	var hzAlbumImgs = [];
	var hzAlbumImgIndex = 0;
	var hzCurUrl = '';
	var hzLoad = $.ajax();
	var hzMark, hzWait;
	function hzMouseOn(e){
		clearTimeout(hzWait);
		hzLoad.abort();
		hzCurUrl = '';
		hzDiv.hide();
		hzAlbumImgs = [];
		if(e){
			hzMark = new Date().getTime();
			hzCurUrl = e.target.toString();
			var hzTarget = document.createElement('a');
			hzTarget.href = hzCurUrl;
			var p = hzTarget.pathname.split('.').reverse();
			if(/bmp|jpeg|jpg|png/i.test(p[0])){ hzDiv.loadImg(hzCurUrl, hzTarget.href) }
			else if(/mp4|webm/i.test(p[0])){ hzDiv.loadVid(hzCurUrl, hzTarget.href) }
			else{
				p = hzTarget.hostname.split('.').reverse();
				switch((p[1]+"."+p[0]).toLowerCase()){
					case 'gfycat.com':
						self.port.emit('load', hzCurUrl, hzTarget.protocol+"//gfycat.com/"+hzTarget.pathname.split('.')[0]);
						break;
					case 'imgflip.com':
						p = hzTarget.pathname.split('/');
						if(p.length > 2){ hzTarget.href = hzTarget.protocol+"//i.imgflip.com/"+p[2].split('#')[0]+".jpg" }
						break;
					case 'imgur.com':
						var alb = "";
						p = hzTarget.pathname.split('/');
						switch(p[1].toLowerCase()){
							case 'a':
								alb = "https://api.imgur.com/3/album/"+p[2]
							case 'gallery':
								alb = alb || "https://api.imgur.com/3/gallery/"+p[2]
								hzLoad = $.ajax({ src:hzCurUrl, url:alb, type:'GET', datatype:'json', beforeSend:function(h){ h.setRequestHeader('Authorization', 'Client-ID f781dcd19302057') },
									success:function(d){
										var i = 0;
										if(d['data']['images']){
											$.each(d['data']['images'], function(i,v){
												var x = setTimeout( function(){ new Image().src = v['link'] }, i);
												i += 1000;
												hzAlbumImgs.push(v['link']);
											});
										}else if(d['data']['link']){
											hzAlbumImgs.push(d['data']['link']);
										}
										if(hzAlbumImgs.length > 0){
											hzDiv.loadImg(this.src, hzAlbumImgs[0]);
											hzAlbumImgIndex = 0;
										}
									}
								});
								return;
						}
						hzTarget.pathname = hzTarget.pathname.split('/').pop();
						hzTarget.href = hzTarget.href.split('?')[0].split(',')[0].split('#')[0];
						if(hzTarget.pathname.split('.').length == 1){ hzTarget.href += ".jpg" }
						switch(hzTarget.pathname.split('.').reverse()[0].toLowerCase()) {
							case 'gif':
								hzTarget.href += "v";
							case 'gifv':
								self.port.emit('load', hzCurUrl, hzTarget.href);
								return;
						}
						break;
					case 'livememe.com':
						hzTarget.href = hzTarget.protocol+"//i.lvme.me"+hzTarget.pathname+".jpg";
						break;
					case 'sli.mg':
						hzTarget.href = hzTarget.protocol+"//i.sli.mg"+hzTarget.pathname+".jpg";
						break;
					case 'vidble.com':
						hzLoad = $.ajax({ src:hzCurUrl, url:hzTarget.href+'?json=1', type:'GET', datatype:'json',
							success:function(d){
								var i = 0;
								$.each(d['pics'], function(i,v){
									var x = setTimeout( function(){ new Image().src = v }, i);
									i += 1000;
									hzAlbumImgs.push(v);
								});
								if(hzAlbumImgs.length > 0) {
									hzDiv.laodImg(this.src, hzAlbumImgs[0]);
									hzAlbumImgIndex = 0;
								}
							}
						});
						return;
					case '500px.com':
					case 'artstation.com':
					case 'citizenop.com':
					case 'craigslist.org':
					case 'deviantart.com':
					case 'explosm.net':
					case 'facebook.com':
					case 'fav.me':
					case 'flic.kr':
					case 'flickr.com':
					case 'giphy.com':
					case 'gifyoutube.com':
					case 'gph.is':
					case 'gyazo.com':
					case 'instagram.com':
					case 'makeameme.org':
					case 'mypixa.com':
					//case 'pinterest.com':
					case 'swirl.xyz':
					case 'tumblr.com':
					case 'twitter.com':
					case 'vid.me':
					case 'vine.co':
						self.port.emit('load', hzCurUrl, hzTarget.href);
						break;
				}
				hzDiv.loadImg(hzCurUrl, hzTarget.href);
			}
		}
	}
	function hzMouseOff(e){ hzMouseOn(null) }

	//port functionality seems to stop working randomly, a page refresh will fix it...
	function hzPortImg(url, img){
		hzAlbumImgs = img;
		hzAlbumImgIndex = 0;
		hzDiv.loadImg(url, hzAlbumImgs[0]);
		debug('img port: '+img);
	}
	self.port.on('image', hzPortImg);

	function hzPortVid(url, vid){
		hzDiv.loadVid(url, vid);
		debug('vid port: '+vid);
	}
	self.port.on('video', hzPortVid);
}