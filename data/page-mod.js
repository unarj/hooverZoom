var hzOnAlbum = false;
var hzLinks = document.getElementsByTagName('a');
for (var i = 0; i < hzLinks.length; i++) {
	hzLinks[i].addEventListener('mouseleave', function(event) { self.port.emit('hide') });
	hzLinks[i].addEventListener('mouseenter', function(event) { hzMouseOn(event.target.href) });
}
window.addEventListener('load', function(event) { hzWinSize() });
window.addEventListener('resize', function(event) { hzWinSize() });

var hzImage = new Image;
hzImage.onerror = function() {
//	document.body.style.cursor = 'auto';
}
hzImage.onload = function() {
//	document.body.style.cursor = 'auto';
	self.port.emit('image', this.src, this.width, this.height );
}

function hzMouseOn(target) {
//	document.body.style.cursor = 'wait';
	var t = document.createElement('a');
	t.href = target;
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
	if(target != t.href) { console.log("pageMod: "+target+" -> "+t.href) }
}

function hzWheel(event) { self.port.emit('wheel', event.deltaY) }

function hzWinSize() {
	var x = Math.max(window.innerWidth, document.documentElement.clientWidth);
	var y = Math.max(window.innerHeight, document.documentElement.clientHeight);
	self.port.emit('winSize', x, y);
	console.log("size: "+x+","+y);
}

self.port.on('onAlbum', function(state) {
	if(state) { window.addEventListener('wheel', hzWheel) }
	else { window.removeEventListener('wheel', hzWheel) }
});