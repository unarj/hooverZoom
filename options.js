var prefs = {};
function debug(s){if(prefs.debug){ console.log('options: '+s) }}
var port = browser.runtime.connect();
port.onMessage.addListener(function(m){
	if(m.prefs){ 
		prefs = m.prefs;
		debug('prefs loaded');
		refresh();
	}
}, debug);
port.postMessage({ req:'getPrefs' });

var addHist, addHistOut, debugPref, delay, delayOut, keys, maxSize, maxSizeOut, scrapeList, srcBlock, textLoc;

function refresh(){
	debug('refreshing');
	addHist.value = prefs.addHist;
	addHistOut.value = prefs.addHist+'ms';
	debugPref.value = prefs.debug;
	delay.value = prefs.delay;
	delayOut.value = prefs.delay+'ms';
	keys.checked = prefs.keys;
	maxSize.value = prefs.maxSize;
	maxSizeOut.value = prefs.maxSize+'%';
	scrapeList.value = prefs.scrapeList;
	srcBlock.value = prefs.srcBlock;
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
	keys = document.getElementById('keys');
	maxSize = document.getElementById('maxSize');
	maxSizeOut = document.getElementById('maxSizeOut');
	maxSize.oninput = function(){ maxSizeOut.value = maxSize.value+'%' }
	scrapeList = document.getElementById('scrapeList');
	srcBlock = document.getElementById('srcBlock');
	textLoc = document.getElementById('textLoc');
	document.querySelector('form').addEventListener('submit', function(e){
		e.preventDefault();
		prefs.addHist = addHist.value;
		prefs.debug = debugPref.checked;
		prefs.delay = delay.value;
		prefs.keys = keys.checked;
		prefs.maxSize = maxSize.value;
		prefs.scrapeList = scrapeList.value;
		prefs.srcBlock = srcBlock.value;
		prefs.textLoc = textLoc.value;
		port.postMessage({ req:'savePrefs', 'prefs':prefs })
	});
	document.querySelector('form').addEventListener('reset', function(e){
		e.preventDefault();
		port.postMessage({ req:'resetPrefs' });
	});
	refresh();
});