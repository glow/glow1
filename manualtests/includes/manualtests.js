/**
@name manualTests
@namespace
@description Manages the files and interface for manual tests
*/
// global namespace for manualTest
var manualTests = (function() {
	
	var manualTests = {},
		repoRoot = getRepoRoot();
	
	var devConfig = {
		// root of the cloned copy of glow
		repoRoot: 	 repoRoot,
		gloaderPath: repoRoot + '../gloader/src/gloader.js',
		mapPath:	 repoRoot + 'srcloader/map.js',
		basePath:	 repoRoot + 'src/'
	};
	
	var liveConfig = {
		// root of the cloned copy of glow
		repoRoot: 	 repoRoot,
		gloaderPath: 'http://node1.bbcimg.co.uk/glow/gloader.0.1.0.js',
		mapPath:	 'http://node1.bbcimg.co.uk/glow/glow/map.1.5.1.js',
		basePath:	 ''
	};
	
	/**
	@name manualTests.config
	@type Object
	@description Config options & paths for the manual tests
	*/
	manualTests.config = devConfig;
	
	// gets a relative path to the repo root including trailing slash
	function getRepoRoot() {
		var lastScriptElm = ( document.body || document.getElementsByTagName('head')[0] ).lastChild;
		return lastScriptElm.src.replace('manualtests.js', '../../');
	}
	
	// output the source for a given script element
	function revealSrcFor(scriptElm) {
		// filter code so it can be safely displayed
		var code = getSource( scriptElm ),
			preElement = document.createElement("pre");
		
		preElement.style.border = '1px solid #ccc';
		preElement.style.padding = '10px';
		preElement.className = "src";
		preElement.innerHTML = "<code>" + code + "<\/code>";
		scriptElm.parentNode.insertBefore(preElement, scriptElm);
	}
	
	// gets the source for a given script element, tidies it up, returns an html string
	function getSource( scriptElm ) {
		var code = scriptElm.innerHTML;
		
		// trim empty lines at start & end
		code = code.replace(/^\s*\n|\n\s*$/g, '');
		
		// match the initial spacing of the first line, so we can shift it left
		var initialWhiteSpaceRe = new RegExp("^" + code.match(/^\s*/)[0], "mg");
		
		code = code.replace(initialWhiteSpaceRe, '')
			.replace("// <![CDATA[", "").replace("// ]]>", "")
			// simple html encoding
			.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;")
			// tabs to spaces
			.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;")
			// change newlines to <br />
			.replace(/\n\r?/g, "<br />");
			
		return code;
	}
	
	/**
	@name manualTests.showSrc
	@function
	@description Outputs script elements with a given class so they can be read
	
	@param {String} [className=showSrc] Only show scripts with this classname
	*/
	manualTests.showSrc = function(className) {
		var classNamePadded = ' ' + (className || 'showSrc') + ' ';
		
		var scriptElms = document.getElementsByTagName('script'),
			i = scriptElms.length;
		
		while (i--) {
			// does the script element have the class name?
			if ( (' ' + scriptElms[i].className + ' ').indexOf(classNamePadded) != -1 ) {
				revealSrcFor(scriptElms[i]);
			}
		}
	}
	return manualTests;
})();