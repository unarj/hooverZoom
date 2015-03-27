var links = document.getElementsByTagName('a');
for (var i = 0; i < links.length; i++) {
	links[i].addEventListener('mouseout', function(event) { self.port.emit('mouseOff') }, false);
	links[i].addEventListener('mouseover', function(event) { mouseOn(event.target.innerHTML) }, false);
}
document.addEventListener('wheel', function(event) { self.port.emit('wheel', event.movementY) }, false);

function mouseOn(target) {
//	document.body.style.cursor = 'no-drop';
	var t = document.createElement('a');
	t.href = target;
	// imgur gets special treatment...
	if(/imgur\.com$/i.test(t.hostname)) {
		if(t.pathname.split('/')[1] == ('a' || 'gallery')) {
			self.port.emit('album', target);
			return;
		}
		else if(t.pathname.split('.').length == 1) { target = target+".jpg" }
	}
	var img = new Image;
	img.onload = function() {
//		document.body.style.cursor = 'auto';
		self.port.emit('imageLoad', target, this.width, this.height, window.innerWidth, window.innerHeight);
	}
	img.onerror = function() {
//		document.body.style.cursor = 'auto';
	}
	img.src = target;
//	console.log("pageMod mouseOn: "+target);
}