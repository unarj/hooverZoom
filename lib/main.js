var pageMod = require('sdk/page-mod');

var panel = require('sdk/panel').Panel({
	contentURL: "./panel.html",
	contentScriptFile: "./panel.js",
	focus: false,
	onHide: function() { pageWorker.contentURL = "about:blank" },
	imgNumber: 0,
	imgTotal: 0
});
panel.port.on('hide', function() { panel.hide() });
//panel.port.on('wheel', function(delta) { pageWorker.port.emit('wheel', delta) })
panel.build = function(img, x, y, winX, winY, num, total) {
	this.imgNumber = num || 1;
	this.imgTotal = total || 1;
	total = total || 1;
	winX = winX * 0.95;
	winY = winY * 0.95;
	if((x > winX) || (y > winY)) {
		var rX = winX / x;
		var rY = winY / y;
		if(rX > rY) {
			x = x * rY;
			y = y * rY;
		} else {
			x = x * rX;
			y = y * rX;
		}
	}
	x = Math.round(x);
	y = Math.round(y);
	this.port.emit('image', img, x, y);
	this.resize(x, y);
	this.show();
	console.log("panel img: "+img+" "+x+","+y+" ("+winX+","+winY+") ("+num+" of "+total+")");
}

var pageWorker = require('sdk/page-worker').Page({
	contentURL: "about:blank",
	contentScriptFile: "./page-worker.js",
	onAttach: function(worker) {
		worker.port.on('hide', function() { if(panel.isShowing) { panel.hide() } })
		worker.port.on('image', function(img, x, y, winX, winY, num, total) { panel.build(img, x, y, winX, winY, num, total) })
	}
});

var prefs = require('sdk/simple-prefs').prefs;
require('sdk/simple-prefs').on('', setPrefs);
function setPrefs() {
	var inc, exec
	if(prefs.blacklist) {
		inc = ['*'];
		exc = prefs.domainlist.split(',');
	} else {
		inc = prefs.domainlist.split(',');
		exc = [];
	}
	pageMod.PageMod({
		include: inc,
		exclude: exc,
		contentScriptFile: "./page-mod.js",
		contentScriptWhen: 'ready',
		onAttach: function(worker) {
			worker.port.on('album', function(url) { pageWorker.contentURL = url }),
			worker.port.on('hide', function() { if(panel.isShowing) { panel.hide() } }),
			worker.port.on('image', function(img, x, y, winX, winY) { panel.build(img, x, y, winX, winY, 1, 1) }),
			worker.port.on('wheel', function(delta) { pageWorker.port.emit('wheel', delta) })
		}
	});
}
setPrefs();