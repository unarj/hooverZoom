const { Cc, Ci } = require('chrome');
var history = Cc["@mozilla.org/browser/history;1"].getService(Ci.mozIAsyncHistory);
var uri = Cc["@mozilla.org/docshell/urifixup;1"].createInstance(Ci.nsIURIFixup).createFixupURI;

var panel = require('sdk/panel').Panel({
	contentURL: "./panel.html",
	contentScriptFile: "./panel.js",
	focus: false,
	onHide: function() {
		pageMod.port.emit('album', false);
		pageWorker.contentURL = 'about:blank';
		this.curUrl = false;
	},
	onShow: function() {
		if(prefs.addHist && this.curUrl) {
			history.updatePlaces({ uri:uri(this.curUrl,0), visits:[{transitionType:1, visitDate:Date.now()*1000}] });
		}
	}
});
	panel.port.on('click', function(state) { pageMod.port.emit('click', state); panel.hide() });
	panel.port.on('hide', function() { panel.hide() });
	panel.port.on('wheel', function(delta) { pageWorker.port.emit('wheel', delta) });
	panel.findSize = function(x, y) {
		if(this.isShowing) {
			if((x > this.width) || (y > this.height)) {
				var rX = this.width / x;
				var rY = this.height / y;
			}
		} else {
			if((x > this.windowX) || (y > this.windowY)) {
				var rX = (this.windowX * (prefs.maxSize / 100)) / x;
				var rY = (this.windowY * (prefs.maxSize / 100)) / y;
			}
		}
		if(rX && rY) {
			if(rX < rY) {
				x = x * rX;
				y = y * rX;
			} else {
				x = x * rY;
				y = y * rY;
			}
		}
		return [Math.floor(x), Math.floor(y)];
	}
	panel.showImage = function(img, x, y, txt) {
		[rX, rY] = this.findSize(x, y);
		this.port.emit('image', img, rX, rY, txt);
		if(!this.isShowing) {
			this.resize(rX, rY);
			this.show();
		}
	}
	panel.showVideo = function(vid, x, y, txt) {
		[rX, rY] = this.findSize(x, y);
		this.port.emit('video', vid, rX, rY, txt);
		if(!this.isShowing) {
			this.resize(rX, rY);
			this.show();
		}
	}
	panel.winSize = function(winX, winY) {
		this.windowX = winX || this.windowX;
		this.windowY = winY || this.windowY;
//		console.log("window size: "+this.windowX+","+this.windowY);
	}

var pageModLib = require('sdk/page-mod');
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
	pageMod = pageModLib.PageMod({
		include: inc,
		exclude: exc,
		contentScriptFile: "./page-mod.js",
		contentScriptWhen: 'ready',
		attachTo: ['existing', 'top'],
		onAttach: function(worker) {
			worker.port.on('hide', function(delta) {
				if(panel.isShowing) { panel.hide() }
				pageWorker.port.emit('inspect', null);
				panel.curUrl = false;
			}),	
			worker.port.on('wheel', function(delta) { pageWorker.port.emit('wheel', delta) }),
			worker.port.on('winSize', function(winX, winY) { panel.winSize(winX, winY) }),
			worker.port.on('worker', function(url) {
				pageWorker.port.emit('inspect', url);
				panel.curUrl = url;
			})
		}
	});
	pageWorker = require('sdk/page-worker').Page({
		contentURL: 'about:blank',
		contentScriptFile: "./page-worker.js",
		contentScriptOptions: { 'delay': prefs.delay },
		contentScriptWhen: 'ready'
	});
	pageWorker.port.on('album', function(state) { pageMod.port.emit('album', state) });
	pageWorker.port.on('hide', function() { if(panel.isShowing) { panel.hide() } });
	pageWorker.port.on('load', function(url) { pageWorker.contentURL = url });
	pageWorker.port.on('image', function(img, x, y, txt) { panel.showImage(img, x, y, txt) });
	pageWorker.port.on('video', function(vid, x, y, txt) { panel.showVideo(vid, x, y, txt) });
}
setPrefs();
