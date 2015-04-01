var hzOnAlbum = false;
var hzLinks = document.getElementsByTagName('a');
for (var i = 0; i < hzLinks.length; i++) {
	hzLinks[i].addEventListener('mouseleave', hzMouseOff, false);
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
}
//window.addEventListener('wheel', hzWheel, false);

var hzImage = new Image;
hzImage.onerror = function() {
//	document.body.style.cursor = 'auto';
}
hzImage.onload = function() {
//	document.body.style.cursor = 'auto';
	self.port.emit('winSize', window.innerWidth, window.innerHeight);
	self.port.emit('image', this.src, this.width, this.height );
}

function hzMouseOn(event) {
//	document.body.style.cursor = 'wait';
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
				self.port.emit('winSize', window.innerWidth, window.innerHeight);
				self.port.emit('album', t.protocol+"//imgur.com/a/"+p[2]+"?gallery");
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
	hzImage.src = t.href;
	self.port.emit('current', event.target.toString(), t.href);
//	if(event.target != t.href) { console.log("pageMod: "+event.target+" -> "+t.href) }
}
function hzMouseOff(event) {
	self.port.emit('current', null, null);
	self.port.emit('hide');
}

function hzWheel(event) {
	event.preventDefault();
	event.stopPropagation();
	console.log("pageMod hzWheel: "+hzOnAlbum);
	return false;
}
self.port.on('onAlbum', function(state) {
	if(hzOnAlbum != state) {
		hzOnAlbum = state;
		if(hzOnAlbum) {
			window.addEventListener('DOMMouseScroll', hzWheel, false);
			console.log("added listener")
		} else {
			window.removeEventListener('DOMMouseScroll', hzWheel, false);
			console.log("removed listener")
		}
	}
});

self.port.on('load', function(url) { unsafeWindow.location.href = url; console.log("pageMod loading: "+url) });