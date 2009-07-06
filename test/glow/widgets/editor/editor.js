t.module("glow.widgets.Editor");

t.test("Load DOM", function() {
	t.expect(1);
	t.stop();
	glow.ready(function() {
		t.ok(glow.isReady, "Document Ready");
		t.start();
	});
});

t.test("new glow.widgets.Editor", function() {
	t.expect(2);
	
	window.t_textarea = glow.dom.create("<textarea></textarea>");
	glow.dom.get("body").append(window.t_textarea);
	window.t_editor = new glow.widgets.Editor(window.t_textarea);
	
	/*1*/ t.ok(typeof window.t_textarea, "The textarea is defined.");
	/*2*/ t.ok(typeof window.t_editor, "The editor is defined.");
});	
	
t.test("Editor properties.", function() {
	t.expect(3);
	
	/*1*/ t.ok(window.t_editor, "A Editor can be created.");
	/*2*/ t.ok(window.t_editor.toolbar, "A editor has a toolbar.");
	/*3*/ t.ok(window.t_editor.editArea, "A editor has a editArea.");
});

t.test("Editor themes.", function() {
	t.expect(1);
	
	var divs = document.body.getElementsByTagName("div");
	var foundTheme = null;
	for (var i = 0, l = divs.length; i < l; i++) {
		if (/editor-(light|dark)/.test(divs[i].className)) foundTheme = RegExp.$1;
	}
	
	/*1*/ t.equals(foundTheme, "light", "The default theme is 'light'.");
});

t.test("Toolbar methods.", function() {
	t.expect(3);
	
	/*1*/ t.ok(window.t_editor.toolbar, "An toolbar is defined.");
	/*2*/ t.equals(typeof window.t_editor.toolbar.addButton, "function", "A toolbar can addButton.");
	/*3*/ t.equals(typeof window.t_editor.toolbar.getTool, "function", "A toolbar can getButton.");
});

// // this is now non-public
// t.test("Toolbar#addToolset()", function() {
// 	t.expect(3);
// 	
// 	/*1*/ t.equals(typeof window.t_editor.toolbar._tools, "object", "An toolbar has _tools.");
// 	/*2*/ t.equals(window.t_editor.toolbar._tools.length, 0, "Initially there are no tool in _tools.");
// 	
// 	window.t_editor.toolbar.addToolset("italics", "bold", "strike").draw();
// 	
// 	/*3*/ t.equals(window.t_editor.toolbar._tools.length, 3, "Calling addToolset(...) puts new tools in _tools.");
// });

// // this is now non-public
// t.test("Toolbar#addButton()", function() {
// 	t.expect(6);
// 	
// 	/*1*/ t.equals(typeof window.t_editor.toolbar._tools, "object", "An toolbar has _tools.");
// 	/*2*/ t.equals(window.t_editor.toolbar._tools.length, 0, "Initially there are no tool in _tools.");
// 	
// 	window.t_editor.toolbar.addButton("Bold", {});
// 	
// 	/*3*/ t.equals(window.t_editor.toolbar._tools.length, 1, "Calling addButton() puts a new tool in _tools.");
// 	/*4*/ t.equals(window.t_editor.toolbar._tools[0].constructor, glow.widgets.Editor.Toolbar.Button, "The new tool is a glow.widgets.Editor.Toolbar.Button.");
// 	/*5*/ t.equals(window.t_editor.toolbar._tools[0].name, "Bold", "The new tool has the given name.");
// 	/*6*/ t.ok(window.t_editor.toolbar._tools[0].element, "The new tool has a DOM element.");
// });

t.test("Toolbar#getTool()", function() {
	t.expect(5);
	
	var bold = window.t_editor.toolbar.getTool("bold");
	
	/*1*/ t.ok(bold, "The getTool method returns something.");
	
	/*2*/ t.equals(typeof bold.deactivate, "function", "A tool can deactivate.");
	/*3*/ t.equals(typeof bold.activate, "function", "A tool can activate.");
	/*4*/ t.equals(typeof bold.disable, "function", "A tool can disable.");
	/*5*/ t.equals(typeof bold.enable, "function", "A tool can enable.");
});

t.test("Button methods.", function() {
	t.expect(6);
	
	var bold = window.t_editor.toolbar.getTool("bold");

	/*1*/ t.equals(bold.isActive, false, "Initially a tool is not active.");
	bold.activate();
	/*2*/ t.equals(bold.isActive, true, "A tool can be made active.");
	bold.deactivate();
	/*3*/ t.equals(bold.isActive, false, "A tool can be not active again.");
	
	/*4*/ t.equals(bold.isEnabled, true, "Initially a tool is enabled.");
	bold.disable();
	/*5*/ t.equals(bold.isEnabled, false, "A tool can be disabled.");
	bold.enable();
	/*6*/ t.equals(bold.isEnabled, true, "A tool can be enabled again.");
});

t.test("EditArea API.", function() {
	t.expect(1);
	
	/*1*/ t.ok(window.t_editor.editArea, "An editArea is defined.");
});

t.test("Tag cleaner API.", function() {
	t.expect(4);
	
	/*1*/ t.equals(typeof window.t_editor.cleaner, "object", "An editor has a cleaner.");
	/*2*/ t.equals(typeof window.t_editor.cleaner.clean, "function", "A cleaner can clean.");
	/*3*/ t.equals(typeof window.t_editor.cleaner.spin, "function", "A cleaner can spin.");
	/*4*/ t.equals(typeof window.t_editor.cleaner.whitelist, "object", "A cleaner has a whitelist.");
});

t.test("Editor#cleaner#clean() - Strong", function() {
	t.expect(4);
	
	var output = window.t_editor.cleaner.clean("<b>Hello</b> world.");
	/*1*/t.equals(output, "<strong>Hello</strong> world.", "The clean method cleans: <b>");
	output = window.t_editor.cleaner.clean("<B>Hello</B> world.");
	/*2*/t.equals(output, "<strong>Hello</strong> world.", "The clean method cleans: <B>");
	output = window.t_editor.cleaner.clean("<b class='anyclass'>Hello</b> world.");
	/*3*/t.equals(output, "<strong>Hello</strong> world.", "The clean method cleans: <b class='anyclass'>");
	output = window.t_editor.cleaner.clean("<STRONG>Hello</STRONG> world.");
	/*3*/t.equals(output, "<strong>Hello</strong> world.", "The clean method cleans: <STRONG>");
});

t.test("Editor#cleaner#clean() - Em", function() {
	t.expect(4);
	
	var output = window.t_editor.cleaner.clean("<i>Hello</i> world.");
	/*1*/t.equals(output, "<em>Hello</em> world.", "The clean method cleans: <i>");
	output = window.t_editor.cleaner.clean("<I>Hello</I> world.");
	/*2*/t.equals(output, "<em>Hello</em> world.", "The clean method cleans: <I>");
	output = window.t_editor.cleaner.clean("<i class='anyclass'>Hello</i> world.");
	/*3*/t.equals(output, "<em>Hello</em> world.", "The clean method cleans: <i class='anyclass'>");
	output = window.t_editor.cleaner.clean("<EM>Hello</EM> world.");
	/*3*/t.equals(output, "<em>Hello</em> world.", "The clean method cleans: <EM>");
});

t.test("Editor#cleaner#clean() - Strike", function() {
	t.expect(4);
	
	var output = window.t_editor.cleaner.clean("<strike>Hello</strike> world.");
	/*1*/t.equals(output, "<strike>Hello</strike> world.", "The clean method cleans: <strike>");
	output = window.t_editor.cleaner.clean("<STRIKE>Hello</STRIKE> world.");
	/*2*/t.equals(output, "<strike>Hello</strike> world.", "The clean method cleans: <STRIKE>");
	output = window.t_editor.cleaner.clean("<strike class='anyclass'>Hello</strike> world.");
	/*3*/t.equals(output, "<strike>Hello</strike> world.", "The clean method cleans: <strike class='anyclass'>");
	output = window.t_editor.cleaner.clean("<P>Hello</P> world.");
	/*4*/t.equals(output, "<p>Hello</p> world.", "The clean method cleans: <P>");
});

t.test("Editor#cleaner#clean() - Convert spans to tags", function() {
	t.expect(4);
	
	var output = window.t_editor.cleaner.clean('<span style="font-weight: bold;">Hello</span> world.');
	/*1*/t.equals(output, "<strong>Hello</strong> world.", "The clean method cleans: <span> with style: bold");
	output = window.t_editor.cleaner.clean('<span style="font-style: italics;">Hello</span> world.');
	/*2*/t.equals(output, "<em>Hello</em> world.",  "The clean method cleans: <span> with style: italics");
	output = window.t_editor.cleaner.clean('<span style="font-decoration: line-through;">Hello</span> world.');
	/*3*/t.equals(output, "<strike>Hello</strike> world.", "The clean method cleans: <span> with style: line-through");
	output = window.t_editor.cleaner.clean('<span style="font-weight: bold; font-style: italics; font-decoration: line-through;">Hello</span> world.');
	/*4*/t.equals(output, "<strong><em><strike>Hello</strike></em></strong> world.", "The clean method cleans: <span> with a combination of styles");
});

t.test("Editor#cleaner#clean() - P and BR", function() {
	t.expect(6);
	
	var output = window.t_editor.cleaner.clean("<p>Hello</p> world.");
	/*1*/t.equals(output, "<p>Hello</p> world.", "The clean method cleans: <p>");
	output = window.t_editor.cleaner.clean("<P>Hello</P> world.");
	/*2*/t.equals(output, "<p>Hello</p> world.", "The clean method cleans: <P>");
	output = window.t_editor.cleaner.clean("<p class='anyclass'>Hello</p> world.");
	/*3*/t.equals(output, "<p>Hello</p> world.", "The clean method cleans: <p class='anyclass'>");
	
	output = window.t_editor.cleaner.clean("<br>Hello<br /> world.");
	/*4*/t.equals(output, "<br>Hello<br> world.", "The clean method cleans: <br> and <br />");
	output = window.t_editor.cleaner.clean("<BR>Hello<BR /> world.");
	/*5*/t.equals(output, "<br>Hello<br> world.", "The clean method cleans: <BR> and <BR />");
	output = window.t_editor.cleaner.clean("<br class='anyclass'>Hello<br class='anyclass' /> world.");
	/*6*/t.equals(output, "<br>Hello<br> world.", "The clean method cleans: <br class='anyclass'> and <br class='anyclass' />");
});

t.test("Editor#cleaner#clean() - nested tags", function() {
	t.expect(4);
	
	var output = window.t_editor.cleaner.clean("<p><B>Hello <i>world</i>.</B></p>");
	/*1*/t.equals(output, "<p><strong>Hello <em>world</em>.</strong></p>", "The clean method cleans simple nested tags.");
	output = window.t_editor.cleaner.clean("<p><B><i>Hello</i><br><b><i>world</i>.</b></B></p>");
	/*2*/t.equals(output, "<p><strong><em>Hello</em><br><strong><em>world</em>.</strong></strong></p>", "The clean method cleans more deeply nested tags.");
	output = window.t_editor.cleaner.clean('<span style="font-weight: bold;"><span style="font-style: italics;">Hello</span> world</span>.');
	/*3*/t.equals(output, "<strong><em>Hello</em> world</strong>.", "The clean method cleans simple nested spans.");
	output = window.t_editor.cleaner.clean('<span style="font-style: italics; font-decoration: line-through;"><span style="font-weight: bold;"><span style="font-style: italics;">Hello</span></span> world</span>.');
	/*4*/t.equals(output, "<em><strike><strong><em>Hello</em></strong> world</strike></em>.", "The clean method cleans more deeply nested spans.");
});

t.test("Editor#cleaner#strip() - whitelist", function() {
	t.expect(2);
	
	var originalwhitelist = window.t_editor.cleaner.whitelist;
	
	window.t_editor.cleaner.whitelist = ["em"];
	var input = "<em><strike><strong><em>Hello</em></strong> world</strike></em>.";
	var output = window.t_editor.cleaner.spin(input);
	/*1*/ t.equals(output, "<em><em>Hello</em> world</em>.", "The strip method can remove non-em tags.");
	
	window.t_editor.cleaner.whitelist = ["p", "em", "strong"];
	output = window.t_editor.cleaner.spin(input);
	/*2*/ t.equals(output, "<em><strong><em>Hello</em></strong> world</em>.", "The strip method can remove non-p/em/strong tags.");
	
	window.t_editor.cleaner.whitelist = originalwhitelist;
});

t.test("Editor.EditArea#_domPath", function() {
	t.expect(1);
	
	/*1*/ t.equals(typeof window.t_editor.editArea._domPath, "function", "The editarea can _domPath.");
});

t.test("Editor.EditArea#_set/_getContent", function() {
	t.expect(4);
	
	t.stop();
	setTimeout(function() {
		window.t_editor.editArea._setContent("<p>hello world</p>");
	
		var content = window.t_editor.editArea._getContent().toLowerCase();
		/*1*/ t.equals(content, "<p>hello world</p>", "The editarea can _setContent and _getContent.");
		
 		window.t_editor.editArea._select();
 		window.t_editor.toolbar.getTool("bold").press();
 		content = window.t_editor.cleaner.clean(window.t_editor.editArea._getContent()).toLowerCase();
		/*2*/ t.equals(content, "<p><strong>hello world</strong></p>", "The bold button produces a strong tag.");
		
		window.t_editor.editArea._select();
		window.t_editor.toolbar.getTool("italics").press();
		content = window.t_editor.cleaner.clean(window.t_editor.editArea._getContent()).toLowerCase();
		/*3*/ t.ok(/<em>.*hello world.*<\/em>/.test(content), "The italics button produces a em tag.");
		
		window.t_editor.editArea._select();
		window.t_editor.toolbar.getTool("strike").press();
		content = window.t_editor.cleaner.clean(window.t_editor.editArea._getContent()).toLowerCase();
		/*4*/ t.ok(/<strike>.*hello world.*<\/strike>/.test(content), "The strike button produces a strike tag.");
		
		t.start();
	}, 10);
});


t.test("Pasted content (Idler)", function() {
	t.expect(1);
	
	window.t_editor.editArea._setContent("<p>hello</p><br>world <TABLE><TR><TD><b>this is a test</b></TD></TR></TABLE>");
	
	t.stop();
	setTimeout(
		function() {
			var content = window.t_editor.editArea._getContent();
			
			/*1*/t.equals(content.toLowerCase() + '', '<p>hello</p><br>world <span><strong>this is a test</strong> </span>', "Pasted content is rinsed of blacklisted tags.");
			t.start();
		},
		1500
	);
});	
 

t.test("dom path", function() {
	t.expect(1);
	
	t.stop();
	setTimeout(function() {
		window.t_editor.editArea._setContent('<p><strike><em><strong>hello world</strong></em></strike></p>');
		var strongNode = window.t_editor.editArea._nodeAt(2);
		var path = window.t_editor.editArea._domPath(strongNode);

		/*1*/ t.equals(path, "|p|strike|em|strong|", "The correct path can be found.");
		t.start();
	}, 20);
});

t.test("Tear down.", function() {
	t.expect(3);

	window.t_editor.editArea.idler.disabled(true);
	
	window.t_textarea.remove();
	window.t_textarea = undefined;
	window.t_editor = undefined;

	/*1*/ t.equals(typeof window.t_textarea , "undefined", "The textarea is no longer defined.");
	/*2*/ t.equals(typeof window.t_editor , "undefined", "The editor is no longer defined.");
	
	glow.dom.get(".glowCSSVERSION-editor").remove();
	var editors = glow.dom.get(".glowCSSVERSION-editor");
	
	/*3*/ t.equals(editors.length, 0, "All generated Dom Elements are cleaned up.");
});
