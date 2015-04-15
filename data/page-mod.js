var hzCurUrl, hzCurWait, hzOnAlbum = false;
var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length ; i < l; i++) {
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
	hzLinks[i].addEventListener('mouseleave', hzMouseOff, false);
}
window.addEventListener('load', hzResize, false);
window.addEventListener('resize', hzResize, false);
window.addEventListener('wheel', hzWheel, false);

function hzMouseOn(e) {
	hzCurUrl = e.target.toString();
	self.port.emit('worker', hzCurUrl);
}

function hzMouseOff(e) {
	if(!e || e.relatedTarget) {
		hzCurUrl = hzOnAlbum = false;
		self.port.emit('worker', false);
	}
}

function hzResize(e) {
	if(hzCurWait) { clearTimeout(hzCurWait) }
	// thought I had a winner with the top formula, but it's causing large popups on my laptop...
//	var x = window.devicePixelRatio * window.innerWidth;
//	var y = window.devicePixelRatio * window.innerHeight;
	var r = window.screen.availWidth / document.documentElement.clientWidth;
	var x = r * document.documentElement.clientWidth;
	var y = r * document.documentElement.clientHeight;
	hzCurWait = setTimeout( function(){ self.port.emit('winSize', x, y) }, 100);
	if(e.type == 'load') { window.removeEventListener('load', hzResize, false) }
}

function hzWheel(e) {
	if(hzOnAlbum) {
		self.port.emit('wheel', e.deltaY);
		e.preventDefault();
		e.stopPropagation();
		return false;
	} else {
		hzMouseOff(null);
	}
}

self.port.on('album', function(state) { hzOnAlbum = state });
self.port.on('click', function(state) { if(state && hzCurUrl) { window.location.href = hzCurUrl } });
