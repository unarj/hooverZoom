var c = document.getElementById('panelContainer');
var i = document.getElementById('panelImg');
var t = document.getElementById('panelText');
var v = document.getElementById('panelVid');

document.addEventListener('click', hzClick, false);
document.addEventListener('mousemove', hzMotion, true);
document.addEventListener('mouseleave', function(){ self.port.emit('hide') }, false);  //y u no work?!?
document.addEventListener('wheel', function(e) { self.port.emit('wheel', e.deltaY) }, true);

self.port.on('image', function(img, x, y, txt) {
	hzOrigin = false;
	v.src = "";
	v.style.display = 'none';
	i.style.display = 'block';
	i.width = x;
	i.height = y;
	if(y < c.offsetHeight) { i.style.marginTop = Math.round((c.offsetHeight - y) / 2).toString() }
	else { i.style.marginTop = "0" }
	i.src = img;
	hzCaption(txt);
//	console.log("panel: set image to "+img);
});

self.port.on('video', function(vid, x, y, txt) {
	hzOrigin = false;
	i.src = "";
	i.style.display = 'none';
	v.style.display = 'block';
	v.width = x;
	v.height = y;
	v.src = vid;
	hzCaption(txt);
//	console.log("panel: set video to "+vid);
});

function hzCaption(str) {
	str = str || "";
	while(t.firstChild) { t.removeChild(t.firstChild) }
	t.appendChild(document.createTextNode(str));
}

function hzClick(e) {
	self.port.emit('hide');
	if(e.button == 0) { self.port.emit('click') }
}

// ideally the popup would hide when it's no longer over the element that caused it to show, but since we don't have
// any visibility under the popup we make a best-guess...
var hzMargin, hzMoved = 0;
var hzOrigin = false;
function hzMotion(e) {
	if(!hzOrigin) {
		hzOrigin = [e.screenX, e.screenY];
		// not sure if we need to account for the pixel ratio, needs testing...
//		hzMargin = [window.devicePixelRatio * screen.width * 0.02, window.devicePixelRatio * screen.height * 0.015];
		hzMargin = [screen.width * 0.02, screen.height * 0.015];
//		console.log(hzOrigin+" "+hzMargin);
	} else {
		hzMoved = [Math.abs(hzOrigin[0] - e.screenX), Math.abs(hzOrigin[1] - e.screenY)];
		if((hzMoved[0] > hzMargin[0]) || (hzMoved[1] > hzMargin[1])) {
			hzOrigin = false;
			self.port.emit('hide');
		}
//		console.log(hzMoved);
	}	
}
