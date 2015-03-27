var imgs = [];
var divs = document.getElementsByTagName('div');
for (var i = 0; i < divs.length; i++) {
	if(/item view/i.test(divs[i].class)) {
		imgs.push() = divs[i].getElementsByTagName('a')[0].innerHTML;
	}
}
if(imgs.length) { self.port.emit('album', imgs) }

console.log("album: "+document.URL)