var hzCurUrl, hzCurWait, hzOnAlbum = false;
var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length; i < l; i++) {
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
	// e.relatedTarget seems to be empty if the panel caused this event...
	if(!e || e.relatedTarget) {
		hzCurUrl, hzOnAlbum = false;
		self.port.emit('hide');
	}
}

function hzResize(e) {
	clearTimeout(hzCurWait);
	hzCurWait = setTimeout( function(){ hzReportSize() }, 100);
	if(e.type == 'load') { window.removeEventListener('load', hzResize, false) }
}
function hzReportSize() {
	self.port.emit('winSize', window.devicePixelRatio * document.documentElement.clientWidth, window.devicePixelRatio * document.documentElement.clientHeight);
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
self.port.on('click', function() { if(hzCurUrl) { window.location.href = hzCurUrl } });
