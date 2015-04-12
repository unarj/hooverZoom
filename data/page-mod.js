var hzOnAlb = false;
var hzLinks = document.getElementsByTagName('a');
for (var i=0, l=hzLinks.length ; i < l; i++) {
	hzLinks[i].addEventListener('mouseenter', hzMouseOn, false);
	hzLinks[i].addEventListener('mouseout', hzMouseOff, false);
}
window.addEventListener('load', hzResize, false);
window.addEventListener('resize', hzResize, false);
window.addEventListener('wheel', hzWheel, false);

function hzMouseOn(event) { self.port.emit('worker', event.target.toString()) };
function hzMouseOff(event) { if(!event || event.relatedTarget) { self.port.emit('worker') } }
function hzResize(event) {
	if(event.type == 'load') { window.removeEventListener('load', hzResize, false) }
	self.port.emit('winSize', window.innerWidth, window.innerHeight);
}
function hzWheel(event) {
	if(hzOnAlb) {
		event.preventDefault();
		event.stopPropagation();
		self.port.emit('wheel', event.deltaY);
		return false;
	}
}

self.port.on('album', function(state) { hzOnAlbum = state });
self.port.on('click', function(url) { if(url) { window.location.href = url } });