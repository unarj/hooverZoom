var pageMod = require('sdk/page-mod');

var panel = require('sdk/panel').Panel({
	contentURL: "./panel.html",
	contentScriptFile: "./panel.js",
	canShow: false,
	focus: false,
	onHide: function() {
		this.canShow = false;
	}
});
panel.port.on('hide', function() { panel.hide() });
panel.port.on('wheel', function(dir) { panel.hide() });
panel.doShow = function() { if(this.canShow) { this.show() } else { console.log("no showing!") } }
panel.build = function(img, x, y, winX, winY) {
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
	this.canShow = true;
	this.doShow();
//	console.log("panel img: "+img+" "+x+","+y+" ("+winX+","+winY+")");
}

var pageWorker = require('sdk/page-worker').Page({
	contentScriptFile: "./page-worker.js",
	onAttach: function(worker) {
		worker.port.on('image', function(img, x, y, winX, winY) { 
			panel.build(img, x, y, winX, winY);
		})
	}
});

var prefs = require('sdk/simple-prefs').prefs;
require('sdk/simple-prefs').on('', setPrefs);
function setPrefs() {
	var inc = ['*'];
	var exc = prefs.domainlist.split(',');
	if(!prefs.blacklist) {
		inc = prefs.domainlist.split(',');
		exc = [''];
	}
	pageMod.PageMod({
		include: inc,
		exclude: exc,
		contentScriptFile: "./page-mod.js",
		contentScriptWhen: 'ready',
		onAttach: function(worker) {
			worker.port.on('album', function(url) { pageWorker.contentURL = url }),
			worker.port.on('hide', function() { if(panel.isShowing) { panel.hide() } }),
			worker.port.on('image', function(img, x, y, winX, winY) { panel.build(img, x, y, winX, winY) })
		}
	});
}
setPrefs();