document.addEventListener('click', function(event) {  }, false);
document.addEventListener('mousemove', hzMotion, true);
document.addEventListener('wheel', function(event) { self.port.emit('wheel', event.deltaY) }, true);

var c = document.getElementById('panelContainer');
var i = document.getElementById('panelImg');
var v = document.getElementById('panelVid');

self.port.on('image', function(img, x, y, txt) {
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

function hzClick(event) {
	if(event.button == 1) { self.port.emit('click', true) }
	else { self.port.emit('click', false) }
}

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