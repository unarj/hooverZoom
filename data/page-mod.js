var hzLinks = document.getElementsByTagName('a');
for (var i = 0; i < links.length; i++) {
	hzLinks[i].addEventListener('mouseleave', function(event) { self.port.emit('hide') }, false);
	hzLinks[i].addEventListener('mouseover', function(event) { hzMouseOn(event.target.innerHTML) }, false);
}
document.addEventListener('wheel', function(event) { self.port.emit('hide') }, false);

var hzImage = new Image;
image.onerror = function() {
//	document.body.style.cursor = 'auto';
}

function hzMouseOn(target) {
//	document.body.style.cursor = 'no-drop';
	var t = document.createElement('a');
	t.href = target;
	// imgur gets special treatment...
	if(/imgur\.com$/i.test(t.hostname)) {
		var p = t.pathname.split('/');
		if((p[1] == 'a') || (p[1] == 'gallery')) {
			self.port.emit('album', t.protocol+"//imgur.com/a/"+p[2]+"?gallery");
			return;
		}
		else if(t.pathname.split('.').length == 1) { target = t.protocol+"//imgur.com/"+p.pop()+".jpg" }
	}
	hzImage.onload = function() {
//		document.body.style.cursor = 'auto';
		self.port.emit('image', target, this.width, this.height, window.innerWidth, window.innerHeight);
	}
	hzImage.src = target;
//	console.log("pageMod mouseOn: "+target);
}