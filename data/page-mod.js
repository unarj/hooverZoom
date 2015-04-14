var hzCurUrl, hzCurWait, hzOnAlbum = false;
var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length ; i < l; i++) {
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, true);
	hzLinks[i].addEventListener('mouseout', hzMouseOff, true);
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
		hzCurUrl = false;
		self.port.emit('worker');
	}
}

function hzResize(e) {
	if(hzCurWait) { clearTimeout(hzCurWait) }
	hzCurWait = setTimeout( function(){ self.port.emit('winSize', window.innerWidth, window.innerHeight) }, 100);
	if(e.type == 'load') { window.removeEventListener('load', hzResize, false) }
}

function hzWheel(e) {
	if(hzOnAlbum) {
		self.port.emit('wheel', e.deltaY);
		e.preventDefault();
		e.stopPropagation();
		return false;
	}
}

self.port.on('album', function(state) { hzOnAlbum = state });
self.port.on('click', function(state) { if(state && hzCurUrl) { window.location.href = hzCurUrl } });