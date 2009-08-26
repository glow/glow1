/**
@name glow.dom
@namespace
@description Accessing and manipulating the DOM
@see <a href="../furtherinfo/creatingnodelists/">Creating NodeLists</a>
@see <a href="../furtherinfo/workingwithnodelists/">Working with NodeLists</a>
@see <a href="../furtherinfo/xmlnodelists/">XML NodeLists</a>
*/
(window.gloader || glow).module({
	name: "glow.dom",
	library: ["glow", "@VERSION@"],
	depends: [],
	builder: function(glow) {
		//private
		var env = glow.env,
			lang = glow.lang,
		/*
		PrivateVar: cssRegex
			For matching CSS selectors
		*/
			cssRegex = {
				tagName: /^(\w+|\*)/,
				combinator: /^\s*([>]?)\s*/,
				//safari 1.3 is a bit dim when it comes to unicode stuff, only dot matches them (not even \S), so some negative lookalheads are needed
				classNameOrId: (env.webkit < 417) ? new RegExp("^([\\.#])((?:(?![\\.#\\[:\\s\\\\]).|\\\\.)+)") : /^([\.#])((?:[^\.#\[:\\\s]+|\\.)+)/
			},
			//for escaping strings in regex
			regexEscape = /([$^\\\/()|?+*\[\]{}.-])/g,

		/*
		PrivateVar: cssCache
			Cache of arrays representing an execution path for css selectors
		*/
			cssCache = {},

		/*
		PrivateVar: dom0PropertyMapping
			Mapping of HTML attribute names to DOM0 property names.
		*/
			dom0PropertyMapping = {
				checked    : "checked",
				"class"    : "className",
				"disabled" : "disabled",
				"for"      : "htmlFor",
				maxlength  : "maxLength"
			},

		/*
		PrivateVar: dom0BooleanAttribute
			The HTML attributes names that should be converted from true/false
			to ATTRIBUTENAME/undefined (i.e. boolean attributes like checked="checked").
		*/
			dom0BooleanAttribute = {
				checked  : true,
				disabled : true
			},

		/*
		PrivateVar: dom0AttributeMappings
			Functions that map dom0 values to sane ones.
		*/
			dom0AttributeMappings = {
				maxlength : function (val) { return val.toString() == "2147483647" ? undefined : val; }
			},
		/*
		PrivateVar: ucheck
			Used by unique(), increased by 1 on each use
		*/
			ucheck = 1,
		/*
		PrivateVar: ucheckPropName
			This is the property name used by unique checks
		*/
			ucheckPropName = "_unique" + glow.UID,
			
		/**
			@name glow.dom-dataPropName
			@private
			@type String
			@description The property name added to the DomElement by the NodeList#data method.
		*/
			dataPropName = "_glowData" + glow.UID,
		
		/**
			@name glow.dom-dataIndex
			@private
			@type String
			@description The value of the dataPropName added by the NodeList#data method.
		*/
			dataIndex = 0,
			
		/**
			@name glow.dom-dataCache
			@private
			@type Object
			@description Holds the data used by the NodeList#data method.
			
			The structure is like:
			[
				{
					myKey: "my data"
				}
			]
		*/
			dataCache = [],
		
		/*
		PrivateVar: htmlColorNames
			Mapping of colour names to hex values
		*/
			htmlColorNames = {
				black: 0,
				silver: 0xc0c0c0,
				gray: 0x808080,
				white: 0xffffff,
				maroon: 0x800000,
				red: 0xff0000,
				purple: 0x800080,
				fuchsia: 0xff00ff,
				green: 0x8000,
				lime: 0xff00,
				olive: 0x808000,
				yellow: 0xffff00,
				navy: 128,
				blue: 255,
				teal: 0x8080,
				aqua: 0xffff,
				orange: 0xffa500
			},
		/*
		PrivateVar: usesYAxis
			regex for detecting which css properties need to be calculated relative to the y axis
		*/
			usesYAxis = /height|top/,
			colorRegex = /^rgb\(([\d\.]+)(%?),\s*([\d\.]+)(%?),\s*([\d\.]+)(%?)/i,
			cssPropRegex = /^(?:(width|height)|(border-(top|bottom|left|right)-width))$/,
			hasUnits = /width|height|top$|bottom$|left$|right$|spacing$|indent$|font-size/,
			//append gets set to a function below
			append,
			//unique gets set to a function below
			unique,
			//we set this up at the end of the module
			placeholderElm,
			//getByTagName gets get to a function below
			getByTagName,
			win = window,
			doc = document,
			docBody,
			docElm,
			// true if properties of a dom node are cloned when the node is cloned (eg, true in IE)
			nodePropertiesCloned,
			// used to convert divs to strings
			tmpDiv = doc.createElement("div"),
			/*
			PrivateVars: tableArray, elmFilter
				Used in private function stringToNodes to capture any 
				elements that cannot be a childNode of <div>.
					Each entry in JSON responds to an element.
					First array value is how deep the element will be created in a node tree.
					Second array value is the beginning of the node tree.
					Third array value is the end of the node tree.
			*/
			tableArray = [1, '<table>', '</table>'],
			emptyArray = [0, '', ''],
			// webkit won't accept <link> elms to be the only child of an element,
			// it steals them and hides them in the head for some reason. Using
			// broken html fixes it for some reason
			paddingElmArray = env.webkit < 526 ? [0, '', '</div>', true] : [1, 'b<div>', '</div>'],
			trArray = [3, '<table><tbody><tr>', '</tr></tbody></table>'],
			elmWraps = {
				caption: tableArray,
				thead: tableArray,
				th: trArray,
				colgroup: tableArray,
				tbody: tableArray,
				tr: [2, '<table><tbody>', '</tbody></table>'],
				td: trArray,
				tfoot: tableArray,
				option: [1, '<select>', '</select>'],
				legend: [1, '<fieldset>', '</fieldset>'],
				link: paddingElmArray,
				script: paddingElmArray,
				style: paddingElmArray
			};
		
		// clean up IE's mess
		if (env.ie) {
			window.attachEvent("onunload", function() {
				tmpDiv = null;
			});
		}
		
		glow.ready(function() {
			docBody = doc.body;
			docElm = doc.documentElement;
		});
		
		
		// test for nodePropertiesCloned
		(function() {
			var div = doc.createElement("div");
			div.a = 1;
			nodePropertiesCloned = !!div.cloneNode(true).a;
		})();

		/*
		PrivateMethod: removeClassRegex
			Get a regex that can be used to remove a class from a space separated list of classes.

		Arguments:
			name - (string) the name of the class.

		Returns:
			The regex.
		*/
		function removeClassRegex (name) {
			return new RegExp(["(^|\\s)", name.replace(regexEscape, "\\$1"), "($|\\s)"].join(""), "g");
		}


		/*
		PrivateMethod: stringToNodes
			Creates an array of nodes from a string
		*/
		function stringToNodes(str) {
			var r = [],
				tagName = (/^\s*<([^\s>]+)/.exec(str) || [,'div'])[1],
				// This matches str content with potential elements that cannot
				// be a child of <div>.  elmFilter declared at top of page.
				elmWrap = elmWraps[tagName] || emptyArray, 
				nodeDepth,
				childElm,
				rLen = 0;
			
			// Create the new element using the node tree contents available in filteredElm.
			tmpDiv.innerHTML = (elmWrap[1] + str + elmWrap[2]);
			
			childElm = tmpDiv;
			
			// Strip newElement down to just the required element and its parent
			nodeDepth = elmWrap[0];
			while(nodeDepth--) {
				childElm = childElm.lastChild;
			}

			// pull nodes out of child
			while (childElm.firstChild) {
				r[rLen++] = childElm.removeChild(childElm.firstChild);
			}
			
			childElm = null;
			
			return r;
		}

		/*
		PrivateMethod: nodelistToArray
			Converts a w3 NodeList to an array
		*/
		function nodelistToArray(nodelist) {
			var r = [], i = 0;
			for (; nodelist[i]; i++) {
				r[i] = nodelist[i];
			}
			return r;
		}

		/*
		PrivateMethod: setAttribute
			Sets the attribute in the nodelist using the supplied function.

		Arguments:
			value - (String|Function) the value/value generator.
			attributeSetter - (Function) a function that can be called to actually set the attribute.

		Returns:
			The <NodeList> object.
		*/
		// is marginal having this separated out as it is only used twice and call is almost as big
		// leaving it separate for now for once and only once, as well as in case attr does some more mutating stuff
		// could be merged back with attr later
		function setAttribute (value, attributeSetter) {
			for (var that = this, i = 0, length = that.length; i < length; i++) {
				attributeSetter.call(
					that[i],
					value.call ?
						value.call(that[i], i) :
						value
				);
			}
			return that;
		}


		/*
		PrivateMethod: append
			append the nodes in "b" to the array / list "a"
		*/
		//return different function for IE & Opera to deal with their stupid bloody expandos. Pah.
		if (document.all) {
			append = function(a, b) {
				var i = 0,
					ai = a.length,
					length = b.length;
				if (typeof b.length == "number") {
					for (; i < length; i++) {
						a[ai++] = b[i];
					}
				} else {
					for (; b[i]; i++) {
						a[ai++] = b[i];
					}
				}
			};
		} else {
			append = function(a, b) {
				var i = 0, ai = a.length;
				for (; b[i]; i++) {
					a[ai++] = b[i];
				}
			};
		}

		/*
		PrivateMethod: isXml
			Is this node an XML Document node or within an XML Document node

		Arguments:
			node

		Returns:
			Bool
		*/
		function isXml(node) {
			//test for nodes within xml element
			return  (node.ownerDocument && !node.ownerDocument.body) ||
					//test for xml document elements
					(node.documentElement && !node.documentElement.body);
		}

		/*
		PrivateMethod: unique
			Get an array of nodes without duplicate nodes from an array of nodes.

		Arguments:
			aNodes - (Array|<NodeList>)

		Returns:
			An array of nodes without duplicates.
		*/
		//worth checking if it's an XML document?
		if (env.ie) {
			unique = function(aNodes) {
				if (aNodes.length == 1) { return aNodes; }

				//remove duplicates
				var r = [],
					ri = 0,
					i = 0;

				for (; aNodes[i]; i++) {
					if (aNodes[i].getAttribute(ucheckPropName) != ucheck && aNodes[i].nodeType == 1) {
						r[ri++] = aNodes[i];
					}
					aNodes[i].setAttribute(ucheckPropName, ucheck);
				}
				for (i=0; aNodes[i]; i++) {
					aNodes[i].removeAttribute(ucheckPropName);
				}
				ucheck++;
				return r;
			}
		} else {
			unique = function(aNodes) {
				if (aNodes.length == 1) { return aNodes; }

				//remove duplicates
				var r = [],
					ri = 0,
					i = 0;

				for (; aNodes[i]; i++) {
					if (aNodes[i][ucheckPropName] != ucheck && aNodes[i].nodeType == 1) {
						r[ri++] = aNodes[i];
					}
					aNodes[i][ucheckPropName] = ucheck;
				}
				ucheck++;
				return r;
			}
		}

		/*
		PrivateMethod: getElementsByTag
			Get elements by a specified tag name from a set of context objects. If multiple
			context objects are passed, then the resulting array may contain duplicates. See
			<unique> to remove duplicate nodes.

		Arguments:
			tag - (string) Tag name. "*" for all.
			contexts - (array) DOM Documents and/or DOM Elements to search in.

		Returns:
			An array(like) collection of elements with the specified tag name.
		*/
		if (document.all) { //go the long way around for IE (and Opera)
			getByTagName = function(tag, context) {
				var r = [], i = 0;
				for (; context[i]; i++) {
					//need to check .all incase data is XML
					//TODO: Drop IE5.5
					if (tag == "*" && context[i].all && !isXml(context[i])) { // IE 5.5 doesn't support getElementsByTagName("*")
						append(r, context[i].all);
					} else {
						append(r, context[i].getElementsByTagName(tag));
					}
				}
				return r;
			};
		} else {
			getByTagName = function(tag, context) {
				var r = [], i = 0, len = context.length;
				for (; i < len; i++) {
					append(r, context[i].getElementsByTagName(tag));
				}
				return r;
			};
		}
		
		/*
			Get the child elements for an html node
		*/
		function getChildElms(node) {
			var r = [],
				childNodes = node.childNodes,
				i = 0,
				ri = 0;
			
			for (; childNodes[i]; i++) {
				if (childNodes[i].nodeType == 1 && childNodes[i].nodeName != "!") {
					r[ri++] = childNodes[i];
				}
			}
			return r;
		}
		
		
		var horizontalBorderPadding = [
				'border-left-width',
				'border-right-width',
				'padding-left',
				'padding-right'
			],
			verticalBorderPadding = [
				'border-top-width',
				'border-bottom-width',
				'padding-top',
				'padding-bottom'
			];
		
		/*
		PrivateMethod: getElmDimension
			Gets the size of an element as an integer, not including padding or border
		*/		
		function getElmDimension(elm, cssProp /* (width|height) */) {
			var r, // val to return
				docElmOrBody = env.standardsMode ? docElm : docBody,
				isWidth = (cssProp == "width"),
				cssPropCaps = isWidth ? "Width" : "Height",
				cssBorderPadding;

			if (elm.window) { // is window
				r = env.webkit < 522.11 ? (isWidth ? elm.innerWidth				: elm.innerHeight) :
					env.webkit			? (isWidth ? docBody.clientWidth		: elm.innerHeight) :
					env.opera < 9.5		? (isWidth ? docBody.clientWidth		: docBody.clientHeight) :
					/* else */			  (isWidth ? docElmOrBody.clientWidth	: docElmOrBody.clientHeight);

			}
			else if (elm.getElementById) { // is document
				r = Math.max(
					docBody["scroll" + cssPropCaps],
					docBody["offset" + cssPropCaps],
					docElm["client" + cssPropCaps],
					docElm["offset" + cssPropCaps],
					docElm["scroll" + cssPropCaps]
				)
			}
			else {
				// get an array of css borders & padding
				cssBorderPadding = isWidth ? horizontalBorderPadding : verticalBorderPadding;
				r = elm['offset' + cssPropCaps] - parseInt( getCssValue(elm, cssBorderPadding) );
			}
			return r;
		}

		/*
		PrivateMethod: getBodyElm
			Gets the body elm for a given element. Gets around IE5.5 nonsense. do getBodyElm(elm).parentNode to get documentElement
		*/
		function getBodyElm(elm) {
			if (env.ie < 6) {
				return elm.document.body;
			} else {
				return elm.ownerDocument.body;
			}
		}

		/*
		PrivateMethod: setElmsSize
			Set element's size

		Arguments:
			elms - (<NodeList>) Elements
			val - (Mixed) Set element height / width. In px unless stated
			type - (String) "height" or "width"

		Returns:
			Nowt.
		*/
		function setElmsSize(elms, val, type) {
			if (typeof val == "number" || /\d$/.test(val)) {
				val += "px";
			}
			for (var i = 0, len = elms.length; i < len; i++) {
				elms[i].style[type] = val;
			}
		}

		/*
		PrivateMethod: toStyleProp
			Converts a css property name into its javascript name, such as "background-color" to "backgroundColor".

		Arguments:
			prop - (String) CSS Property name

		Returns:
			String, javascript style property name
		*/
		function toStyleProp(prop) {
			if (prop == "float") {
				return env.ie ? "styleFloat" : "cssFloat";
			}
			return lang.replace(prop, /-(\w)/g, function(match, p1) {
				return p1.toUpperCase();
			});
		}

		/*
		PrivateMethod: tempBlock
			Gives an element display:block (but keeps it hidden) and runs a function, then sets the element back how it was

		Arguments:
			elm - element
			func - function to run

		Returns:
			Return value of the function
		*/
		function tempBlock(elm, func) {
			//TODO: rather than recording individual style properties, just cache cssText? This was faster for getting the element size
			var r,
				elmStyle = elm.style,
				oldDisp = elmStyle.display,
				oldVis = elmStyle.visibility,
				oldPos = elmStyle.position;

			elmStyle.visibility = "hidden";
			elmStyle.position = "absolute";
			elmStyle.display = "block";
			if (!isVisible(elm)) {
				elmStyle.position = oldPos;
				r = tempBlock(elm.parentNode, func);
				elmStyle.display = oldDisp;
				elmStyle.visibility = oldVis;
			} else {
				r = func();
				elmStyle.display = oldDisp;
				elmStyle.position = oldPos;
				elmStyle.visibility = oldVis;
			}
			return r;
		}

		/*
		PrivateMethod: isVisible
			Is the element visible?
		*/
		function isVisible(elm) {
			//this is a bit of a guess, if there's a better way to do this I'm interested!
			return elm.offsetWidth ||
				elm.offsetHeight;
		}

		/*
		PrivateMethod: getCssValue
			Get a computed css property

		Arguments:
			elm - element
			prop - css property or array of properties to add together

		Returns:
			String, value
		*/
		function getCssValue(elm, prop) {
			var r, //return value
				total = 0,
				i = 0,
				propLen = prop.length,
				compStyle = doc.defaultView && (doc.defaultView.getComputedStyle(elm, null) || doc.defaultView.getComputedStyle),
				elmCurrentStyle = elm.currentStyle,
				oldDisplay,
				match,
				propTest = prop.push || cssPropRegex.exec(prop) || [];


			if (prop.push) { //multiple properties, add them up
				for (; i < propLen; i++) {
					total += parseInt( getCssValue(elm, prop[i]), 10 ) || 0;
				}
				return total + "px";
			}
			
			if (propTest[1]) { // is width / height
				if (!isVisible(elm)) { //element may be display: none
					return tempBlock(elm, function() {
						return getElmDimension(elm, propTest[1]) + "px";
					});
				}
				return getElmDimension(elm, propTest[1]) + "px";
			}
			else if (propTest[2] //is border-*-width
				&& glow.env.ie
				&& getCssValue(elm, "border-" + propTest[3] + "-style") == "none"
			) {
				return "0";
			}
			else if (compStyle) { //W3 Method
				//this returns computed values
				if (typeof compStyle == "function") {
					//safari returns null for compStyle when element is display:none

					oldDisplay = elm.style.display;
					r = tempBlock(elm, function() {
						if (prop == "display") { //get true value for display, since we've just fudged it
							elm.style.display = oldDisplay;
							if (!doc.defaultView.getComputedStyle(elm, null)) {
								return "none";
							}
							elm.style.display = "block";
						}
						return getCssValue(elm, prop);
					});
				} else {
					// assume equal horizontal margins in safari 3
					// http://bugs.webkit.org/show_bug.cgi?id=13343
					// The above bug doesn't appear to be closed, but it works fine in Safari 4
					if (env.webkit > 500 && env.webkit < 526 && prop == 'margin-right' && compStyle.getPropertyValue('position') != 'absolute') {
						prop = 'margin-left';
					}
					r = compStyle.getPropertyValue(prop);
				}
			} else if (elmCurrentStyle) { //IE method
				if (prop == "opacity") {
					match = /alpha\(opacity=([^\)]+)\)/.exec(elmCurrentStyle.filter);
					return match ? String(parseInt(match[1], 10) / 100) : "1";
				}
				//this returns cascaded values so needs fixing
				r = String(elmCurrentStyle[toStyleProp(prop)]);
				if (/\d+[a-z%]+$/i.test(r) && prop != "font-size") {
					r = getPixelValue(elm, r, usesYAxis.test(prop)) + "px";
				}
			}
			//some results need post processing
			if (prop.indexOf("color") != -1) { //deal with colour values
				r = normaliseCssColor(r).toString();
			} else if (r.indexOf("url") == 0) { //some browsers put quotes around the url, get rid
				r = r.replace(/\"/g,"");
			}
			return r;
		}

		/*
		PrivateMethod: getPixelValue
			Converts a relative value into an absolute pixel value. Only works in IE with Dimension value (not stuff like relative font-size).
			Based on some Dean Edwards' code

		Arguments:
			element - element used to calculate relative values
			value - (string) relative value
			useYAxis - (string) calulate relative values to the y axis rather than x

		Returns:
			Number
		*/
		function getPixelValue(element, value, useYAxis) {
			if (/\d(px)?$/i.test(value)) { return parseInt(value); }
			
			// Remember the original values
			var axisPos = useYAxis ? "top" : "left",
				axisPosUpper = useYAxis ? "Top" : "Left",
				elmStyle = element.style,
				positionVal = elmStyle[axisPos],
				runtimePositionVal = element.runtimeStyle[axisPos],
				r;
			
			// copy to the runtime type to prevent changes to the display
			element.runtimeStyle[axisPos] = element.currentStyle[axisPos];
			// set value to left / top
			elmStyle[axisPos] = value;
			// get the pixel value
			r = elmStyle["pixel" + axisPosUpper];
			
			// revert values
			elmStyle[axisPos] = positionVal;
			element.runtimeStyle[axisPos] = runtimePositionVal;
			
			return r;
		}

		/*
		PrivateMethod: normaliseCssColor
			Converts a CSS colour into "rgb(255, 255, 255)" or "transparent" format
		*/

		function normaliseCssColor(val) {
			if (/^(transparent|rgba\(0, ?0, ?0, ?0\))$/.test(val)) { return 'transparent'; }
			var match, //tmp regex match holder
				r, g, b, //final colour vals
				hex, //tmp hex holder
				mathRound = Math.round,
				parseIntFunc = parseInt,
				parseFloatFunc = parseFloat;

			if (match = colorRegex.exec(val)) { //rgb() format, cater for percentages
				r = match[2] ? mathRound(((parseFloatFunc(match[1]) / 100) * 255)) : parseIntFunc(match[1]);
				g = match[4] ? mathRound(((parseFloatFunc(match[3]) / 100) * 255)) : parseIntFunc(match[3]);
				b = match[6] ? mathRound(((parseFloatFunc(match[5]) / 100) * 255)) : parseIntFunc(match[5]);
			} else {
				if (typeof val == "number") {
					hex = val;
				} else if (val.charAt(0) == "#") {
					if (val.length == "4") { //deal with #fff shortcut
						val = "#" + val.charAt(1) + val.charAt(1) + val.charAt(2) + val.charAt(2) + val.charAt(3) + val.charAt(3);
					}
					hex = parseIntFunc(val.slice(1), 16);
				} else {
					hex = htmlColorNames[val];
				}

				r = (hex) >> 16;
				g = (hex & 0x00ff00) >> 8;
				b = (hex & 0x0000ff);
			}

			val = new String("rgb(" + r + ", " + g + ", " + b + ")");
			val.r = r;
			val.g = g;
			val.b = b;
			return val;
		}

		/*
		PrivateMethod: getTextNodeConcat
			Take an element and returns a string of its text nodes combined. This is useful when a browser (Safari 2) goes mad and doesn't return anything for innerText or textContent
		*/
		function getTextNodeConcat(elm) {
			var r = "",
				nodes = elm.childNodes,
				i = 0,
				len = nodes.length;
			for (; i < len; i++) {
				if (nodes[i].nodeType == 3) { //text
					//this function is used in safari only, string concatination is faster
					r += nodes[i].nodeValue;
				} else if (nodes[i].nodeType == 1) { //element
					r += getTextNodeConcat(nodes[i]);
				}
			}
			return r;
		}

		/*
		PrivateMethod: getNextOrPrev
			This gets the next / previous sibling element of each node in a nodeset
			and returns the new nodeset.
		*/
		function getNextOrPrev(nodelist, dir /* "next" or "previous" */) {
			var ret = [],
				ri = 0,
				nextTmp,
				i = 0,
				length = nodelist.length;

			for (; i < length; i++) {
				nextTmp = nodelist[i];
				while (nextTmp = nextTmp[dir + "Sibling"]) {
					if (nextTmp.nodeType == 1 && nextTmp.nodeName != "!") {
						ret[ri++] = nextTmp;
						break;
					}
				}
			}
			return r.get(ret);
		}

		/*
		 get the scroll offset. TODO: This should be replaced
		 with a public function which works on all elements
		*/
		function scrollPos() {
			var win = window,
				docElm = env.standardsMode ? doc.documentElement : docBody;

			return {
				x: docElm.scrollLeft || win.pageXOffset || 0,
				y: docElm.scrollTop || win.pageYOffset || 0
			};
		}
		
		/*
		 Get the 'real' positioned parent for an element, otherwise return null.
		*/
		function getPositionedParent(elm) {
			var offsetParent = elm.offsetParent;
			
			// get the real positioned parent
			// IE places elements with hasLayout in the offsetParent chain even if they're position:static
			// Also, <body> and <html> can appear in the offsetParent chain, but we don't want to return them if they're position:static
			while (offsetParent && r.get(offsetParent).css("position") == "static") {	
				offsetParent = offsetParent.offsetParent;
			}
			
			// sometimes the <html> element doesn't appear in the offsetParent chain, even if it has position:relative
			if (!offsetParent && r.get(docElm).css("position") != "static") {
				offsetParent = docElm;
			}
			
			return offsetParent || null;
		}

		//public
		var r = {}; //object to be returned

		/**
		@name glow.dom.get
		@function
		@description Returns a {@link glow.dom.NodeList NodeList} from CSS selectors and/or Elements.

		@param {String | String[] | Element | Element[] | glow.dom.NodeList} nodespec+ One or more CSS selector strings, Elements or {@link glow.dom.NodeList NodeLists}.

			Will also accept arrays of these types, or any combinations thereof.

			Supported CSS selectors:

			<ul>
				<li>Universal selector "*".</li>
				<li>Type selector "div"</li>
				<li>Class selector ".myClass"</li>
				<li>ID selector "#myDiv"</li>
				<li>Child selector "ul > li"</li>
				<li>Grouping "div, p"</li>
			</ul>

		@returns {glow.dom.NodeList}

		@example
			// Nodelist with all links in element with id "nav"
			var myNodeList = glow.dom.get("#nav a");

		@example
			// NodeList containing the nodes passed in
			var myNodeList = glow.dom.get(someNode, anotherNode);

		@example
			// NodeList containing elements in the first form
			var myNodeList = glow.dom.get(document.forms[0].elements);
		*/
		r.get = function() {
			var r = new glow.dom.NodeList(),
				i = 0,
				args = arguments,
				argsLen = args.length;

			for (; i < argsLen; i++) {
				if (typeof args[i] == "string") {
					r.push(new glow.dom.NodeList().push(doc).get(args[i]));
				} else {
					r.push(args[i]);
				}
			}
			return r;
		};

		/**
		@name glow.dom.create
		@function
		@description Returns a {@link glow.dom.NodeList NodeList} from an HTML fragment.

		@param {String} html An HTML string.

			All top-level nodes must be elements (i.e. text content in the
			HTML must be wrapped in HTML tags).

		@param {Object} [opts] An optional options object
			@param {Object} [opts.interpolate] Data for a call to glow.lang.interpolate
				If this option is set, the String html parameter will be passed through glow.lang.interpolate with this as the data and no options
				If glow.lang.interpolates options are required, an explicit call must be made

		@returns {glow.dom.NodeList}

		@example
			// NodeList of two elements
			var myNodeList = glow.dom.create("<div>Hello</div><div>World</div>");
		*/
		r.create = function(sHtml, opts) {
			var ret = [],
				i = 0,
				rLen = 0,
				toCheck;
			
			opts = opts || {};
			
			if(opts.interpolate != undefined) {
				sHtml = lang.interpolate(sHtml, opts.interpolate);
			}
			
			toCheck = stringToNodes(sHtml);
			
			for (; toCheck[i]; i++) {
				if (toCheck[i].nodeType == 1 && toCheck[i].nodeName != "!") {
					ret[rLen++] = toCheck[i];
				} else if (toCheck[i].nodeType == 3 && lang.trim(toCheck[i].nodeValue) !== "") {
					throw new Error("glow.dom.create - Text must be wrapped in an element");
				}
			}
			return new r.NodeList().push(ret);
		};

		/**
		@name glow.dom.parseCssColor
		@function
		@description Returns an object representing a CSS colour string.

		@param {String} color A CSS colour.

			Examples of valid values are "red", "#f00", "#ff0000",
			"rgb(255,0,0)", "rgb(100%, 0%, 0%)"

		@returns {Object}

			An object with properties named "r", "g" and "b", each will have
			an integer value between 0 and 255.

		@example
			glow.dom.parseCssColor("#ff0000");
			// returns {r:255, g:0, b:0}
		*/
		r.parseCssColor = function(cssColor) {
			var normal = normaliseCssColor(cssColor);
			return {r: normal.r, g: normal.g, b: normal.b};
		}

		/**
		@name glow.dom.NodeList
		@class
		@description An array-like collection of DOM Elements.

			It is recommended you create a NodeList using {@link glow.dom.get glow.dom.get},
			or {@link glow.dom.create glow.dom.create}, but you can also use
			the constructor to create an empty NodeList.

			Unless otherwise specified, all methods of NodeList return the
			NodeList itself, allowing you to chain methods calls together.

		@example
			// empty NodeList
			var nodes = new glow.dom.NodeList();

		@example
			// using get to return a NodeList then chaining methods
			glow.dom.get("p").addClass("eg").append("<b>Hello!</b>");

		@see <a href="../furtherinfo/creatingnodelists/">Creating NodeLists</a>
		@see <a href="../furtherinfo/workingwithnodelists/">Working with NodeLists</a>
		@see <a href="../furtherinfo/xmlnodelists/">XML NodeLists</a>
		*/
		r.NodeList = function() {

			/**
			@name glow.dom.NodeList#length
			@type Number
			@description Number of nodes in the NodeList
			@example
				// get the number of paragraphs on the page
				glow.dom.get("p").length;
			*/
			this.length = 0; //number of elements in NodeList
		};

		/*
			Group: Methods
		*/
		r.NodeList.prototype = {

			/**
			@name glow.dom.NodeList#item
			@function
			@description Returns a node from the NodeList.

			@param {Number} index The numeric index of the node to return.

			@returns {Element}

			@example
				// get the fourth node
				var node = myNodeList.item(3);

			@example
				// another way to get the fourth node
				var node = myNodeList[3];
			*/
			item: function (nIndex) {
				return this[nIndex];
			},

			/**
			@name glow.dom.NodeList#push
			@function
			@description Adds Elements to the NodeList.

			@param {Element | Element[] | glow.dom.NodeList} nodespec+ One or more Elements, Arrays of Elements or NodeLists.

			@returns {glow.dom.NodeList}

			@example
				var myNodeList = glow.dom.create("<div>Hello world</div>");
				myNodeList.push("<div>Foo</div>", glow.dom.get("#myList li"));
			*/
			push: function() {
				var args = arguments,
					argsLen = args.length,
					i = 0,
					n,
					nNodeListLength,
					that = this,
					arrayPush = Array.prototype.push;

				for (; i < argsLen; i++) {
					if (!args[i]) {
						continue;
					} else if (args[i].nodeType == 1 || args[i].nodeType == 9 || args[i].document) { //is Node
						arrayPush.call(that, args[i]);
					} else if (args[i][0]) { //is array or array like
						for (n = 0, nNodeListLength = args[i].length; n < nNodeListLength; n++) {
							arrayPush.call(that, args[i][n]);
						}
					}
				}
				return that;
			},

			/**
			@name glow.dom.NodeList#each
			@function
			@description Calls a function for each node.

				The supplied function will be called for each node in the NodeList.
				
				The index of the node will be provided as the first parameter, and
				'this' will refer to the node.

			@param {Function} callback The function to run for each node.

			@returns {glow.dom.NodeList}

			@example
				var myNodeList = glow.dom.get("a");
				myNodeList.each(function(i){
					// in this function: this == myNodeList[i]
				});
			*/
			each: function (callback) {
				for (var i = 0, that = this, length = that.length; i < length; i++) {
					callback.call(that[i], i, that);
				}
				return that;
			},

			/**
			@name glow.dom.NodeList#eq
			@function
			@description Compares the NodeList to an element, array of elements or another NodeList

					Returns true if the items are the same and are in the same
					order.

			@param {Element | Element[] | glow.dom.NodeList} nodespec The element, array or NodeList the NodeList is being compared to.

			@returns {Boolean}

			@example
				// the following returns true
				glow.dom.get('#blah').eq( document.getElementById('blah') );
			*/
			eq: function (nodelist) {
				var that = this, i = 0, length = that.length;

				if (! nodelist.push) { nodelist = [nodelist]; }
				if (nodelist.length != that.length) { return false; }
				for (; i < length; i++) {
					if (that[i] != nodelist[i]) { return false; }
				}
				return true;
			},

			/**
			@name glow.dom.NodeList#isWithin
			@function
			@description Tests if all the nodes are decendents of an element.

			@param {Element | glow.dom.NodeList} nodespec The element or NodeList that the NodeList is being tested against.

				If nodespec is a NodeList, then the its first node will be used.

			@returns {glow.dom.NodeList}

			@example
				var myNodeList = glow.dom.get("input");
				if (myNodeList.isWithin(glow.dom.get("form")) {
					// do something
				}
			*/
			isWithin: function (node) {
				if (node.push) { node = node[0]; }
				
				// missing some nodes? Return false
				if ( !node || !this.length ) { return false; }
				
				var that = this,
					i = 0,
					length = that.length,
					toTest; //node to test in manual method

				if (node.contains && env.webkit >= 521) { //proprietary method, safari 2 has a wonky implementation of this, avoid, avoid, avoid
					//loop through
					for (; i < length; i++) {
						// myNode.contains(myNode) returns true in most browsers
						if (!(node.contains(that[i]) && that[i] != node)) { return false; }
					}
				} else if (that[0].compareDocumentPosition) { //w3 method
					//loop through
					for (; i < length; i++) {
						//compare against bitmask
						if (!(that[i].compareDocumentPosition(node) & 8)) { return false; }
					}
				} else { //manual method
					for (; i < length; i++) {
						toTest = that[i];
						while (toTest = toTest.parentNode) {
							if (toTest == node) { break; }
						}
						if (!toTest) { return false; }
					}
				}
				return true;
			},

			/**
			@name glow.dom.NodeList#attr
			@function
			@description Gets or sets attributes

				When getting an attribute, it is retrieved from the first
				node in the NodeList. Setting attributes applies the change
				to each element in the NodeList.

				To set an attribute, pass in the name as the first
				parameter and the value as a second parameter.

				To set multiple attributes in one call, pass in an object of
				name/value pairs as a single parameter.

				For browsers that don't support manipulating attributes
				using the DOM, this method will try to do the right thing
				(i.e. don't expect the semantics of this method to be
				consistent across browsers as this is not possible with
				currently supported browsers).

			@param {String | Object} name The name of the attribute, or an object of name/value pairs
			@param {String} [value] The value to set the attribute to.

			@returns {String | glow.dom.NodeList}

				When setting attributes it returns the NodeList, otherwise
				returns the attribute value.

			@example
				var myNodeList = glow.dom.get(".myImgClass");

				// get an attribute
				myNodeList.attr("class");

				// set an attribute
				myNodeList.attr("class", "anotherImgClass");

				// set multiple attributes
				myNodeList.attr({
				  src: "a.png",
				  alt: "Cat jumping through a field"
				});
			*/
			attr: function (name /* , val */) {
				var that = this,
					args = arguments,
					argsLen = args.length,
					i,
					value;

				if (that.length === 0) {
					return argsLen > 1 ? that : undefined;
				}
				if (typeof name == 'object') {
					for (i in name) {
						if (lang.hasOwnProperty(name, i)) {
							that.attr(i, name[i]);
						}
					}
					return that;
				}
				if (env.ie && dom0PropertyMapping[name]) {
					if (argsLen > 1) {
						setAttribute.call(
							that,
							args[1],
							// in the callback this is the dom node
							function (val) { this[dom0PropertyMapping[name]] = val; }
						);
						return that;
					}
					value = that[0][dom0PropertyMapping[name]];
					if (dom0BooleanAttribute[name]) {
						return value ? name : undefined;
					}
					else if (dom0AttributeMappings[name]) {
						return dom0AttributeMappings[name](value);
					}
					return value;
				}
				if (argsLen > 1) {
					setAttribute.call(
						that,
						args[1],
						// in the callback this is the dom node
						function (val) { this.setAttribute(name, val); }
					);
					return that;
				}
				//2nd parameter makes IE behave, but errors for XML nodes (and isn't needed for xml nodes)
				return isXml(that[0]) ? that[0].getAttribute(name) : that[0].getAttribute(name, 2);
			},

			/**
			@name glow.dom.NodeList#removeAttr
			@function
			@description Removes an attribute from each node.

			@param {String} name The name of the attribute to remove.

			@returns {glow.dom.NodeList}

			@example
				glow.dom.get("a").removeAttr("target");
			*/
			removeAttr: function (name) {
				var mapping = env.ie && dom0PropertyMapping[name],
					that = this,
					i = 0,
					length = that.length;

				for (; i < length; i++) {
					if (mapping) {
						that[i][mapping] = "";
					} else {
						that[i].removeAttribute(name);
					}
				}
				return that;
			},

			/**
			@name glow.dom.NodeList#hasAttr
			@function
			@description Does the node have a particular attribute?
				
				The first node in the NodeList is tested
				
			@param {String} name The name of the attribute to test for.

			@returns {Boolean}

			@example
				if ( glow.dom.get("#myImg").hasAttr("alt") ){
					// ...
				}
			*/
			hasAttr: function (name) {
				var firstNode = this[0],
					attributes = firstNode.attributes;

				if (isXml(firstNode) && env.ie) { //getAttributeNode not supported for XML
					var attributes = firstNode.attributes,
						i = 0,
						len = attributes.length;

					//named node map doesn't seem to work properly, so need to go by index
					for (; i < len; i++) {
						if (attributes[i].nodeName == name) {
							return attributes[i].specified;
						}
					}
					return false;
				} else if (this[0].getAttributeNode) {
					var attr = this[0].getAttributeNode(name);
					return attr ? attr.specified : false;
				}

				return typeof attributes[attr] != "undefined";
			},
			
			/**
			@name glow.dom.NodeList#prop
			@function
			@description Gets or sets node peropties
			
				This function gets / sets node properties, to get attributes,
				see {@link glow.dom.NodeList#attr NodeList#attr}.
				
				When getting a property, it is retrieved from the first
				node in the NodeList. Setting properties to each element in
				the NodeList.
				
				To set multiple properties in one call, pass in an object of
				name/value pairs.
				
			@param {String | Object} name The name of the property, or an object of name/value pairs
			@param {String} [value] The value to set the property to.

			@returns {String | glow.dom.NodeList}

				When setting properties it returns the NodeList, otherwise
				returns the property value.

			@example
				var myNodeList = glow.dom.get("#formElement");

				// get the node name
				myNodeList.prop("nodeName");

				// set a property
				myNodeList.prop("_secretValue", 10);

				// set multiple properties
				myNodeList.prop({
					checked: true,
					_secretValue: 10
				});
			*/
			prop: function(name, val) {
				
				// setting multiple
				if (name.constructor === Object) {
					var hash = name,
						key;
					
					// loop through hash
					for (key in hash) {
						this.prop(key, hash[key]);
					}
					return this;
				}
				
				// setting single (to all in the NodeList)
				if (val !== undefined) {
					var i = this.length;
					while (i--) {
						this[i][name] = val;
					}
					return this;
				}
				
				// getting
				if (!this[0]) { return undefined; }
				return this[0][name];
			},
			
			/**
			@name glow.dom.NodeList#hasClass
			@function
			@description Tests if a node has a given class.

				Will return true if any node in the NodeList has the supplied class

				<p><em>This method is not applicable to XML NodeLists.</em></p>

			@param {String} name The name of the class to test for.

			@returns {Boolean}

			@example
				if (glow.dom.get("a").hasClass("termsLink")){
					// ...
				}
			*/
			hasClass: function (name) {
				for (var i = 0, length = this.length; i < length; i++) {
					if ((" " + this[i].className + " ").indexOf(" " + name + " ") != -1) {
						return true;
					}
				}
				return false;
			},

			/**
			@name glow.dom.NodeList#addClass
			@function
			@description Adds a class to each node.

				<p><em>This method is not applicable to XML NodeLists.</em></p>

			@param {String} name The name of the class to add.

			@returns {glow.dom.NodeList}

			@example
				glow.dom.get("#login a").addClass("highlight");
			*/
			addClass: function (name) {
				for (var i = 0, length = this.length; i < length; i++) {
					if ((" " + this[i].className + " ").indexOf(" " + name + " ") == -1) {
						this[i].className += ((this[i].className)? " " : "") + name;
					}
				}
				return this;
			},

			/**
			@name glow.dom.NodeList#removeClass
			@function
			@description Removes a class from each node.

				<p><em>This method is not applicable to XML NodeLists.</em></p>

			@param {String} name The name of the class to remove.

			@returns {glow.dom.NodeList}

			@example
				glow.dom.get("#footer #login a").removeClass("highlight");
			*/
			removeClass: function (name) {
				var re = removeClassRegex(name),
					that = this,
					i = 0,
					length = that.length;

				for (; i < length; i++) {
					that[i].className = that[i].className.replace(re, " ");
				}
				return that;
			},

			/**
			@name glow.dom.NodeList#toggleClass
			@function
			@description Toggles a class on each node.

				<p><em>This method is not applicable to XML NodeLists.</em></p>

			@param {String} name The name of the class to toggle.

			@returns {glow.dom.NodeList}

			@example
				glow.dom.get(".onOffSwitch").toggleClass("on");
			 */
			toggleClass: function (name) {
				var i = this.length,
					paddedClassName,
					paddedName = " " + name + " ";
					
				while (i--) {
					paddedClassName = " " + this[i].className + " ";
					
					if (paddedClassName.indexOf(paddedName) != -1) {
						this[i].className = paddedClassName.replace(paddedName, " ");
					} else {
						this[i].className += " " + name;
					}
				}
				return this;
			},

			/**
			@name glow.dom.NodeList#val
			@function
			@description Gets or sets form values for the first node.

				<p><em>This method is not applicable to XML NodeLists.</em></p>

				<p><em>Getting values from form elements</em></p>

				The returned value depends on the type of element, see below:

				<dl>
				<dt>Radio button or checkbox</dt>
				<dd>If checked, then the contents of the value attribute, otherwise an empty string.</dd>
				<dt>Select</dt>
				<dd>The contents of value attribute of the selected option</dd>
				<dt>Select (multiple)</dt>
				<dd>An array of selected option values.</dd>
				<dt>Other form element</dt>
				<dd>The value of the input.</dd>
				</dl>

				<p><em>Getting values from a form</em></p>

				If the first element in the NodeList is a form, then an
				object is returned containing the form data. Each item
				property of the object is a value as above, apart from when
				multiple elements of the same name exist, in which case the
				it will contain an array of values.

				<p><em>Setting values for form elements</em></p>

				If a value is passed and the first element of the NodeList
				is a form element, then the form element is given that value.
				For select elements, this means that the first option that
				matches the value will be selected. For selects that allow
				multiple selection, the options which have a value that
				exists in the array of values/match the value will be
				selected and others will be deselected.

				Currently checkboxes and radio buttons are not checked or
				unchecked, just their value is changed. This does mean that
				this does not do exactly the reverse of getting the value
				from the element (see above) and as such may be subject to
				change

				<p><em>Setting values for forms</em></p>

				If the first element in the NodeList is a form and the
				value is an object, then each element of the form has its
				value set to the corresponding property of the object, using
				the method described above.

			@param {String | Object} [value] The value to set the form element/elements to.

			@returns {glow.dom.NodeList | String | Object}

				When used to set a value it returns the NodeList, otherwise
				returns the value as described above.

			@example
				// get a value
				var username = glow.dom.get("input#username").val();

			@example
				// get values from a form
				var userDetails = glow.dom.get("form").val();

			@example
				// set a value
				glow.dom.get("input#username").val("example username");

			@example
				// set values in a form
				glow.dom.get("form").val({
					username : "another",
					name     : "A N Other"
				});
			*/
			val: function () {

				/*
				PrivateFunction: elementValue
					Get a value for a form element.
				*/
				function elementValue (el) {
					var elType = el.type,
						elChecked = el.checked,
						elValue = el.value,
						vals = [],
						i = 0;

					if (elType == "radio") {
						return elChecked ? elValue : "";
					} else if (elType == "checkbox") {
						return elChecked ? elValue : "";

					} else if (elType == "select-one") {
						return el.selectedIndex > -1 ?
							el.options[el.selectedIndex].value : "";

					} else if (elType == "select-multiple") {
						for (var length = el.options.length; i < length; i++) {
							if (el.options[i].selected) {
								vals[vals.length] = el.options[i].value;
							}
						}
						return vals;
					} else {
						return elValue;
					}
				}

				/*
				PrivateMethod: formValues
					Get an object containing form data.
				*/
				function formValues (form) {
					var vals = {},
						radios = {},
						formElements = form.elements,
						i = 0,
						length = formElements.length,
						name,
						formElement,
						j,
						radio,
						nodeName;

					for (; i < length; i++) {
						formElement = formElements[i];
						nodeName = formElement.nodeName.toLowerCase();
						name = formElement.name;
						
						// fieldsets & objects come back as form elements, but we don't care about these
						// we don't bother with fields that don't have a name
						// switch to whitelist?
						if (
							nodeName == "fieldset" ||
							nodeName == "object" ||
							!name
						) { continue; }

						if (formElement.type == "checkbox" && ! formElement.checked) {
							if (! name in vals) {
								vals[name] = undefined;
							}
						} else if (formElement.type == "radio") {
							if (radios[name]) {
								radios[name][radios[name].length] = formElement;
							} else {
								radios[name] = [formElement];
							}
						} else {
							var value = elementValue(formElement);
							if (name in vals) {
								if (vals[name].push) {
									vals[name][vals[name].length] = value;
								} else {
									vals[name] = [vals[name], value];
								}
							} else {
								vals[name] = value;
							}
						}
					}
					for (i in radios) {
						j = 0;
						for (length = radios[i].length; j < length; j++) {
							radio = radios[i][j];
							name = radio.name;
							if (radio.checked) {
								vals[radio.name] = radio.value;
								break;
							}
						}
						if (! name in vals) { vals[name] = undefined; }
					}
					return vals;
				}

				/*
				PrivateFunction: setFormValues
					Set values of a form to those in passed in object.
				*/
				function setFormValues (form, vals) {
					var prop, currentField,
						fields = {},
						storeType, i = 0, n, len, foundOne, currentFieldType;

					for (prop in vals) {
						currentField = form[prop];
						if (currentField && currentField[0] && !currentField.options) { // is array of fields
							//normalise values to array of vals
							vals[prop] = vals[prop] && vals[prop].push ? vals[prop] : [vals[prop]];
							//order the fields by types that matter
							fields.radios = [];
							fields.checkboxesSelects = [];
							fields.multiSelects = [];
							fields.other = [];

							for (i = 0; currentField[i]; i++) {
								currentFieldType = currentField[i].type;
								if (currentFieldType == "radio") {
									storeType = "radios";
								} else if (currentFieldType == "select-one" || currentFieldType == "checkbox") {
									storeType = "checkboxesSelects";
								} else if (currentFieldType == "select-multiple") {
									storeType = "multiSelects";
								} else {
									storeType = "other";
								}
								//add it to the correct array
								fields[storeType][fields[storeType].length] = currentField[i];
							}

							for (i = 0; fields.multiSelects[i]; i++) {
								vals[prop] = setValue(fields.multiSelects[i], vals[prop]);
							}
							for (i = 0; fields.checkboxesSelects[i]; i++) {
								setValue(fields.checkboxesSelects[i], "");
								for (n = 0, len = vals[prop].length; n < len; n++) {
									if (setValue(fields.checkboxesSelects[i], vals[prop][n])) {
										vals[prop].slice(n, 1);
										break;
									}
								}
							}
							for (i = 0; fields.radios[i]; i++) {
								fields.radios[i].checked = false;
								foundOne = false;
								for (n = 0, len = vals[prop].length; n < len; n++) {
									if (setValue(fields.radios[i], vals[prop][n])) {
										vals[prop].slice(n, 1);
										foundOne = true;
										break;
									}
									if (foundOne) { break; }
								}
							}
							for (i = 0; fields.other[i] && vals[prop][i] !== undefined; i++) {
								setValue(fields.other[i], vals[prop][i]);
							}
						} else if (currentField && currentField.nodeName) { // is single field, easy
							setValue(currentField, vals[prop]);
						}
					}
				}

				/*
				PrivateFunction: setValue
					Set the value of a form element.

				Returns:
					values that weren't able to set if array of vals passed (for multi select). Otherwise true if val set, false if not
				*/
				function setValue (el, val) {
					var i = 0,
						length,
						n = 0,
						nlen,
						elOption,
						optionVal;

					if (el.type == "select-one") {
						for (length = el.options.length; i < length; i++) {
							if (el.options[i].value == val) {
								el.selectedIndex = i;
								return true;
							}
						}
						return false;
					} else if (el.type == "select-multiple") {
						var isArray = !!val.push;
						for (i = 0, length = el.options.length; i < length; i++) {
							elOption = el.options[i];
							optionVal = elOption.value;
							if (isArray) {
								elOption.selected = false;
								for (nlen = val.length; n < nlen; n++) {
									if (optionVal == val[n]) {
										elOption.selected = true;
										val.splice(n, 1);
										break;
									}
								}
							} else {
								return elOption.selected = val == optionVal;
							}
						}
						return false;
					} else if (el.type == "radio" || el.type == "checkbox") {
						el.checked = val == el.value;
						return val == el.value;
					} else {
						el.value = val;
						return true;
					}
				}

				// toplevel implementation
				return function (/* [value] */) {
					var args = arguments,
						val = args[0],
						that = this,
						i = 0,
						length = that.length;

					if (args.length === 0) {
						return that[0].nodeName == 'FORM' ?
							formValues(that[0]) :
							elementValue(that[0]);
					}
					if (that[0].nodeName == 'FORM') {
						if (! typeof val == 'object') {
							throw 'value for FORM must be object';
						}
						setFormValues(that[0], val);
					} else {
						for (; i < length; i++) {
							setValue(that[i], val);
						}
					}
					return that;
				};
			}(),

			/**
			@name glow.dom.NodeList#slice
			@function
			@description Extracts nodes from a NodeList and returns them as a new NodeList.

			@param {Number} start The NodeList index at which to begin extraction.

				If negative, this param specifies a position measured from
				the end of the NodeList

			@param {Number} [end] The NodeList index immediately after the end of the extraction.

				If not specified the extraction includes all nodes from the
				start to the end of the NodeList. A Negative end specifies
				an position measured from the end of the NodeList.

			@returns {glow.dom.NodeList}

				Returns a new NodeList containing the extracted nodes

			@example
				var myNodeList = glow.dom.create("<div></div><div></div>");
				myNodeList = myNodeList.slice(1, 2); // just second div
			 */
			slice: function (/* start, end */) {
				return new r.NodeList().push(Array.prototype.slice.apply(this, arguments));
			},

			/**
			@name glow.dom.NodeList#sort
			@function
			@description Returns a new NodeList containing the same nodes in order.

				Sort order defaults to document order if no sort function is passed in.

			@param {Function} [func] Function to determine sort order

				This function will be passed 2 nodes (a, b). The function
				should return a number less than 0 to sort a lower than b
				and greater than 0 to sort a higher than b.

			@returns {glow.dom.NodeList}

				Returns a new NodeList containing the sorted nodes

			@example
				// heading elements in document order
				var headings = glow.dom.get("h1, h2, h3, h4, h5, h6").sort();

				//get links in alphabetical (well, lexicographical) order
				var links = glow.dom.get("a").sort(function(a, b) {
					return ((a.textContent || a.innerText) < (b.textContent || b.innerText)) ? -1 : 1;
				})
			*/
			sort: function(func) {
				var that = this, i=0, aNodes;

				if (!that.length) { return that; }
				if (!func) {
					if (typeof that[0].sourceIndex == "number") {
						// sourceIndex is IE proprietary (but Opera supports)
						func = function(a, b) {
							return a.sourceIndex - b.sourceIndex;
						};
					} else if (that[0].compareDocumentPosition) {
						// DOM3 method
						func = function(a, b) {
							return 3 - (a.compareDocumentPosition(b) & 6);
						};
					} else {
						// js emulation of sourceIndex
						aNodes = getByTagName("*", [doc]);
						for (; aNodes[i]; i++) {
							aNodes[i]._sourceIndex = i;
						}
						func = function(a, b) {
							return a._sourceIndex - b._sourceIndex;
						};
					}
				}

				return r.get([].sort.call(that, func));
			},

			/**
			@name glow.dom.NodeList#filter
			@function
			@description Filter the NodeList using a function

				The supplied function will be called for each node in the NodeList.
				
				The index of the node will be provided as the first parameter, and
				'this' will refer to the node.
				
				Return true to keep the node, or false to remove it.

			@param {Function} func Function to test each node

			@returns {glow.dom.NodeList}

				Returns a new NodeList containing the filtered nodes

			@example
				// return images with a width greater than 320
				glow.dom.get("img").filter(function (i) {
					return this.width > 320;
				});
			 */
			filter: function(callback) {
				var ret = [], //result
					ri = 0,
					i = 0,
					length = this.length;
				for (; i < length; i++) {
					if (callback.apply(this[i], [i])) {
						ret[ri++] = this[i];
					}
				}
				return r.get(ret);
			},

			/**
			@name glow.dom.NodeList#children
			@function
			@description Gets the child elements of each node as a new NodeList.

			@returns {glow.dom.NodeList}

				Returns a new NodeList containing all the child nodes

			@example
				// get all list items
				var items = glow.dom.get("ul, ol").children();
			 */
			children: function() {
				var ret = [],
					ri = 0,
					i = 0,
					n = 0,
					length = this.length,
					childTmp;
				
				for (; i < length; i++) {
					ret = ret.concat( getChildElms(this[i]) );
				}
				return r.get(ret);
			},

			/**
			@name glow.dom.NodeList#parent
			@function
			@description Gets the unique parent nodes of each node as a new NodeList.

			@returns {glow.dom.NodeList}

				Returns a new NodeList containing the parent nodes, with
				duplicates removed

			@example
				// elements which contain links
				var parents = glow.dom.get("a").parent();
			*/
			parent: function() {
				var ret = [],
					ri = 0,
					i = 0,
					length = this.length;

				for (; i < length; i++) {
					ret[ri++] = this[i].parentNode;
				}
				return r.get(unique(ret));
			},

			/**
			@name glow.dom.NodeList#next
			@function
			@description Gets the next sibling element for each node as a new NodeList.

			@returns {glow.dom.NodeList}

				A new NodeList containing the next sibling elements.

			@example
				// gets the element following #myLink (if there is one)
				var next = glow.dom.get("#myLink").next();
			*/
			next: function() {
				return getNextOrPrev(this, "next");
			},

			/**
			@name glow.dom.NodeList#prev
			@function
			@description Gets the previous sibling element for each node as a new NodeList.

			@returns {glow.dom.NodeList}

				A new NodeList containing the previous sibling elements.

			@example
				// gets the elements before #myLink (if there is one)
				var previous = glow.dom.get("#myLink").previous();
			*/
			prev: function() {
				return getNextOrPrev(this, "previous");
			},

			/**
			@name glow.dom.NodeList#is
			@function
			@description Tests if all the nodes match a CSS selector.
			
				Jake: I'm deprecating this until we have time to make it faster (probably when we change our CSS selector engine)
			
			@deprecated
			@param {String} selector A CSS selector string

			@returns {Boolean}

			@example
				var bigHeadings = glow.dom.get("h1, h2, h3");

				// true
				if (bigHeadings.is("h1, h2, h3, h4, h5, h6")) ...

				// false
				if (bigHeadings.is("a")) ...
			*/
			is: function (selector) {
				// TODO - this implementation needs to be optimized
				var nodes = glow.dom.get(selector),
					i = 0,
					iLen = this.length,
					j,
					jLen;

				node:
				for (; i < iLen; i++) {
					for (j = 0, jLen = nodes.length; j < jLen; j++) {
						if (this[i] == nodes[j]) {
							continue node;
						}
					}
					return false;
				}
				return true;
			},

			/**
			@name glow.dom.NodeList#text
			@function
			@description Gets the inner text of the first node, or set the inner text of all matched nodes.

			@param {String} [text] String to set as inner text of nodes

			@returns {glow.dom.NodeList | String}

				If the text argument is passed then the NodeList is
				returned, otherwise the text is returned.

			@example
				// set text
				var div = glow.dom.create("<div></div>").text("Hello World!");

				// get text
				var greeting = div.text();
			*/
			text: function (/* text */) {
				var args = arguments,
					i = 0,
					that = this,
					length = that.length;

				if (args.length > 0) {
					for (; i < length; i++) {
						that[i].innerHTML = "";
						that[i].appendChild(doc.createTextNode(args[0]));
					}
					return that;
				}
				//innerText (empty) and textContent (undefined) don't work in safari 2 for hidden elements
				return that[0].innerText || that[0].textContent == undefined ? getTextNodeConcat(that[0]) : that[0].textContent;
			},

			/**
			@name glow.dom.NodeList#empty
			@function
			@description Removes the contents of all the nodes.

			@returns {glow.dom.NodeList}

			@example
				// remove the contents of all textareas
				glow.dom.get("textarea").empty();
			*/
			empty: function () {
				/*
				  NOTE: I changed this to destroy all nodes within the parent, but
				  seemed backwards incompatible with our own timetable demo
				  so we best hadn't do it until Glow 2
				*/
				var i = 0,
					len = this.length;
					
				for (; i < len; i++) {
					while(this[i].firstChild) {
						this[i].removeChild(this[i].firstChild);
					}
				}
				return this;
			},

			/**
			@name glow.dom.NodeList#remove
			@function
			@description Removes each node from its parent node.
				If you no longer need the nodes, consider using
				{@link glow.dom.NodeList#destroy destroy}
				
			@returns {glow.dom.NodeList}

			@example
				// take all the links out of a document
				glow.dom.get("a").remove();
			*/
			remove: function () {
				for (var that = this, i = 0, length = that.length, parentNode; i < length; i++) {
					if (parentNode = that[i].parentNode) {
						parentNode.removeChild(that[i]);
					}
				}
				return that;
			},
			
			/**
			@name glow.dom.NodeList#destroy
			@function
			@description Removes each node from the DOM
				The node will actually be destroyed to free up memory

			@returns {glow.dom.NodeList} An empty NodeList

			@example
				// destroy all links in the document
				glow.dom.get("a").destroy();
			*/
			destroy: function () {
				this.appendTo(tmpDiv);
				// destroy nodes
				tmpDiv.innerHTML = "";
				// empty the nodelist
				Array.prototype.splice.call(this, 0, this.length);
				return this;
			},

			/**
			@name glow.dom.NodeList#clone
			@function
			@description Gets a new NodeList containing a clone of each node.
			
			@param {Boolean} [cloneListeners=false] Also clone any event listeners assigned using Glow
			
			@returns {glow.dom.NodeList}

				Returns a new NodeList containing clones of all the nodes in
				the NodeList

			@example
				// get a copy of all heading elements
				var myClones = glow.dom.get("h1, h2, h3, h4, h5, h6").clone();
				
			@example
				// get a copy of all anchor elements with 
				var myAnchors = glow.dom.get("a").clone(true);
			*/
			clone: function (cloneListeners) {
				var ret = [],
					i = this.length,
					allCloneElms,
					eventIdProp = '__eventId' + glow.UID;

				while (i--) {
					ret[i] = this[i].cloneNode(true);
				}
				
				// some browsers (ie) also clone node properties as attributes
				// we need to get rid of the eventId.
				if (nodePropertiesCloned && !isXml(ret[0])) {
					allCloneElms = r.get( ret ).get("*").push( ret );
					i = allCloneElms.length;
					while(i--) {
						allCloneElms[i][eventIdProp] = null;
					}
				}
				
				// shall we clone events too?
				if (cloneListeners) {
					// check the stuff we need is hanging around, we don't want
					// glow.dom to be dependant on glow.events as it's a circular
					// dependency
					if ( !glow.events ) {
						throw "glow.events required to clone event listeners";
					}
					
					glow.events._copyListeners(
						this.get("*").push( this ),
						allCloneElms || r.get( ret ).get("*").push( ret )
					);
				}
				
				return r.get(ret);
			},

			/**
			@name glow.dom.NodeList#html
			@function
			@description Gets the HTML content of the first node, or set the HTML content of all nodes.

				<p><em>This method is not applicable to XML NodeLists.</em></p>

			@param {String} [html] String to set as inner HTML of nodes

			@returns {glow.dom.NodeList | String}

				If the html argument is passed, then the NodeList is
				returned, otherwise the inner HTML of the first node is returned.

			@example
				// get the html in #footer
				var footerContents = glow.dom.get("#footer").html();

			@example
				// set a new footer
				glow.dom.get("#footer").html("<strong>Hello World!</strong>");
			*/
			html: function (newHtml) {
				var i = 0,
					length = this.length;

				if (arguments.length) {
					for (; i < length; i++) {
						this[i].innerHTML = newHtml;
					}
					return this;
				}
				return this[0] ? this[0].innerHTML : "";
			},

			/**
			@name glow.dom.NodeList#width
			@function
			@description Gets the width of the first node in pixels or sets the width of all nodes

				<p><em>This method is not applicable to XML NodeLists.</em></p>

				Return value does not include the padding or border of the
				element in browsers supporting the correct box model.

				You can use this to easily get the width of the document or
				window, see example below.

			@param {Number} [width] New width in pixels.

			@returns {glow.dom.NodeList | Number}

				Width of first element in pixels, or NodeList when setting widths

			@example
				// get the width of #myDiv
				glow.dom.get("#myDiv").width();

			@example
				// set the width of list items in #myDiv to 200 pixels
				glow.dom.get("#myDiv li").width(200);

			@example
				// get the height of the document
				glow.dom.get(document).width()

			@example
				// get the height of the window
				glow.dom.get(window).width()
			*/
			width: function(width) {
				if (width == undefined) {
					return getElmDimension(this[0], "width");
				}
				setElmsSize(this, width, "width");
				return this;
			},

			/**
			@name glow.dom.NodeList#height
			@function
			@description Gets the height of the first element in pixels or sets the height of all nodes

				<p><em>This method is not applicable to XML NodeLists.</em></p>

				 Return value does not include the padding or border of the element in
				 browsers supporting the correct box model.

				 You can use this to easily get the height of the document or
				 window, see example below.

			@param {Number} [height] New height in pixels.

			@returns {glow.dom.NodeList | Number}

				Height of first element in pixels, or NodeList when setting heights.

			@example
				// get the height of #myDiv
				glow.dom.get("#myDiv").height();

			@example
				// set the height of list items in #myDiv to 200 pixels
				glow.dom.get("#myDiv li").height(200);

			@example
				// get the height of the document
				glow.dom.get(document).height()

			@example
				// get the height of the window
				glow.dom.get(window).height()
			*/
			height: function(height) {
				if (height == undefined) {
					return getElmDimension(this[0], "height");
				}
				setElmsSize(this, height, "height");
				return this;
			},

			/**
			@name glow.dom.NodeList#show
			@function
			@description Shows all hidden items in the NodeList.
			@returns {glow.dom.NodeList}
			@example
				// Show element with ID myDiv
				glow.dom.get("#myDiv").show();
			@example
				// Show all list items within #myDiv
				glow.dom.get("#myDiv li").show();
			*/
			show: function() {
				var i = 0,
					len = this.length,
					currItem,
					itemStyle;
				for (; i < len; i++) {
					/* Create a NodeList for the current item */
					currItem = r.get(this[i]);
					itemStyle = currItem[0].style;
					if (currItem.css("display") == "none") {
						itemStyle.display = "";
						itemStyle.visibility = "visible";
						/* If display is still none, set to block */
						if (currItem.css("display") == "none") {
							itemStyle.display = "block";
						}
					}
				}
				return this;
			},

			/**
			@name glow.dom.NodeList#hide
			@function
			@description Hides all items in the NodeList.
			@returns {glow.dom.NodeList}
			@example
				// Hides all list items within #myDiv
				glow.dom.get("#myDiv li").hide();
			*/
			hide: function() {
				return this.css("display", "none").css("visibility", "hidden");
			},

			/**
			@name glow.dom.NodeList#css
			@function
			@description Gets a CSS property for the first node or sets a CSS property on all nodes.

				<p><em>This method is not applicable to XML NodeLists.</em></p>

				If a single property name is passed, the corresponding value
				from the first node will be returned.

				If a single property name is passed with a value, that value
				will be set on all nodes on the NodeList.

				If an array of properties name is passed with no value, the return
				value is the sum of those values from the first node in the NodeList.
				This can be useful for getting the total of left and right padding,
				for example.

				Return values are strings. For instance, "height" will return
				"25px" for an element 25 pixels high. You may want to use
				parseInt to convert these values.

				Here are the compatible properties you can get, if you use one
				which isn't on this list the return value may differ between browsers.

				<dl>
				<dt>width</dt><dd>Returns pixel width, eg "25px". Can be used even if width has not been set with CSS.</dd>
				<dt>height</dt><dd>Returns pixel height, eg "25px". Can be used even if height has not been set with CSS.</dd>
				<dt>top, right, bottom, left</dt><dd>Pixel position relative to positioned parent, or original location if position:relative, eg "10px". These can be used even if position:static.</dd>
				<dt>padding-top</dt><dd>Pixel size of top padding, eg "5px"</dd>
				<dt>padding-right</dt><dd>Pixel size of right padding, eg "5px"</dd>
				<dt>padding-bottom</dt><dd>Pixel size of bottom padding, eg "5px"</dd>
				<dt>padding-left</dt><dd>Pixel size of left padding, eg "5px"</dd>
				<dt>margin-top</dt><dd>Pixel size of top margin, eg "5px"</dd>
				<dt>margin-right</dt><dd>Pixel size of right margin, eg "5px"</dd>
				<dt>margin-bottom</dt><dd>Pixel size of bottom margin, eg "5px"</dd>
				<dt>margin-left</dt><dd>Pixel size of left margin, eg "5px"</dd>
				<dt>border-top-width</dt><dd>Pixel size of top border, eg "5px"</dd>
				<dt>border-right-width</dt><dd>Pixel size of right border, eg "5px"</dd>
				<dt>border-bottom-width</dt><dd>Pixel size of bottom border, eg "5px"</dd>
				<dt>border-left-width</dt><dd>Pixel size of left border, eg "5px"</dd>
				<dt>border-*-style</dt><dd>eg "dotted"</dd>
				<dt>border-*-color</dt><dd>returns colour in format "rgb(255, 255, 255)", return value also has properties r, g & b to get individual values as integers</dd>
				<dt>color</dt><dd>returns colour in format "rgb(255, 255, 255)", return value also has properties r, g & b to get individual values as integers</dd>
				<dt>list-style-position</dt><dd>eg "outside"</dd>
				<dt>list-style-type</dt><dd>eg "square"</dd>
				<dt>list-style-image</dt><dd>Returns full image path, eg "url(http://www.bbc.co.uk/lifestyle/images/bullets/1.gif)" or "none"</dd>
				<dt>background-image</dt><dd>Returns full image path, eg "url(http://www.bbc.co.uk/lifestyle/images/bgs/1.gif)" or "none"</dd>
				<dt>background-attachment</dt><dd>eg "scroll"</dd>
				<dt>background-repeat</dt><dd>eg "repeat-x"</dd>
				<dt>direction</dt><dd>eg "ltr"</dd>
				<dt>font-style</dt><dd>eg "italic"</dd>
				<dt>font-variant</dt><dd>eg "small-caps"</dd>
				<dt>line-height</dt><dd>Pixel height, eg "30px". Note, Opera may return value with 2 decimal places, eg "30.00px"</dd>
				<dt>letter-spacing</dt><dd>Pixel spacing, eg "10px"</dd>
				<dt>text-align</dt><dd>eg "right"</dd>
				<dt>text-decoration</dt><dd>eg "underline"</dd>
				<dt>text-indent</dt><dd>Pixel indent, eg "10px"</dd>
				<dt>white-space</dt><dd>eg "nowrap"</dd>
				<dt>word-spacing</dt><dd>Pixel spacing, eg "5px"</dd>
				<dt>float</dt><dd>eg "left"</dd>
				<dt>clear</dt><dd>eg "right"</dd>
				<dt>opacity</dt><dd>Value between 0 & 1. In IE, this value comes from the filter property (/100)</dd>
				<dt>position</dt><dd>eg "relative"</dd>
				<dt>z-index</dt><dd>eg "32"</dd>
				<dt>display</dt><dd>eg "block"</dd>
				<dt>text-transform</dt><dd>eg "uppercase"</dd>
				</dl>

				The following return values that may be usable but have differences in browsers

				<dl>
				<dt>font-family</dt><dd>Some browsers return the font used ("Verdana"), others return the full list found in the declaration ("madeup, verdana, sans-serif")</dd>
				<dt>font-size</dt><dd>Returns size as pixels except in IE, which will return the value in the same units it was set in ("0.9em")</dd>
				<dt>font-weight</dt><dd>Returns named values in some browsers ("bold"), returns computed weight in others ("700")</dd>
				</dl>

			@param {String | String[] | Object} property The CSS property name, array of names to sum, or object of key-value pairs

			@param {String} [value] The value to apply

			@returns {glow.dom.NodeList | String}

				Returns the CSS value from the first node, or NodeList when setting values

			@example
				// get value from first node
				glow.dom.get("#myDiv").css("display");

			@example
				// set left padding to 10px on all nodes
				glow.dom.get("#myDiv").css("padding-left", "10px");

			@example
				// "30px", total of left & right padding
				glow.dom.get("#myDiv").css(["padding-left", "padding-right"]);

			@example
				// where appropriate, px is assumed when no unit is passed
				glow.dom.get("#myDiv").css("height", 300);
		
			@example
				// set multiple CSS values at once
				// NOTE: Property names containing a hyphen such as font-weight must be quoted
				glow.dom.get("#myDiv").css({
					"font-weight": "bold",
					padding: "10px",
					color: "#00cc99"
				})
			*/
			css: function(prop, val) {
				var that = this,
					thisStyle,
					i = 0,
					len = that.length,
					originalProp = prop;

				if (prop.constructor === Object) { // set multiple values
					for (style in prop) {
						this.css(style, prop[style]);
					}
					return that;
				}
				else if (val != undefined) { //set one CSS value
					prop = toStyleProp(prop);
					for (; i < len; i++) {
						thisStyle = that[i].style;
						
						if (typeof val == "number" && hasUnits.test(originalProp)) {
							val = val.toString() + "px";
						}
						if (prop == "opacity" && env.ie) {
							//in IE the element needs hasLayout for opacity to work
							thisStyle.zoom = "1";
							if (val === "") {
								thisStyle.filter = "";
							} else {
								thisStyle.filter = "alpha(opacity=" + Math.round(Number(val, 10) * 100) + ")";
							}
						} else {
							thisStyle[prop] = val;
						}
					}
					return that;
				} else { //getting stuff
					if (!len) { return; }
					return getCssValue(that[0], prop);
				}
			},

			/**
			@name glow.dom.NodeList#offset
			@function
			@description Gets the offset from the top left of the document.
			
				If the NodeList contains multiple items, the offset of the
				first item is returned.

			@returns {Object}
				Returns an object with "top" & "left" properties in pixels

			@example
				glow.dom.get("#myDiv").offset().top
			*/
			offset: function () {
				// http://weblogs.asp.net/bleroy/archive/2008/01/29/getting-absolute-coordinates-from-a-dom-element.aspx - great bit of research, most bugfixes identified here (and also jquery trac)
				var elm = this[0],
					docScrollPos = scrollPos();

				//this is simple(r) if we can use 'getBoundingClientRect'
				// Sorry but the sooper dooper simple(r) way is not accurate in Safari 4
				if (!glow.env.webkit && elm.getBoundingClientRect) {
					var rect = elm.getBoundingClientRect();
					return {
						top: rect.top
							/*
							 getBoundingClientRect is realive to top left of
							 the viewport, so we need to sort out scrolling offset
							*/
							+ docScrollPos.y
							/*
							 IE adds the html element's border to the value. We can
							 deduct this value using client(Top|Left). However, if
							 the user has done html{border:0} clientTop will still
							 report a 2px border in IE quirksmode so offset will be off by 2.
							 Hopefully this is an edge case but we may have to revisit this
							 in future
							*/
							- docElm.clientTop,

						left: rect.left //see above for docs on all this stuff
							+ docScrollPos.x
							- docElm.clientLeft
					};
				} else { //damnit, let's go the long way around
					var top = 0,
						left = 0,
						originalElm = elm,
						nodeNameLower,
						//does the parent chain contain a position:fixed element
						involvesFixedElement = false,
						offsetParentBeforeBody;

					//add up all the offset positions
					do {
						left += elm.offsetLeft;
						top += elm.offsetTop;

						//if css position is fixed, we need to add in the scroll offset too, catch it here
						if (getCssValue(elm, "position") == "fixed") {
							involvesFixedElement = true;
						}

						//gecko & webkit (safari 3) don't add on the border for absolutely positioned items
						if (env.gecko || env.webkit > 500) {
							left += parseInt(getCssValue(elm, "border-left-width"));
							top += parseInt(getCssValue(elm, "border-top-width"));
						}

						//we need the offset parent (before body) later
						if (elm.nodeName.toLowerCase() != "body") {
							offsetParentBeforeBody = elm;
						}

					} while (elm = elm.offsetParent);

					//deduct all the scroll offsets
					elm = originalElm;
					while ((elm = elm.parentNode) && (elm != docBody) && (elm != docElm)) {
						left -= elm.scrollLeft;
						top -= elm.scrollTop;

						//FIXES
						//gecko doesn't add the border of contained elements to the offset (overflow!=visible)
						if (env.gecko && getCssValue(elm, "overflow") != "visible") {
							left += parseInt(getCssValue(elm, "border-left-width"));
							top += parseInt(getCssValue(elm, "border-top-width"));
						}
					}

					//if we found a fixed position element we need to add the scroll offsets
					if (involvesFixedElement) {
						left += docScrollPos.x;
						top += docScrollPos.y;
					}

					//FIXES
					// Webkit < 500 body's offset gets counted twice for absolutely-positioned elements (or if there's a fixed element)
					// Gecko - non-absolutely positioned elements that are direct children of body get the body offset counted twice
					if (
						(env.webkit < 500 && (involvesFixedElement || getCssValue(offsetParentBeforeBody, "position") == "absolute")) ||
						(env.gecko && getCssValue(offsetParentBeforeBody, "position") != "absolute")
					) {
						left -= docBody.offsetLeft;
						top -= docBody.offsetTop;
					}

					return {left:left, top:top};
				}
			},
			
			/**
			@name glow.dom.NodeList#position
			@function
			@description Get the top & left position of an element relative to its positioned parent
				
				This is useful if you want to make a position:static element position:absolute
				and retain the original position of the element
				
			@returns {Object} An object with 'top' and 'left' number properties

			@example
				// get the top distance from the positioned parent
				glow.dom.get("#elm").position().top
			*/
			position: function() {
				var positionedParent = r.get( getPositionedParent(this[0]) ),
					hasPositionedParent = !!positionedParent[0],
					
					// element margins to deduct
					marginLeft = parseInt( this.css("margin-left") ) || 0,
					marginTop  = parseInt( this.css("margin-top")  ) || 0,
					
					// offset parent borders to deduct, set to zero if there's no positioned parent
					positionedParentBorderLeft = ( hasPositionedParent && parseInt( positionedParent.css("border-left-width") ) ) || 0,
					positionedParentBorderTop  = ( hasPositionedParent && parseInt( positionedParent.css("border-top-width")  ) ) || 0,
					
					// element offsets
					elOffset = this.offset(),
					positionedParentOffset = hasPositionedParent ? positionedParent.offset() : {top: 0, left: 0};
				
				return {
					left: elOffset.left - positionedParentOffset.left - marginLeft - positionedParentBorderLeft,
					top:  elOffset.top  - positionedParentOffset.top  - marginTop  - positionedParentBorderTop
				}
			},
			
			/**
			@name glow.dom.NodeList#append
			@function
			@description Appends the given elements to each node.

				If there is more than one node in the NodeList, then the given elements
				are appended to the first node and clones are appended to the other
				nodes.

				<p><em>String nodespecs cannot be used with XML NodeLists</em></p>

			@param {String | Element | glow.dom.NodeList} nodespec HTML string, Element or NodeList to append to each node.

			@returns {glow.dom.NodeList}

			@example
				// ends every paragraph with '...'
				glow.dom.get('p').append(
					'<span>...</span>'
				);
			*/
			append: function (nodeSpec) {
				var that = this,
					j = 0,
					i = 1,
					length = that.length,
					nodes;

				if (length == 0) { return that; }
				nodes = typeof nodeSpec == "string" ? nodelistToArray(stringToNodes(nodeSpec)) :
						nodeSpec.nodeType ? [nodeSpec] : nodelistToArray(nodeSpec);

				for (; nodes[j]; j++) {
					that[0].appendChild(nodes[j]);
				}
				for (; i < length; i++) {
					for (j = 0; nodes[j]; j++) {
						that[i].appendChild(nodes[j].cloneNode(true));
					}
				}
				return that;
			},

			/**
			@name glow.dom.NodeList#prepend
			@function
			@description Prepends the given elements to each node.

				If there is more than one node in the NodeList, then the given elements
				are prepended to the first node and clones are prepended to the other
				nodes.

				<p><em>String nodespecs cannot be used with XML NodeLists</em></p>

			@param {String | Element | glow.dom.NodeList} nodespec HTML string, Element or NodeList to prepend to each node.

			@returns {glow.dom.NodeList}

			@example
				// prepends every paragraph with 'Paragraph: '
				glow.dom.get('p').prepend(
					'<span>Paragraph: </span>'
				);
			*/
			prepend: function (nodeSpec) {
				var that = this,
					j = 0,
					i = 1,
					length = that.length,
					nodes,
					first;

				if (length == 0) { return that; }

				nodes = typeof nodeSpec == "string" ? nodelistToArray(stringToNodes(nodeSpec)) :
						nodeSpec.nodeType ? [nodeSpec] : nodelistToArray(nodeSpec);

				first = that[0].firstChild;

				for (; nodes[j]; j++) {
					that[0].insertBefore(nodes[j], first);
				}

				for (; i < length; i++) {
					first = that[i].firstChild;
					for (j = 0; nodes[j]; j++) {
						that[i].insertBefore(nodes[j].cloneNode(true), first);
					}
				}
				return that;
			},

			/**
			@name glow.dom.NodeList#appendTo
			@function
			@description Appends the NodeList to elements.

				If more than one element is given (i.e. if the nodespec argument
				is an array of nodes or a NodeList) the NodeList will be
				appended to the first element and clones to each subsequent
				element.

			@param {String | Element | glow.dom.NodeList} nodespec CSS selector string, Element or NodeList to append the NodeList to.

			@returns {glow.dom.NodeList}

			@example
				// appends '...' to every paragraph
				glow.dom.create('<span>...</span>').appendTo('p');
			*/
			appendTo: function (nodes) {
				if (! (nodes instanceof r.NodeList)) { nodes = r.get(nodes); }
				nodes.append(this);
				return this;
			},

			/**
			@name glow.dom.NodeList#prependTo
			@function
			@description Prepends the NodeList to elements.

				If more than one element is given (i.e. if the nodespec argument
				is an array of nodes or a NodeList) the NodeList will be
				prepended to the first element and clones to each subsequent
				element.

			@param {String | Element | glow.dom.NodeList} nodespec CSS selector string, Element or NodeList to prepend the NodeList to.

			@returns {glow.dom.NodeList}

			@example
				// prepends 'Paragraph: ' to every paragraph
				glow.dom.create('<span>Paragraph: </span>').prependTo('p');
			*/
			prependTo: function (nodes) {
				if (! (nodes instanceof r.NodeList)) { nodes = r.get(nodes); }
				nodes.prepend(this);
				return this;
			},

			/**
			@name glow.dom.NodeList#after
			@function
			@description Inserts elements after each node.

				If there is more than one node in the NodeList, the elements
				will be inserted after the first node and clones inserted
				after each subsequent node.

			@param {String | Element | glow.dom.NodeList} nodespec HTML string, Element or NodeList to insert after each node

			@returns {glow.dom.NodeList}

			@example
				// adds a paragraph after each heading
				glow.dom.get('h1, h2, h3').after('<p>...</p>');
			*/
			after: function (nodeSpec) {
				var that = this,
					length = that.length,
					nodes,
					nodesLen,
					j,
					i = 1,
					cloned;

				if (length == 0) { return that; }

				nodes = typeof nodeSpec == "string" ? r.create(nodeSpec) :
					nodeSpec instanceof r.NodeList ? nodeSpec :
					r.get(nodeSpec);

				nodesLen = nodes.length;

				for (j = nodesLen - 1; j >= 0; j--) {
					that[0].parentNode.insertBefore(nodes[j], that[0].nextSibling);
				}
				for (; i < length; i++) {
					cloned = nodes.clone();

					for (j = nodesLen - 1; j >= 0; j--) {
						that[i].parentNode.insertBefore(cloned[j], that[i].nextSibling);
					}
				}
				return that;
			},

			/**
			@name glow.dom.NodeList#before
			@function
			@description Inserts elements before each node.

				If there is more than one node in the NodeList, the elements
				will be inserted before the first node and clones inserted
				before each subsequent node.

			@param {String | Element | glow.dom.NodeList} nodespec HTML string, Element or NodeList to insert before each node

			@returns {glow.dom.NodeList}

			@example
				// adds a heading before each
				glow.dom.get('p').before('<h1>Paragraph:</h1>');
			*/
			before: function (nodeSpec) {
				var that = this,
					length = that.length,
					j = 0,
					i = 1,
					nodes,
					nodesLen,
					cloned;

				if (length == 0) { return that; }

				nodes = typeof nodeSpec == "string" ? r.create(nodeSpec) :
					nodeSpec instanceof r.NodeList ? nodeSpec :
					r.get(nodeSpec);

				nodesLen = nodes.length;

				for (; j < nodesLen; j++) {
					that[0].parentNode.insertBefore(nodes[j], that[0]);
				}
				for (; i < length; i++) {
					cloned = nodes.clone();
					for (j = 0; j < nodesLen; j++) {
						that[i].parentNode.insertBefore(cloned[j], that[i]);
					}
				}
				return that;
			},

			/**
			@name glow.dom.NodeList#insertAfter
			@function
			@description Insert the NodeList after each of the given elements.

				If more than one element is passed in, the NodeList will be
				inserted after the first element and clones inserted after each
				subsequent element.

			@param {String | Element | glow.dom.NodeList} nodespec CSS selector string, Element or NodeList to insert the NodeList after

			@returns {glow.dom.NodeList}

			@example
				// adds a paragraph after each heading
				glow.dom.create('<p>HAI!</p>').insertAfter('h1, h2, h3');
			*/
			insertAfter: function (nodes) {
				if (! (nodes instanceof r.NodeList)) { nodes = r.get(nodes); }
				nodes.after(this);
				return this;
			},

			/**
			@name glow.dom.NodeList#insertBefore
			@function
			@description Insert the NodeList before each of the given elements.

				If more than one element is passed in, the NodeList will be
				inserted before the first element and clones inserted before each
				subsequent element.

			@param {String | Element | glow.dom.NodeList} nodespec CSS selector string, Element or NodeList to insert the NodeList before

			@returns {glow.dom.NodeList}

			@example
				// adds a heading before each paragraph
				glow.dom.create('<h1>Paragraph:</h1>').insertBefore('p');
			*/
			insertBefore: function (nodes) {
				if (! (nodes instanceof r.NodeList)) { nodes = r.get(nodes); }
				nodes.before(this);
				return this;
			},


			/**
			@name glow.dom.NodeList#replaceWith
			@function
			@description Replace nodes on the page with given elements.

			@param {glow.dom.NodeList | String} nodespec Elements to insert into the document.

				If more than one node is to be replaced then nodespec will be
				cloned for additional elements. If a string is provided it will
				be treated as HTML and converted into elements.

			@returns {glow.dom.NodeList}
				Returns a new NodeList containing the nodes which have been removed
			*/
			replaceWith: function (nodeSpec) {
				/*
				 we need to put a placeholder in first in case the new stuff
				 has the same ids as stuff being replaced. This causes issues
				 in safari 2, the new element can't be picked up with getElementById
				*/
				if (env.webkit < 500) {
					this.after(placeholderElm).remove();
					r.get("u.glow-placeholder").after(nodeSpec).remove();
				} else {
					this.after(nodeSpec).remove()
				}
				return this;
			},
			
			/**
			@name glow.dom.NodeList#data
			@function
			@description Lorem ipsum
			@param {String|Object} [key]
			@param {Object} [val]
			*/
			data: function (key, val) { /*debug*///console.log("data()");
				if (typeof key === "object") { // setting many values
					for (var prop in key) { this.data(prop, key[prop]); }
				}
				
				var elm = null,
					i = this.length,
					index = null;
				// uses private class-scoped variables: dataCache, dataPropName, dataIndex
				
				while (i--) {
					elm = this[i];
					
					if (elm[dataPropName] === undefined) {
						elm[dataPropName] = dataIndex;
						dataCache[dataIndex++] = {};
					}
					
					index = elm[dataPropName];
					
					// TODO - need to defend against reserved words being used as keys?
					switch (arguments.length) {
						case 0:
							return dataCache[index];
						case 1:
							return dataCache[index][key];
						case 2:
							dataCache[index][key] = val;
							break;
						default:
							throw new Error("glow.dom.NodeList#data expects 2 or less arguments, not "+arguments.length+".");
					}
				}
			},
			
			// TODO - clone() and destroy() need to handle attached data
			
			/**
			@name glow.dom.NodeList#removeData
			@function
			@description Lorem ipsum
			@param {String} [key]
			*/
			removeData: function (key) {
				var elm = null,
					i = this.length,
					index = null;
				// uses private class-scoped variables: dataCache, dataPropName
				
				while (i--) {
					elm = this[i];
					index = elm[dataPropName];
					if ( index !== undefined ) {
						switch (arguments.length) {
							case 0:
								delete dataCache[index];
								try {
									delete elm[dataPropName]; // IE 6 goes wobbly here
								}
								catch(e) { // remove expando from IE 6
									elm[dataPropName] = undefined;
									elm.removeAttribute && elm.removeAttribute(dataPropName);
								}
								break;
							case 1:
								delete dataCache[index][key];
								break;
							default:
								throw new Error("glow.dom.NodeList#removeData expects 1 or less arguments, not "+arguments.length+".");
						}
					}
				}
			},

			/**
			@name glow.dom.NodeList#get
			@function
			@description Gets decendents of nodes that match a CSS selector.

			@param {String} selector CSS selector

			@returns {glow.dom.NodeList}
				Returns a new NodeList containing matched elements

			@example
				// create a new NodeList
				var myNodeList = glow.dom.create("<div><a href='s.html'>Link</a></div>");

				// get 'a' tags that are decendants of the NodeList nodes
				myNewNodeList = myNodeList.get("a");
			*/
			get: function() {

				/*
				PrivateFunction: compileSelector
					Compile a CSS selector to an AST.

				Arguments:
					sSelector - A string containing the CSS selector (or comma separated group of selectors).

				Returns:
					An array containing an AST for each selector in the group.
				*/
				function compileSelector(sSelector) {
					//return from cache if possible
					if (cssCache[sSelector]) {
						return cssCache[sSelector];
					}

					var r = [], //array of result objects
						ri = 0, //results index
						comb, //current combinator
						tagTmp,
						idTmp,
						aRx, //temp regex result
						matchedCondition, //have we matched a condition?
						sLastSelector, //holds last copy of selector to prevent infinite loop
						firstLoop = true,
						originalSelector = sSelector;

					while (sSelector && sSelector != sLastSelector) {
						tagTmp = "";
						idTmp = "";
						//protect us from infinite loop
						sLastSelector = sSelector;

						//start by getting the scope (combinator)
						if (aRx = cssRegex.combinator.exec(sSelector)) {
							comb = aRx[1];
							sSelector = sSelector.slice(aRx[0].length);
						}
						//look for optimal id & tag searching
						if (aRx = cssRegex.tagName.exec(sSelector)) {
							tagTmp = aRx[1];
							sSelector = sSelector.slice(aRx[0].length);
						}
						if (aRx = cssRegex.classNameOrId.exec(sSelector)) {
							if (aRx[1] == "#") {
								idTmp = aRx[2];
								sSelector = sSelector.slice(aRx[0].length);
							}
						}
						if (!comb) { //use native stuff
							if (idTmp && firstLoop) {
								r[ri++] = [getByIdQuick, [idTmp.replace(/\\/g, ""), tagTmp || "*", null]];
							} else {
								r[ri++] = [getByTagName, [tagTmp || "*", null]];
								if (idTmp) {
									r[ri++] = [hasId, [idTmp.replace(/\\/g, ""), null]];
								}
							}
						} else if (comb == ">") {
							r[ri++] = [getChildren, [null]];
							if (idTmp) {
								r[ri++] = [hasId, [idTmp.replace(/\\/g, ""), null]];
							}
							if (tagTmp && tagTmp != "*") { //uses tag
								r[ri++] = [isTag, [tagTmp, null]];
							}
						}

						//other conditions can appear in any order, so here we go:
						matchedCondition = true;
						while (matchedCondition) {
							//look for class or ID
							if (sSelector.charAt(0) == "#" || sSelector.charAt(0) == ".") {
								if (aRx = cssRegex.classNameOrId.exec(sSelector)) {
									if (sSelector.charAt(0) == "#") { //is ID
										//define ID, remove escape chars
										r[ri++] = [hasId, [aRx[2].replace(/\\/g, ""), null]];
									} else { //is class
										r[ri++] = [hasClassName, [aRx[2].replace(/\\/g, ""), null]];
									}
									sSelector = sSelector.slice(aRx[0].length);
								} else {
									throw new Error("Invalid Selector " + originalSelector);
								}
							} else {
								matchedCondition = false;
							}
						}

						firstLoop = false;
					}

					if (sSelector !== "") {
						throw new Error("Invalid Selector " + originalSelector);
					}

					//add to cache and return
					return cssCache[sSelector] = r;
				}

				/*
				PrivateFunction: fetchElements
					Get elements which match array of compiled conditions based on
					an initial context.

				Arguments:
					a - (object) CSS selector AST object.
					initialContext - DOM Element or DOM Document to search within.

				Returns:
					An array of matching elements.
				*/
				function fetchElements(a, initialContext) {
					var context = initialContext; //elements to look within

					for (var i = 0, al = a.length; i < al; i++) {
						a[i][1][a[i][1].length - 1] = context;
						context = a[i][0].apply(this, a[i][1]);
					}
					return context;
				}

				/*
				PrivateFunction: getByIdQuick
					Get an element with a specific tag name, within a context.

				Arguments:
					id - (string) the id of the element.
					tagName - (string) the name of the element.
					context - DOM Element or DOM Document in which to find the element.

				Returns:
					A DOM Element matching the specified criteria.
				*/
				function getByIdQuick(id, tagName, context) {
					var r = [], ri = 0, notQuick = [], notQuicki = 0, tmpNode;
					for (var i = 0, length = context.length; i < length; i++) {
						if (context[i].getElementById) {
							tmpNode = context[i].getElementById(id);
							if (tmpNode && (tmpNode.tagName == tagName.toUpperCase() || tagName == "*" || tmpNode.tagName == tagName)) {
								r[ri++] = tmpNode;
							}
						} else {
							notQuick[notQuicki++] = context[i];
						}
					}
					//deal with the ones we couldn't do quick
					if (notQuick[0]) {
						notQuick = getByTagName(tagName, notQuick);
						notQuick = hasId(id, notQuick);
					}
					return r.concat(notQuick);
				}

				function getChildren(context) {
					var r = [],
						i = 0,
						len = context.length;
						
					for (; i < len; i++) {
						append( r, getChildElms(context[i]) );
					}
					return r;
				}

				function hasId(id, context) {
					for (var i = 0, length = context.length; i < length; i++) {
						if (context[i].id == id) {
							//is this a safe optimisation?
							return [context[i]];
						}
					}
					return [];
				}

				/*
				PrivateFunction: isTag
					Get an array of elements within an array that have a given tag name.

				Arguments:
					tagName - (string) the name of the element.
					context - (array) elements to match.

				Returns:
					An array of matching elements.
				*/
				function isTag(tagName, context) {
					var r = [], ri = 0;
					for (var i = 0, length = context.length; i < length; i++) {
						if (context[i].tagName == tagName.toUpperCase() || context[i].tagName == tagName) {
							r[ri++] = context[i];
						}
					}
					return r;
				}

				/*
				PrivateFunction: hasClassName
					Get elements that have a given class name from a provided array of elements.

				Arguments:
					className - (string) the name of the class.
					context - (array) the DOM Elements to match.

				Returns:
					An array of matching DOM Elements.
				*/
				function hasClassName(className, context) {
					var r = [], ri = 0;
					for (var i = 0, length = context.length; i < length; i++) {
						if ((" " + context[i].className + " ").indexOf(" " + className + " ") != -1) {
							r[ri++] = context[i];
						}
					}
					return r;
				}

				/*
				PrivateFunction: getBySelector
					Get elements within a context by a CSS selector.

				Arugments:
					sSelector - (string) CSS selector.
					context - DOM Document or DOM Element to search within.

				Returns:
					An array of DOM Elements.
				*/
				function getBySelector(sSelector, context) {
					var aCompiledCSS; // holds current compiled css statement
					var r = [];
					//split multiple selectors up
					var aSelectors = sSelector.split(",");
					//process each
					for (var i = 0, nSelLen = aSelectors.length; i < nSelLen; i++) {
						aCompiledCSS = compileSelector(glow.lang.trim(aSelectors[i]));
						//get elements from DOM
						r = r.concat(fetchElements(aCompiledCSS, context));
					}
					return r;
				}

				/*
				PrivateFunction: getIfWithinContext
					Get elements from a set of elements that are within at least one of another
					set of DOM Elements.

				Arguments:
					nodes - DOM Elements to take the results from.
					context - DOM Elements that returned elements must be within.

				Returns:
					An array of DOM Elements.
				*/
				function getIfWithinContext(nodes, context) {
					nodes = nodes.length ? nodes : [nodes];
					var r = []; //to return
					var nl;

					//loop through nodes
					for (var i = 0; nodes[i]; i++) {
						nl = glow.dom.get(nodes[i]);
						//loop through context nodes
						for (var n = 0; context[n]; n++) {
							if (nl.isWithin(context[n])) {
								r[r.length] = nl[0];
								break;
							}
						}
					}
					return r;
				}
				
				// main implementation
				return function(sSelector) {
					// no point trying if there's no current context
					if (!this.length) { return this; }

					var r = []; //nodes to return
					// decide what to do by arg
					for (var i = 0, argLen = arguments.length; i < argLen; i++) {
						if (typeof arguments[i] == "string") { // css selector string
							r = r.concat(getBySelector(arguments[i], this));
							// append(r, getBySelector(arguments[i], this));
						} else { // nodelist, array, node
							r = r.concat(getIfWithinContext(arguments[i], this));
							// append(r, getIfWithinContext(arguments[i], this));
						}
					}

					// strip out duplicates, wrap in nodelist
					return glow.dom.get(unique(r));
				};
			}()
		};

		//some init stuff. Using u to make it quicker to get by tag name :)
		placeholderElm = r.create('<u class="glow-placeholder"></u>');
		//set up glow.dom
		glow.dom = r;

	}
});
