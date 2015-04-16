var c = document.getElementById('panelContainer');
var i = document.getElementById('panelImg');
var t = document.getElementById('panelText');
var v = document.getElementById('panelVid');

document.addEventListener('click', hzClick, false);
document.addEventListener('mouseleave', function(){ self.port.emit('hide') }, false);
document.addEventListener('mousemove', hzMotion, true);
document.addEventListener('wheel', function(e) { self.port.emit('wheel', e.deltaY) }, true);


self.port.on('image', function(img, x, y, txt) {
	hzOrigin = false;
	v.src = "blank.gif";
	v.style.display = 'none';
	i.style.display = 'block';
	i.width = x;
	i.height = y;
	if(y < c.offsetHeight) {
		i.style.marginTop = Math.round((c.offsetHeight - y) / 2).toString();
	} else {
		i.style.marginTop = "0";
	}
	i.src = img;
	hzCaption(txt);
//	console.log("panel: set image to "+img);
});

self.port.on('video', function(vid, x, y, txt) {
	hzOrigin = false;
	i.src = "blank.gif";
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
	if(e.button == 0) { self.port.emit('click', true) }
	else { self.port.emit('click', false) }
}

// ideally the popup would hide when it's no longer over the element that caused it to show, but since we don't have
// any visibility under the popup we make a best-guess...
var hzMargin, hzMoved = 0;
var hzOrigin = false;
function hzMotion(e) {
	if(!hzOrigin) {
		hzOrigin = [e.screenX, e.screenY];
		hzMargin = [window.devicePixelRatio * screen.width * 0.03, window.devicePixelRatio * screen.height * 0.01];
	} else {
		hzMoved = [Math.abs(hzOrigin[0] - e.screenX), Math.abs(hzOrigin[1] - e.screenY)];
	if((hzMoved[0] > hzMargin[0]) || (hzMoved[1] > hzMargin[1])) {
			hzOrigin = false;
			self.port.emit('hide');
		}
	}	
}
