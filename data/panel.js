document.addEventListener('click', function(event) { self.port.emit('hide') }, false);
document.addEventListener('mouseout', function(event) { self.port.emit('hide') }, false);
document.addEventListener('wheel', function(event) { self.port.emit('wheel', event.movementY) }, false);

self.port.on('setImg', function(img, x, y) {
	var i = document.getElementById('main');
	i.src = img;
	i.width = x;
	i.height = y;
});