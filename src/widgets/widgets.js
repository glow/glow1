/**
 * @name glow.widgets
 * @namespace
 * @description Widget core module.
 * 		The glow.widgets module contains generic functionality used by our
 * 		widgets, but currently no public API.
 */
(window.gloader || glow).module({
	name: "glow.widgets",
	library: ["glow", "@VERSION@"],
	depends: [["glow", "@VERSION@", 'glow.dom', 'glow.events']],
	builder: function(glow) {
		var doc,
			docBody,
			env = glow.env;
		
		glow.ready(function() {
			doc = document;
			docBody = doc.body;
			
			//check if css or images are disabled, add class name "glow-basic" to body if they aren't
			var testDiv = glow.dom.create('<div class="glowCSSVERSION-cssTest" style="height:0;position:absolute;visibility:hidden;top:-20px;display:block"></div>').appendTo(docBody);
			
			// not testing for height as that break in some browsers' 'zoom' implementations
			if (testDiv.css("visibility") != 'hidden') {
				//css disabled
				docBody.className += " glowCSSVERSION-basic";
			} else {
				// block any further ready calls until our widgets CSS has loaded
				glow._addReadyBlock("glow_widgetsCSS");
				
				(function() {
					if (testDiv.css("z-index") != "1234") {
						//css hasn't loaded yet
						setTimeout( arguments.callee, 10 );
						return;
					}
					// BRING ON THE WALLLLL!
					glow._removeReadyBlock("glow_widgetsCSS");
					
					if (testDiv.css("background-image").indexOf("ctr.png") == -1) {
						docBody.className += " glowCSSVERSION-basic";
					}
				})();
			}
			
			//add some IE class names to the body to help widget styling
			env.ie && (docBody.className += " glowCSSVERSION-ie");
			//note: we apply the class "glow-ielt7" for IE7 if it's in quirks mode
			(env.ie < 7 || !env.standardsMode) && (docBody.className += " glowCSSVERSION-ielt7");
			//some rounding issues in firefox when using opacity, so need to have a workaround
			env.gecko && (docBody.className += " glowCSSVERSION-gecko");
		});
		
		
		glow.widgets = {
			/*
			PrivateMethod: _scrollPos
				Get the scroll position of the document. Candidate for moving into glow.dom?
			*/
			_scrollPos: function() {
				var win = window,
					docElm = env.standardsMode ? doc.documentElement : docBody;
				
				return {
					x: docElm.scrollLeft || win.pageXOffset || 0,
					y: docElm.scrollTop || win.pageYOffset || 0
				};
			}
		};
	}
});
