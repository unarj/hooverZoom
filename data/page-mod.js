//console.log("loading pageMod...");
var hzCurAlb, hzCurImg, hzCurUrl = false;
var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length ; i < l; i++) {
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
	hzLinks[i].addEventListener('mouseleave', hzMouseOff, false);
}
window.addEventListener('wheel', hzWheel, false);

var hzImage = new Image;
hzImage.onerror = function() {
//	hmm...
}
hzImage.onload = function() {
	if(hzCurImg === this.src && this.naturalWidth && this.naturalHeight) {
		self.port.emit('winSize', window.innerWidth, window.innerHeight);
		self.port.emit('image', this.src, this.naturalWidth, this.naturalHeight);
	}
}

function hzMouseOn(event) {
	target = event.target.toString();
	if(hzCurUrl != target) {
		hzCurUrl = target;
		var t = document.createElement('a');
		t.href = event.target;
		var p = t.hostname.split('.').reverse();
		switch(p[1]+"."+p[0]) {
			case "gfycat.com":
				t.href = t.protocol+"//giant.gfycat.com"+t.pathname;
				if(t.pathname.split('.').length == 1) {	t.href = t.href+".gif" }
				break;
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
					self.port.emit('winSize', window.top.innerWidth, window.top.innerHeight);
					self.port.emit('album', hzCurAlb);
					return;
				} else { t.href = t.protocol+"//i.imgur.com/"+p.pop() }
				p = t.pathname.split('.');
				if(p.length == 1) { t.href += ".jpg"}
				else if(p.pop() == "gifv") { t.href = t.protocol+"//i.imgur.com/"+p.pop()+".gif" }
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
	if(event.relatedTarget) {
		hzImage.src = "";
		hzCurImg = hzCurUrl = false;
		if(hzCurAlb) {
			hzCurAlb = false;
			self.port.emit('album', "about:blank");
		}
		self.port.emit('hide');
	}
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