(function () {


t.module("glow.i18n");

t.test("Core Internationalisation Module", function() {
	t.expect(20);
	
	glow.i18n.addLocalePack('en', {
		BAGPUSS : {
			YAFFELL : "Prof Yaffell"
		}
	});
	
	glow.i18n.addLocalePack('kd', {
		FIVE: {
			JULIAN : "Julian",
			DICK : "Dick",
			ANNE : "Anne",
			GEORGE : "George",
			TIMMY : "Timmy"
		},
		RAINBOW: {
			ROD: "Rod",
			JANE: "Jane",
			FREDDY: "Freddie"
		}
	});
	
	
	glow.i18n.addLocalePack('kd-GB', {
		FIVE: {
			JULIAN : "Julian, what!",
			DICK : "Dick, what!",
			ANNE : "Anne, what!",
			GEORGE : "George, what!",
			TIMMY : "Timmy, what!"
		},
		RAINBOW: {
			ROD: "Rod, what!"
		}
	});
	
	glow.i18n.addLocalePack('kd-GB-scouse', {
		FIVE: {
			JULIAN : "Julian likhe"
		}
	});
	
	glow.i18n.addLocalePack('kd-US', {
		FIVE: {
			JULIAN : "Julian, mkay!",
			DICK : "Dick, mkay!",
			ANNE : "Anne, mkay!",
			GEORGE : "George, mkay!",
			TIMMY : "Timmy, mkay!"
		},
		RAINBOW: {
			ROD: "Rod, mkay!",
			FREDDY: "Freddie, mkay!"
		}
	});
	
	t.equals(glow.i18n.getLocale(), 'en', "Getting first locale (not set on the page)");

	glow.i18n.setLocale("aa");
	t.equals(glow.i18n.getLocale(), 'aa', "Setting a well formed language locale");

	glow.i18n.setLocale("aa-Aaaa");
	t.equals(glow.i18n.getLocale(), 'aa-Aaaa', "Setting a well formed language-script locale");

	glow.i18n.setLocale("aa-AA");
	t.equals(glow.i18n.getLocale(), 'aa-AA', "Setting a well formed language-region locale");

	glow.i18n.setLocale("aa-Aaaa-AA");
	t.equals(glow.i18n.getLocale(), 'aa-Aaaa-AA', "Setting a well formed language-script-region locale");

	glow.i18n.setLocale("aa-aaa");
	t.equals(glow.i18n.getLocale(), 'aa-aaa', "Setting a well formed language-variant locale");

	glow.i18n.setLocale("aa-Aaaa-aaa");
	t.equals(glow.i18n.getLocale(), 'aa-Aaaa-aaa', "Setting a well formed language-script-variant locale");

	glow.i18n.setLocale("aa-AA-aaa");
	t.equals(glow.i18n.getLocale(), 'aa-AA-aaa', "Setting a well formed language-region-variant locale");

	glow.i18n.setLocale("aa-Aaaa-AA-aaa");
	t.equals(glow.i18n.getLocale(), 'aa-Aaaa-AA-aaa', "Setting a well formed language-script-region-variant locale");

	glow.i18n.setLocale("XX-Xxxx-bb-Bbbb-xx-BB-XX-bbb-xxxx");
	t.equals(glow.i18n.getLocale(), 'bb-Bbbb-BB-bbb', "Correctly interpreting a mal-formed locale");
	
	glow.i18n.setLocale("QtTtW");
	t.equals(glow.i18n.getLocale(), 'bb-Bbbb-BB-bbb', "Correctly ignoring an invalid locale");
	
	glow.i18n.revertLocale();
	t.equals(glow.i18n.getLocale(), 'aa-Aaaa-AA-aaa', "Correctly rewinding along the locale stack (1)");
	
	glow.i18n.revertLocale();
	t.equals(glow.i18n.getLocale(), 'aa-AA-aaa', "Correctly rewinding along the locale stack (2)");
	
	glow.i18n.revertLocale();
	t.equals(glow.i18n.getLocale(), 'aa-Aaaa-aaa', "Correctly rewinding along the locale stack (3)");
	
	glow.i18n.revertLocale();
	t.equals(glow.i18n.getLocale(), 'aa-aaa', "Correctly rewinding along the locale stack (4)");
	
	glow.i18n.revertLocale();
	t.equals(glow.i18n.getLocale(), 'aa-Aaaa-AA', "Correctly rewinding along the locale stack (5)");
	
	glow.i18n.setLocale("kd-GB-scouse");
	t.isObj(glow.i18n.getLocaleModule("RAINBOW"), {ROD: "Rod, what!", JANE: "Jane", FREDDY: "Freddie"}, "Get locale module");
		
	var checked = glow.i18n.checkLocale("kd-GB-scouse");
	t.equals(checked.BAGPUSS.YAFFELL, "en", "Correctly checking the negotiation results on an entire locale");

	var checked = glow.i18n.checkLocale("kd-GB-scouse", {module: "BAGPUSS"});
	t.equals(checked.YAFFELL, "en", "Correctly checking the negotiation results on a module");

	var checked = glow.i18n.checkLocale("kd-GB-scouse", {module: "BAGPUSS", label: "YAFFELL"});
	t.equals(checked, "en", "Correctly checking the negotiation results on a label");
});


})();