var hzImgs = [];
var hzImgNum = 0;
var hzImage = new Image;
hzImage.onerror = function() {
//	document.body.style.cursor = 'auto';
	self.port.emit('hide');
}
hzImage.onload = function() {
//	document.body.style.cursor = 'auto';
	self.port.emit('image', this.src, this.width, this.height, window.innerWidth, window.innerHeight, hzImgNum, hzImgs.length);
}

console.log("pageWorker: "+document.URL);
var t = document.createElement('a');
t.href = document.URL;
var p = t.hostname.split('.').reverse();
switch(p[1]+"."+p[0]) {
	case "imgur.com":
		var divs = document.getElementsByTagName('div');
		for (var i = 0; i < divs.length; i++) {
			if(/item view/i.test(divs[i].class)) {
				hzImgs.push() = divs[i].getElementsByTagName('a')[0].href;
			}
		}
		break;
}

console.log(hzImgs);
if(hzImgs.length) {
	hzCount = 0;
	hzImage.src = hzImgs[0];
}

self.port.on('wheel', function(delta) {
	if(delta > 0) {
		hzImgNum++;
		if(hzImgNum > hzImgs.length) { hzCount = 0 }
	} else {
		hzCount--;
		if(hzCount < 0) { hzImgNum = hzImgs.length }
	}
	hzImage.src = hzImgs[hzImgNum];
});