
var buildToTest = decodeURIComponent((window.location.search.match(/build=([^&]+)/) || ["", "src"])[1]);

function moduleLocation (mod) {
	if (buildToTest == 'src') { return 'src/' + mod; }
	var base = 'dist/';
	var dist;
	MANI: for (var i in manifest) {
		for (var j = 0, length = manifest[i].length; j < length; j++) {
			if (manifest[i][j] == mod) {
				dist = i;
				break MANI;
			}
		}
	}
	if (! dist) { throw "could not find module " + mod + " in manifest"; }
	if (buildToTest == 'dist') {
		return base + dist;
	} else if (buildToTest == 'lite') {
		return base + dist.replace(/.js$/, ".lite.js");
    } else if (buildToTest == 'debug') {
		return base + dist.replace(/.js$/, ".debug.js");
	} else {
		throw "build parameter must be src, dist, lite or debug";
	}
}

var loadPrefix = '../';

var loaded = {};
function require (js) {
	if (loaded[js]) { return; }
	loaded[js] = true;
	document.write('<' + 'script type="text/javascript" src="' + loadPrefix + js + '"><' + '/script>');
}

