t.module("glow.embed Flash embedding");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("Test Embedding", function() {

	t.expect(6);
	
	var $ = glow.dom.get;
	
	var flashHolder = glow.dom.create('<div id="flashTest"></div>').appendTo("body");
	
	var embed_tag = glow.env.ie ? "object" : "embed";
	
	// see, nothing up my sleeve...	
	t.ok($("#flashTest " + embed_tag).length==0,"no embed element exists");

	try {
		var movie = new glow.embed.Flash("makebeleive.swf","#flashTest","9");
		t.ok($("#flashTest " + embed_tag).length==0,"we have no errors, but still no embed tag");
		t.ok(movie.container instanceof glow.dom.NodeList, "Container is nodelist");
		t.ok(movie.container[0].id == "flashTest", "Container is correct");
	}
	catch(e){
		t.ok(false,"Error creating glow.embed.Flash: " + e.toString());
	}

	movie.embed();
	
	if (!movie.movie) {
	  t.skip("Flash 9 or greater required");
	}
	
	t.ok(movie.movie.nodeName.toLowerCase() == embed_tag, "Movie property references Flash")

	
	t.ok($("#flashTest " + embed_tag).length==1,"after call to embed, we have an embedded object");
	
	flashHolder.remove();
});

t.test("Test Flash fails without required parameters", function() {

	t.expect(3);
	
	var $ = glow.dom.get;
	var flashHolder = glow.dom.create('<div id="flashTest"></div>').appendTo("body");
	
	var embed_tag = glow.env.ie ? "object" : "embed";

	try {
		var movie = new glow.embed.Flash();
		t.ok(false,"should get an error if we call create Flash with no parameters");
	}
	catch(e){
		t.ok(true,"calling Flash with no parameters " + e.message);
	}

	try {
		var movie = new glow.embed.Flash("anyold.swf");
		t.ok(false,"should get an error if we call create Flash missing required parameters");
	}
	catch(e){
		t.ok(true,"calling Flash with missing required parameters " + e.message);
	}

	try {
		var movie = new glow.embed.Flash("anyold.swf","#flashTest");
		t.ok(false,"should get an error if we call create Flash missing required parameters");
	}
	catch(e){
		t.ok(true,"calling Flash with missing required parameters " + e.message);
	}
	
	flashHolder.remove();
});

t.test("check version checking", function() {

	t.expect(4);
	var flashHolder = glow.dom.create('<div id="flashTest"></div>').appendTo("body");

	
	try {
		new glow.embed.Flash("anyold.swf","#flashTest","99").embed();
		t.ok(glow.dom.get("#flashTest")[0].innerHTML.match(/This content requires Flash Player version 99/) != null,"Default Error message is displayed");
	}
	catch(e){
		t.ok(false,"shouldn't get an error, just error message in GUI " + e.message);
	}

	try {
		new glow.embed.Flash("anyold.swf","#flashTest","99",{message:"Please install the latest version of FLASH"}).embed();
		t.ok(glow.dom.get("#flashTest")[0].innerHTML == "Please install the latest version of FLASH","Custom Error message is displayed");
	}
	catch(e){
		t.ok(false,"shouldn't get an error, just error message in GUI " + e.message);
	}

	try {
		new glow.embed.Flash("anyold.swf","#flashTest","99",{message:function(){return "a custom message"}}).embed();
		t.ok(glow.dom.get("#flashTest")[0].innerHTML == "a custom message","Custom Error message from function is displayed");
	}
	catch(e){
		t.ok(false,"shouldn't get an error, just error message in GUI " + e.message);
	}

	try {

		new glow.embed.Flash("anyold.swf","#flashTest","99 0").embed();
		t.ok(false,"invalid version format, should throw an error");
	}
	catch(e){
		t.ok(true, e.message);
	}
	flashHolder.remove();

});

t.test("check that supplied attributes are set correctly", function() {

	t.expect(5);
	var $ = glow.dom.get;
	var flashHolder = glow.dom.create('<div id="flashTest"></div>').appendTo("body");

	var embed_tag = glow.env.ie ? "object" : "embed";
	
	new glow.embed.Flash("anyold.swf","#flashTest","6",{
	  attributes: {
		id:"testFlash",
		name:"gwor",
		blat:"gret"
	  },
	  params:{
		wmode:"transparent",
		FlashVars: {hello:"world",foo:"bar"}
	  }
	}).embed();
	t.ok($("#testFlash")[0].tagName.toLowerCase() == embed_tag,"set id");
	t.ok($("#testFlash")[0].getAttribute("name") == "gwor","set name");
	t.ok($("#testFlash")[0].getAttribute("blat") == "gret","set arbitrary attribute");
	//wmode test
	if (glow.env.ie) {
	  t.ok($("#testFlash").children().filter(function() { return this.name == "wmode" }).attr("value") == "transparent", "transparent wmode set (param)")
	} else {
	  t.ok($("#testFlash")[0].getAttribute("wmode") == "transparent", "transparent wmode set (attr)");
	}
		//flashvars test
		if (glow.env.ie) {
		  t.equals($("#testFlash").children().filter(function() { return this.name == "FlashVars" }).attr("value"), "hello=world&foo=bar", "flashvars (param)")
		} else {
		  t.equals($("#testFlash")[0].getAttribute("FlashVars"), "hello=world&foo=bar", "flashvars (attr)");
		}
	flashHolder.remove();

});

t.test("Shortcut attribute setting", function() {
  t.expect(2);
  var $ = glow.dom.get;
  var flashHolder = glow.dom.create('<div id="flashTest"></div>').appendTo("body");
  
  var myFlash = new glow.embed.Flash("anyold.swf","#flashTest","6",{
	id: "newIdValue",
	className: "someClassName"
  }).embed();
  
  t.equals(myFlash.movie.id, "newIdValue", "ID");
  t.equals(myFlash.movie.className, "someClassName", "className");

  flashHolder.remove();
});

t.test("check correct defaults for missing parameters", function() {

	t.expect(3);
	var flashHolder = glow.dom.create('<div id="flashTest"></div>').appendTo("body");

	var embed_tag = glow.env.ie ? "object" : "embed";
	var $ = glow.dom.get;

	new glow.embed.Flash("anyold.swf","#flashTest","6").embed();
	var embed = $("#flashTest " + embed_tag)[0];
	
	try {
		//not using getAttribute for the first two as some browsers give empty strings while others give null
		t.ok(embed.id != "","Movie has auto-generated ID");
		t.ok(embed.name == "","no name by default");
		if (glow.env.ie) {
		  t.ok($(embed).children().filter(function() { return this.name == "allowscriptaccess" }).attr("value") == "always", "allowscriptaccess:always");
		} else {
		  t.ok(embed.getAttribute("allowscriptaccess") == "always","allowscriptaccess:always");
		}
	}
	catch (e){
		t.ok(false,"glow didn't find embed tag");
	}
	flashHolder.remove();

});
