(function() {
	/**
		@name showSrc
		@function
		@description Makes script blocks (with a class of "showSrc") visible on the page.
	 */

	function showSrc() {
		var scriptElements, // the existing SCRIPT elements on the page
			code,           // the filtered contents of each SCRIPT element
			preElement,     // the PRE element we are injecting into the page with the code
			css,            // the css added to the page to make the PRE content pretty
			styleElement;   // the STYLE element we are injecting into the page with the css
		
		// inject css into the page
		// assumes the new PRE elements will have a className of "src"
		css = ".src { border: 1px dashed #ccc; padding: 8px; }";
		
		styleElement = document.createElement("style");
		styleElement.type = "text/css";
		if (styleElement.styleSheet) { styleElement.styleSheet.cssText = css; }
		else { styleElement.appendChild( document.createTextNode(css) ); }
		
		document.getElementsByTagName("head")[0].appendChild(styleElement);
		
		// inject PRE elements next to SCRIPT elements (if they have class == showSrc)
		scriptElements = document.getElementsByTagName("script");
		
		for (var i = 0; i < scriptElements.length; i++) {
			if ((" "+scriptElements[i].className+" ").indexOf(" showSrc ") > -1) {
				// filter code so it can be safely displayed
				code = scriptElements[i].innerHTML
					.replace("// <![CDATA[", "").replace("// ]]>", "")
					.replace(/</g, "&lt;").replace(/>/g, "&gt;")
					.replace(/\t/g, "    ")
					.replace(/^(\s*[\n\r\f])*/, "").replace(/\s*$/, "")
					.replace(/[\n\r\f]/g, "<br />");
				code = shiftLeft(code);
				
				preElement = document.createElement("pre");
				preElement.className = "src";
				preElement.innerHTML = "<code style='white-space: pre;'>"+code+"<\/code>";
				scriptElements[i].parentNode.insertBefore(preElement, scriptElements[i]);
			}
		}
	}
	
	/**
		@name shiftLeft
		@private
		@function
		@param {String} code The code to be shifted.
		@type String
		@description Trim leading spaces from code, while keeping the overall
		indentation levels the same.
	 */
	function shiftLeft(code) {
		var padding; // the extra spaces found at the beginning of the first line of code
		
		// assumes all indentation characters are spaces
		padding = code.match(/^( +)\S/);
		if (padding.length) { padding = padding[1]; }
		
		return code.replace(new RegExp("(^|[\n\r\f])"+padding, "g"), "$1");
	}
	
	// when included in the body this function becomes anonymous and self-invoking
	// when included in the head you must call it yourself (after the body arrives)
	if (document.getElementsByTagName("body").length) {
		showSrc();
	}
	else {
		window.showSrc = showSrc;
	}
})();

