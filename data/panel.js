document.addEventListener('click', function(event) { self.port.emit('click') }, false);
document.addEventListener('mousemove', hzMotion, true);
document.addEventListener('wheel', function(event) { self.port.emit('wheel', event.deltaY) }, true);

var i = document.getElementById('panelImg');
var t = document.getElementById('panelText');
self.port.on('image', function(img, x, y, txt) {
	i.src = img;
	i.width = x;
	i.height = y;
	t.innerHTML = txt;
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