var hzLinks = document.getElementsByTagName('a');
for (var i = 0; i < hzLinks.length; i++) {
	hzLinks[i].addEventListener('mouseleave', function(event) { self.port.emit('hide') }, false);
	hzLinks[i].addEventListener('mouseenter', function(event) { hzMouseOn(event.target.href) }, false);
}
document.addEventListener('wheel', function(event) { self.port.emit('hide') }, false);

var hzImage = new Image;
hzImage.onerror = function() {
	document.body.style.cursor = 'auto';
}
hzImage.onload = function() {
	document.body.style.cursor = 'auto';
	self.port.emit('image', this.src, this.width, this.height, window.innerWidth, window.innerHeight);
}

function hzMouseOn(target) {
	document.body.style.cursor = 'wait';
	var t = document.createElement('a');
	t.href = target;
	// imgur gets special treatment...
	if(/imgur\.com$/i.test(t.hostname)) {
		var p = t.pathname.split('/');
		if((p[1] == 'a') || (p[1] == 'gallery')) {
			self.port.emit('album', t.protocol+"//imgur.com/a/"+p[2]+"?gallery");
			return;
		}
		else if(t.pathname.split('.').length == 1) { t.href = t.protocol+"//imgur.com/"+p.pop()+".jpg" }
	}
	hzImage.src = t.href;
//	console.log("pageMod hzMouseOn: "+target);
}
