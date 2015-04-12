var pageMods = require('sdk/page-mod');
var pageMod;
var pageWorker;

var panel = require('sdk/panel').Panel({
	contentURL: "./panel.html",
	contentScriptFile: "./panel.js",
	focus: false,
	onHide: function() {
//		if(prefs.markVisited) { pageMod.port.emit('addHistory', this.curSrc) }
		pageMod.port.emit('mouseOff');
		pageWorker.contentURL = "about:blank";
	}
});
panel.port.on('click', function() { pageMod.port.emit('click'); panel.hide()});
panel.port.on('hide', function() { panel.hide() });
panel.port.on('wheel', function(delta) { pageWorker.port.emit('wheel', delta) });
panel.findSize = function(x, y) {
	if((x > this.windowX) || (y > this.windowY)) {
		var rX = (this.windowX * (prefs.maxSize / 100)) / x;
		var rY = (this.windowY * (prefs.maxSize / 100)) / y;
		if(rX < rY) {
			x = x * rX;
			y = y * rX;
		} else {
			x = x * rY;
			y = y * rY;
		}
	}
	return [Math.round(x),Math.round(y)];
}
panel.showImage = function(img, x, y, txt) {
	[rX, rY] = this.findSize(x, y);
	this.port.emit('image', img, rX, rY, txt);
	if(this.isShowing) {
		this.position = {top:0, left:0};
	} else {
		this.resize(rX, rY);
		this.show();
	}
//	console.log("panel img: "+img+" "+x+","+y+" ("+this.windowX+","+this.windowY+") ("+this.imgNumber+" of "+this.imgTotal+")");
}
panel.showVideo = function(vid, x, y, txt) {
	[rX, rY] = this.findSize(x, y);
	this.port.emit('video', vid, rX, rY, txt);
	this.resize(rX, rY);
	this.show();
}
panel.winSize = function(winX, winY) {
	this.windowX = winX || this.windowX;
	this.windowY = winY || this.windowY;
//	console.log("window size: "+this.windowX+","+this.windowY);
}

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
		contentScriptOptions: { 'delay': prefs.delay },
		attachTo: ['existing', 'top'],
		onAttach: function(worker) {
			worker.port.on('hide', function() { if(panel.isShowing) { panel.hide() } }),
			worker.port.on('image', function(img, x, y) { panel.showImage(img, x, y) }),
			worker.port.on('wheel', function(delta) { pageWorker.port.emit('wheel', delta) }),
			worker.port.on('winSize', function(winX, winY) { panel.winSize(winX, winY) }),
			worker.port.on('worker', function(url) { pageWorker.contentURL = url })
		}
	});
	pageWorker = require('sdk/page-worker').Page({
		contentURL: "about:blank",
		contentScriptFile: "./page-worker.js",
		contentScriptOptions: { 'delay': prefs.delay }
	});
	pageWorker.port.on('hide', function() { if(panel.isShowing) { panel.hide() } });
	pageWorker.port.on('image', function(img, x, y, txt) { panel.showImage(img, x, y, txt) });
	pageWorker.port.on('video', function(vid, x, y, txt) { panel.showVideo(vid, x, y, txt) });
}
setPrefs();