
t.module("glow");

t.test("Basic requirements", function() {
	t.expect(1);
	t.ok(glow.isSupported, "glow.isSupported");
});

t.test("Simple DOM Ready testing", function() {
	t.expect(4);
	if (glow.isReady) { t.skip("DOM already ready"); }
	t.stop();

	var firstFired = false;

	glow.ready(function() {

		firstFired = true;
		t.ok(true, "glow.ready()");
		t.ok(glow.isReady, "Document should be ready now");
		glow.ready(function() {
			t.ok(true, "glow.ready() when document loaded");
		});
	});
	glow.ready(function() {
		t.ok(firstFired, "glow.ready() 2nd in queue");
		t.start();
	})
});

t.test("DOM Ready Blocking testing", function() {
	// we can assume the DOM is ready at this stage
	t.expect(7);
	var results = "";
	
	glow._addReadyBlock("test1");
	
	glow.ready(function() {
		results += "1";
	});
	glow.ready(function() {
		results += "2";
	});
	
	t.equals(results, "", "glow.ready correctly blocked");

	glow._removeReadyBlock("test1");
	
	t.equals(results, "12", "glow.ready queue run in order");
	
	glow.ready(function() {
		results += "3";
	});
	
	t.equals(results, "123", "glow.ready unblocked");
	
	glow._addReadyBlock("test2");
	glow._addReadyBlock("test3");
	
	glow.ready(function() {
		results += "4";
	});
	glow.ready(function() {
		results += "5";
	});
	
	t.equals(results, "123", "glow.ready blocked");
	
	glow._removeReadyBlock("test2");
	
	t.equals(results, "123", "glow.ready still blocked");
	
	glow._removeReadyBlock("test3");
	
	t.equals(results, "12345", "glow.ready queue run in order");
	
	glow.ready(function() {
		results += "6";
	});
	
	t.equals(results, "123456", "glow.ready unblocked");
});

t.test("DOM Ready nested blocking", function() {
	t.expect(4);
	
	var results = "";
	
	glow._addReadyBlock("test4");
	
	glow.ready(function() {
		results += "1";
		glow._addReadyBlock("test5");
		glow.ready(function() {
			results += "2";
		});
		glow._removeReadyBlock("test5");
	});
	
	t.equals(results, "", "glow.ready blocked");
	
	glow._removeReadyBlock("test4");
	
	t.equals(results, "12", "glow.ready unblocked & queue run");
	
	glow.ready(function() {
		results += "3"
	});
	
	t.equals(results, "123", "glow.ready unblocked");
	t.equals(glow.isReady, true, "glow.isReady");
	
});

t.test("DOM Ready split blocking", function() {
	t.expect(3);
	
	var results = "";
	
	glow._addReadyBlock("test6");
	
	glow.ready(function() {
		results += "1";
		glow._addReadyBlock("test7");
		glow.ready(function() {
			results += "2";
		});
	});
	
	t.equals(results, "", "glow.ready blocked");
	
	glow._removeReadyBlock("test6");
	
	t.equals(results, "1", "glow.ready unblocked & queue run");
	
	glow._removeReadyBlock("test7");
	
	t.equals(results, "12", "glow.ready unblocked & queue run");
});

t.test("Module Pattern", function () {
	t.expect(4);

	glow.module({
		name: "glow.testModule1",
		library: ["glow", glow.VERSION],
		depends: [],
		builder: function(glow) {
			t.ok(true, "implemenation runs");
			glow.testModule1 = {
				blah: 10
			};
		}
	});

	t.equals(glow.testModule1.blah, 10, 'return value is added to module namespace');

	var dependencyError;

	// dependency checking
	try {
		glow.module({
			name: "glow.testModule2",
			library: ["glow", glow.VERSION],
			depends: [["glow", glow.VERSION, "glow.testModule3"]],
			builder: function(glow) {
				t.ok(false, 'testModule2(1) builder function avoided');
			}
		});
	}
	catch (e) {
		dependencyError = e;
	}
	t.ok(dependencyError, 'dependency error caught');

	dependencyError = null;

	// multiple dependency checking
	try {
		glow.module({
			name: "glow.testModule2",
			library: ["glow", glow.VERSION],
			depends: [["glow", glow.VERSION, "glow.testModule1", "glow.testModule3", "glow.testModule4"]],
			builder: function(glow) {
				t.ok(false, 'testModule2(2) builder function avoided');
			}
		});
	}
	catch (e) {
		dependencyError = e;
	}
	t.ok(dependencyError, 'multiple dependency error caught');
});

t.test("glow.env", function() {
	t.expect(2);
	var found = false;
	if (glow.env.gecko) {
		t.ok(typeof glow.env.gecko == "number", "Gecko detected: " + glow.env.gecko);
		found = true;
	}
	if (glow.env.ie) {
		t.ok(typeof glow.env.ie == "number", "IE detected: " + glow.env.ie);
		found = true;
	}
	if (glow.env.opera) {
		t.ok(typeof glow.env.opera == "number", "Opera detected: " + glow.env.opera);
		found = true;
	}
	if (glow.env.webkit) {
		t.ok(typeof glow.env.webkit == "number", "Webkit detected: " + glow.env.webkit);
		found = true;
	}
	if (glow.env.khtml) {
		t.ok(typeof glow.env.khtml == "number", "KHTML detected: " + glow.env.khtml);
		found = true;
	}
	if (!found) {
		t.ok(false, "Browser unknown");
	}
	t.ok(glow.env.version && typeof glow.env.version == "string", "Version populated: '" + glow.env.version + "'");
})

t.module("glow.lang");

t.test("glow.lang.trim()", function() {
	t.expect(6);

	t.equals(glow.lang.trim("    Hello World"), "Hello World", "Leading");
	t.equals(glow.lang.trim("Hello World "), "Hello World", "Trailing");
	t.equals(glow.lang.trim("  Hello World  "), "Hello World", "Leading and trailing");
	t.equals(glow.lang.trim("	\tHello World		"), "Hello World", "Leading and trailing tabs");
	t.equals(glow.lang.trim("\n\nHello World\n"), "Hello World", "Leading and trailing new lines");
	t.equals(glow.lang.trim("\n	\t\nHello World\n\t	\n"), "Hello World", "Leading and trailing pick'n'mix");
});

t.test("glow.lang.toArray()", function() {
	t.expect(5);

	var myArray = ["Hello", "world"];
	t.ok(myArray === glow.lang.toArray(myArray), "Should simply pass back a normal array (optimisation)");

	(function() {
		t.ok(glow.lang.toArray(arguments).push, "Converts arguments to proper array");
		t.isSet(glow.lang.toArray(arguments), arguments, "Has same values at same indexes");
	})("hello", "world");

	t.ok(glow.lang.toArray(document.getElementsByTagName("html")).push, "Converts nodelist to proper array");
	t.isSet(glow.lang.toArray(document.getElementsByTagName("html")), document.getElementsByTagName("html"), "Has same values at same indexes");
});

t.test("glow.lang.apply()", function() {
	t.expect(1);
	t.isObj(glow.lang.apply({foo: "hello", bar: "world"}, {bar: "everyone"}), {foo: "hello", bar: "everyone"}, "Quick test");
});

t.test("glow.lang.interpolate()", function() {
	t.expect(13);

	t.equals(
		glow.lang.interpolate("Hello {people}. Foo {bar}. Thankyou, {goodnight}", {people: "world", bar: "foo", notused: "garg!"}),
		"Hello world. Foo foo. Thankyou, {goodnight}",
		"Standard test"
	);

	t.equals(
		glow.lang.interpolate("{john} \"{paul}\" {george} {ringo}", {john: false, paul: "", george: 0, ringo: NaN}),
		"false \"\" 0 NaN",
		"Works with defined falseish values"
	);

	t.equals(
		glow.lang.interpolate("My cat's name is {name}. His colours are {colours.0} & {colours.1}. His mum is {family.mum}, his dad is {family.dad} and he has {family.siblings.length} brothers or sisters.", {name: "Domino", colours: ["black", "white"], family:{mum: "Spot", dad: "Patch", siblings: []}}),
		"My cat's name is Domino. His colours are black & white. His mum is Spot, his dad is Patch and he has 0 brothers or sisters.",
		"The documentation example"
	);

	t.equals(
		glow.lang.interpolate("Hello {subject}. Where is {subject}?", {subject: "everyone"}),
		"Hello everyone. Where is everyone?",
		"Matches globally"
	);

	t.equals(
		glow.lang.interpolate("Hello {1}. Where is {2}?", {"1": "everyone", "2": "Peter"}),
		"Hello everyone. Where is Peter?",
		"Works with numbered keys"
	);

	t.equals(
		glow.lang.interpolate("Hello {my.friends}. Where is {something-else}? This is {b^o$r()i[n].g}", {"my.fri.nds": "ERROR", "my.friends": "everyone", "something-else": "Peter", "b^o$r()i[n].g": "working"}),
		"Hello everyone. Where is Peter? This is working",
		"Works with regex chars and flattened data"
	);

	t.equals(
		glow.lang.interpolate("Hello {0}. Where is {1}? ({length})", ["peeps", "Paul"]),
		"Hello peeps. Where is Paul? (2)",
		"Works with arrays at the base"
	);

	t.equals(
		glow.lang.interpolate("{foo.foo} is {bar.bar.bar}, but not {foo.bar}. Nevermind {foo} or {nope}", {foo: {foo: "FFOO", toString: function() {return "[oFoo]"}}, bar: {bar: {bar: "BBBAR"}}}),
		"FFOO is BBBAR, but not {foo.bar}. Nevermind [oFoo] or {nope}",
		"Nested objects"
	);

	t.equals(
		glow.lang.interpolate("{peter.0} likes {paul.paul.0} and {mary.0.mary}. Not {peter.1} or {mary.1.mary}. Paul has {paul.paul.length} friends.", {peter: ["Peter"], paul: {paul: ["Paul","Puff","Magic","Dragon"]}, mary: [{mary: "Mary"}]}),
		"Peter likes Paul and Mary. Not {peter.1} or {mary.1.mary}. Paul has 4 friends.",
		"Nested arrays"
	);

	t.equals(
		glow.lang.interpolate("{foo} is {bar}, but <foo> is <bar>", {foo: "FOO", bar: "BAR"}, {delimiter: "<>"}),
		"{foo} is {bar}, but FOO is BAR",
		"Works with alternate delimiter pair"
	);

	t.equals(
		glow.lang.interpolate("{foo} is {bar}, but [foo] is [bar]", {foo: "FOO", bar: "BAR"}, {delimiter: "[]"}),
		"{foo} is {bar}, but FOO is BAR",
		"Works with alternate delimiter pair (regex chars)"
	);

	t.equals(
		glow.lang.interpolate("{foo} is {bar}, but %foo% is %bar%", {foo: "FOO", bar: "BAR"}, {delimiter: "%"}),
		"{foo} is {bar}, but FOO is BAR",
		"Works with alternate single delimiter"
	);

	t.equals(
		glow.lang.interpolate("{foo} is {bar}, but $foo$ is $bar$", {foo: "FOO", bar: "BAR"}, {delimiter: "$"}),
		"{foo} is {bar}, but FOO is BAR",
		"Works with alternate single delimiter (regex char)"
	);
});


t.test("glow.lang.replace()", function () {
	t.expect(5);

	t.equals(glow.lang.replace("foo bar baz", "bar", "blah"), "foo blah baz", "replace string with string");

	t.equals(glow.lang.replace("foo bar baz", /bar/, "blah"), "foo blah baz", "respace regex with string");

	t.equals(
		glow.lang.replace("foo bar bar baz", "bar", function (search, idx, str) {
			return "blah " + search + " " + idx + " " + str;
		}),
		"foo blah bar 4 foo bar bar baz bar baz",
		"replace string with function"
	);

	t.equals(
		glow.lang.replace("foo bar bar baz", /(bar)/, function (word) { return "blah " + word; }, true),
		"foo blah bar bar baz",
		"replace non-global regex with function"
	);

	t.equals(
		glow.lang.replace("foo bar bar baz", /(bar)/g, function (word) { return "blah" + word; }),
		"foo blahbar blahbar baz",
		"replace global regex with function"
	);
});


t.test("glow.lang.hasOwnProperty()", function() {
	t.expect(8);
	var MyClass = function() { //assigning like this makes obj.constructor wrong in Safari 1.3
		this.a = 10;
	}
	MyClass.prototype.x = 100;
	MyClass.prototype.y = 200;
	MyClass.prototype.z = "test";
	MyClass.prototype.p = undefined;
	var inst = new MyClass();
	inst.y = 100;
	inst.b = "hello";
	inst.z = "test";
	inst.q = undefined;
	inst.p = undefined;

	t.equals(glow.lang.hasOwnProperty(inst, "b"), true, "Property from object");
	t.equals(glow.lang.hasOwnProperty(inst, "a"), true, "Property from constructor");
	t.equals(glow.lang.hasOwnProperty(inst, "x"), false, "Property from prototype");
	t.equals(glow.lang.hasOwnProperty(inst, "y"), true, "Property from prototype overridden");
	t.equals(glow.lang.hasOwnProperty(inst, "z"), true, "Property from prototype overridden with same val");
	t.equals(glow.lang.hasOwnProperty(inst, "madeup"), false, "Undefined property");
	t.equals(glow.lang.hasOwnProperty(inst, "q"), true, "Property set as undefined");
	t.equals(glow.lang.hasOwnProperty(inst, "p"), true, "Property set as undefined, with prototype also undefined");
});

t.test("glow.lang.map()", function() {
	t.expect(14);

	var test1 = ["hello", "world", 2, 4, 6];

	var count = 0;

	var r = glow.lang.map(test1, function(item, i, arr) {
		if (i == 0) {
			t.ok(arr == test1, "Original array passed in");
			t.ok(this == test1, "Array is 'this'");
		}
		t.equals(count, i, "Index passed in");
		t.equals(test1[count], item, "Item correctly set")

		count++;

		return "a" + i;
	});

	t.isSet(r, ["a0", "a1", "a2", "a3", "a4"], "Array mapped");

	glow.lang.map(test1, function(item, i, arr) {
		if (i == 0) {
			t.equals(this, "test", "'this' can be user set");
		}
	}, "test");
})

t.test("glow.lang.extend()", function() {
	t.expect(12);

	t.ok(glow.lang.extend instanceof Function, "is function");

	var BaseClass = function() {
		this.a = "From Base";
		this.b = "From Base";
	}
	BaseClass.prototype = {
		c: function() {
			return "From Base";
		},
		d: function() {
			return "From Base";
		}
	};
	var SubClass = function() {
		BaseClass.call(this);
		this.b = "From Sub";
		this.e = "From Sub";
	}
	glow.lang.extend(SubClass, BaseClass, {
		d: function() {
			return "From Sub";
		},
		f: function() {
			return "From Sub";
		}
	});

	var myBase = new BaseClass();
	var mySub = new SubClass();

	t.equals(myBase.a, "From Base", "Base a prop");
	t.equals(myBase.b, "From Base", "Base b prop");
	t.equals(myBase.c(), "From Base", "Base c function");
	t.equals(myBase.d(), "From Base", "Base d function");
	t.equals(mySub.a, "From Base", "Sub a prop (inherited)");
	t.equals(mySub.b, "From Sub", "Sub b prop (overwritten)");
	t.equals(mySub.c(), "From Base", "Sub c function (inherited)");
	t.equals(mySub.d(), "From Sub", "Sub d function (overwritten)");
	t.equals(mySub.e, "From Sub", "Sub e prop (new)");
	t.equals(mySub.f(), "From Sub", "Sub f function (new)");
	t.equals(SubClass.base, BaseClass, "sub.base property set");


})

t.test("glow.lang.clone()", function() {
	t.expect(4);

	var testObject = { hello: "world" };

	var clonedObject = glow.lang.clone( testObject );

	t.equals( clonedObject.hello, "world", "clonedObject.hello property should read world");
	t.equals( testObject.hello, "world", "testObject.hello property should read world");

	clonedObject.hello = "space";

	t.equals( clonedObject.hello, "space", "clonedObject.hello property should now read space");
	t.equals( testObject.hello, "world", "testObject.hello property should still read world");

})


