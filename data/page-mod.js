//console.log("loading pageMod...");
var hzCurAlb, hzCurImg, hzCurUrl, hzMark = false;
var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length ; i < l; i++) {
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
	hzLinks[i].addEventListener('mouseout', hzMouseOff, false);
}
window.addEventListener('load', hzResize, false);
window.addEventListener('resize', hzResize, false);
window.addEventListener('wheel', hzWheel, false);

var hzImage = new Image;
hzImage.onload = function() {
	if((hzCurImg === this.src) && this.width && this.height) {
		var i = self.options.delay - (new Date().getTime() - hzMark);
		if(i <= 0) {
			self.port.emit('image', this.src, this.width, this.height);
		} else {
//			console.log("pageMod: image delayed "+i);
			setTimeout( function(){ hzImage.src = hzCurImg }, i);
		}
	}
}

function hzMouseOn(event) {
	target = event.target.toString();
	if(hzCurUrl != target) {
		hzMark = new Date().getTime();	
		hzCurUrl = target;
		var t = document.createElement('a');
		t.href = event.target;
		var p = t.hostname.split('.').reverse();
		switch(p[1]+"."+p[0]) {
			case "gfycat.com":
				self.port.emit('worker', t.href);
				return;
			case "imgflip.com":
				p = t.pathname.split('/');
				if(p.length > 2) {
					p = p[2].split('#');
					t.href = t.protocol+"//i.imgflip.com/"+p[0]+".jpg";
				}
				break;
			case "imgur.com":
				p = t.pathname.split('/');
				if((p[1] == "a") || (p[1] == "gallery")) {
					hzCurAlb = t.protocol+"//imgur.com/a/"+p[2]+"?gallery"
					self.port.emit('worker', hzCurAlb);
					return;
				} else {
					t.href = t.protocol+"//i.imgur.com/"+p.pop();
				}
				p = t.pathname.split('.');
				if(p.length == 1) { t.href += ".jpg"}
				else if(p.pop() == "gifv") {
					self.port.emit('worker', t.href);
					return;
				}
				break;
			case "livememe.com":
				p = t.pathname.split('.');
				if(p.length == 1) {	t.href = t.protocol+"//i.lvme.me"+p.pop()+".jpg" }
				break;
		}
		hzImage.src = hzCurImg = t.href;
//		if(hzCurUrl != hzCurImg) { console.log("pageMod: "+hzCurUrl+" -> "+hzCurImg) }
	}
}

function hzMouseOff(event) {
	if(!event || event.relatedTarget) {
		hzImage.src = 'about:blank';
		hzCurImg = hzCurUrl = false;
		if(hzCurAlb) {
			hzCurAlb = false;
			self.port.emit('worker', 'about:blank');
		}
		self.port.emit('hide');
	}
}

function hzResize(event) {
	self.port.emit('winSize', window.innerWidth, window.innerHeight);
}

function hzWheel(event) {
	if(hzCurAlb) {
		event.preventDefault();
		event.stopPropagation();
		self.port.emit('wheel', event.deltaY);
		return false;
	}
}

//self.port.on('addHistory', function(url) { if(url) { window.open(url).close() } });
self.port.on('click', function() { if(hzCurUrl) { window.location.href = hzCurUrl } });
self.port.on('mouseOff', function() { hzMouseOff() });