var pageMods = require('sdk/page-mod');
var pageMod;

var panel = require('sdk/panel').Panel({
	contentURL: "./panel.html",
	contentScriptFile: "./panel.js",
	focus: false,
	onHide: function() {
//		if(prefs.markVisited) { pageMod.port.emit('addHistory', this.curSrc) }
//		pageWorker.contentURL = "about:blank";
	}
});
panel.port.on('click', function() { panel.hide(); pageMod.port.emit('click') });
panel.port.on('hide', function() { panel.hide() });
panel.port.on('wheel', function(delta) { pageWorker.port.emit('wheel', delta) });
panel.build = function(img, x, y, txt) {
	txt = txt || "";
	if((x > this.windowX) || (y > this.windowY)) {
		var rX = this.windowX / x;
		var rY = this.windowY / y;
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
	this.port.emit('image', img, x, y, txt);
	this.resize(x, y);
	this.show();
//	console.log("panel img: "+img+" "+x+","+y+" ("+this.windowX+","+this.windowY+") ("+this.imgNumber+" of "+this.imgTotal+")");
}
panel.winSize = function(winX, winY) {
	this.windowX = winX * 0.95 || this.windowX;
	this.windowY = winY * 0.95 || this.windowY;
}

var pageWorker = require('sdk/page-worker').Page({
	contentURL: "about:blank",
	contentScriptFile: "./page-worker.js"
});
pageWorker.port.on('hide', function() { if(panel.isShowing) { panel.hide() } });
pageWorker.port.on('image', function(img, x, y, txt) { panel.build(img, x, y, txt) });

var prefs = require('sdk/simple-prefs').prefs;
require('sdk/simple-prefs').on('', setPrefs);
function setPrefs() {
	var inc, exec;
	if(prefs.blacklist) {
		inc = ['*'];
		exc = prefs.domainlist.split(',');
	} else {
		inc = prefs.domainlist.split(',');
		exc = [];
	}
	pageMod = pageMods.PageMod({
		include: inc,
		exclude: exc,
		contentScriptFile: "./page-mod.js",
		contentScriptWhen: 'ready',
		attachTo: ['existing', 'top'],
		onAttach: function(worker) {
			worker.port.on('album', function(url) { pageWorker.contentURL = url }),
			worker.port.on('hide', function() { if(panel.isShowing) { panel.hide() } }),
			worker.port.on('image', function(img, x, y) { panel.build(img, x, y) }),
			worker.port.on('wheel', function(delta) { pageWorker.port.emit('wheel', delta) }),
			worker.port.on('winSize', function(winX, winY) { panel.winSize(winX, winY) })		
		}
	});
}
setPrefs();