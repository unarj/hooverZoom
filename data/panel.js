document.addEventListener('click', function(event) { self.port.emit('hide') }, false);
document.addEventListener('mousemove', function(event) { hzMotion() }, false);
document.addEventListener('wheel', function(event) { hzMouseWheel(event.deltaY) }, false);

self.port.on('image', function(img, x, y) {
	var i = document.getElementById('panelImg');
	i.src = img;
	i.width = x;
	i.height = y;
});

//this is a hack but works well enough for now...
var hzMoved = 0;
function hzMotion() {
	if(hzMoved > 15) {
		hzMoved = 0;
		self.port.emit('hide');
	} else {
		hzMoved++;
	}
}

function hzMouseWheel(delta) {
	if(delta) { self.port.emit('wheel', delta) }
}
