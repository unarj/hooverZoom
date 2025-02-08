var prefs = {};
function hzDebug(s){if(prefs.debug){ window.console.log('options: '+s) }}
const port = browser.runtime.connect();
port.onMessage.addListener(function(m){
	if(m.prefs){ 
		prefs = m.prefs;
		hzDebug('prefs loaded');
		refresh();
	}
}, hzDebug);
port.postMessage({ req:'getPrefs' });

var addHist, addHistOut, debugPref, delay, delayOut, hImgur, hReddit, hTinypic, keys, maxSize, maxSizeOut, scrapeList, srcBlock, textLoc;

function refresh(){
	hzDebug('refreshing');
	addHist.value = prefs.addHist;
	addHistOut.value = prefs.addHist+'ms';
	debugPref.checked = prefs.debug;
	delay.value = prefs.delay;
	delayOut.value = prefs.delay+'ms';
	hImgur.checked = prefs.hImgur;
	hReddit.checked = prefs.hReddit;
	hTinypic.checked = prefs.hTinypic;
	keys.checked = prefs.keys;
	maxSize.value = prefs.maxSize;
	maxSizeOut.value = prefs.maxSize+'%';
	regexAutoFormat.checked = prefs.regexAutoFormat;
	scrapeList.value = prefs.scrapeList;
	scrapeListBlock.value = prefs.scrapeListBlock;
	srcBlock.value = prefs.srcBlock;
	srcBlockInvert.checked = prefs.srcBlockInvert;
	textLoc.value = prefs.textLoc;
	debugPref.checked = prefs.debug;
}

document.addEventListener('DOMContentLoaded', function(){
	addHist = document.getElementById('addHist');
	addHistOut = document.getElementById('addHistOut');
	addHist.oninput = function(){ addHistOut.value = addHist.value+'ms' }
	debugPref = document.getElementById('debug');
	delay = document.getElementById('delay');
	delayOut = document.getElementById('delayOut');
	delay.oninput = function(){ delayOut.value = delay.value+'ms' }
	hImgur = document.getElementById('hImgur');
	hReddit = document.getElementById('hReddit');
	hTinypic = document.getElementById('hTinypic');
	keys = document.getElementById('keys');
	maxSize = document.getElementById('maxSize');
	maxSizeOut = document.getElementById('maxSizeOut');
	maxSize.oninput = function(){ maxSizeOut.value = maxSize.value+'%' }
	regexAutoFormat = document.getElementById('regexAutoFormat');
	scrapeList = document.getElementById('scrapeList');
	scrapeListBlock = document.getElementById('scrapeListBlock');
	srcBlock = document.getElementById('srcBlock');
	srcBlockInvert = document.getElementById('srcBlockInvert');
	textLoc = document.getElementById('textLoc');
	document.querySelector('form').addEventListener('submit', function(e){
		e.preventDefault();
		prefs.addHist = addHist.value;
		prefs.debug = debugPref.checked;
		prefs.delay = delay.value;
		prefs.hImgur = hImgur.checked;
		prefs.hReddit = hReddit.checked;
		prefs.hTinypic = hTinypic.checked;
		prefs.keys = keys.checked;
		prefs.maxSize = maxSize.value;
		prefs.regexAutoFormat = regexAutoFormat.checked;
		prefs.scrapeList = scrapeList.value;
		prefs.scrapeListBlock = scrapeListBlock.value;
		prefs.srcBlock = srcBlock.value;
		prefs.srcBlockInvert = srcBlockInvert.checked;
		prefs.textLoc = textLoc.value;
		port.postMessage({ req:'savePrefs', 'prefs':prefs })
	});
	document.querySelector('form').addEventListener('reset', function(e){
		e.preventDefault();
		port.postMessage({ req:'resetPrefs' });
	});
	refresh();
});