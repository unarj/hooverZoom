document.addEventListener('click', function(event) { self.port.emit('hide') }, false);
document.addEventListener('mousemove', hzMotion, true);
document.addEventListener('wheel', hzWheel, true);

self.port.on('image', function(img, x, y) {
	var i = document.getElementById('panelImg');
	i.src = img;
	i.width = x;
	i.height = y;
});

//this is a hack but works well enough for now...
var hzMoved = 0;
function hzMotion(event) {
	if(hzMoved > 15) {
		hzMoved = 0;
		self.port.emit('hide');
	} else {
		hzMoved++;
	}
}

function hzWheel(event) {
	if(event.deltaY) { self.port.emit('wheel', event.deltaY) }
}
