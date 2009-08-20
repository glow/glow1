t.module("glow.forms");

t.test("Load DOM", function() {
  t.expect(1);
  t.stop();
  glow.ready(function() {
    t.ok(glow.isReady, "Document Ready");
    t.start();
  });
});

t.test("Set up", function() {
	//how many asserts you're expecting
	t.expect(1);
	
	try {
		window.testForm = glow.dom.create('<div>\
			<p id="formTestOutput" style="border: solid 2px gray; padding: 8px; float: right; width: 40%;"></p> \
			<form id="register" action="" method="get"> \
			<fieldset><legend>test form</legend><br />\
			<label for="username">username:</label> <input name="username" id="username" type="text" value="" /><br />\
			<label for="age">age:</label> <input name="age" id="age" type="text" value="" /><br />\
			<label for="email">email:</label> <input name="email" id="email" type="text" value="" /><br />\
			<label for="email_confirm">email confirm:</label> <input name="email_confirm" id="email_confirm" type="text" value="" /><br />\
			<label for="format">format:</label> <input name="format" type="radio" value="text" /> text  <input name="format" type="radio" value="html" /> html<br />\
			<label for="format">announce:</label> <input name="announce" id="news" type="checkbox" value="news" checked="checked" /> news <input name="announce" id="news" type="checkbox" value="deals" checked="checked" /> deals <input name="announce" id="news" type="checkbox" value="alerts" checked="checked" /> alerts <br />\
			<label for="friend1">friend:</label> <input id="friend1" name="friend" id="age" type="text" value="one" /><br />\
			<label for="friend2">friend:</label> <input id="friend2" name="friend" id="age" type="text" value="two" /><br />\
			<label for="about">about yourself:</label><br /><textarea id="about" name="about"></textarea><br />\
			<input type="reset"><input type="submit"> \
			</fieldset> \
			</form> \
		</div>');
		
		testForm.appendTo("body");
		
		var myFormElem = glow.dom.get("#register");
	}
	catch(e){/*ignored*/}
	
	 t.ok(myFormElem, "A test form was created.");
});

function resetFormsTestElement() {
	var myFormElem = glow.dom.get("#register");
	var myFormElemClone = myFormElem.clone();
	myFormElem.parent().empty().append(myFormElemClone);
}

t.test("glow.forms.Form", function() {
	//how many asserts you're expecting
	t.expect(3);
	
	 t.ok(glow.forms, "Forms module exists");
	 t.equals(typeof glow.forms.Form, "function", "glow.forms.Form is a function.");
	
	var myFormElem = glow.dom.get("#register");
	
	try {
		var myForm = new glow.forms.Form(myFormElem);
	}
	catch(e){/*ignored*/}
	
	 t.ok(myForm, "A new form instance can be created.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});


t.test("glow.forms.Form#addTests", function() {
	t.expect(4);
	
	var myFormElem = glow.dom.get("#register");
	var myForm = new glow.forms.Form(myFormElem);
	
	 t.equals(typeof myForm.addTests, "function", "glow.forms.Form#addTests is a function.");
	
	try {
		myForm
		.addTests(
			"username",
			["required"]
		)
		.addTests(
			"age",
			["required"],
			["isNumber"]
		);
	}
	catch(e){/*ignored*/}
	
	 t.equals(myForm._fields.length, 2, "Fields can be added to the form.");
	 t.equals(myForm._fields[0].name, "username", "Field has a name.");
	 t.equals(myForm._fields[1]._tests.length, 2, "Tests can be added to the field.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.Form#validate", function() {
	t.expect(3);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;

	try {
		var myForm = new glow.forms.Form(myFormElem);
		glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	}
	catch(e){/*ignored*/}
	
	 t.equals(typeof myForm.validate, "function", "glow.forms.Form#validate is a function.");
	
	myForm
	.addTests(
		"username",
		["required"]
	)
	.addTests(
		"age",
		["required"],
		["isNumber"]
	);
	
	try {
		myForm.validate('submit');
	}
	catch(e){/*ignored*/}
	
	 t.ok(validateResults, "Results are passed to the validate function set in the opts object.");
	 t.equals(validateResults.fields.length, 2, "Results has fields for each test added.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms events", function() {
	t.expect(5);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });

	myForm
	.addTests(
		"username",
		["required"]
	)
	.addTests(
		"age",
		["required", {on: "change"}]
	);
	
	 t.equals(validateResults, undefined, "Initially validateResults is undefined.");
	
	var didSubmit = false
	glow.events.addListener(myFormElem, "submit", function(){ didSubmit = true; return false; });
	glow.events.fire(myFormElem[0], "submit");
	
	 t.equals(didSubmit, true, "The test form was submitted.");
	 t.ok(validateResults, "Once submitted validateResults is defined.");
	 t.equals(validateResults.fields[0].name, "username", "The validateResults has a result for the test tied to the 'submit' event.");
	 t.equals(validateResults.fields.length, 1, "The validateResults has no result for the test tied to the 'change' event.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms conditional tests", function() {
	t.expect(3);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	myForm.formNode.val({email: ""});
	myForm
	.addTests(
		"email",
		["required"]
	)
	.addTests(
		"format",
		["required", {field: "email"}],
		["required"]
	);
	
	myForm.validate('submit');
	
	 t.equals(validateResults.errorCount, 1, "When a conditional test fails the next test does not fail.");
	 t.equals(validateResults.fields[0].result, glow.forms.FAIL, "Other field failed.");
	 t.equals(validateResults.fields[1].result, glow.forms.SKIP, "This field skipped.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.required", function() {
	t.expect(4);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.required, "function", "glow.forms.tests.require is a function.");
	
	myForm
	.addTests(
		"username",
		["required"]
	)
	.addTests(
		"age",
		["required"]
	)
	.addTests(
		"email",
		["required"]
	);
	
	myForm.formNode.val({
		username: "",
		age: " ",
		email: " x"
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.FAIL, "Required fails on an empty value.");
	 t.equals(validateResults.fields[1].result, glow.forms.FAIL, "Required fails on a spaces-only value.");
	 t.equals(validateResults.fields[2].result, glow.forms.PASS, "Required passes on a value with non-space character.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.isNumber", function() {
	t.expect(5);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.isNumber, "function", "glow.forms.tests.isNumber is a function.");
	
	myForm
	.addTests(
		"username",
		["isNumber"]
	)
	.addTests(
		"age",
		["isNumber"]
	)
	.addTests(
		"email",
		["isNumber"]
	)
	.addTests(
		"email_confirm",
		["isNumber"]
	);
	
	myForm.formNode.val({
		username: "",
		age: "1..23",
		email: ".",
		email_confirm: "-01.20"
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.FAIL, "isNumber fails on an empty value.");
	 t.equals(validateResults.fields[1].result, glow.forms.FAIL, "isNumber fails on a malformed number.");
	 t.equals(validateResults.fields[2].result, glow.forms.FAIL, "isNumber fails on a dot.");
	 t.equals(validateResults.fields[3].result, glow.forms.PASS, "isNumber passes on a valid number.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.min and max", function() {
	t.expect(5);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.range, "function", "glow.forms.tests.range is a function.");
	
	myForm
	.addTests(
		"username",
		["min", {arg: "0"}]
	)
	.addTests(
		"username",
		["max", {arg: "0"}]
	)
	.addTests(
		"age",
		["min", {arg: "0"}]
	)
	.addTests(
		"age",
		["max", {arg: "1"}]
	);
	
	myForm.formNode.val({
		username: "0",
		age: ".5",
		email: "0",
		email_confirm: "0" 
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.PASS, "min n == value n should pass.");
	 t.equals(validateResults.fields[1].result, glow.forms.PASS, "max n == value n should pass.");
	 t.equals(validateResults.fields[2].result, glow.forms.PASS, "min n < value n should pass.");
	 t.equals(validateResults.fields[3].result, glow.forms.PASS, "max n > value n should pass.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});


t.test("glow.forms.tests.range", function() {
	t.expect(6);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.range, "function", "glow.forms.tests.range is a function.");
	
	myForm
	.addTests(
		"username",
		["range", {arg: "0..0"}]
	)
	.addTests(
		"age",
		["range", {arg: "1..0"}]
	)
	.addTests(
		"email",
		["range", {arg: "-1..1"}]
	)
	.addTests(
		"email_confirm",
		["range", {arg: "0.0..1.5"}]
	).addTests(
		"about",
		["range", {arg: "11..100"}]
	);
	
	myForm.formNode.val({
		username: "0",
		age: "0",
		email: "0",
		email_confirm: "0",		about: "50" 
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.PASS, "range from n to n should pass.");
	 t.equals(validateResults.fields[1].result, glow.forms.PASS, "range from n to n-1 should pass.");
	 t.equals(validateResults.fields[2].result, glow.forms.PASS, "range from -n to n+2 should pass.");
	 t.equals(validateResults.fields[3].result, glow.forms.PASS, "range from n.n to n.n should pass.");
	 t.equals(validateResults.fields[4].result, glow.forms.PASS, "min and max should be compared as numbers not strings.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.count", function() {
	t.expect(4);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.count, "function", "glow.forms.tests.count is a function.");
	
	myForm
	.addTests(
		"username",
		["count", {arg: 1}]
	)
	.addTests(
		"announce",
		["count", {arg: 3}]
	)
	.addTests(
		"announce",
		["count", {arg: 1}]
	);
	
	myForm.formNode.val({
		username: ""
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.FAIL, "count fails to match 1 when text input is empty.");
	 t.equals(validateResults.fields[1].result, glow.forms.PASS, "count passes when test matches checked boxes.");
	 t.equals(validateResults.fields[2].result, glow.forms.FAIL, "count fails when test matches checked boxes.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});


t.test("glow.forms.tests.regex", function() {
	t.expect(3);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.regex, "function", "glow.forms.tests.regex is a function.");
	
	myForm
	.addTests(
		"username",
		["regex", {arg: /^[abc]+$/}]
	)
	.addTests(
		"age",
		["regex", {arg: '^[abc]+$'}]
	);
	
	myForm.formNode.val({
		username: "banana",
		age: "baabaa"
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.FAIL, "regex fails when test doesn't match.");
	 t.equals(validateResults.fields[1].result, glow.forms.PASS, "regex passes when test does match.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.minLen", function() {
	t.expect(4);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.minLen, "function", "glow.forms.tests.minLen is a function.");
	
	myForm
	.addTests(
		"username",
		["minLen", {arg: 3}]
	)
	.addTests(
		"age",
		["minLen", {arg: 3}]
	)
	.addTests(
		"email",
		["minLen", {arg: 3}]
	);
	
	myForm.formNode.val({
		username: "a",
		age: "abc",
		email: "abcd"
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.FAIL, "minLen fails when value is too short.");
	 t.equals(validateResults.fields[1].result, glow.forms.PASS, "minLen passes when value is the same as the minimum.");
	 t.equals(validateResults.fields[1].result, glow.forms.PASS, "minLen passes when value is less than the minimum.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.maxLen", function() {
	t.expect(4);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.maxLen, "function", "glow.forms.tests.maxLen is a function.");
	
	myForm
	.addTests(
		"username",
		["maxLen", {arg: 0}]
	)
	.addTests(
		"age",
		["maxLen", {arg: 3}]
	)
	.addTests(
		"email",
		["maxLen", {arg: 3}]
	);
	
	myForm.formNode.val({
		username: "abc",
		age: "abc",
		email: "ab"
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.FAIL, "maxLen fails when value is too long.");
	 t.equals(validateResults.fields[1].result, glow.forms.PASS, "maxLen passes when value is the same as the maximum.");
	 t.equals(validateResults.fields[1].result, glow.forms.PASS, "maxLen passes when value is less than the maximum.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.isEmail", function() {
	t.expect(5);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.isEmail, "function", "glow.forms.tests.isEmail is a function.");
	
	myForm
	.addTests(
		"username",
		["isEmail"]
	)
	.addTests(
		"age",
		["isEmail"]
	)
	.addTests(
		"email",
		["isEmail"]
	)
	.addTests(
		"email_confirm",
		["isEmail"]
	);
	
	myForm.formNode.val({
		username: "1abc-123@abc.a1-b2.xyz.co.uk",
		age: "abc@abc@.com",
		email: "abc123",
		email_confirm: " abc123@abc.com "
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.PASS, "isEmail passes when value is valid email.");
	 t.equals(validateResults.fields[1].result, glow.forms.FAIL, "isEmail fails when value is almost a valid email.");
	 t.equals(validateResults.fields[2].result, glow.forms.FAIL, "isEmail fails when value is not a valid email.");
	 t.equals(validateResults.fields[3].result, glow.forms.PASS, "isEmail passes when value is a valid email, but has whitespace padding.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.sameAs", function() {
	t.expect(4);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.sameAs, "function", "glow.forms.tests.sameAs is a function.");
	
	myForm
	.addTests(
		"username",
		["sameAs", {arg: "email"}]
	)
	.addTests(
		"email_confirm",
		["sameAs", {arg: "email"}]
	)
	.addTests(
		"email_confirm",
		["sameAs", {arg: "email_confirm"}]
	);
	
	myForm.formNode.val({
		username: "bert",
		email: "bert@sesame.org",
		email_confirm: "bert@sesame.org"
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.FAIL, "sameAs fails when value are not the same.");
	 t.equals(validateResults.fields[1].result, glow.forms.PASS, "sameAs passes when value are the same.");
	 t.equals(validateResults.fields[2].result, glow.forms.PASS, "sameAs passes when test is same as the field.");

	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.custom", function() {
	t.expect(3);
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	glow.events.addListener(myForm, "validate", function(results){validateResults = results; return false; });
	
	 t.equals(typeof glow.forms.tests.custom, "function", "glow.forms.tests.custom is a function.");
	
	var myTest = function (values, opts, callback, formValues) {
		var message = opts.message || "The value 'Fail' is not allowed.";
		
		for (var i = 0, len = values.length; i < len; i++) {
			if (values[i] == "Fail") {
				callback(glow.forms.FAIL, message);
				return;
			}
		}
		callback(glow.forms.PASS, message);
	}
	
	myForm
	.addTests(
		"username",
		["custom", { arg: myTest }]
	)
	.addTests(
		"age",
		["custom", { arg: myTest }]
	);
	
	myForm.formNode.val({
		username: "Fred",
		age: "Fail"
	});
	
	myForm.validate('submit');
	
	 t.equals(validateResults.fields[0].result, glow.forms.PASS, "custom passes when value is valid.");
	 t.equals(validateResults.fields[1].result, glow.forms.FAIL, "custom fails when value is not valid.");
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("glow.forms.tests.ajax", function() {
	t.expect(2);
	t.stop();
	
	var myFormElem = glow.dom.get("#register");
	
	var validateResults;
	
	var myForm = new glow.forms.Form(myFormElem);
	
	myForm.formNode.val({
		username: "AJ Acks",
		age: "99"
	});
	
	glow.events.addListener(myForm, "validate", function(results) {
		 t.equals(results.fields[0].result, glow.forms.PASS, "ajax passes when url returns a value.");
		
		//clean up
		resetFormsTestElement();
		//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
		t.start();
	});
	
	 t.equals(typeof glow.forms.tests.ajax, "function", "glow.forms.tests.ajax is a function.");
	
	var handleResponseText = function(/**glow.net.Response*/response) {
		if (response.text() == "XHR Test Document") {
			return glow.forms.PASS;
		}
		else {
			return glow.forms.FAIL;
		}
	}

	myForm
	.addTests(
		"username",
		["ajax", {arg: handleResponseText, url: "testdata/xhr/basictext.txt?name={username}&age={age}&pals={friend}"}]
	);
	
	myForm.validate('submit');
});

t.test("glow.forms manual tests", function() {
	var $ = glow.dom.get;
	var writer = {
		log: function (outputArea) {
			return function(msg) {
				outputArea.html(outputArea.html()+"<div style='padding: 4px; border-bottom: solid 1px #ccc;'>"+msg+"<"+"/div>");
			}
		}($("#formTestOutput"))
		,
		clear: function (outputArea) {
			return function(msg) {
				outputArea.html("");
				glow.anim.css(outputArea, 1, {
				  'border-color': {to: '#ff3333'}
				},
				{
					tween: glow.tweens.elasticIn()
				}).start();
			}
		}($("#formTestOutput"))
	};
	
	var myFormElem = $("#register");
	var myForm = new glow.forms.Form(myFormElem);

	myForm
	.addTests(
		"username",
		["required"]
	)
	.addTests(
		"age",
		["isNumber", {on: "submit change idle", delay: "3000"}],
		["range", {arg: "18..60", on: "idle", delay: "2000"}]
	)
	.addTests(
		"email",
		["required"],
		["isEmail", {on: "submit change"}]
	)
	.addTests(
		"email_confirm",
		["required", {field: "email"}],
		["sameAs", {arg: "email"}]
	)
	.addTests(
		"format",
		["required", {field: "email", on: "submit click", message: "Email address is required."}],
		["required"]
	)
	.addTests(
		"announce",
		["required", {field: "email", on: "submit change", message: "Email address is required to receive announcements."}],
		["minCount", {arg: 2, on: "submit change"}]
	)
	.addTests(
		"friend",
		["required"]
	)
	.addTests(
		"about",
		["custom", {on: "idle", arg: function(values, opts, callback) {
			if (values[0].split(" ").length > 10) callback(glow.forms.FAIL, "10 words or less please.");
			else callback(glow.forms.PASS, "");
		}}]
	)
	;

	glow.events.addListener(
		myForm,
		"validate",
		function(results) {
			writer.clear();
			writer.log("<div> event: "+results.eventName+"<"+"/div>");
			writer.log("> form: "+glow.data.encodeUrl(results.form.formNode.val()));
			writer.log(results.errorCount+" errors found.");
			//writer.log("results.fields.length "+results.fields.length);
			
			var resultNames = ["SKIP", "FAIL", "PASS"];
			for (var i = 0; i < results.fields.length; i++) {
				var field = results.fields[i];
				writer.log(((field.result)?'&radic;':'x')+" <b>"+field.name+"<"+"/b>, "+resultNames[1+field.result]+", '"+field.message+"'");
			}
			return (results.errorCount === 0);
		}
	);
	
	//clean up
	resetFormsTestElement();
	//myFormElem[0].parentNode.innerHTML = myFormElem[0].parentNode.innerHTML;
});

t.test("Clean up",
	function() {
		t.expect(1);
		testForm.remove();
		t.ok(true, "Cleaned!");
	}
);
