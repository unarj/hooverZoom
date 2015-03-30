document.addEventListener('mousemove', function(event) { hzMotion() }, false);

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