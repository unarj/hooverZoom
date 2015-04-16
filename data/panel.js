document.addEventListener('click', hzClick, false);
document.addEventListener('mousemove', hzMotion, true);
document.addEventListener('wheel', function(e) { self.port.emit('wheel', e.deltaY) }, true);

var c = document.getElementById('panelContainer');
var i = document.getElementById('panelImg');
var v = document.getElementById('panelVid');

self.port.on('image', function(img, x, y, txt) {
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
	i.src = "blank.gif";
	i.style.display = 'none';
	v.style.display = 'block';
	v.width = x;
	v.height = y;
	v.src = vid;
	hzCaption(txt);
//	console.log("panel: set video to "+vid);
});

var t = document.getElementById('panelText');
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
// any visibility under the popup make a best-guess...
var hzHeight, hzMoved = 0;
function hzMotion(e) {
	if(hzMoved == 0) { hzHeight = window.devicePixelRatio * document.documentElement.clientHeight }
	hzMoved += e.clientX;
	if(hzMoved > (hzHeight / 100)) {
		hzMoved = 0;
		self.port.emit('hide');
	}
}
