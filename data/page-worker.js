var hzImgs = [];
var hzImgNum = 0;
var hzImage = new Image;
hzImage.onerror = function() {
//	document.body.style.cursor = 'auto';
	self.port.emit('hide');
}
hzImage.onload = function() {
//	document.body.style.cursor = 'auto';
	self.port.emit('image', this.src, this.width, this.height);
}

console.log("pageWorker: "+document.URL);
var t = document.createElement('a');
t.href = document.URL;
var p = t.hostname.split('.').reverse();
switch(p[1]+"."+p[0]) {
	case "imgur.com":
		var els = document.getElementsByTagName('div');
		console.log(els.length);
		for(var i=0, l=els.length; i < l; i++) {
			if(els[i].getAttribute('class') == "image") {
				var img = t.protocol+"//i.imgur.com/"+els[i].getAttribute('id')+".jpg";
				new Image().src = img;
				hzImgs.push(img);
			}
		}
		break;
}

console.log(hzImgs);
if(hzImgs.length > 0) {
	hzImage.src = hzImgs[hzImgNum];
//	console.log("pageWorker sending: "+hzImgs[hzImgNum]);
}

self.port.on('wheel', function(delta) {
	if(delta > 0) {
		hzImgNum++;
		if(hzImgNum > hzImgs.length-1) { hzImgNum = 0 }
	} else {
		hzImgNum--;
		if(hzImgNum < 0) { hzImgNum = hzImgs.length-1 }
	}
	hzImage.src = hzImgs[hzImgNum];
	console.log("pageWorker sending: "+hzImgs[hzImgNum]+" ("+(hzImgNum+1)+" of "+hzImgs.length+")");
});