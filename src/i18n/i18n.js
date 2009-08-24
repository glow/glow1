/**
@name glow.i18n
@namespace
@description Internationalisation Module.
@requires glow
@see <a href="../furtherinfo/i18n/index.shtml">Using glow.i18n</a>
*/
(window.gloader || glow).module({
	name: "glow.i18n",
	library: ["glow", "@VERSION@"],
	depends: [["glow", "@VERSION@"]],
	builder: function(glow) {
		var self;
		
		// Regexes for judging subtag types in the 'L'anguage, 'S'cript, 'R'egion, 'V'ariant form
		// lv is a match for a subtag that can be either 'L'anguage or 'V'ariant
		// See full explanation of tags and subtags at the end of the file
		var subtagRegexes = {
				l  : /^[a-z]$/,
				lv : /^[a-z]{2,3}$/,
				s  : /^[A-Z][a-z]{3}$/,
				r  : /^[A-Z]{2}|[0-9]{3}$/,
				v  : /^[a-z0-9]{4,}$/
			};

		// Bit masks for tag signature in the 'L'anguage, 'S'cript, 'R'egion, 'V'ariant form
		// See full explanation of tags and subtags at the end of the file
		var L    = 1,
			S    = 2,
			R    = 4,
			V    = 8,
			LSRV = L + S + R + V,
			LRV  = L     + R + V,
			LSV  = L + S     + V,
			LV   = L         + V,
			LSR  = L + S + R    ,
			LR   = L     + R    ,
			LS   = L + S;
	
		// Base structures for tag parsing using 'L'anguage, 'S'cript, 'R'egion, 'V'ariant form
		// See full explanation of tags and subtags at the end of the file
		var masks   = {l: L, s: S, r: R, v: V}, // map subtag types to masks
			subtags = ['l', 's', 'r', 'v'],		// in order
			labels  = {l: 0, s: 1, r: 2, v: 3}; // reverse look up for subtags

		// holds the actual local pack data
		var localePacks = {};

		// holds the main index of the pack / module structure
		var moduleStructure = {};

		// the currently selected locale
		// comes from html lang if it exists and is valid, defaults to 'en'
		var currentLocale = parseTag(document.documentElement.lang || 'en') || parseTag('en');
		
		// Determine what, if any, type of subtag this is by regex matching
		function getSubtagPattern( subtag ) {
			for (var pattern in subtagRegexes) { // These regexes are mutually exclusive, so order is immaterial
				if (subtagRegexes[pattern].test(subtag)) {
					return pattern;
				}
			}
	
			return "";
		}

		// Parse the given tag and return a queryable data set using 'L'anguage, 'S'cript, 'R'egion, 'V'ariant form
		// See full explanation of tags and subtags at the end of the file
		// if the tag is valid, returns the internal representation of a parsed locale tag
		// canonical is the valid canonical form of the tag eg "en-GB", mask is a bitmask indicating which subtag types are present and subtags is an object containing the actual subtags
		function parseTag( tag ) {
			if (!tag.split) {
				tag = "";
			}
		
			var parts = tag.split("-"), // get the subtags
				len = parts.length,
				canon = [],				// will hold the subtags of the canonical tag
				matchedSubtags = {l: "", s:"", r:"", v:""},
				start = 0,
				i = start,
				mask = 0,
				subtag,
				label;
		
			for (var j = 0, jlen = subtags.length; j < jlen; j++) { // order of subtag match is important
				i = start;
				subtag = subtags[j];
				label = labels[subtag];
	
				while ((getSubtagPattern(parts[i]).indexOf(subtag) == -1) && (i < len)) { // indexOf allows for partial match of 'lv' regex
					i++; // if no match, move on
				}
				
				if (i < len) { // if a match is found, store it and continue with the next subtag from this point
					canon[label] = parts[i];
					mask += masks[subtag];
					matchedSubtags[subtag] = parts[i];
					parts[i] = "*";
					start = i;
				}
			}
			
			// put it all back together as a string
			var canonical = canon.join("-").replace(/-+/g, "-");
			
			if ((canonical == "") || (canonical.substring(0, 1) == "-")) { // this means there is no language subtag, so we must fail the parse
				return false;
			}
			else {
				return {canonical: canonical, mask: mask, subtags: matchedSubtags};
			}
		}		
		
		// For a given tag, and mask for a subset of it, return the subset tag using 'L'anguage, 'S'cript, 'R'egion, 'V'ariant form
		// eg for 'en-GB-scouse' and an LR mask, return 'en-GB'
		// See full explanation of tags and subtags at the end of the file
		// ** note the bitwise operations **
		function getSubsetTag( parsed, test, mask ) {
			var subset;
			
			// this test (bitwise because the operands are bitmasks) determines that mask has no bits set that parsed.mask does not
			// this is to make sure that the tag being generated is genuinely a subset of the main tag
			if ((mask & ~parsed.mask) == 0) {
				subset = parsed.subtags["l"]; // there must be a language subtag, because this tags passed the parse
				
				if (S & mask) {
					subset = subset + "-" + parsed.subtags["s"];
				}
				if (R & mask) {
					subset = subset + "-" + parsed.subtags["r"];
				}
				if (V & mask) {
					subset = subset + "-" + parsed.subtags["v"];
				}
	
				if (test(subset)) {
					return subset;
				}
			}
		
			return false;
		}

		// Performs the generic tag negotiation process
		// The test is a function that performs an additional check to see if the subset tag currently being
		// checked should be used, normally based on the presence of appropriate data in the locale packs
		// parsed is the parsed locale tag, as returned by parseTag
		// testFn is the function passed to getSubsetTag, used to determine if a given subste tag is a negotiated hit
		// successFn, failFn are the functions to be run when the negotiation result is known
		function negotiate( parsed, testFn, successFn, failFn ) {
			var subset;
					
			switch(parsed.mask) { // NOTE the breaks are conditional because it might be OK for all the cases to execute - need to move on to the next case if the "if" fails
				case LRV:
					if ((subset = getSubsetTag(parsed, testFn, LRV ))) {
						break;
					}
				case LR:
					if ((subset = getSubsetTag(parsed, testFn, LR  ))) {
						break;
					}
				case LSRV:
					if ((subset = getSubsetTag(parsed, testFn, LSRV))) {
						break;
					}
				case LSR:
					if ((subset = getSubsetTag(parsed, testFn, LSR ))) {
						break;
					}
				case LSV:
					if ((subset = getSubsetTag(parsed, testFn, LSV ))) {
						break;
					}
				case LS:
					if ((subset = getSubsetTag(parsed, testFn, LS  ))) {
						break;
					}
				case LV:
					if ((subset = getSubsetTag(parsed, testFn, LV  ))) {
						break;
					}
				case L:
					if ((subset = getSubsetTag(parsed, testFn, L   ))) {
						break;
					}
				default:
					if (testFn('en')) {
						subset = 'en';
					}
					else {
						subset = null;
					}
			}

			if (subset == null) {
				failFn();
			} 
			else {
				successFn(subset);
			}
		}
	
		/**
		@name glow.i18n.setLocale
		@function
		@description Sets the locale to a new one, stacking up the old one for later retreival.
		
			Has no effect if the newLocaleTag is invalid.
		
		@param {String} newLocaleTag The new locale tag to be set.

		@returns this
		
		@example
			// assume locale is "en-GB" first
			glow.i18n.setLocale("cy-GB");
			// locale is now "cy-GB" with "en-GB" stacked up
		*/
		function setLocale( newLocaleTag ) {
			var old = currentLocale,
				parsed = parseTag(newLocaleTag);

			if (parsed) {
				currentLocale = parsed;
				currentLocale.next = old;
			}
			
			return self;
		}
	
		/**
		@name glow.i18n.revertLocale
		@function
		@description Reverts the locale to the one used immediately prior to the current one.
		
			Has no effect if the current locale was the first set (ie if no new locales have been set,
			or if the locale has been reverted all the way back to the beginning).

		@returns this
		
		@example
			// assume locale is "en-GB" first
			glow.i18n.setLocale("cy-GB");
			// locale is now "cy-GB" with "en-GB" stacked up
			glow.i18n.revertLocale();
			// locale is now back to "en-GB"
		*/
		function revertLocale() {
			currentLocale = currentLocale.next || currentLocale;
			
			return self;		
		}
		
		/**
		@name glow.i18n.getLocale
		@function
		@description Returns the tag of the current locale in canonical form.

		@returns {String}

		@example
			loc = glow.i18n.getLocale(); // returns the current locale eg "en-GB"

			glow.i18n.setLocale("cy-GB");
			loc = glow.i18n.getLocale(); // now returns "cy

			glow.i18n.setLocale("en-ignoredsubtag-US");
			loc = glow.i18n.getLocale(); // now returns "en-US", which is the canonical form
		*/
		function getLocale() {
			return currentLocale.canonical;
		}
		
		/**
		@name glow.i18n.addLocaleModule
		@function
		@description Stores the given data against the given module on the given locale.
			Creates any local packs and / or moduels that dio not already exist.
			Adds the given data to any that do.

		@param {String} moduleName The name of the module to be created/added to.
		@param {String} localeTag The locale tag to add the module to.
		@param {Object} data The data of the module in key : value form.

		@returns this
		
		@example
			// assume locale is "en-GB" first
			glow.i18n.setLocale("cy-nonsense-GB");
			var newLocale = glow.i18n.getLocale(); // returns "cy-GB"
		*/
		function addLocaleModule( moduleName, localeTag, data ) {
			var tag = parseTag(localeTag),
				pack,
				module,
				structure;
			
			if (tag) {
				pack      = localePacks[tag.canonical]  = localePacks[tag.canonical]  || {};
				module    = pack[moduleName]            = pack[moduleName]            || {};
				structure = moduleStructure[moduleName] = moduleStructure[moduleName] || {};
				
				for (var key in data) { // not using glow.lang.apply to avoid two loops
					module[key] = data[key];
					structure[key] = 1;
				}
			}
 			
			return self;
		}
	
		/**
		@name glow.i18n.getLocaleModule
		@function
		@description Retreives an object whose keys are every label that can have a value (via tag negotiation) associated with it, and whose values are the associated label values.

		@param {String} moduleName The name of the module retreived.
		@param {Object} [opts] Options object
			@param {String} [opts.locale] On override locale to use instaed of the system locale.

		@returns {Object}
		*/
		function getLocaleModule( moduleName, opts ) {
			var module = {},
				options = opts || {},
				structure = moduleStructure[moduleName] || {},
				localeTag = currentLocale,
				tag,
				label;

			// define the customisers for negotiate outside the loop
			// oddly, the loop control variable *is* correclty accessed, becasue of var scoping and the synchronous function calls
			function test( nTag ) {
				if (localePacks[nTag] && localePacks[nTag][moduleName] && localePacks[nTag][moduleName][label]) {
					return true;
				}
				else {
					return false;
				}
			}
			
			function success( sTag ) {
				module[label] = localePacks[sTag][moduleName][label];
			}
			
			function fail() {
				module[label] = "[Error! No " + moduleName + "." + label + " on " + localeTag.canonical + "]";
			}
			
			if (options.locale != undefined) {
				tag = parseTag(options.locale);
				
				if (tag) {
					localeTag = tag;
				}
			}

			for (label in structure) {
				negotiate(localeTag, test, success, fail);
			}

			return module;
		}
		
		/**
		@name glow.i18n.addLocalePack
		@function
		@description Shortcut for creating many locale modules on one locale (ie a brand new entire locale pack)

		@param {String} localeTag The name of the module retreived.
		@param {Object} data The data of the module in MODULE : key : value form.

		@returns this
		*/
		function addLocalePack( localeTag, data ) {
			for (var moduleName in data) {
				addLocaleModule(moduleName, localeTag, data[moduleName]);
			}
			
			return self;
		}
	
		/**
		@name glow.i18n.checkLocale
		@function
		@description Developer focused checker for getting the locale tag(s) returned by tag negotiation
			if no options passed it returns a structured data object of the entire data set for the given locale
			if just a module name is passed, the result set is limited to that module
			if a module name and a label are passed it returns a string for just that label
	
		@param {String} localeTag The name of the module retreived.
		@param {Object} [opts] Options object
			@param {String} [opts.module] If set, restricts the results to that module.
			@param {String} [opts.label] If set alongside opts.module, restricts the results to that label on that module.

		@returns {Object}
		*/
		function checkLocale( localeTag, opts ) {
			var options = opts || {},
				parsed = parseTag(localeTag);
	
			if (options.module) {
				if (options.label) {
					return checkLocaleByModuleAndLabel(parsed, options.module, options.label);
				}
				else {
					return checkLocaleByModule(parsed, options.module);
				}
			}
			else {
				return checkLocaleByEverything(parsed);
			}
			
			return null;
		}

		// helper for checkLocale
		function checkLocaleByModuleAndLabel( parsed, module, label ) {
			var result;
			
			// Define the customisers for negotiate outside the function call to be consistent with other checkLocaleBy* helpers
			function test( nTag ) {
				if (localePacks[nTag] && localePacks[nTag][module] && localePacks[nTag][module][label]) {
					return true;
				}
				else {
					return false;
				}
			}
			
			function success( sTag ) {
				result = sTag;
			}
			
			function fail() {
				result = "**error** - no negotiated value exists";
			}

			negotiate(parsed, test, success, fail);
			
			return result;
		}
		
		// helper for checkLocale
		function checkLocaleByModule( parsed, module ) {
			var structure = moduleStructure[module] || {},
				results = {},
				label;

			// Define the customisers for negotiate outside the loop
			// Oddly, the loop control variable *is* correclty accessed, becasue of var scoping and the synchronous function calls
			function test( nTag ) {
				if (localePacks[nTag] && localePacks[nTag][module] && localePacks[nTag][module][label]) {
					return true;
				}
				else {
					return false;
				}
			}
			
			function success( sTag ) {
				results[label] = sTag;
			}
			
			function fail() {
				results[label] = "**error** - no negotiated value exists";
			}
			
			for (label in structure) {
				negotiate(parsed, test, success, fail);
			}
			
			return results;			
		}
		
		// helper for checkLocale
		function checkLocaleByEverything( parsed ) {
			var results = {},
				module,
				label;
			
			// Define the customisers for negotiate outside the loop
			// Oddly, the loop control variable *is* correclty accessed, becasue of var scoping and the synchronous function calls
			function test( nTag ) {
				if (localePacks[nTag] && localePacks[nTag][module] && localePacks[nTag][module][label]) {
					return true;
				}
				else {
					return false;
				}
			}
			
			function success( sTag ) {
				results[module][label] = sTag;
			}
			
			function fail() {
				results[module][label] = "**error** - no negotiated value exists";
			}

			for (module in moduleStructure) {
				results[module] = {};
				
				for (label in moduleStructure[module]) {
					negotiate(parsed, test, success, fail);
				}
			}
			
			return results;
		}

		
		// make the module
		glow.i18n = self = {
			setLocale : setLocale,
			revertLocale : revertLocale,
			getLocale : getLocale,
			addLocaleModule : addLocaleModule,
			getLocaleModule : getLocaleModule,
			addLocalePack : addLocalePack,
			checkLocale : checkLocale
		}
		
		// define the basic 'en' locale pack
		// just the properties - widgets and modules will add their own locale modules
		addLocalePack("en", {
			PROPERTIES : {
				LANGUAGE : "English",
				DIR : "ltr"
			}
		});
	}
});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

	About Locale Tags and Tag Negotiation
	=====================================
	
	Locale Tag negotiation is the process Glow uses to find the most specific
	match for a given tag given the context.
	
	
	
	Locale Tag Structure
	~~~~~~~~~~~~~~~~~~~~
	
	First, let's look at the anatomy of locale tags in Glow.
	
	According to the IANA spec, locale tags have this structure
	
		language-script-region-variant-extension-privateuse
	
	There are also "grandfathered" and "redundant" tags that existed before
	this structure was implemented and continue for backwards compatibility.
	
	Glow only supports the following subset of that structure. Subtags are
	separated by "-" and must appear in the correct order.
	
		language-script-region-variant
	
	These are the IANA formats of these subtags
	
	language : /[a-z]{2,3}/          - 2 or 3 lowercase letters.
	script   : /[A-Z][a-z]{3}/       - an uppercase letter followed by
									   3 lowercase letters
	region   : /[A-Z]{2}|[0-9]{3}/   - 2 upper case letters or a 3 digit number
	variant  : /[a-z0-9]{4,}/        - lower case letters or numbers,
									   4 or more characters
	
	eg (yes, these are all official IANA tags, even the last one...)
	
	en			  language                  generic English
	en-GB		  language-region        	British English
	en-Runr		  language-script           English written in Runic script
	en-Runr-GB	  language-script-region    British English written in Runic
	en-GB-scouse  language-region-variant	Scouse variant of British English
	
	While Glow does not support grandfathered or redundant tags or extension or
	private use subtags, it does not enforce compliance with the IANA registry.
	
	This means that if the subtag formats can be relaxed a little, variation
	from the standard could be used to fill these gaps with a tag that Glow can
	parse.
	
	As a result Glow applies theses formats to subtags
	
	language : /[a-z]{1,3}/        - 1, 2 or 3 lowercase letters
										> allowing shorter subtag than IANA
	script   : /[A-Z][a-z]{3}/     - an uppercase letter
									 followed by 3 lowercase letters
										> same as IANA
	region   : /[A-Z]{2}|[0-9]{3}/ - 2 upper case letters or a 3 digit number
										> same as IANA
	variant  : /[a-z0-9]{2,}/      - lower case letters or numbers,
									 2 or more characters
										> allowing shorter subtag than IANA
	
	This does mean that there is now potential conflict between the language
	and the variant subtags; a subtag that is 2 or 3 lowercase letters could be
	either. Glow's insistence on strict subtag order solves this. If a subtag
	that falls in this overlap zone is encountered, it is a language subtag
	first, a variant if a language has already be found, and ignored as a last
	resort.
	
	Now, even though according to IANA, en-GB-oed is grandfathered (the variant
	is too short), it can be directly supported by Glow.
	
	(If you're interested, en-GB-oed is British English, but with Oxford
	English Dictionary spellings. These basically -ize rather than -ise but all
	other spellings as en-GB, so the OED lists "colourize")
	
	
	
	Tag Negotiation Process
	~~~~~~~~~~~~~~~~~~~~~~~
	
	When parsing a tag, Glow will look for each subtag in the expected order.
	If a subtag is encountered out of order, or when that item has already been
	parsed, it will be ignored. If a subtag's type cannot be identified, it
	will be ignored.
	
	GB-cy-1-en-US will be parsed as cy-US.
		'GB' is out of order,
		'en' is a duplicated language subtag and
		'1' is not a recognised subtag type.
	
	Given all this, Locale negotiation occurs in the following order.
	
								script present?
									/      \
							 (yes) /        \ (no)
								  /          \
		language-script-region-variant    language-region-variant
				language-script-region    language-region
			   language-script-variant       /
					   language-script      /
									\      /
								language-variant
									language
									   en
	
	It starts at the specificity of the given tag, and skips steps which have a
	subtag that isn't present. eg
	
	xx-YY, which will be parsed as language-region, will negotiate as
		language-region
		language
		en
	
	xx-Yyyy-ZZ, will be parsed as language-script-region, and negotiate as
		language-script-region
		language-script
		language
		en
	
	When Locale packs are created, the tag will be checked to see if it can
	be negotiated. A valid tag must have at least a language, so "en-GB" and
	"cy" are valid, but "GB" is not.
	
	
	How this Module handles all this
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	
	The code has a number of variables, objects and arrays whose names or
	values make reference to some variant or combination of l, s, r or v. These
	match to the 'L'anguage, 'S'cript, 'R'egion or 'V'ariant subtag.

	So, for instance, the variable LSRV is a bitmask for a tag structure with
	all four subtags.
	
	
	
	Useful URLs
	~~~~~~~~~~~
	
	http://www.w3.org/International/articles/language-tags/
	http://www.w3.org/International/articles/bcp47/
	http://www.iana.org/assignments/language-subtag-registry



 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
