var hzLinks = document.getElementsByTagName('a');
for (var i = 0; i < hzLinks.length; i++) {
	hzLinks[i].addEventListener('mouseleave', function(event) { self.port.emit('hide') }, false);
	hzLinks[i].addEventListener('mouseenter', function(event) { hzMouseOn(event.target.href) }, false);
}
document.addEventListener('wheel', function(event) { self.port.emit('hide') }, false);

var hzImage = new Image;
hzImage.onerror = function() {
//	document.body.style.cursor = 'auto';
}
hzImage.onload = function() {
//	document.body.style.cursor = 'auto';
	self.port.emit('image', this.src, this.width, this.height, window.innerWidth, window.innerHeight);
}

function hzMouseOn(target) {
//	document.body.style.cursor = 'wait';
	var t = document.createElement('a');
	t.href = target;
	if(/imgur\.com$/i.test(t.hostname)) {
		var p = t.pathname.split('/');
		console.log(p[1]);
		switch(p[1]) {
			case "a" || "gallery":
				self.port.emit('album', t.protocol+"//imgur.com/a/"+p[2]+"?gallery");
				return;
		}
		p = t.pathname.split('.');
		if(p.length == 1) {
			t.href = t.protocol+"//i.imgur.com/"+p.pop()+".jpg";
		} else { 
			switch(p.pop()) {
				case "gifv":
					// would rather load the GIFV, but a javascript image element doesn't seem to like it...
					t.href = t.protocol+"//i.imgur.com/"+p.pop()+".gif";
					break;
			}
		}
	}
	if(/gfycat\.com$/i.test(t.hostname)) {
		t.href = t.protocol+"//giant.gfycat.com"+t.pathname;
		p = t.pathname.split('.');
		if(p.length == 1) {
			t.href = t.href+".gif";
		}
	}
	hzImage.src = t.href;
	if(target != t.href) {
		console.log("pageMod: "+target+" -> "+t.href);
	}
}
