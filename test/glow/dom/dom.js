t.module("glow.dom selectors");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("broken", function() {
	t.expect(7);
	try {
		glow.dom.get("[");
		t.ok(false, "[ Broken Selector");
	} catch (e) {
		t.ok(true, "[ Broken Selector");
	}
	try {
		glow.dom.get("(");
		t.ok(false, "( Broken Selector");
	} catch (e) {
		t.ok(true, "( Broken Selector");
	}
	try {
		glow.dom.get("{");
		t.ok(false, "{ Broken Selector");
	} catch (e) {
		t.ok(true, "{ Broken Selector");
	}try {
		glow.dom.get("<");
		t.ok(false, "< Broken Selector");
	} catch (e) {
		t.ok(true, "< Broken Selector");
	}
	try {
		glow.dom.get("()");
		t.ok(false, "() Broken Selector");
	} catch (e) {
		t.ok(true, "() Broken Selector");
	}
	try {
		glow.dom.get("<>");
		t.ok(false, "<> Broken Selector");
	} catch (e) {
		t.ok(true, "<> Broken Selector");
	}
	try {
		glow.dom.get("{}");
		t.ok(false, "{} Broken Selector");
	} catch (e) {
		t.ok(true, "{} Broken Selector");
	}
});

t.test("id", function() {
	t.expect(22);
	t.selects("#body", ["body"], "ID Selector");
	t.selects("body#body", ["body"], "ID Selector w/ Element");
	t.selects("ul#firstUL", ["firstUL"], "ID Selector w/ Element");
	t.selects("#firstp #simon1", ["simon1"], "ID selector with existing ID descendant");
	t.selects("#firstp #foobar", [], "ID selector with non-existant descendant");
	t.selects("#台北Táiběi", ["台北Táiběi"], "ID selector using UTF8");

	t.selects("#台北Táiběi, #台北", ["台北Táiběi", "台北"], "Multiple ID selectors using UTF8");
	t.selects("div #台北", ["台北"], "Descendant ID selector using UTF8");
	t.selects("form > #台北", ["台北"], "Child ID selector using UTF8");
	
	t.selects("#foo\\:bar", ["foo:bar"], "Escaped ID");
	t.selects("#test\\.foo\\[5\\]bar", ["test.foo[5]bar"], "Escaped ID");
	t.selects("div #foo\\:bar", ["foo:bar"], "Descendant escaped ID");
	t.selects("div #test\\.foo\\[5\\]bar", ["test.foo[5]bar"], "Descendant escaped ID");
	t.selects("form > #foo\\:bar", ["foo:bar"], "Child escaped ID");
	t.selects("form > #test\\.foo\\[5\\]bar", ["test.foo[5]bar"], "Child escaped ID");
	
	t.selects("#form > #radio1", ["radio1"], "ID Selector, child ID present");
	t.selects("#form  #first", [], "ID Selector, not an ancestor ID");
	t.selects("#form > #option1a", [], "ID Selector, not a child ID");
	
	t.selects("#foo > *", ["sndp", "en", "sap"], "All Children of ID");
	t.selects("#firstUL > *", [], "All Children of ID with no children");
	
	t.selects("#asdfasdf #foobar", [], "ID selector with non-existant ancestor");
	
	t.isSet( glow.dom.get("body").get("#form"), q("form"), "ID selector within the context of another element" );
});

t.test("class", function() {
	t.expect(16);
	t.selects(".blog", ["mark","simon"], "Class Selector");
	t.selects(".blog.link", ["simon"], "Class Selector");
	t.selects("a.blog", ["mark","simon"], "Class Selector w/ Element");
	t.selects("p .blog", ["mark","simon"], "Parent Class Selector");
	
	t.selects(".台北Táiběi", ["utf8class1"], "Class selector using UTF8");
	t.selects(".台北", ["utf8class1","utf8class2"], "Class selector using UTF8");
	t.selects(".台北Táiběi.台北", ["utf8class1"], "Class selector using UTF8");
	t.selects(".台北Táiběi, .台北", ["utf8class1","utf8class2"], "Class selector using UTF8");
	t.selects("div .台北Táiběi", ["utf8class1"], "Descendant class selector using UTF8");
	t.selects("form > .台北Táiběi", ["utf8class1"], "Child class selector using UTF8");
	
	t.selects(".foo\\:bar", ["foo:bar"], "Escaped Class");
	t.selects(".test\\.foo\\[5\\]bar", ["test.foo[5]bar"], "Escaped Class");
	t.selects("div .foo\\:bar", ["foo:bar"], "Descendant escaped Class");
	t.selects("div .test\\.foo\\[5\\]bar", ["test.foo[5]bar"], "Descendant escaped Class");
	t.selects("form > .foo\\:bar", ["foo:bar"], "Child escaped Class");
	t.selects("form > .test\\.foo\\[5\\]bar", ["test.foo[5]bar"], "Child escaped Class");
});

t.test("multiple", function() {
	t.expect(4);
	t.selects("a.blog, #main p", ["mark","simon","firstp","ap","sndp","en","sap","first"], "Comma Support");
	t.selects("a.blog , #main p", ["mark","simon","firstp","ap","sndp","en","sap","first"], "Comma Support");
	t.selects("a.blog ,#main p", ["mark","simon","firstp","ap","sndp","en","sap","first"], "Comma Support");
	t.selects("a.blog,#main p", ["mark","simon","firstp","ap","sndp","en","sap","first"], "Comma Support");
});

t.test("child and adjacent", function() {
	t.expect(7);
	t.selects("p > a", ["simon1","google","groups","mark","yahoo","simon"], "Child");
	t.selects("p> a", ["simon1","google","groups","mark","yahoo","simon"], "Child");
	t.selects("p >a", ["simon1","google","groups","mark","yahoo","simon"], "Child");
	t.selects("p>a", ["simon1","google","groups","mark","yahoo","simon"], "Child");
	t.selects("p > a.blog", ["mark","simon"], "Child w/ Class");
	t.selects("code > *", ["anchor1","anchor2"], "All Children");
	t.selects("#dl p > * > *", ["anchor1","anchor2"], "All Grandchildren");
});

t.module("glow.dom.NodeList creation");

t.test("glow.dom.NodeList constructor", function () {
	t.expect(1);

	var emptyNodeList = new glow.dom.NodeList();
	t.equals(emptyNodeList.length, 0, "create empty NodeList");
});

t.test("glow.dom.create", function () {
	t.expect(16);

	var NodeList = glow.dom.create(' <div id="aNewNode1">test</div> <div id="aNewNode2">test</div> ');
	
	t.ok(NodeList.length == 2, "two element NodeList created with glow.dom.create");
	t.ok(NodeList[0].id == "aNewNode1" && NodeList[1].id == "aNewNode2", "nodes created with glow.dom.create as expected");
	
	var error;
	try {
		var nodes = glow.dom.create(' <div>test</div> hello <div>test</div> ');
	} catch (e) {
		error = e;
	}
	t.ok(error.message && error.message.indexOf("Text must be wrapped in an element") > -1, "Throws error with non-whitespace text nodes");
	
	//IE doesn't like link elements inserted via innerHTML
	var myLink = glow.dom.create('<link type="text/css" rel="stylesheet" media="screen" href="/static/users/style/id-panel.css" />')
	
	t.ok(myLink[0] && myLink[0].nodeName.toLowerCase() == "link", "Link element created");

	// glow.dom.create needs to work with elements that cannot be a child of a DIV
	// ***************************************************************************

	// CAPTION NODE
	var caption = glow.dom.create("<caption></caption>");
	t.ok(caption[0] && caption[0].nodeName.toLowerCase() == "caption", "Caption element created");
	
	// THEAD NODE
	var thead = glow.dom.create("<thead></thead>");
	t.ok(thead[0] && thead[0].nodeName.toLowerCase() == "thead", "Thead element created");
	
	// TH NODE
	var th = glow.dom.create("<th></th>");
	t.ok(th[0] && th[0].nodeName.toLowerCase() == "th", "Th element created");
	
	// COLGROUP NODE
	var colgroup = glow.dom.create("<colgroup />");
	t.ok(colgroup[0] && colgroup[0].nodeName.toLowerCase() == "colgroup", "Colgroup element created");
	
	// TBODY NODE
	var tbody = glow.dom.create("<tbody></tbody>");
	t.ok(tbody[0] && tbody[0].nodeName.toLowerCase() == "tbody", "Tbody element created");
	
	// TR NODE
	var tr = glow.dom.create("<tr></tr>");
	t.ok(tr[0] && tr[0].nodeName.toLowerCase() == "tr", "Tr element created");
	
	// TD NODE
	var td = glow.dom.create("<td></td>");
	t.ok(td[0] && td[0].nodeName.toLowerCase() == "td", "Td element created");
	
	// TFOOT NODE
	var tfoot = glow.dom.create("<tfoot></tfoot>");
	t.ok(tfoot[0] && tfoot[0].nodeName.toLowerCase() == "tfoot", "Tfoot element created");
	
	// OPTION NODE
	var option = glow.dom.create("<option></option>");
	t.ok(option[0] && option[0].nodeName.toLowerCase() == "option", "Option element created"); 
	
	// LEGEND NODE
	var legend = glow.dom.create("<legend></legend>");
	t.ok(legend[0] && legend[0].nodeName.toLowerCase() == "legend", "Legend element created");
	
	// SCRIPT NODE
	var script = glow.dom.create("<script></script>");
	t.ok(script[0] && script[0].nodeName.toLowerCase() == "script", "Script element created");
	
	// STYLE NODE
	var style = glow.dom.create('<style type="text/css">#abc1234 { margin:0; }</style>');
	t.equals(style[0].nodeName.toLowerCase(), "style", "Style element created");

});

t.test("glow.dom.create - interpolate", function() {
	t.expect(5);
	
	var iNodes = glow.dom.create("<div>{foo}</div>", {
		interpolate: {foo: "FOO"}
	});
	t.equals(iNodes.text(), "FOO", "Basic Interpolation");
	
	var data = {
			faveElms: '<strong>strong</strong> & <h1>h1</h1>',
			food: 'cake',
			lt: '<',
			gt: '>'
		},
		template = '<div>My favourite elements are {faveElms}. Do you have any {food}? Here\'s a {lt}span{gt}. This {<b>placeholder</b>} does not exist.</div>';
	
	var elm = glow.dom.create(template, {
		interpolate: data
	});
	
	t.equals(elm.get("*").length, 4, "HTML not escaped");
	
	elm = glow.dom.create(template, {
		interpolate: data,
		escapeHtml: true
	});
	
	t.equals(elm.get("span, strong, h1").length, 0, "HTML escaped, no unwanted elements created");
	t.equals(elm.text(), 'My favourite elements are <strong>strong</strong> & <h1>h1</h1>. Do you have any cake? Here\'s a <span>. This {placeholder} does not exist.', "HTML escaped, text retained");
	
	// test escapeHtml doesn't fail when interpolate isn't used
	var moreNodes = glow.dom.create('<div>Hello</div>', {
		escapeHtml: true
	});
	
	t.equals(moreNodes.html(), "Hello", "Simple Node Created");
	
	iNodes.destroy();
});

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("glow.dom.get - selector", function () {
	t.expect(2);
	var NodeList = glow.dom.get("#form");
	t.ok(NodeList instanceof glow.dom.NodeList, "get returns a NodeList");
	t.equals(NodeList[0], document.getElementById("form"), "NodeList contains node for simple id selector");
});


t.test("glow.dom.get - nodes", function () {
	t.expect(4);

	var singleElementNodeList = glow.dom.get(document.getElementById("option1a"));

	t.ok(singleElementNodeList.length == 1, "single element NodeList created with on has one element");
	t.equals(
		singleElementNodeList[0],
		document.getElementById("option1a"),
		"single element NodeList has correct element"
	);


	var twoElementNodeList = glow.dom.get([
		document.getElementById("option1a"),
		document.getElementById("option1b")
	]);
	t.ok(twoElementNodeList.length == 2, "two element NodeList created with get has two elements");
	t.isSet(
		[twoElementNodeList[0], twoElementNodeList[1]],
		q("option1a", "option1b"),
		"elements in NodeList created by get are as expected"
	);
});

t.test("glow.dom.NodeList.get", function() {
	t.expect(6);
	t.isSet(glow.dom.get("#foo").get("#sndp"), q("sndp"), "find nested with css");
	t.isSet(glow.dom.get("#foo").get("#ap"), [], "respects current items (css)");
	t.isSet(glow.dom.get("#foo").get(document.getElementById("sndp")), q("sndp"), "find nested with node");
	t.isSet(glow.dom.get("#foo").get(document.getElementById("ap")), [], "respects current items (node)");
	t.isSet(glow.dom.get("#foo").get(document.getElementById("foo")), [], "Items can't contain themselves");
	t.equals(glow.dom.get("#form").get("input").length, 9, "Get form elements within a form");
});


t.module("glow.dom.NodeList array access");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

// glow.dom.NodeList.length
// 	Number of content nodes
t.test("glow.dom.NodeList.length", function () {
	t.expect(2);
	var emptyNodeList = new glow.dom.NodeList();
	t.equals(emptyNodeList.length, 0, "zero element NodeList returns zero as the length");
	var NodeList = glow.dom.get([
		document.getElementById("option1a"),
		document.getElementById("option1b")
	]);
	t.ok(NodeList.length == 2, "two element NodeList returns two as the length");
});

// glow.dom.NodeList.item(Number)
// 	Get node at index 'Number' (for NodeList compatibility)

t.test("glow.dom.NodeList.item", function () {
	t.expect(1);
	var option1a = document.getElementById("option1a");
	var option1b = document.getElementById("option1b");
	var NodeList = glow.dom.get([option1a, option1b]);
	t.ok(NodeList.item(0) == option1a && NodeList.item(1) == option1b, "item returns NodeList items");
});

// glow.dom.NodeList.each(Function)
// 	Runs 'Function' for each context node, arguements[0] is the node

t.test("glow.dom.NodeList.each", function () {
	t.expect(1);
	var ids = '';
	glow.dom.get('#option1a, #option1b').each(function (i) {
		ids += this.id + ' ' + i.toString() + ' ';
	});
	t.equals(ids, "option1a 0 option1b 1 ", "NodeList interated over with each");
});

// glow.dom.NodeList.push(element(s) / array of element(s)) **
// 	Add elements to the context

t.test("glow.dom.NodeList.push", function () {
	t.expect(4);
	var NodeList = glow.dom.get("#option1a, #option1b");

	NodeList.push(glow.dom.get("#option1c")[0]);
	t.equals(NodeList.length, 3, "pushing element increases length");
	t.equals(NodeList[2], glow.dom.get("#option1c")[0], "can push a dom node");

	NodeList.push([glow.dom.get("#option1d")[0], glow.dom.get("#option2a")[0]]);
	t.equals(NodeList.length, 5, "pushing array of nodes increases length");
	t.ok(NodeList[3] == glow.dom.get("#option1d")[0] && NodeList[4] == glow.dom.get("#option2a")[0], "can put array of dom nodes");
});


// glow.dom.NodeList.slice(start:Number[, end:Number])
// 	As you'd expect

t.test("glow.dom.NodeList.slice", function () {
	t.expect(3);
	var NodeList = glow.dom.get("#option1a, #option1b, #option1c, #option1d").slice(1, -1);
	t.equals(NodeList.length, 2, "NodeList length cut by slice");
	t.ok(NodeList[0] == glow.dom.get("#option1b")[0] && NodeList[1] == glow.dom.get("#option1c")[0], "expected nodes remain after slice");
	t.ok(glow.dom.get("div").slice(0) instanceof glow.dom.NodeList, "Slice returns NodeList");
});

t.test("glow.dom.NodeList.sort", function() {
	t.expect(2);
	t.isSet(glow.dom.get("#foo p, #ap a").sort(), q("google", "groups", "anchor1", "mark", "sndp", "en", "sap"), "Sort multi selectors into order");
	t.isSet(glow.dom.get("#sndp, #foo").sort(), q("foo", "sndp"), "Depth last");
});

t.module("glow.dom.NodeList comparison");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

// glow.dom.NodeList.eq(element, array) **
//   Is the NodeList the same as another? If a single element is provided it is treated as an array of one element

t.test("glow.dom.NodeList.eq", function () {
	t.expect(4);

	var option1a = glow.dom.get("#option1a");
	var option1b = glow.dom.get("#option1b");

	t.ok(glow.dom.get(option1a).eq(option1a), "NodeList same as element");
	t.ok(! glow.dom.get(option1a).eq(option1b), "NodeList not same as different element");

	t.ok(glow.dom.get([option1a, option1b]).eq(glow.dom.get([option1a, option1b])), "NodeList with more than one element same a NodeList");
	t.ok(! glow.dom.get([option1a, option1b]).eq(glow.dom.get([option1b, option1a])), "NodeList with more than one element not same as different NodeList");

});

// glow.dom.NodeList.isWithin(element, array - only first element used) **
//   Returns true if all of the NodeList nodes are decendants of the parameter.

t.test("glow.dom.NodeList.isWithin", function () {
	t.expect(3);
	t.ok(glow.dom.get("#area1, #option2a").isWithin(glow.dom.get("#form")), "isWithin for multiple decendents");
	t.ok(! glow.dom.get("#area1, #ap").isWithin(glow.dom.get("#form")), "isWithin for mixed decendents and non-decendents");
	t.ok(! glow.dom.get("#ap").isWithin(glow.dom.get("#form")), "isWithin for non-decendent element");
});


t.module("glow.dom.NodeList Attribute Methods");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

// glow.dom.NodeList.attr(String)
//   Get attribute 'String' from first context node

t.test("glow.dom.NodeList.attr", function () {
	t.expect(14);

	t.equals(glow.dom.get("#check1").attr("checked"), "checked", "checked checkbox returns checked as the attribute value");
	t.equals(glow.dom.get("#check2").attr("checked"), undefined, "checked checkbox returns empty string as the attribute value");

	t.equals(glow.dom.get("#mark").attr("class"), "blog", "can get class attribute");

	// TODO - add tests for multiple classes

    // cssFloat: styleFloat,
	// TODO - how do i test this - is there anything in the html page that is floated

	t.equals(glow.dom.get("#text2").attr("disabled"), "disabled", "disabled element returns disabled as the attribute value");
	t.equals(glow.dom.get('#text1').attr("disabled"), undefined, "not disabled element returns undefined for disabled attribute value");

    // float: styleFloat,
	// TODO - how do i test this - see above

	var label = glow.dom.get("#testLabel1");
	t.equals(label.attr("for"), "text1", "get 'for' with attr");

	t.equals(glow.dom.get("#name").attr("maxlength"), "15", "get 'maxlength' with attr");
	t.equals(glow.dom.get("#text1").attr("maxlength"), undefined, "get unset 'maxlength' with attr");

	t.ok(glow.dom.get("#T2").attr("readonly"), "get 'readonly' with attr");
	t.ok(! glow.dom.get("#name").attr("readonly"), "get unset 'readonly' with attr");

	t.ok(glow.dom.get("#option2d").attr("selected"), "get 'selected' with attr");
	t.ok(! glow.dom.get("#option2c").attr("selected"), "get unset 'selected' with attr");

	// TODO - add test that exposes Safari misreporting selected attribute of hidden option
	// see jquery for fix for this.

    // styleFloat: styleFloat,
	// TODO - how do i test this - see above

//		value: "value",
	t.equals(glow.dom.get("#name").attr("value"), "name", "get 'value' with attr");

	t.ok(
		glow.dom.get("#idTest").attr("value") == undefined || glow.dom.get("#idTest").attr("value") == "",
		"get unset 'value' with attr"
	);
});

// glow.dom.NodeList.attr(key:String, value:String)
//   Set attribute key = value on context nodes

t.test("glow.dom.NodeList.attr(key:String, value:String)", function () {
	t.expect(4);

	var node = glow.dom.create("<div></div>");
	node.attr("id", "blahblahid");
	t.equals(node[0].id, "blahblahid", "set 'id' with attr");
	t.equals(node.attr("id"), "blahblahid", "get 'id' with attr");

	var nodes = glow.dom.create("<div></div><div></div><div></div>");
	nodes.attr("class", "testClass");

	t.ok(
		nodes.slice(0, 1).attr("class") == "testClass"
		&& nodes.slice(1, 2).attr("class") == "testClass"
		&& nodes.slice(2, 3).attr("class") == "testClass",
	    "set 'class' on multiple attributes with attr"
	);

	glow.dom.get("#check2").attr("checked", "checked");
	t.equals(glow.dom.get("#check2").attr("checked"), "checked", "set 'checked' with attr checks checkbox");

	glow.dom.get("#check1").attr("checked", "");
	// removed because setAttribute("checked", "") has no effect in opera
	
});

// glow.dom.NodeList.attr(Object)
//   Set attributes on context nodes using hash-like Object {attrName: value}

t.test("glow.dom.NodeList.attr(Object)", function () {
	t.expect(4);

	var nodes = glow.dom.create("<div></div><div></div>");

	nodes.attr({
		"class"   : "blah",
		"onclick" : "alert(1);"
	});

	t.equals(nodes.attr("class"), "blah", "attr with object set 'class' on first node");
	t.equals(nodes.attr("onclick"), "alert(1);", "attr with object set 'onclick' on first node");
	t.equals(nodes.slice(1, 2).attr("class"), "blah", "attr with object set 'class' on second node");
	t.equals(nodes.slice(1, 2).attr("onclick"), "alert(1);", "attr with object set 'onclick' on second node");
});


// glow.dom.NodeList.attr(key:String, value:Function)
//   Set attribute key = value(). 'this' in 'value' is the current node, arguments[0] is the index

t.test("glow.dom.NodeList.attr(key:String, value:Function)", function () {
	t.expect(2);

    var nodes = glow.dom.create("<div></div><div></div>");
	var i = 0;
	nodes.attr("class", function () {
		t.equals(this, nodes[i++], "this in callback is the node for node " + i);
	});
});


// glow.dom.NodeList.removeAttr(String)
//   Remove attr 'String' from context nodes

t.test("glow.dom.NodeList.removeAttr(String)", function () {
	t.expect(2);

	var nodes = glow.dom.create("<div class=\"blah\"></div><div class=\"blah\"></div>");
	nodes.removeAttr("class");

	t.ok(
		nodes.slice(0, 1).attr("class") == undefined || nodes.slice(0, 1).attr("class") == "",
		"remove attribute from first node"
	);
	t.ok(
		nodes.slice(1, 2).attr("class") == undefined || nodes.slice(1, 2).attr("class") == "",
		"remove attribute from second node"
	);
});

t.test("glow.dom.NodeList.hasAttr(String)", function () {
	t.expect(2);
	var nodes = glow.dom.create("<div class=\"blah\"></div><div></div>");

	t.ok(nodes.slice(0, 1).hasAttr("class"), "class attribute exists");

	t.ok(! nodes.slice(1, 2).hasAttr("class"), "class attribute does not exist");

	// don't even bother expecing IE to be sane about empty attributes
});

// glow.dom.NodeList.hasClass(String)
//   True if any of the context nodes has class 'String'

t.test("glow.dom.NodeList.hasClass(String)", function () {
	t.expect(3);

	t.ok(
		glow.dom.get("#mark").hasClass("blog")
		&& ! glow.dom.get("#mark").hasClass("blah"),
		"single class"
	);

	t.ok(
		glow.dom.get("#fadein").hasClass("chain")
		&& glow.dom.get("#fadein").hasClass("test")
		&& ! glow.dom.get("#fadein").hasClass("blah"),
		"mulitple classes"
	 );

	t.ok(
		glow.dom.get("#mark, #fadein").hasClass("chain")
		&& ! glow.dom.get("#mark, #fadein").hasClass("blah"),
		"multiple nodes"
	);
});

// glow.dom.NodeList.addClass(String)
//   Add class 'String' to context nodes

t.test("glow.dom.NodeList.addClass(String)", function () {
	t.expect(3);

	var nodes = glow.dom.create("<div></div><div></div>");
	
	t.equals(nodes.addClass("blah"), nodes, "addClass returns the node list");
	t.ok(nodes.slice(0,1).hasClass("blah") && nodes.slice(1,2).hasClass("blah"), "add a class");
	nodes.addClass("bah");
	t.ok(nodes.slice(0,1).hasClass("blah") && nodes.slice(1,2).hasClass("blah") && nodes.slice(0,1).hasClass("bah") && nodes.slice(1,2).hasClass("bah"), "add a second class & retains first class");
});


// glow.dom.NodeList.removeClass(String)
//   Remove class 'String' from context nodes

t.test("glow.dom.NodeList.removeClass(String)", function () {
	t.expect(6);

	var nodes = glow.dom.create('<div class="classa classb"></div><div class="classa"></div>');
	
	t.equals(nodes.removeClass("classb"), nodes, "removeClass returns the node list");
	t.ok(!nodes.hasClass("classb"), "remove a class from one node");
	var oldClasses = [nodes[0].className, nodes[1].className];
	nodes.removeClass("classc");
	t.ok(String(oldClasses[0]) == String(nodes[0].className) && String(oldClasses[1]) == String(nodes[1].className), "remove a non-existant class has no effect");
	nodes.removeClass("classa");
	t.ok(/^\s*$/.test(nodes[0].className) && /^\s*$/.test(nodes[1].className), "remove a class from multiple elements");
	// https://devtools.iplayer.bbc.co.uk/bbctrac/jslib/ticket/92 - bug with hyphens in class names
	nodes.slice(0,1).addClass("classname-with-hyphen").removeClass("with-hyphen");
	t.ok(/\bclassname\-with\-hyphen\b/.test(nodes[0].className), "Partial class name hasn't been removed");
	// https://devtools.iplayer.bbc.co.uk/bbctrac/jslib/ticket/98
	// removing class from middle of a list collapses its neighbours
	nodes.addClass("classx").addClass("classy").addClass("classz").removeClass("classy");
	t.ok(!nodes.hasClass("classxclassz"), "remove a class from the middle of a list safely");
});

// glow.dom.NodeList.toggleClass(String)
//   Toggle class 'String' on context nodes

t.test("glow.dom.NodeList.toggleClass(String)", function () {
	t.expect(3);

	var nodes = glow.dom.create("<div class=\"classa classb\"></div><div class=\"classa\"></div>");

	t.equals(nodes.toggleClass("classa"), nodes, "toggleClass returns the node list");
	t.ok(/^\s*classb\s*$/.test(nodes[0].className) && /^\s*$/.test(nodes[1].className), "toggle class on multiple nodes");

	nodes.toggleClass("classb");
	t.ok(/^\s*$/.test(nodes[0].className) && /^\s*classb\s*$/.test(nodes[1].className), "toggle class toggles each node");
});



// glow.dom.NodeList.val() **
//   Gets the form return value of first context, array for multiple selects, obj for forms

t.test("glow.dom.NodeList.val()", function () {
	t.expect(15);

	t.equals(
		glow.dom.create("<input type=\"text\" name=\"blah\"/>").val(),
		"",
		"unspecified value returns empty string"
	);

	t.equals(
		glow.dom.create("<input type=\"text\" name=\"blah\" value=\"val\"/>").val(),
		"val",
		"get value from text input"
	);

	t.equals(
		glow.dom.create("<input type=\"checkbox\" name=\"blah\" value=\"val\" checked=\"checked\"/>").val(),
		"val",
		"get value from checked checkbox"
	);
	
	t.equals(
		glow.dom.create("<input type=\"checkbox\" name=\"blah\" value=\"val\"/>").val(),
		"",
		"Empty value from unchecked checkbox"
	);

	t.equals(
		glow.dom.create("<input type=\"radio\" name=\"blah\" value=\"val\"/>").val(),
		"",
		"Empty value from unchecked radio"
	);

	t.equals(
		glow.dom.create("<input type=\"radio\" name=\"blah\" value=\"val\" checked=\"checked\"/>").val(),
		"val",
		"get value from checked radio"
	);

	t.equals(
		glow.dom.create(
			"<select name=\"blah\"><option>foo</option>" +
			"<option value=\"bah\" selected=\"selected\">bar</option></select>"
		).val(),
		"bah",
		"value for selectd is selected option"
	);

	t.isSet(
		glow.dom.create(
			"<select multiple=\"multiple\" name=\"blah\">" +
			"  <option value=\"blah1\" selected=\"selected\">b1</option>" +
			"  <option selected=\"selected\" value=\"value2\">blah2</option>" +
			"  <option>other</option>" +
			"</select>"
		).val(),
		["blah1", "value2"],
		"get array of selected items from multiple select"
	);

	var formVal = glow.dom.create(
		"<form>" +
		  "<fieldset>" +
			"<input type=\"hidden\" name=\"hidden1\" value=\"hidden1val\"/>" +
			"<input type=\"text\" name=\"nm1\" value=\"val1\"/>" +
			"<input type=\"text\" name=\"nm2\" value=\"val2.1\"/>" +
			"<input type=\"text\" name=\"nm2\" value=\"val2.2\"/>" +
		  "</fieldset>" +
		  "<fieldset>" +
			"<input type=\"checkbox\" name=\"ck1\" value=\"val1\"/>" +
			"<input type=\"checkbox\" name=\"ck2\" value=\"val2\" checked=\"checked\"/>" +
			"<input type=\"checkbox\" name=\"ck3\" value=\"val3.1\"/>" +
			"<input type=\"checkbox\" name=\"ck3\" value=\"val3.2\" checked=\"checked\"/>" +
			"<input type=\"checkbox\" name=\"ck3\" value=\"val3.3\"/>" +
			"<input type=\"checkbox\" name=\"ck3\" value=\"val3.4\" checked=\"checked\"/>" +
			"<input type=\"radio\" name=\"myRadios\" value=\"rval1\"/>" +
			"<input type=\"radio\" name=\"myRadios\" value=\"rval2\" checked=\"checked\"/>" +
			"<input type=\"radio\" name=\"myRadios2\" value=\"rval1\"/>" +
			"<input type=\"radio\" name=\"myRadios2\" value=\"rval2\"/>" +
			'<input type="text" value="Test" />' +
			'<object id="uploadBridge"><param name="quality" value="high" /></object>' +
			'<input type="file" name="fileUpload" />' +
			'<input type="submit" id="whatever" value="Test" />' +
		  "</fieldset>" +
		"</form>"
	).val();

	t.equals(formVal.nm1, "val1", "form element in form value");
	t.isSet(formVal.nm2, ["val2.1", "val2.2"], "multi-form values result in array");
	t.ok(! ('ck1' in formVal), "unchecked checkbox value not in form");
	t.equals(formVal.ck2, "val2", "checked checkbox value in form");
	t.isSet(formVal.ck3, ["val3.2", "val3.4"], "only checked checkboxes have values");

	t.equals(formVal.myRadios, "rval2", "radio has value of checked radio");
	t.equals(formVal.myRadios2, undefined, "unchecked radios have undefined value");
});

// glow.dom.NodeList.val(String) **
//   Sets value of appropriate context nodes

t.test("glow.dom.NodeList.val(String)", function () {
	t.expect(3);

	var nodes = glow.dom.create("<input type=\"text\" name=\"blah1\"/><input type=\"text\" name=\"blah2\"/>");

	nodes.val("aValue");

	t.ok(nodes[0].value == "aValue" && nodes[1].value == "aValue", "set value of text node2");

	var select = glow.dom.create("<select><option value=\"1\">blah</option><option value=\"2\">blah</option></select>");

	select.val("2");

	t.ok(select[0].selectedIndex == 1, "set value for single select");

	var multiSelect = glow.dom.create("<select multiple=\"multiple\" name=\"blah\"><option value=\"1\">blah</option><option value=\"2\">blah2</option></select>");

	multiSelect.val(["1", "2"]);
	
	t.ok(multiSelect[0].options[0].selected && multiSelect[0].options[1].selected, "multiple select takes array of values");
});

// glow.dom.NodeList.val(Object) **
//   Sets value of form elements for each form context node. Object is a {name: value} hash. Value can be an array for multiple selects.

t.test("glow.dom.NodeList.val(Object)", function () {
	t.expect(8);
	var form = glow.dom.create(
		'<form>' +
		  '<input type="text" name="nm1" value="val1" />' +
		  '<input type="text" name="nm2" value="val2" />' +
		  '<input type="text" name="nm3" value="val3" />' +
          '<input type="checkbox" name="ck1" value="ck1val1" checked="checked" />' +
          '<input type="checkbox" name="ck2" value="ck2val1" checked="checked" />' +
          '<input type="checkbox" name="ck2" value="ck2val2" />' +
          '<input type="checkbox" name="ck3" value="ck3val3" />' +
          '<input type="checkbox" name="ck4" value="ck4val4" checked="checked" />' +
		  '<input type="radio" name="myRadios" value="rval1" />' +
		  '<input type="radio" name="myRadios" value="rval2" checked="checked" />' +
		  '<input type="radio" name="myRadios2" value="rval1" />' +
		  '<input type="radio" name="myRadios2" value="rval2" />' +
		'</form>'
	).appendTo(document.body);
	
	form.val({
		nm1 : "3val",
		nm2 : "2val",
		nm3 : "1val",
		ck1 : undefined,
		ck2 : ["ck2val2"],
		ck3 : "ck3val3",
		ck4 : "ck4valzz",
		myRadios : undefined,
		myRadios2 : 'rval1'
	});

	t.ok(
		form[0].elements[0].value == "3val" &&
		form[0].elements[1].value == "2val" &&
		form[0].elements[2].value == "1val",
		"set form values to object"
	);

	t.ok(! form[0].elements[3].checked, "undefined checkbox is unchecked");
	t.ok(! form[0].elements[4].checked, "checkbox without value in array unchecked");	
	t.ok(form[0].elements[5].checked, "checkbox with value in array checked");
	t.ok(form[0].elements[6].checked, "checkbox with value checked");
	t.ok(! form[0].elements[7].checked, "checkbox with wrong value value unchecked");

	t.ok(! form[0].elements[8].checked && ! form[0].elements[9].checked, "setting radio to undefined unchecks all");
	t.ok(form[0].elements[10].checked && ! form[0].elements[11].checked, "setting radio to value checks correct one");
	
	form.remove();
});

t.test("glow.dom.NodeList#prop on empty NodeList", function() {
	t.expect(1);
	
	var myNodeList = new glow.dom.NodeList();
	
	// these shouldn't cause an error
	myNodeList.prop("hello", "world");
	myNodeList.prop({
		no: "errors",
		please: "thankyou"
	});
	
	t.ok(myNodeList.prop("hello") === undefined, "on empty NodeList returns undefined");
});

t.test("glow.dom.NodeList#prop", function() {
	t.expect(23);
	
	var elm = glow.dom.create(
		'<input type="checkbox" name="ck2" value="val2" checked="checked"/>' +
		'<div>Hello</div>' +
		'<span>World</span>' +
	'');
	
	// getting
	t.ok( elm.prop("checked") === true, "Checked property === true" );
	t.equals( elm.prop("nodeName").toLowerCase(), "input", "Get the node name" );
	t.ok( elm.prop("doesNotExist") === undefined, "Not existant property is undefined" );
	
	// setting
	
	elm.prop("_test1", 10);
	var myObj = {hello:"world"};
	var returnVal = elm.prop("_test2", myObj);
	
	t.ok(returnVal === elm, "NodeList returned when setting");
	
	// getting what we just set, via api
	t.ok( elm.slice(0,1).prop("_test1") === 10, "10 set and got via prop() (elm 1)" );
	t.ok( elm.slice(1,2).prop("_test1") === 10, "10 set and got via prop() (elm 2)" );
	t.ok( elm.slice(2,3).prop("_test1") === 10, "10 set and got via prop() (elm 3)" );
	
	t.ok( elm.slice(0,1).prop("_test2") === myObj, "myObj set and got via prop() (elm 1)" );
	t.ok( elm.slice(1,2).prop("_test2") === myObj, "myObj set and got via prop() (elm 2)" );
	t.ok( elm.slice(2,3).prop("_test2") === myObj, "myObj set and got via prop() (elm 3)" );
	
	t.ok( elm.slice(0,1)[0]._test1 === 10, "10 set and got via [0] (elm 1)" );
	t.ok( elm.slice(1,2)[0]._test1 === 10, "10 set and got via [0] (elm 2)" );
	t.ok( elm.slice(2,3)[0]._test1 === 10, "10 set and got via [0] (elm 3)" );
	
	t.ok( elm.slice(0,1)[0]._test2 === myObj, "myObj set and got via [0] (elm 1)" );
	t.ok( elm.slice(1,2)[0]._test2 === myObj, "myObj set and got via [0] (elm 2)" );
	t.ok( elm.slice(2,3)[0]._test2 === myObj, "myObj set and got via [0] (elm 3)" );
	
	// more setting - multiple values
	
	var myObj2 = {foo:"bar"};
	
	returnVal = elm.prop({
		_test3: 5,
		_test4: myObj2
	});
	
	t.ok(returnVal === elm, "NodeList returned when setting multiple");
	
	// get those values
	t.ok( elm.slice(0,1).prop("_test3") === 5, "5 set and got via prop() (elm 1)" );
	t.ok( elm.slice(1,2).prop("_test3") === 5, "5 set and got via prop() (elm 2)" );
	t.ok( elm.slice(2,3).prop("_test3") === 5, "5 set and got via prop() (elm 3)" );
	
	t.ok( elm.slice(0,1).prop("_test4") === myObj2, "myObj2 set and got via prop() (elm 1)" );
	t.ok( elm.slice(1,2).prop("_test4") === myObj2, "myObj2 set and got via prop() (elm 2)" );
	t.ok( elm.slice(2,3).prop("_test4") === myObj2, "myObj2 set and got via prop() (elm 3)" );
	
	elm.destroy();
});

// glow.dom.NodeList.is(CssExpression)
//   True if all context nodes match css expression

t.test("glow.dom.NodeList.is(CssExpression)", function () {
	t.expect(2);

	var nodes = glow.dom.get("#option3a, #option3b, #option3c");

	t.ok(nodes.is("#select3 option"), "NodeList is expression");

	t.ok(! nodes.is("#option3a, #idTest"), "NodeList isn't expression");
	
});

t.module("glow.dom.NodeList Altering context selection");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("glow.dom.NodeList.filter(function)", function() {
	t.expect(4);
	var nodes = glow.dom.get("#foo p").filter(function(i) {
		return this.innerHTML.indexOf("normal link") != -1;
	});
	t.isSet(nodes, q("en"), "Filter uses 'this' as context and returns correct item");
	nodes = glow.dom.get("#foo p").filter(function(i) {
		return glow.dom.get(this).get("> code").length > 0;
	});
	t.isSet(nodes, q("sndp", "sap"), "Filter returns multiple items");
	nodes = glow.dom.get("#foo p").filter(function(i) {
		return i % 2;
	});
	t.isSet(nodes, q("en"), "Filter provides i param");
	t.ok(nodes instanceof glow.dom.NodeList, "Returns NodeList");
});

t.test("glow.dom.NodeList.children()", function() {
	t.expect(3);
	var nodes = glow.dom.get("#foo").children();
	t.isSet(nodes, q("sndp", "en", "sap"), "Gets direct children");
	nodes = glow.dom.get("#sndp").children();
	t.equals(nodes.length, 1, "Gets only elements");
	t.ok(nodes instanceof glow.dom.NodeList, "Returns NodeList");
});

t.test("glow.dom.NodeList.parent()", function() {
	t.expect(3);
	var nodes = glow.dom.get("#foo, #simon1").parent();
	t.isSet(nodes, q("main", "firstp"), "Gets direct parents");
	nodes = glow.dom.get("#foo, #ap").parent();
	t.isSet(nodes, q("main"), "Gets only unique parents");
	t.ok(nodes instanceof glow.dom.NodeList, "Returns NodeList");
});

t.test("glow.dom.NodeList.ancestors()", function() {
	t.expect(3);
	
	var nodes = glow.dom.get("#simon1").ancestors();
	var expectedNodes = glow.dom.get("#firstp, #main, dl, body, html");
	
	t.isSet(nodes, expectedNodes, "Gets ancestors");
	
	var nodes = glow.dom.get("#simon1, #foo").ancestors();
	var expectedNodes = glow.dom.get("#firstp, #main, dl, body, html");
      
	
	t.isSet(nodes, expectedNodes, "Gets only unique ancestors");
	
	nodes = glow.dom.get("#foo, #ap").ancestors();
	
	t.ok(nodes instanceof glow.dom.NodeList, "Returns NodeList");
});

t.test("glow.dom.NodeList.next()", function() {
	t.expect(4);
	var nodes = glow.dom.get("#foo, #google").next();
	t.isSet(nodes, q("first", "groups"), "Gets next elements");
	nodes = glow.dom.get("#simon1").next();
	t.isSet(nodes, [], "Returns nothing if no next element");
	t.ok(nodes instanceof glow.dom.NodeList, "Returns NodeList");
	nodes = glow.dom.create("<div><div>Prev One</div><!-- html comment -->Text<div>Next One</div></div>").get("div").slice(0, 1);
	t.equals(nodes.next().text(), "Next One", "Skips comment nodes");
});

t.test("glow.dom.NodeList.prev()", function() {
	t.expect(4);
	var nodes = glow.dom.get("#foo, #groups").prev();
	t.isSet(nodes, q("ap", "google"), "Gets previous elements");
	nodes = glow.dom.get("#simon1").prev();
	t.isSet(nodes, [], "Returns nothing if no previous element");
	t.ok(nodes instanceof glow.dom.NodeList, "Returns NodeList");
	nodes = glow.dom.create("<div><div>Prev One</div><!-- html comment -->Text<div>Next One</div></div>").get("div").slice(-1);
	t.equals(nodes.prev().text(), "Prev One", "Skips comment nodes");
});


t.module("glow.dom.NodeList Manipulation");

t.test("glow.dom.NodeList.text()", function () {
	t.expect(2);

	var nodes = glow.dom.create("<div>first text</div><div>second text</div>");	
	t.equals(nodes.text(), "first text", "get the text of the first context node");

	nodes.text("new first text");
	t.equals(nodes.text(), "new first text", "set the text of the first context node");
});

t.test("glow.dom.NodeList.empty()", function () {
	t.expect(1);

	var nodes = glow.dom.create("<div><span></span></div><div>text</div>");

	nodes.empty();
	t.ok(! nodes[0].firstChild && ! nodes[1].firstChild, "empty all nodes");
});

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("glow.dom.NodeList.remove()", function () {
	t.expect(2);
	var nodes = glow.dom.create("<div>first</div><div>second</div>");	

	var body = document.getElementById("body");
	body.appendChild(nodes[0]);
	body.appendChild(nodes[1]);

	t.ok(nodes[0].parentNode == body && nodes[1].parentNode == body, "set up test for remove");

	nodes.remove();
	
	// IE replaces parentNode with a document fragment, so parentNode isn't always null
	t.ok(nodes[0].parentNode != body && nodes[1].parentNode != body, "remove removes nodes from document");
});

t.test("glow.dom.NodeList#destroy", function() {
	t.expect(5);
	
	var nodes = glow.dom.create('<div id="destroyTest1">first</div><div id="destroyTest2">second</div>').appendTo(document.body);
	
	t.equals(glow.dom.get("#destroyTest1").length, 1, "First element in document");
	t.equals(glow.dom.get("#destroyTest2").length, 1, "Second element in document");
	
	nodes.destroy();
	
	t.equals(nodes.length, 0, "NodeList emptied");
	t.equals(glow.dom.get("#destroyTest1").length, 0, "First element not in document");
	t.equals(glow.dom.get("#destroyTest2").length, 0, "Second element not in document");
})

t.test("glow.dom.NodeList.clone()", function () {
	t.expect(5);

	var nodes = glow.dom.create("<div><span>first</span></div><div>second</div>");	

	var clone = nodes.clone();

	t.equals(clone.length, 2, "clone results in same number of nodes");

	t.ok(clone[0] != nodes[0] && clone[1] != nodes[1], "clone results in new nodes");

	t.ok(clone[0].nodeName == nodes[0].nodeName && clone[1].nodeName == nodes[1].nodeName, "clone duplicates node names");

	t.equals(clone[0].firstChild.nodeName, nodes[0].firstChild.nodeName, "clone duplicates child elements");

	t.equals(clone[1].innerText, nodes[1].innerText, "clone duplicates text nodes");
});

t.test("glow.dom.NodeList.html()", function () {
	t.expect(7);

	var nodes = glow.dom.create("<div><span>first</span></div><div>second</div>");

	t.equals(nodes.html().toLowerCase(), "<span>first</span>", "html returns inner html for first node");

	nodes.html("<div>first</div>");
	
	t.equals(nodes.html().toLowerCase(), "<div>first</div>", "html sets inner html for first node");
	
	var emptyNodeList = new glow.dom.NodeList();
	// this shouldn't error
	emptyNodeList.html("<div></div>");
	t.equals(emptyNodeList.length, 0, "No error on empty nodelist");
	
	// http://glow-project.lighthouseapp.com/projects/33663/tickets/17-empty-nodelists-html-method-causes-error-if-passed-undefined
	emptyNodeList = new glow.dom.NodeList();
	// this shouldn't error
	emptyNodeList.html(undefined);
	t.equals(emptyNodeList.length, 0, "No error on empty nodelist with undefined param");
	
	t.equals((new glow.dom.NodeList()).html(), "", "Empty nodelist should return empty string");
	
	var tableNode = glow.dom.create("<table class='madetable'></table>").appendTo("body")
	
	// add a row
	tableNode.html("<tr><td>first</td></tr>");
	
	t.equals(tableNode.get('tr').length, 1, 'Table row added');
	
	// clear table
	tableNode.html("");
	
	t.equals(tableNode.get('tr').length, 0, 'Table contents removed');
	
	tableNode.destroy();
});

t.test("glow.dom.NodeList#append()", function () {
	t.expect(6);

	var node = glow.dom.create("" + 
		'<div>' +
			'<div class="first">1</div>' +
		'</div>' +
		'<div>' +
			'<div class="first">1</div>' +
		'</div>'
	);
	var res = node.append('<div class="second">2</div>');
	var firstNode = node.slice(0, 1);
	var secondNode = node.slice(1, 2);
	t.ok(
		res == node &&
		firstNode.children().length == 2 &&
		secondNode.children().length == 2 &&
		firstNode.children()[0].className == "first" &&
		firstNode.children()[1].className == "second" &&
		secondNode.children()[0].className == "first" &&
		secondNode.children()[1].className == "second",
		"append html to nodes"
	);
	

	var domNode = glow.dom.create('<div class="third"></div>');
	res = node.append(domNode[0]);
	t.ok(
		res == node &&
		firstNode.children().length == 3 &&
		secondNode.children().length == 3 &&
		firstNode.children()[0].className == "first" &&
		firstNode.children()[1].className == "second" &&
		firstNode.children()[2].className == "third" &&
		secondNode.children()[0].className == "first" &&
		secondNode.children()[1].className == "second" &&
		secondNode.children()[2].className == "third" &&
		firstNode.children()[2] == domNode[0] &&
		secondNode.children()[2] != domNode[0],
		"append dom element"
	);

	var nodeSet = glow.dom.create('<div class="forth"></div><div class="fifth"></div>');
	res = node.append(nodeSet);
	t.ok(
		res == node &&
		firstNode.children().length == 5 &&
		secondNode.children().length == 5 &&
		firstNode.children()[0].className == "first" &&
		firstNode.children()[1].className == "second" &&
		firstNode.children()[2].className == "third" &&
		firstNode.children()[3].className == "forth" &&
		firstNode.children()[4].className == "fifth" &&
		secondNode.children()[0].className == "first" &&
		secondNode.children()[1].className == "second" &&
		secondNode.children()[2].className == "third" &&
		secondNode.children()[3].className == "forth" &&
		secondNode.children()[4].className == "fifth" &&
		firstNode.children()[3] == nodeSet[0] &&
		firstNode.children()[4] == nodeSet[1] &&
		secondNode.children()[3] != domNode[0] &&
		secondNode.children()[4] != domNode[1],
		"append NodeList"
	);
	
	node.append("Just some text!");
	
	t.equals( node[0].lastChild.nodeValue, "Just some text!", "Added text node" );
	t.equals( node[1].lastChild.nodeValue, "Just some text!", "Added both text nodes" );
	
	t.ok(glow.dom.create("<div></div><div></div>").append("Hello").text() == "Hello", "Adding text");
});

t.test("glow.dom.NodeList.prepend(String / Node / Array)", function () {
	t.expect(4);

	var node = glow.dom.create('' + 
		'<div>' +
			'<div class="fifth">5</div>' +
		'</div>' +
		'<div>' +
			'<div class="fifth">5</div>' +
		'</div>'
	);
	var res = node.prepend('<div class="forth">2</div>');
	var firstNode = node.slice(0, 1);
	var secondNode = node.slice(1, 2);
	t.ok(
		res == node &&
		firstNode.children().length == 2 &&
		secondNode.children().length == 2 &&
		firstNode.children()[0].className == "forth" &&
		firstNode.children()[1].className == "fifth" &&
		secondNode.children()[0].className == "forth" &&
		secondNode.children()[1].className == "fifth",
		"prepend html to nodes"
	);

	var domNode = glow.dom.create('<div class="third"></div>');
	res = node.prepend(domNode[0]);
	t.ok(
		res == node &&
		firstNode.children().length == 3 &&
		secondNode.children().length == 3 &&
		firstNode.children()[0].className == "third" &&
		firstNode.children()[1].className == "forth" &&
		firstNode.children()[2].className == "fifth" &&
		secondNode.children()[0].className == "third" &&
		secondNode.children()[1].className == "forth" &&
		secondNode.children()[2].className == "fifth" &&
		firstNode.children()[0] == domNode[0] &&
		secondNode.children()[0] != domNode[0],
		"prepend dom element"
	);

	var nodeSet = glow.dom.create('<div class="first"></div><div class="second"></div>');
	res = glow.dom.create("<div></div><div></div>").prepend(nodeSet);
	t.ok(res.get("> div.first, > div.second").length == 4 && res.get("> div").slice(0, 1).hasClass("first"), "prepend nodeset");
	
	node = glow.dom.create('' +
		'<div></div>' +
		'<div>Text</div>' +
		'<div><div>Test</div></div>'
	);
	node.prepend("<span>Hello</span>");
	t.ok(node.get("span").filter(function() { return glow.dom.get(this).text() == "Hello"; }).length == 3, "Works with empty elements");
});


t.test("glow.dom.NodeList.appendTo(String / Node / Array)", function () {
	t.expect(3);

	var nodes = glow.dom.create("" + 
		'<div class="second">2</div>' +
		'<div class="third">3</div>'
	);

	var domNode = glow.dom.create('<div><div class="first"></div></div>');
	var res = nodes.appendTo(domNode[0]);
	t.ok(
		res == nodes &&
		domNode.children().length == 3 &&
		domNode.children()[0].className == "first" &&
		domNode.children()[1] == nodes[0] &&
		domNode.children()[2] == nodes[1],
		"append NodeList to dom Element"
	);

	var moreNodes = glow.dom.create(
		'<div><div class="first"></div></div>' +
		'<div><div class="first"></div></div>'
	);

	var firstNode = moreNodes.slice(0, 1);
	var secondNode = moreNodes.slice(1, 2);

	res = nodes.appendTo(moreNodes);
	t.ok(
		res == nodes &&
		firstNode.children().length == 3 &&
		secondNode.children().length == 3 &&
		firstNode.children()[0].className == "first" &&
		firstNode.children()[1].className == "second" &&
		firstNode.children()[2].className == "third" &&
		secondNode.children()[0].className == "first" &&
		secondNode.children()[1].className == "second" &&
		secondNode.children()[2].className == "third" &&
		firstNode.children()[1] == nodes[0] &&
		firstNode.children()[2] == nodes[1] &&
		secondNode.children()[1] != nodes[0] &&
		secondNode.children()[2] != nodes[1],
		"appendTo NodeList"
	);

	var node = glow.dom.create('<span>...</span>');
	res = node.appendTo('#foo, #first');
	t.ok(
		res == node &&
		glow.dom.get('#foo')[0].lastChild == node[0] &&
		glow.dom.get('#first').children().slice(-1).text() == '...',
		"append NodeList to selector"
	);
});


t.test("glow.dom.NodeList.prependTo(String / Node / Array)", function () {
	t.expect(3);

	var nodes = glow.dom.create("" + 
		'<div class="first">1</div>' +
		'<div class="second">2</div>'
	);

	var domNode = glow.dom.create('<div><div class="third">3</div></div>');
	var res = nodes.prependTo(domNode[0]);
	t.ok(
		res == nodes &&
		domNode.children().length == 3 &&
		domNode.children()[0] == nodes[0] &&
		domNode.children()[1] == nodes[1] &&
		domNode.children()[2].className == "third",
		"prepend NodeList to dom Element"
	);

	var moreNodes = glow.dom.create(
		'<div><div class="third"></div></div>' +
		'<div><div class="third"></div></div>'
	);

	var firstNode = moreNodes.slice(0, 1);
	var secondNode = moreNodes.slice(1, 2);

	res = nodes.prependTo(moreNodes);
	t.ok(
		res == nodes &&
		firstNode.children().length == 3 &&
		secondNode.children().length == 3 &&
		firstNode.children()[0].className == "first" &&
		firstNode.children()[1].className == "second" &&
		firstNode.children()[2].className == "third" &&
		secondNode.children()[0].className == "first" &&
		secondNode.children()[1].className == "second" &&
		secondNode.children()[2].className == "third" &&
		firstNode.children()[0] == nodes[0] &&
		firstNode.children()[1] == nodes[1] &&
		secondNode.children()[0] != nodes[0] &&
		secondNode.children()[1] != nodes[1],
		"prepend to NodeList"
	);

	var node = glow.dom.create('<span>...</span>');
	res = node.prependTo('#foo, #first');
	t.ok(
		res == node &&
		glow.dom.get('#foo')[0].firstChild == node[0] &&
		glow.dom.get('#first').children().slice(0, 1).text() == '...',
		"prepend NodeList to selector"
	);
});


// glow.dom.NodeList.after(String / Node / Array)
//   Insert node(s) after each context node

t.test("glow.dom.NodeList.after(html)", function () {
	t.expect(1);

	var container = glow.dom.create(
		'<div>' +
			'<div class="orig"></div>' +
			'<div class="orig"></div>' +
		'</div>'
	);

	var orig = container.children();
	var res = orig.after('<div class="halb"></div>');

	t.ok(
		res == orig &&
		orig.length == 2 &&
		container.children().length == 4 &&
		container.children()[0] == orig[0] &&
		container.children()[2] == orig[1] &&
		container.children()[1].className == 'halb' &&
		container.children()[3].className == 'halb',
		"insert html after nodes"
	);
});

t.test("glow.dom.NodeList.after(Element)", function () {
	t.expect(1);

	var container = glow.dom.create(
		'<div>' +
			'<div class="orig"></div>' +
			'<div class="orig"></div>' +
		'</div>'
	);

	var node = glow.dom.create('<div class="blah2"></div>');
	
	var orig = container.children();
	var res = orig.after(node[0]);

	t.ok(
		res == orig &&
		orig.length == 2 &&
		container.children().length == 4 &&
		container.children()[0] == orig[0] &&
		container.children()[1] == node[0] &&
		container.children()[2] == orig[1] &&
		container.children()[3].className == 'blah2' &&
		container.children()[3] != node[0],
		"insert dom Element after nodes"
	);
});


t.test("glow.dom.NodeList.after(NodeList)", function () {
	t.expect(1);

	var container = glow.dom.create(
		'<div>' +
			'<div class="orig"></div>' +
			'<div class="orig"></div>' +
		'</div>'
	);

	var nodes = glow.dom.create('<div class="blah2"></div><div class="blah3"></div>');
	
	var orig = container.children();
	var res = orig.after(nodes);

	t.ok(
		res == orig &&
		orig.length == 2 &&
		container.children().length == 6 &&
		container.children()[0] == orig[0] &&
		container.children()[1] == nodes[0] &&
		container.children()[2] == nodes[1] &&
		container.children()[3] == orig[1] &&
		container.children()[4].className == 'blah2' &&
		container.children()[4] != nodes[0] &&
		container.children()[5].className == 'blah3' &&
		container.children()[5] != nodes[1],
		"insert NodeList after nodes"
	);
});


// glow.dom.NodeList.before(String / Node / Array)
//   Insert node(s) before each context node

t.test("glow.dom.NodeList.before(html)", function () {
	t.expect(1);

	var container = glow.dom.create(
		'<div>' +
			'<div class="orig"></div>' +
			'<div class="orig"></div>' +
		'</div>'
	);

	var orig = container.children();
	var res = orig.before('<div class="halb"></div>');

	t.ok(
		res == orig &&
		orig.length == 2 &&
		container.children().length == 4 &&
		container.children()[1] == orig[0] &&
		container.children()[3] == orig[1] &&
		container.children()[0].className == 'halb' &&
		container.children()[2].className == 'halb',
		"insert html before nodes"
	);
});

t.test("glow.dom.NodeList.before(Element)", function () {
	t.expect(1);

	var container = glow.dom.create(
		'<div>' +
			'<div class="orig"></div>' +
			'<div class="orig"></div>' +
		'</div>'
	);

	var node = glow.dom.create('<div class="blah2"></div>');
	
	var orig = container.children();
	var res = orig.before(node[0]);

	t.ok(
		res == orig &&
		orig.length == 2 &&
		container.children().length == 4 &&
		container.children()[0] == node[0] &&
		container.children()[1] == orig[0] &&
		container.children()[2].className == 'blah2' &&
		container.children()[2] != node[0] && 
		container.children()[3] == orig[1],
		"insert dom Element before nodes"
	);
});


t.test("glow.dom.NodeList.before(NodeList)", function () {
	t.expect(1);

	var container = glow.dom.create(
		'<div>' +
			'<div class="orig"></div>' +
			'<div class="orig"></div>' +
		'</div>'
	);

	var nodes = glow.dom.create('<div class="blah2"></div><div class="blah3"></div>');
	
	var orig = container.children();
	var res = orig.before(nodes);

	t.ok(
		res == orig &&
		orig.length == 2 &&
		container.children().length == 6 &&
		container.children()[2] == orig[0] &&
		container.children()[0] == nodes[0] &&
		container.children()[1] == nodes[1] &&
		container.children()[5] == orig[1] &&
		container.children()[3].className == 'blah2' &&
		container.children()[3] != nodes[0] &&
		container.children()[4].className == 'blah3' &&
		container.children()[4] != nodes[1],
		"insert NodeList before nodes"
	);
});


// glow.dom.NodeList.insertAfter(String / Node / Array)
//   Insert context nodes after each parameter node

t.test("glow.dom.NodeList.insertAfter(selector)", function () {
	t.expect(1);

	var nodes = glow.dom.create('<div class="blah1"></div><div class="blah2"></div>');

	var res = nodes.insertAfter('#foo, #first');
	t.ok(
		res == nodes &&
		glow.dom.get('#foo')[0].nextSibling == nodes[0] &&
		glow.dom.get('#foo')[0].nextSibling.nextSibling == nodes[1] &&
		glow.dom.get('#first')[0].nextSibling != nodes[0] &&
		glow.dom.get('#first')[0].nextSibling.nextSibling != nodes[1] &&
		glow.dom.get('#first')[0].nextSibling.className == 'blah1' &&
		glow.dom.get('#first')[0].nextSibling.nextSibling.className == 'blah2',
		"insert NodeList after selector"
	);
});

t.test("glow.dom.NodeList.insertAfter(Element)", function () {
	t.expect(1);

	var nodes = glow.dom.create('<div class="blah1"></div><div class="blah2"></div>');

	var res = nodes.insertAfter(glow.dom.get('#foo')[0]);
	t.ok(
		res == nodes &&
		glow.dom.get('#foo')[0].nextSibling == nodes[0] &&
		glow.dom.get('#foo')[0].nextSibling.nextSibling == nodes[1],
		"insert NodeList after Element"
	);
});

t.test("glow.dom.NodeList.insertAfter(NodeList)", function () {
	t.expect(1);

	var nodes = glow.dom.create('<div class="blah1"></div><div class="blah2"></div>');

	var res = nodes.insertAfter(glow.dom.get('#foo, #first'));
	t.ok(
		res == nodes &&
		glow.dom.get('#foo')[0].nextSibling == nodes[0] &&
		glow.dom.get('#foo')[0].nextSibling.nextSibling == nodes[1] &&
		glow.dom.get('#first')[0].nextSibling != nodes[0] &&
		glow.dom.get('#first')[0].nextSibling.nextSibling != nodes[1] &&
		glow.dom.get('#first')[0].nextSibling.className == 'blah1' &&
		glow.dom.get('#first')[0].nextSibling.nextSibling.className == 'blah2',
		"insert NodeList after selector"
	);
});


// glow.dom.NodeList.insertBefore(String / Node / Array)
//   Insert context nodes before each parameter node

t.test("glow.dom.NodeList.insertBefore(selector)", function () {
	t.expect(1);

	var nodes = glow.dom.create('<div class="blah1"></div><div class="blah2"></div>');

	var res = nodes.insertBefore('#foo, #first');
	t.ok(
		res == nodes &&
		glow.dom.get('#foo')[0].previousSibling == nodes[1] &&
		glow.dom.get('#foo')[0].previousSibling.previousSibling == nodes[0] &&
		glow.dom.get('#first')[0].previousSibling != nodes[1] &&
		glow.dom.get('#first')[0].previousSibling.previousSibling != nodes[0] &&
		glow.dom.get('#first')[0].previousSibling.className == 'blah2' &&
		glow.dom.get('#first')[0].previousSibling.previousSibling.className == 'blah1',
		"insert NodeList before selector"
	);
});

t.test("glow.dom.NodeList.insertBefore(Element)", function () {
	t.expect(1);

	var nodes = glow.dom.create('<div class="blah1"></div><div class="blah2"></div>');

	var res = nodes.insertBefore(glow.dom.get('#foo')[0]);
	t.ok(
		res == nodes &&
		glow.dom.get('#foo')[0].previousSibling == nodes[1] &&
		glow.dom.get('#foo')[0].previousSibling.previousSibling == nodes[0],
		"insert NodeList before Element"
	);
});

t.test("glow.dom.NodeList.insertBefore(NodeList)", function () {
	t.expect(1);

	var nodes = glow.dom.create('<div class="blah1"></div><div class="blah2"></div>');

	var res = nodes.insertBefore(glow.dom.get('#foo, #first'));
	t.ok(
		res == nodes &&
		glow.dom.get('#foo')[0].previousSibling == nodes[1] &&
		glow.dom.get('#foo')[0].previousSibling.previousSibling == nodes[0] &&
		glow.dom.get('#first')[0].previousSibling != nodes[1] &&
		glow.dom.get('#first')[0].previousSibling.previousSibling != nodes[0] &&
		glow.dom.get('#first')[0].previousSibling.className == 'blah2' &&
		glow.dom.get('#first')[0].previousSibling.previousSibling.className == 'blah1',
		"insert NodeList before selector"
	);
});


// glow.dom.NodeList.replaceWith(String / Node / Array)
//   Replace context nodes with parameter nodes

t.test("glow.dom.NodeList.replaceWith(String)", function () {
	t.expect(6);

	var testDoc = glow.dom.create('<div><span>Hello</span><b>World</b><b>Foobar</b><i>BLLLARRRRG!!!</i></div>').appendTo(document.body);
    var ret1 = testDoc.get("span").replaceWith('<p>PASS</p>');
	testDoc.get("b").replaceWith('<span>GREAT</span>');
	testDoc.get("i").replaceWith('<span>CRACKING</span><b>CHEESEGROMIT</b>');

	var testChildren = testDoc.children();
	t.ok(ret1[0].nodeName == "SPAN" && ret1[0].innerHTML == "Hello", "Correct return nodes");
	t.ok(testChildren[0].nodeName == "P" && testChildren[0].innerHTML == "PASS", "Span replaced with p");
	t.ok(testChildren[1].nodeName == "SPAN" && testChildren[1].innerHTML == "GREAT", "First bold replaced with span");
	t.ok(testChildren[2].nodeName == "SPAN" && testChildren[2].innerHTML == "GREAT", "Second bold replaced with span");
	t.ok(
	  testChildren[3].nodeName == "SPAN" && testChildren[3].innerHTML == "CRACKING" &&
	  testChildren[4].nodeName == "B" && testChildren[4].innerHTML == "CHEESEGROMIT",
	  "i replaced with 2 spans"
	);
	t.ok(testChildren[5] == undefined, "No extra elements");
	testDoc.remove();
});


t.test("glow.dom.NodeList.replaceWith(Element)", function () {
	t.expect(6);
	var testDoc = glow.dom.create('<div><span>Hello</span><b>World</b><b>Foobar</b><i>BLLLARRRRG!!!</i></div>').appendTo(document.body);
    var ret1 = testDoc.get("span").replaceWith(glow.dom.create('<p>PASS</p>')[0]);
	testDoc.get("b").replaceWith(glow.dom.create('<span>GREAT</span>')[0]);

	var testChildren = testDoc.children();
	t.ok(ret1[0].nodeName == "SPAN" && ret1[0].innerHTML == "Hello", "Correct return nodes");
	t.ok(testChildren[0].nodeName == "P" && testChildren[0].innerHTML == "PASS", "Span replaced with p");
	t.ok(testChildren[1].nodeName == "SPAN" && testChildren[1].innerHTML == "GREAT", "First bold replaced with span");
	t.ok(testChildren[2].nodeName == "SPAN" && testChildren[2].innerHTML == "GREAT", "Second bold replaced with span");
	t.ok(testChildren[3].nodeName == "I" && testChildren[3].innerHTML == "BLLLARRRRG!!!", "i left intact");
	t.ok(testChildren[4] == undefined, "No extra elements");
	testDoc.remove();
});

t.test("glow.dom.NodeList.replaceWith(NodeList)", function () {
	t.expect(6);

	var testDoc = glow.dom.create('<div><span>Hello</span><b>World</b><b>Foobar</b><i>BLLLARRRRG!!!</i></div>').appendTo(document.body);
    var ret1 = testDoc.get("span").replaceWith(glow.dom.create('<p>PASS</p>'));
	testDoc.get("b").replaceWith(glow.dom.create('<span>GREAT</span>'));
	testDoc.get("i").replaceWith(glow.dom.create('<span>CRACKING</span><b>CHEESEGROMIT</b>'));

	var testChildren = testDoc.children();
	t.ok(ret1[0].nodeName == "SPAN" && ret1[0].innerHTML == "Hello", "Correct return nodes");
	t.ok(testChildren[0].nodeName == "P" && testChildren[0].innerHTML == "PASS", "Span replaced with p");
	t.ok(testChildren[1].nodeName == "SPAN" && testChildren[1].innerHTML == "GREAT", "First bold replaced with span");
	t.ok(testChildren[2].nodeName == "SPAN" && testChildren[2].innerHTML == "GREAT", "Second bold replaced with span");
	t.ok(
	  testChildren[3].nodeName == "SPAN" && testChildren[3].innerHTML == "CRACKING" &&
	  testChildren[4].nodeName == "B" && testChildren[4].innerHTML == "CHEESEGROMIT",
	  "i replaced with 2 spans"
	);
	t.ok(testChildren[5] == undefined, "No extra elements");
	testDoc.remove();
});

t.test("glow.dom.NodeList.replaceWith special cases", function () {
  t.expect(3);
  //safari 2 doesn't like it when 2 elements with the same id appear on the page at the same time, even for a moment
  
  var testDoc = glow.dom.create('<div id="testGuff"><div id="myTestElement">Hello</div></div>').appendTo(document.body);
  
  testDoc.get("#myTestElement").replaceWith('<span id="myTestElement">Bye</span>');
  
  t.equals(testDoc.children()[0].nodeName, "SPAN", "Div replaced with new element");
  t.equals(testDoc.children()[0].id, "myTestElement", "Span has correct id");
  t.ok(glow.dom.get("#myTestElement").length, "Can get new item by ID");
  
  testDoc.remove();
});



t.test("glow.dom.NodeList#wrap", function () {
	
	t.expect(6);  
		
	var testDoc = glow.dom.create("<p class='gift'><span>Shiny toys</span></p>").appendTo(document.body);
	var testDoc =  glow.dom.get(".gift").wrap("<div id='giftwrap'><span class='tissuepaper'></span></div>");
	
	t.ok(glow.dom.get(".gift").parent().hasClass("tissuepaper"), "Wrapped item has new correct parent");    
	
	t.ok(glow.dom.get(".gift").parent().hasClass("tissuepaper"), "Wrapped item has correct new parent");
	
	glow.dom.get("#giftwrap").remove();
	
	var testDoc = glow.dom.create("<div id='test'><div class='2toys'>two toys: <span class='toy'>toy1</span><span class='toy'>toy2</span></div><div class='1toy'><span class='toy'>toy3</span></div></div>").appendTo(document.body);    
	var testDoc =  glow.dom.get(".toy").wrap("<div class='giftwrap'><span class='tissuepaper'></span></div>");
		
	t.ok(glow.dom.get(".toy").parent().hasClass("tissuepaper"), "Multiple wrapped items have correct new wrapper parents");
		
	glow.dom.get("#test").remove();
		
	var nodes = glow.dom.create("<div class='inner'>inner</div>").wrap("<div class='outer'></div>");   
		
	t.ok(nodes.parent().hasClass("outer"), "Unattached wrapped item has correct new wrapper parent");
		
	glow.dom.get(".outer").remove();
		
	var wrappernodes = glow.dom.create("<div class='wrappernode'>wrappernode</div>").appendTo(document.body);
		
	var towrap = glow.dom.create("<div class='towrap'>wrap1</div><div class='towrap'>wrap2</div><div class='towrap'>wrap3</div>").appendTo(document.body);
		
	var nodes = glow.dom.get(".towrap").wrap(wrappernodes);
		
	t.ok(nodes.parent().hasClass("wrappernode") && wrappernodes.children().length == '1' && nodes.length == '3', "Three in document wrapper nodes have correct parents and one new child each");
		
	glow.dom.get(".wrappernode").remove();
	glow.dom.get(".towrap").remove();
		
	var wrappernodes2 = glow.dom.create("<div class='wrappernode'>wrappernode</div>");    
		
	var nodes = glow.dom.create("<div class='towrap'>wrap1</div><div class='towrap'>wrap2</div>").wrap(wrappernodes2);
		
	t.ok(nodes.parent().hasClass("wrappernode") && wrappernodes2.children().length == '1' && nodes.length == '2', "Two new unattached wrapped nodes have correct parents and two children");
		
	glow.dom.get(".wrappernode").remove();
   
    
});

t.test("glow.dom.NodeList#unwrap", function () {
    t.expect(4);
    
    var testDoc =  glow.dom.create("<div id='giftwrap'><div id='gift'><span>Shiny toys</span></div></div>").appendTo(document.body);
    var expectedNodes = testDoc.children();    
    var newDoc = glow.dom.get("#gift").unwrap();           
    
    t.ok(glow.dom.get("#gift"), "Unwrapped node exists");
    
    t.isSet(newDoc, expectedNodes, "Returned value is new unwrapped nodelist");

    newDoc.remove();
    testDoc.remove();
    
    
    var testDoc =  glow.dom.create("<div id='box'><div class='tissuepaper'><div class='tissuepaper' id='inner'><span>Shiny toys</span></div></div></div>").appendTo(document.body); 
    var toUnwrap = glow.dom.get(".tissuepaper")
    
    var newDoc = toUnwrap.unwrap();      
    
    t.isSet(newDoc, toUnwrap, "Unwraps multiple nodes, and when nested");

    newDoc.remove();
    testDoc.remove();
    
    
    var testDoc =  glow.dom.create("<div id='box'><div class='tissuepaper'><div class='tissuepaper' id='inner'><span>Shiny toys</span></div></div></div>");
 
    
    var expectedNodes = glow.dom.get("#inner");
    
    var toUnwrap = glow.dom.get(".tissuepaper")
    
    var newDoc = toUnwrap.unwrap();   
    
    
    t.isSet(newDoc, toUnwrap, "Removes parents for unattached nodes");

    newDoc.remove();
    testDoc.remove();
});
			

t.module("glow.dom.NodeList XML tests");

var xmlData;

t.test("Load XML Data", function() {
  t.expect(1);
	t.stop();
	var getRef = glow.net.get("testdata/xhr/xml.xml", {
		onLoad: function(response) {
			xmlData = response.xml();
			t.ok(xmlData, "xml load");
			t.start();
		},
		onError: function() {
			t.ok(false, "xml load");
			t.start();
		}
	});
});

t.test("XML In NodeList", function() {
	t.expect(1);
	var xmlNodes = glow.dom.get(xmlData);
	t.equals(xmlNodes[0].nodeType, 9, "First node is document");
});

t.test("Selectors with XML", function() {
	t.expect(7);
	var xmlNodes = glow.dom.get(xmlData);
	var testNode = xmlNodes.get("nodeListTest");
	t.equals(xmlNodes.get("*").length, 20, "Get all (*)");
	t.ok(testNode.length == 1
		&& testNode[0].nodeName == "nodeListTest", "Got nodeListTest");
	t.ok(xmlNodes.get("nodelisttest").length === 0, "Case sensitive");
	t.ok(testNode.get("o").length == 7, "Tag names from multiple parents");
	t.ok(testNode.get("testOne o").length == 3, "elementName elementName");
	t.ok(testNode.get("testOne > w > o").length == 3, "elementName > elementName > elementName");
	t.ok(testNode.get("testOne > w > o, o").length == 7, "Removes duplicates");
	//we don't need to test class names or ID here, as they're dependant on doctype or schema
});

t.test("glow.dom.NodeList#attr (XML)", function() {
	t.expect(3);
	var xmlNodes = glow.dom.get(xmlData).children().clone();
	var testNodes = xmlNodes.get("*").filter(function() {
	  return glow.dom.get(this).attr("something") == "pass";
	});
	t.ok(testNodes.length == 1
		 && testNodes[0].nodeName == "testOne", "Get Attr");
	
	testNodes = xmlNodes.get("o").filter(function() {
	  return glow.dom.get(this).attr("y") == "3";
	});
	
	t.ok(testNodes.length == 2
		 && testNodes[0].nodeName == "o", "Get Attr with element filter");
	
	xmlNodes.get("testTwo").attr("x", "42");
	t.equals(xmlNodes.get("testTwo").attr("x"), "42", "Set then get attribute");
});

t.test("glow.dom.NodeList attribute checking and removing (XML)", function() {
	t.expect(4);
	var xmlNodes = glow.dom.get(xmlData).children().clone();
	
	t.ok(xmlNodes.get("testOne").hasAttr("something"), "has existing attribute");
	t.ok(xmlNodes.get("testOne").hasAttr("isEmpty"), "has existing (but empty) attribute");
	t.ok(!xmlNodes.get("testOne").hasAttr("doesntHave"), "false for non-existant attribute");
	
	t.ok(!xmlNodes.get("testTwo").removeAttr("x").hasAttr("x"), "remove attribute");
});

t.test("glow.dom.NodeList#isWithin (XML)", function() {
	t.expect(3);
	var xmlNodes = glow.dom.get(xmlData).children().clone();

	
	t.ok(xmlNodes.get("o").isWithin(xmlNodes), "Nodes are within document");
	t.ok(xmlNodes.get("testOne").isWithin(xmlNodes.get("nodeListTest")), "Node is within element");
	t.ok(!xmlNodes.get("testTwo").isWithin(xmlNodes.get("testOne")), "Node isn't within element");
});

t.test("glow.dom.NodeList altering content selection (XML)", function() {
	t.expect(4);
	var xmlNodes = glow.dom.get(xmlData).children().clone();
	
	t.ok(xmlNodes.get("w").children().eq(xmlNodes.get("testOne o")), "children()");
	t.ok(xmlNodes.get("testOne o").parent().eq(xmlNodes.get("w")), "parent()");
	t.ok(xmlNodes.get("testOne").next()[0].nodeName == "testTwo", "next()");
	t.ok(xmlNodes.get("testTwo").prev()[0].nodeName == "testOne", "prev()");
});

t.test("glow.dom.NodeList Manipulation (XML)", function() {
	t.expect(11);
	var xmlNodes = glow.dom.get(xmlData).children().clone();
	
	/*
	 * make sure you check appending using string etc. May have to just
	 * mention that in documentation
	 */
	
	t.equals(xmlNodes.get("b").text(), "Pass", "Getting inner text from a node");
	t.equals(xmlNodes.get("b").empty().get(" > * ").length, 0, "Empty node");
	xmlNodes.get("b").remove();
	t.equals(xmlNodes.get("b").length, 0, "Removed node");
	var testTwoClone = xmlNodes.get("testTwo").clone().empty();
	t.ok(xmlNodes.get("testTwo > *").length == 4 && testTwoClone.get(" > * ").length == 0, "Cloned node");
	
	//get fresh xml, we've messed with the current one too much...
	var xmlNodes = glow.dom.get(xmlData).children().clone();
	
	xmlNodes.get("nodeListTest").append(xmlData.createElement("pass"));
	t.equals(xmlNodes.get("nodeListTest > pass").length, 1, "Node appended using node created by xml document");
	xmlNodes.get("testTwo o").append(xmlData.createElement("pass"));
	t.equals(xmlNodes.get("o > pass").length, 4, "Append correctly cloning nodes for multiple appends");
	xmlNodes.get("testTwo").prepend(xmlData.createElement("shouldBeFirst"));
	t.equals(xmlNodes.get("testTwo > *")[0].nodeName, "shouldBeFirst", "Prepend using node created by xml document");
	
	//get fresh xml, we've messed with the current one too much...
	xmlNodes = glow.dom.get(xmlData).children().clone();
	
	glow.dom.get(xmlData.createElement("shouldBeLast")).appendTo(xmlNodes.get("testTwo"));
	t.equals(xmlNodes.get("testTwo > *").slice(-1)[0].nodeName, "shouldBeLast", "appendTo using node created by xml document");
	glow.dom.get(xmlData.createElement("shouldBeFirst")).prependTo(xmlNodes.get("testTwo"));
	t.equals(xmlNodes.get("testTwo > *")[0].nodeName, "shouldBeFirst", "prependTo using node created by xml document");
	
	//get fresh xml, we've messed with the current one too much...
	xmlNodes = glow.dom.get(xmlData).children().clone();
	
	xmlNodes.get("testTwo o").slice(1, 2).after(xmlData.createElement("afterO"));
	t.equals(xmlNodes.get("testTwo o").slice(1, 2).next()[0].nodeName, "afterO", "after using node created by xml document");
	
	//get fresh xml, we've messed with the current one too much...
	xmlNodes = glow.dom.get(xmlData).children().clone();
	
	xmlNodes.get("testTwo o").slice(2, 3).before(xmlData.createElement("beforeO"));
	t.equals(xmlNodes.get("testTwo o").slice(2, 3).prev()[0].nodeName, "beforeO", "before using node created by xml document");
});

t.module("glow.dom CSS and dimensions");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("glow.dom.NodeList.width", function() {
	t.expect(13);
	var node = glow.dom.create("" +
		'<div id="cssTests">' +
			'<div class="width100">Test</div>' +
			'<div class="width100 padding10">Test</div>' +
			'<div class="bordered" style="width:100px;border:10px solid #000">Test</div>' +
			'<div class="width100 overflowScroll">Test</div>' +
			'<div class="containsWidth100Div" style="float:left"><div class="width100">Test</div></div>' +
			'<div style="width:500px; height: 100px"> <div id="autoWidthTest" style="border:5px solid red; padding:10px;"></div> </div>' +
		'</div>'
	)[0];
	document.body.appendChild(node);
	
	t.ok( typeof glow.dom.get(window).width() == 'number', "window width is number" );
	t.ok( glow.dom.get(window).width() > 0, "window width is greater than zero" );
	t.ok( typeof glow.dom.get(document).width() == 'number', "document width is number" );
	t.ok( glow.dom.get(document).width() > 0, "document width is greater than zero" );
	
	t.equals(glow.dom.get("#cssTests div.width100").width(), 100, "Width get");
	t.equals(glow.dom.get("#cssTests div.width100.padding10").width(), 100, "Ignore padding");
	t.equals(glow.dom.get("#cssTests div.bordered").width(), 100, "Ignore border");
	t.equals(glow.dom.get("#cssTests div.width100.overflowScroll").width(), 100, "Element with scrollbars");
	t.equals(glow.dom.get("#cssTests div.containsWidth100Div").width(), 100, "Element floating and containing div");
	t.equals(glow.dom.get("#autoWidthTest").width(), 470, "Auto width element with border & padding");
	
	t.equals(glow.dom.get("#cssTests div.bordered").width(200).width(), 200, "Set width number");
	t.equals(glow.dom.get("#cssTests div.bordered").width("300").width(), 300, "Set width str, no unit");
	t.equals(glow.dom.get("#cssTests div.bordered").width("400px").width(), 400, "Set width str, inc unit");
	
	node.parentNode.removeChild(node);
});

t.test("glow.dom.NodeList.height", function() {
	t.expect(12);
	var node = glow.dom.create("" +
		'<div id="cssTests">' +
			'<div class="height100">Test</div>' +
			'<div class="height100 padding10">Test</div>' +
			'<div class="bordered" style="height:100px;border:10px solid #000">Test</div>' +
			'<div class="height100 overflowScroll">Test</div>' +
			'<div class="containsHeight100Div"><div class="height100">Test</div></div>' +
		'</div>'
	)[0];
	document.body.appendChild(node);
	
	t.ok( typeof glow.dom.get(window).height() == 'number', "window height is number" );
	t.ok( glow.dom.get(window).height() > 0, "window height is greater than zero" );
	t.ok( typeof glow.dom.get(document).height() == 'number', "document height is number" );
	t.ok( glow.dom.get(document).height() > 0, "document height is greater than zero" );
	
	t.equals(glow.dom.get("#cssTests div.height100").height(), 100, "height get");
	t.equals(glow.dom.get("#cssTests div.height100.padding10").height(), 100, "Ignore padding");
	t.equals(glow.dom.get("#cssTests div.bordered").height(), 100, "Ignore border");
	t.equals(glow.dom.get("#cssTests div.height100.overflowScroll").height(), 100, "Element with scrollbars");
	t.equals(glow.dom.get("#cssTests div.containsHeight100Div").height(), 100, "Element floating and containing div");
	
	t.equals(glow.dom.get("#cssTests div.bordered").height(200).height(), 200, "Set height number");
	t.equals(glow.dom.get("#cssTests div.bordered").height("300").height(), 300, "Set height str, no unit");
	t.equals(glow.dom.get("#cssTests div.bordered").height("400px").height(), 400, "Set height str, inc unit");
	node.parentNode.removeChild(node);
});

t.test("glow.dom.NodeList.css setting with hash of values", function() {
	t.expect(5);
	var node = glow.dom.create("" +
		'<div id="cssTests">' +
			'<div class="test">Test</div>' +
		'</div>'
	)[0];
	document.body.appendChild(node);
	// TRY A SINGLE ENTRY
	t.equals(glow.dom.get("#cssTests div.test").css({width: "100px"}).css("width"), "100px", "Set width to 100px");
	// TRY MULTIPLE ENTRY
	glow.dom.get("#cssTests div.test").css({
		"font-style": "italic",
		"font-size": "10px",
		padding: "10px",
		margin: "10px"
	});
	t.equals(glow.dom.get("#cssTests div.test").css("font-style"), "italic", "Set font-style to italic");
	t.equals(glow.dom.get("#cssTests div.test").css("font-size"), "10px", "Set font-weight to 10px");
	t.equals(glow.dom.get("#cssTests div.test").css("padding-left"), "10px", "Set font-weight to 10px");
	t.equals(glow.dom.get("#cssTests div.test").css("margin-left"), "10px", "Set font-weight to 10px");
	node.parentNode.removeChild(node);
});

t.test("glow.dom.NodeList.css getting", function() {
	t.expect(59);
	var node = glow.dom.create("" +
		'<div id="cssTests">' +
			'<div class="width100">Test</div>' +
			'<div class="height100">Test</div>' +
			'<div class="containsWidth100Div" style="float:left"><div class="width100">Test</div></div>' +
			'<div class="padTest">padTest</div>' +
			'<div class="borderTest">Test</div>' +
			'<div class="marginTest">Test</div>' +
			'<div class="marginTest2">Test</div>' +
			'<ul class="listTest">' +
				'<li>Test</li>' +
				'<li>' +
					'<ul>' +
						'<li>Test</li>' +
					'</ul>' +
				'</li>' +
			'</ul>' +
			'<div class="colourTest">Test<div>Test</div></div>' +
			'<div class="backgroundTest">Test</div>' +
			'<div class="fontTest">Test</div>' +
			'<table class="tableTest"><tr><td>Test</td><td>Test</td></tr><tr><td>Test</td><td>Test</td></tr></table>' +
			'<div class="posTest1">Test</div>' +
			'<div class="posTest2">postest2</div>' +
			'<div class="posTest3">Test</div>' +
			'<div class="posTest4Container"><div class="posTest4">Test</div><div class="posTest5">Test</div></div>' +
			'<div class="posTest4Container"><div class="padTest2">Test</div></div>' +
			'<div class="posTest6Container" style="position:relative;zoom:1"><div style="height:100px">Padding!</div><div class="posTest6">Test</div></div>' +
			'<div class="posTest7Container" style="width:500px;margin-left:20px;"><div class="posTest7">Test</div></div>' +
			'<div class="posTest8">posTest8</div>' +
			'<div class="opacityTest">Test</div>' +
			'<div class="displayTest1">Test</div>' +
			'<div class="displayTest2">Test</div>' +
			'<div class="displayNone" style="display:none"><div class="posTest8">Test</div></div>' +
		'</div>'
	)[0];
	document.body.appendChild(node);
	
	t.equals(glow.dom.get("#cssTests div.width100").css("width"), "100px", "Width");
	t.equals(glow.dom.get("#cssTests div.height100").css("height"), "100px", "Height");
	t.equals(glow.dom.get("#cssTests div.padTest").css("padding-right"), "10px", "Absolute Padding");
	t.equals(glow.dom.get("#cssTests div.padTest").css("padding-left"), "60px", "Relative Padding");
	t.equals(glow.dom.get("#cssTests div.borderTest").css("border-right-width"), "10px", "Absolute Border");
	t.equals(glow.dom.get("#cssTests div.borderTest").css("border-left-width"), "60px", "Relative Border");
	t.equals(glow.dom.get("#cssTests div.marginTest").css("margin-right"), "10px", "Absolute margin");
	t.equals(glow.dom.get("#cssTests div.marginTest").css("margin-left"), "60px", "Relative margin");
	t.equals(glow.dom.get("#cssTests div.padTest").css(["padding-right", "padding-left"]), "70px", "Left and right padding total");
	t.equals(glow.dom.get("#cssTests div.borderTest").css(["border-right-width", "border-left-width"]), "70px", "Left and right border total");
	t.equals(glow.dom.get("#cssTests div.marginTest").css(["margin-right", "margin-left"]), "70px", "Left and right margin total");
		//this is fine, but IE's % padding calculator is broken so it fails this test
		//t.equals(glow.dom.get("#cssTests div.padTest2").css("padding-left"), "250px", "Percent padding");
		//cannot get value for auto in some browsers
		//t.equals(glow.dom.get("#cssTests div.marginTest2").css("margin-left"), "dunno", "Auto margin");
	
	//lists
	t.equals(glow.dom.get("#cssTests ul.listTest").css("list-style-image"), "none", "list-style-image");
	t.equals(glow.dom.get("#cssTests ul.listTest").css("list-style-position"), "outside", "list-style-position");
	t.equals(glow.dom.get("#cssTests ul.listTest").css("list-style-type"), "square", "list-style-type");
	t.equals(glow.dom.get("#cssTests ul.listTest li").css("list-style-image"), "none", "list-style-image (on li)");
	t.equals(glow.dom.get("#cssTests ul.listTest li").css("list-style-position"), "outside", "list-style-position (on li)");
	t.equals(glow.dom.get("#cssTests ul.listTest li").css("list-style-type"), "square", "list-style-type (on li)");
	
	//color tests
	t.equals(glow.dom.get("#cssTests div.colourTest").css("color"), "rgb(0, 255, 0)", "color");
	t.equals(glow.dom.get("#cssTests div.colourTest div").css("color"), "rgb(0, 255, 0)", "color nested");
	//safari gets this one a little wrong, but it's ok
	t.ok(/rgb\(12[78], 12[78], 12[78]\)/.test(glow.dom.get("#cssTests div.colourTest").css("background-color")), "background-color (percentage color)");
	t.equals(glow.dom.get("#cssTests div.colourTest").css("border-left-color"), "rgb(0, 128, 0)", "border-left-color (keyword)");
	
	//background test
	t.equals(glow.dom.get("#cssTests div.backgroundTest").css("background-image"), "url(" + /^([\s\S]+)\//.exec(window.location.href)[1] + "/testdata/fail.png)", "background-image");
	t.equals(glow.dom.get("#cssTests div.backgroundTest").css("background-attachment"), "scroll", "background-attachment");
	t.equals(glow.dom.get("#cssTests div.backgroundTest").css("background-repeat"), "repeat-x", "background-repeat");
		//Cannot get a reliable value for this
		//t.equals(glow.dom.get("#cssTests div.backgroundTest").css("background-position"), "top right", "background-position");
	
	//font & direction
	t.equals(glow.dom.get("#cssTests div.fontTest").css("direction"), "rtl", "direction");
		//some browsers return used font, others return full list provided in stylesheet
		//t.equals(glow.dom.get("#cssTests div.fontTest").css("font-family"), "verdana", "font-family");
		//cannot get a computed value for IE
		//t.equals(glow.dom.get("#cssTests div.fontTest").css("font-size"), "60px", "font-size");
	t.equals(glow.dom.get("#cssTests div.fontTest").css("font-style"), "italic", "font-style");
	t.equals(glow.dom.get("#cssTests div.fontTest").css("font-variant"), "small-caps", "font-variant");
		//cannot get a computed value for this, some use 'bold', others '700'. Could map the realtive values, but I'm not convinced it's needed
		//t.equals(glow.dom.get("#cssTests div.fontTest").css("font-weight"), "bold", "font-weight");
	//opera adds 2 decimal places for a laugh
	t.ok(/120(\.00)?px/.test(glow.dom.get("#cssTests div.fontTest").css("line-height")), "line-height");
	t.equals(glow.dom.get("#cssTests div.fontTest").css("letter-spacing"), "120px", "letter-spacing");
	t.equals(glow.dom.get("#cssTests div.fontTest").css("text-align"), "justify", "text-align");
	t.equals(glow.dom.get("#cssTests div.fontTest").css("text-decoration"), "underline", "text-decoration");
	t.equals(glow.dom.get("#cssTests div.fontTest").css("text-indent"), "120px", "text-indent");
		//IE 5.5 returns "uppercase"
		//t.equals(glow.dom.get("#cssTests div.fontTest").css("text-transform"), "capitalize", "text-transform");
	t.equals(glow.dom.get("#cssTests div.fontTest").css("white-space"), "nowrap", "white-space");
	t.equals(glow.dom.get("#cssTests div.fontTest").css("word-spacing"), "240px", "word-spacing");
	
	//bordering
	t.equals(glow.dom.get("#cssTests div.borderTest").css("border-top-style"), "dotted", "border-top-style");
	t.equals(glow.dom.get("#cssTests div.borderTest").css("border-right-style"), "dashed", "border-right-style");
	t.equals(glow.dom.get("#cssTests div.borderTest").css("border-bottom-style"), "double", "border-bottom-style");
	t.equals(glow.dom.get("#cssTests div.borderTest").css("border-left-style"), "solid", "border-left-style");
	
	//misc
	t.equals(glow.dom.get("#cssTests div.containsWidth100Div").css("float"), "left", "float");
	t.equals(glow.dom.get("#cssTests div.padTest").css("clear"), "left", "clear");
		//can't get a good value out of firefox
		//t.equals(glow.dom.get("#cssTests table.tableTest").css("table-layout"), "fixed", "table-layout");
	t.equals(glow.dom.get("#cssTests div.displayTest1").css("display"), "inline", "display");
	t.equals(glow.dom.get("#cssTests div.displayTest2").css("display"), "none", "display");
	t.equals(glow.dom.get("#cssTests div.padTest").css("opacity"), "1", "opacity - none set");
	t.equals(glow.dom.get("#cssTests div.opacityTest").css("opacity"), "0.25", "opacity - none set");
	
	//positioning
	t.equals(glow.dom.get("#cssTests div.posTest1").css("position"), "absolute", "position");
	t.equals(glow.dom.get("#cssTests div.posTest1").css("top"), "66px", "top (em val)");
	t.equals(glow.dom.get("#cssTests div.posTest1").css("left"), "30px", "left (px val)");
	t.equals(glow.dom.get("#cssTests div.posTest1").css("z-index"), "32", "z-index");
	t.equals(glow.dom.get("#cssTests div.posTest2").css("right"), "60px", "right (em val)");
	t.equals(glow.dom.get("#cssTests div.posTest2").css("bottom"), "30px", "bottom (px val)");
	t.equals(glow.dom.get("#cssTests div.posTest3").css("position"), "relative", "position");
	t.equals(glow.dom.get("#cssTests div.posTest3").css("top"), "-60px", "top (reltive negative em)");
	t.equals(glow.dom.get("#cssTests div.posTest3").css("left"), "-30px", "left (reltive negative em)");
	t.equals(glow.dom.get("#cssTests div.posTest4").css("left"), "250px", "left (%)");
	t.equals(glow.dom.get("#cssTests div.posTest5").css("right"), "250px", "right (%)");
	t.equals(glow.dom.get("#cssTests div.posTest7").css("left"), "30px", "Using correct offset parent");
	
	//display none tests
	// doesn't work while display:none, may fix later?
	//t.equals(glow.dom.get("#cssTests div.posTest8").css("top"), "60px", "top (em val display none)");
	//t.equals(glow.dom.get("#cssTests div.posTest8").css("left"), "30px", "left (px val display none)");
	t.equals(glow.dom.get("#cssTests div.posTest8").css("width"), "60px", "width (em val display none)");
	t.equals(glow.dom.get("#cssTests div.posTest8").css("width"), "60px", "width (em val display none)");
	t.equals(glow.dom.get("#cssTests div.posTest8").css("height"), "30px", "height (px val display none)");
	//t.equals(glow.dom.get("#cssTests div.displayNone div").css("top"), "60px", "top (em val inside display none)");
	
	
	node.parentNode.removeChild(node);
});

t.module("glow.dom.NodeList position detecting");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("glow.dom.NodeList#offset", function() {
	t.expect(18);
	
	var node = glow.dom.create('' +
		'<div id="offsetTest" style="position:absolute; top:0; left:0; background:#000; zoom:1; overflow: hidden">' +
			'<div id="elm1" style="position:relative; height:120px; width:300px; padding:20px; margin: 0 10px 10px 10px">' +
				'<div id="elm1_1" style="height:5px; width:5px; padding:5px; border:5px solid #000"></div>' +
			'</div>' +
			'<div id="elm2" style="position:relative; height:140px; width:300px; padding:20px; margin:10px; border: 10px solid red">' +
				'<div id="elm2_1" style="height:5px; width:5px; padding:20px; border:5px solid #000"></div>' +
			'</div>' +
			'<div id="elm3" style="height:200px; width:130px; padding:20px; margin:10px">' +
				'<div id="elm3_1" style="height:5px; width:5px; padding:20px; border:5px solid #000; margin: 10px; background: #000"></div>' +
			'</div>' +
			'<div id="elm4" style="position:absolute; height:50px; width:50px; padding:5px; margin:10px; top:5px; left: 5px">' +
				'<div id="elm4_1" style="height:5px; width:5px; padding:0px; margin:5px"></div>' +
			'</div>' +
			'<div id="elm5" style="position:relative; height:140px; width:300px; padding:20px; margin:10px; border: 10px solid red">' +
				'<div id="elm5_1" style="height:5px; width:5px; padding:0px; margin-top:-10px; background: yellow"></div>' +
			'</div>' +
		'</div>' +
	'').appendTo(document.body);
	
	var elm1Offset = glow.dom.get("#elm1").offset();
	var elm1_1Offset = glow.dom.get("#elm1_1").offset();
	var elm2Offset = glow.dom.get("#elm2").offset();
	var elm2_1Offset = glow.dom.get("#elm2_1").offset();
	var elm3Offset = glow.dom.get("#elm3").offset();
	var elm3_1Offset = glow.dom.get("#elm3_1").offset();
	var elm4Offset = glow.dom.get("#elm4").offset();
	var elm4_1Offset = glow.dom.get("#elm4_1").offset();
	var elm5_1Offset = glow.dom.get("#elm5_1").offset();
	
	t.equals(elm1Offset.top, 0, "elm1 top offset");
	t.equals(elm1Offset.left, 10, "elm1 left offset");
	
	t.equals(elm1_1Offset.top, 20, "elm1_1 top offset");
	t.equals(elm1_1Offset.left, 30, "elm1_1 left offset");
	
	t.equals(elm2Offset.top, 170, "elm2 top offset");
	t.equals(elm2Offset.left, 10, "elm2 left offset");
	
	t.equals(elm2_1Offset.top, 200, "elm2_1 top offset");
	t.equals(elm2_1Offset.left, 40, "elm2_1 left offset");
	
	t.equals(elm3Offset.top, 380, "elm3 top offset");
	t.equals(elm3Offset.left, 10, "elm3 left offset");
	
	t.equals(elm3_1Offset.top, (glow.env.ie < 8) ? 400 : 410, "elm3_1 top offset");
	t.equals(elm3_1Offset.left, 40, "elm3_1 left offset");
	
	t.equals(elm4Offset.top, 15, "elm4 top offset");
	t.equals(elm4Offset.left, 15, "elm4 left offset");
	
	t.equals(elm4_1Offset.top, (glow.env.ie < 8) ? 20 : 25, "elm4_1 top offset");
	t.equals(elm4_1Offset.left, 25, "elm4_1 left offset");
	
	t.equals(elm5_1Offset.top, 650, "elm5_1 top offset");
	t.equals(elm5_1Offset.left, 40, "elm5_1 left offset");
	
	node.destroy();	
});

t.test("glow.dom.NodeList#offset with scrolling", function() {
  t.expect(4);
  var node = glow.dom.create("" +
	'<div id="offsetTests" style="position:absolute;top:0;left:0;">' +
	  '<div style="height:100px"></div>' +
	  '<div class="scroller1" style="width: 300px; height: 300px; overflow: scroll; position: relative">' +
		'<div style="height: 500px"></div>' +
		'<div class="test1 scroller2" style="width: 300px; height: 300px; overflow: scroll; position: relative; background:#f00">' +
		  '<div class="test2" style="position:absolute; left: 400px; top: 800px; width: 200px; height: 200px; background:#ff0"></div>' +
		'</div>' +
		'<div style="height: 500px"></div>' +
	  '</div>' +
	'</div>' +
  '').appendTo(document.body);
  
  
  
  //safari 1.3 is annoying and won't set the scroll position straight away, so we need to do this...
  t.stop();
  setTimeout(function() {
	node.get("div.scroller1")[0].scrollTop = 400;
	node.get("div.scroller2")[0].scrollTop = 700;
	
	t.equals(node.get("div.test1").offset().top, 200, "y position with scrolling");
	t.equals(node.get("div.test1").offset().left, 0, "x position with scrolling");
	t.equals(node.get("div.test2").offset().top, 300, "nested y position with scrolling");
	t.equals(node.get("div.test2").offset().left, 400, "nested x position with scrolling");

	node.destroy();
	t.start();
  }, 50);
});

t.test("glow.dom.NodeList#position", function() {
	t.expect(18);
	
	var node = glow.dom.create('' +
		'<div id="positionTest" style="position:relative; background:#000; zoom:1; overflow: hidden">' +
			'<div id="pos1" style="position:relative; height:120px; width:300px; padding:20px; margin: 0 10px 10px 10px">' +
				'<div id="pos1_1" style="height:5px; width:5px; padding:5px; border:5px solid #000"></div>' +
			'</div>' +
			'<div id="pos2" style="position:relative; height:140px; width:300px; padding:20px; margin:10px; border: 10px solid red">' +
				'<div id="pos2_1" style="height:5px; width:5px; padding:20px; border:5px solid #000"></div>' +
			'</div>' +
			'<div id="pos3" style="height:200px; width:130px; padding:20px; margin:10px">' +
				'<div id="pos3_1" style="height:5px; width:5px; padding:20px; border:5px solid #000; margin: 10px"></div>' +
			'</div>' +
			'<div id="pos4" style="position:absolute; height:50px; width:50px; padding:5px; margin:10px; top:5px; left: 5px">' +
				'<div id="pos4_1" style="height:5px; width:5px; padding:0px; margin:5px"></div>' +
			'</div>' +
			'<div id="pos5" style="position:relative; height:140px; width:300px; padding:20px; margin:10px; border: 10px solid red">' +
				'<div id="pos5_1" style="height:5px; width:5px; padding:0px; margin-top:-10px; background: yellow"></div>' +
			'</div>' +
		'</div>' +
	'').appendTo(document.body);
	
	var pos1Position = glow.dom.get("#pos1").position();
	var pos1_1Position = glow.dom.get("#pos1_1").position();
	var pos2Position = glow.dom.get("#pos2").position();
	var pos2_1Position = glow.dom.get("#pos2_1").position();
	var pos3Position = glow.dom.get("#pos3").position();
	var pos3_1Position = glow.dom.get("#pos3_1").position();
	var pos4Position = glow.dom.get("#pos4").position();
	var pos4_1Position = glow.dom.get("#pos4_1").position();
	var pos5_1Position = glow.dom.get("#pos5_1").position();
	
	t.equals(pos1Position.top, 0, "pos1 top position");
	t.equals(pos1Position.left, 0, "pos1 left position");
	
	t.equals(pos1_1Position.top, 20, "pos1_1 top position");
	t.equals(pos1_1Position.left, 20, "pos1_1 left position");
	
	t.equals(pos2Position.top, 160, "pos2 top position");
	t.equals(pos2Position.left, 0, "pos2 left position");
	
	t.equals(pos2_1Position.top, 20, "pos2_1 top position");
	t.equals(pos2_1Position.left, 20, "pos2_1 left position");
	
	t.equals(pos3Position.top, 370, "pos3 top position");
	t.equals(pos3Position.left, 0, "pos3 left position");
	
	t.equals(pos3_1Position.top, (glow.env.ie < 8) ? 390 : 400, "pos3_1 top position");
	t.equals(pos3_1Position.left, 30, "pos3_1 left position");
	
	t.equals(pos4Position.top, 5, "pos4 top position");
	t.equals(pos4Position.left, 5, "pos4 left position");
	
	t.equals(pos4_1Position.top, (glow.env.ie < 8) ? 0 : 5, "pos4_1 top position");
	t.equals(pos4_1Position.left, 5, "pos4_1 left position");
	
	t.equals(pos5_1Position.top, 20, "pos5_1 top position");
	t.equals(pos5_1Position.left, 20, "pos5_1 left position");
	
	node.destroy();	
});

t.test("glow.dom.NodeList#scrollLeft & scrollTop", function() {
	t.expect(8);
	
	var testElm = glow.dom.create(' \
		<div style="width:300px; height:200px; overflow:scroll; zoom:1;"> \
			<div style="width:2000px;height:2000px"></div> \
		</div> \
	').appendTo(document.body);
	
	t.equals( typeof testElm.scrollLeft(), 'number', 'scrollLeft returns number' );
	t.equals( typeof testElm.scrollTop(), 'number', 'scrollTop returns number' );
	
	// set scroll positions to 0,0
	// setting scrollLeft twice to test chaining
	testElm.scrollLeft(10).scrollTop(0).scrollLeft(0);
	
	t.equals( testElm.scrollTop(), 0, 'scrollTop' );
	t.equals( testElm.scrollLeft(), 0, 'scrollLeft' );
	
	testElm.scrollLeft(30);
	
	t.equals( testElm.scrollTop(), 0, 'scrollTop' );
	t.equals( testElm.scrollLeft(), 30, 'scrollLeft' );
	
	testElm.scrollTop(50);
	
	t.equals( testElm.scrollTop(), 50, 'scrollTop' );
	t.equals( testElm.scrollLeft(), 30, 'scrollLeft' );
	
	testElm.destroy();
});

t.module("glow.dom.NodeList#data");

t.test("Load DOM", function() {
	t.expect(1);
	t.stop();
	
	glow.ready(function() {
		t.ok(glow.isReady, "Document Ready");
		t.start();
	});
});

t.test("glow.dom.NodeList#data Setup", function() {
	t.expect(1);
	
	try {
		glow.dom.create('' +
			'<div id="dataTest">' +
				'<p id="para1">' +
					'<span id="span1">one</span>' +
				'</p>' +
				'<p id="para2">two</p>' +
				'<p id="para3">three</p>' +
			'</div>' +
		'').appendTo(document.body);
	}
	catch (e) {
	}
	
	t.equals(glow.dom.get("#para1").length, 1, "The created node is found.");
});

t.test("glow.dom.NodeList#data API", function() {
	t.expect(2);
	var dataTest = glow.dom.get("#dataTest");
	
	t.equals(typeof dataTest.data, "function", "A NodeList instance has a method named 'data'.");
	t.equals(typeof dataTest.removeData, "function", "A NodeList instance has a method named 'removeData'.");
});

t.test("glow.dom.NodeList#data method", function() {
	t.expect(7);
	
	var dataTest = glow.dom.get("#dataTest > p");
	var self = dataTest.data("color", "red");
	t.equals(dataTest.data("color"), "red", "Can set and get a key:val from NodeList.");
	t.ok((dataTest === self), "The call to set a key:val is chainable.");
	
	var data = dataTest.data();
	t.equals(data.color, "red", "Can get the entire data object from NodeList when given no arguments.");
	
	var para1 = glow.dom.get("#para1");
	t.equals(para1.data("color"), "red", "Can get the same data from different NodeLists that refer to the same DomElements.");

	self = dataTest.data({
		size: "grande",
		count: 8
	});
	t.equals(dataTest.data("size"), "grande", "Can set multiple key:vals at once.");
	t.equals(dataTest.data("count"), 8, "All the multiple key:vals are set.");
	t.ok((dataTest === self), "The call to multiple key:val is chainable.");

});

t.test("glow.dom.NodeList#removeData method", function() {
	t.expect(5);
	var dataTest = glow.dom.get("#dataTest p");
	
	var data = dataTest.data();
	t.equals(data.color, "red", "Data is already set on the NodeList.");
	dataTest.removeData("color");
	t.equals(data.color, undefined, "Can remove data by key name.");
	
	t.equals(data.size, "grande", "More data is already set on the NodeList.");
	
	var self = dataTest.removeData();
	data = dataTest.data();
	t.equals(data.size, undefined, "Can remove all data at once.");
	t.ok( (dataTest === self), "The call to removeData is chainable.");
});

t.test("glow.dom.NodeList#data Clone", function() {
	t.expect(3);
	
	var testData = glow.dom.get("#dataTest");
	testData.data("tea", "milky");
	
	testData.get("#span1").data("biscuits", 2);
	var testClone = testData.clone();
	t.equals(testClone.get("#span1").data("biscuits"), 2, "A cloned node has a copy of the data from the node it's based on.");
	
	t.equals(testClone.data("tea"), "milky", "A child node in a cloned node has the same data as the node it's based on.");

	testData.data("tea", "lemony");
	t.equals(testClone.data("tea"), "milky", "Changing the original data doesn't change the cloned data.");
	
});

t.test("glow.dom.NodeList#data Destroy", function() {
	t.expect(2);

	var testData = glow.dom.get("#dataTest");
	testData.data("tea", "milky");
	
	t.equals(testData.data("tea"), "milky", "Before being destroyed the node's data is defined.");
	testData.destroy();

	t.equals(testData.data("tea"), undefined, "After being destroyed the node's data is undefined.");
});

/*-----------------------------------------------------------------------------*/