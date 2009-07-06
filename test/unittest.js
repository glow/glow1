/*
Class: UnitTest
	An instance, 't', is created in the global namespace by default.
*/
function UnitTest() {
	//private
	this._sTestHTML = null; //stores testground HTML for resetting purposes
	this._oStats = {}; //tests vs failed tests & execution time
	this._queue = [];
	this._blocked = true;
	this._stopTimeout = null; //holds interval timeout
	
	//public
	/*
	Property: currentTest
		A reference to modules[..last..].tests[..last..]
	*/
	this.currentTest = null;
	/*
	Property: currentModule
		A reference to modules[..last..]
	*/
	this.currentModule = null;
	/*
	Property: modules
		Array of <UnitTest.ModuleResult> objects
	*/
	this.modules = [];
	/*
	Property: moduleToTest
		The name of the module to test. Null to test all modules.
	*/
	this.moduleToTest = null;
	/*
	Property: allModuleNames
		All modules names passed to the unit tester, including ones
		not tested because of 'moduleToTest'
	*/
	this.allModuleNames = [];
}

UnitTest.prototype = {
	_process: function() {
		while (this._queue.length && !this._blocked) {
			var call = this._queue[0];
			this._queue = this._queue.slice(1);
			call();
		}
	},
	/*
	Method: stats
		Get stats about the unit test
	
	Returns:
		Object in the form:
		(code)
		{
			modules: {
				passed: Number, //how many modules passed
				failed: Number, //how many modules failed
				total: Number //total number of modules
			},
			tests: {
				passed: Number, //how many tests passed (in all modules)
				failed: Number, //how many tests failed (in all modules)
				skipped: Number, //how many tests were skipped (in all modules)
				total: Number, //total number of tests (in all modules)
				errors: Number, //how many tests failed with an exception
				withUnexpectedAsserts: Number //how many tests had more / less asserts than expected
			},
			asserts: {
				passed: Number, //how many asserts passed (in all tests)
				todo: Number, //how many asserts failed but were expected to (in all tests)
				failed: Number, //how many asserts unexpectedly failed (in all tests)
				total: Number, //total number of asserts (in all tests)
			}
		};
		(end)
	*/
	stats: function() {
		if (!this._oStats.modules) {
			this._oStats.modules = {passed: 0, total: this.modules.length};
			this._oStats.tests = {passed: 0, total: 0, errored: 0, withUnexpectedAsserts: 0, todo: 0, skipped: 0};
			this._oStats.asserts = {passed: 0, todo: 0, total: 0};
			
			//loop through the results
			for (var i = 0; i < this.modules.length; i++) {
				if (this.modules[i].passed()) {
					this._oStats.modules.passed++;
				}
				
				this._oStats.tests.total += this.modules[i].stats().testsTotal;
				this._oStats.tests.errored += this.modules[i].stats().testsErrored;
				this._oStats.tests.withUnexpectedAsserts += this.modules[i].stats().testsWithUnexpectedAsserts;
				this._oStats.tests.passed += this.modules[i].stats().testsPassed;
				this._oStats.tests.skipped += this.modules[i].stats().testsSkipped;
				this._oStats.tests.todo += this.modules[i].stats().testsTodo;
				//loop through tests
				for (var j = 0; j < this.modules[i].tests.length; j++) {
					this._oStats.asserts.total += this.modules[i].tests[j].stats().assertsTotal;
					this._oStats.asserts.passed += this.modules[i].tests[j].stats().assertsPassed;
					if (this.modules[i].tests[j].todo) {
						this._oStats.asserts.todo += this.modules[i].tests[j].stats().assertsFailed;
					}
				}
			}
			
			//calculate failed tests
			this._oStats.modules.failed = this._oStats.modules.total - this._oStats.modules.passed;
			this._oStats.tests.failed = this._oStats.tests.total - this._oStats.tests.passed;
			this._oStats.asserts.failed = this._oStats.asserts.total - this._oStats.asserts.passed - this._oStats.asserts.todo;
		}
		
		return this._oStats;
	},
	/*
	Method: passed
		Has the unit passed all tests?
	
	Returns:
		True if all modules in <modules> passed their tests.
	*/
	passed: function() {
		return !this.stats().modules.failed;
	},
	/*
	Method: run
		Begin running queued tests.
		
	Arguments:
		onComplete - (Function) Run when all tests complete. Use onComplete to process the results of the test.
	*/
	run: function(onComplete) {
		onComplete = onComplete || function() {};
		this._blocked = false;
		var time = new Date(); //for recording exe time
		var oThis = this;
		glow.ready(function() {
			oThis._sTestHTML = document.getElementById('dl').innerHTML; //backup html (for resetting)
		});
		this.synchronize(function() {
			oThis._oStats.time = new Date() - time;
			onComplete();
		});
		return this;
	},
	/*
	Method: synchronize
		Adds function to the function queue. Used to queue tests and results processors.
	
	Arguments:
		callback - function to add to the queue
	*/
	synchronize: function(callback) {
		this._queue[this._queue.length] = callback;
		if (!this._blocked) {
			this._process();
		}
		return this;
	},
	/*
	Method: stop
		Halt the execution of further tests. This is useful if your test contains asynchronous or deferred parts.
		If you stop the test queue, you must start it again once your test is complete. The queue will automatically
		restart after 10 seconds unless explicitly restarted.
		
	Example:
		(code)
		t.test("Some test", function() {
			t.stop();
			setTimeout(function() {
				//asserts
				t.start();
			}, 300);
		});
		(end)
	*/
	stop: function() {
		this._blocked = true;
		var oThis = this;
		this._stopTimeout = setInterval(function() {
			oThis.currentTest.error = new Error("stop() timeout exceeded");
			oThis.start();
		}, 10000); 
	},
	/*
	Method: start
		Resume processing the test queue. Only needed after the queue is explicitly halted using stop().
	*/
	start: function() {
		var oThis = this;
		// A slight delay, to avoid any current callbacks
		setTimeout(function(){
			oThis._blocked = false;
			oThis._process();
		}, 13);
		//cancel timeout - causes function to exit in rhino
		clearInterval(this._stopTimeout);
		return this;
	},
	/*
	Method: resetHTML
		Reset the html test elements to their default. Call this after running tests which modify elements on the page.
		Automatically called at the end of every test.
	*/
	resetHTML: function() {
		if (this._sTestHTML) { document.getElementById('dl').innerHTML = this._sTestHTML; }
		return this;
	},
	/*
	Method: addModule
		Add a new module to <modules>
	
	Arguments:
		newModule - (<UnitTest.ModuleResult>) Module to add
	*/
	addModule: function(newModule) {
		this.modules[this.modules.length] = newModule;
		return this;
	},
	/*
	Method: test
		Creates a new test and adds it to a queue. The queue is not processed untill the DOM tree is created or the queue is blocked (see Control methods / variables).
		
	Arguments:
		name - (String) name of the test. should be in the format "namespace.methodName() - further details". "Further details" are only necessary if the test only deals with a portion of the method.
		callback - (Function) test code containing assertions to compare actual values to expected values.
		
	Example:
		(code)
		t.test("BBC.DOM.find() - CSS3 selectors", function() {
			//test code
		});
		(end)
	*/
	test: function (name, callback) {
		var oThis = this;
		// add test to queue
		this.synchronize(function() {
			if (oThis.moduleToTest && !oThis.currentModule) { return; }
			//create default module if one isn't already there
			if (!oThis.currentModule) {
				oThis.module("Unknown");
			}
			oThis.currentTest = UnitTest.TestResult(name);
			oThis.currentModule.addTest(oThis.currentTest);
			try {
				callback();
			} catch(e) {
				//ignore error if test is skipped
				if (oThis.currentTest.skipped) { return; }
				
				//write error to firebug / firebug lite console if exists
				if( typeof console != "undefined" && console.error && console.warn ) {
					console.error("Test " + name + " died, exception and test follows");
					console.error(e);
					console.warn(callback.toString());
				}
				oThis.currentTest.error = e;
			}
		});
		this.synchronize(function() {
			if (oThis.moduleToTest && !oThis.currentModule) { return; }
			oThis.resetHTML();
		});
	},
	/*
	Method: todo
		Creates a new todo test and adds it to a queue. Todo tests are the same as regular tests expect they are expected to fail. If all expected asserts within a todo are true, the todo will fail and should be changed to a test.
		
	Arguments:
		name - (String) name of the todo. should be in the format "namespace.methodName() - further details". "Further details" are only necessary if the todo only deals with a portion of the method.
		callback - (Function) test code containing assertions to compare actual values to expected values.
		
	Example:
		(code)
		t.todo("BBC.DOM.find() - CSS3 selectors", function() {
			//test code
		});
		(end)
	*/
	todo: function (name, callback) {
		//todo is just like a test, so reuse it
		this.test(name, callback);
		var oThis = this;
		//set it as a todo
		this.synchronize(function() {
			if (oThis.moduleToTest && !oThis.currentModule) { return; }
			oThis.currentTest.todo = true;
		});
	},
	/*
	Method: module
		Declares a new section of tests. Subsiquent tests will be contained within a new module of this name.
		
	Arguments:
		moduleName - (String) Module name. "XHR" and "DOM" could be valid module names.
	*/
	module: function(moduleName) {
		var oThis = this;
		this.allModuleNames.push(moduleName);
		this.synchronize(function() {
			if (oThis.moduleToTest && moduleName != oThis.moduleToTest) {
				oThis.currentModule = null;
			} else {
				oThis.currentModule = UnitTest.ModuleResult(moduleName);
				oThis.addModule(oThis.currentModule);
			}
			
		});
	},
	/*
	Method: expect
		Declare how many assertions your test contains. Recommended as the first line of a test.
		
	Arguments:
		asserts - (Number) How many asserts to expect in the current test
	*/
	expect: function(asserts) {
		this.currentTest.expectedAsserts = asserts;
	},
	/*
	Method: skip
		Skip this test. Test will exit when called and be labeled as skipped.
		
	Arguments:
		reason - (String) Reason for skipping test
	*/
	skip: function(reason) {
		reason = reason || "Skipped";
		this.currentTest.skipped = reason;
		throw "Test skipped";
	},	
	/*
	Method: ok
		Asserts the first parameter is true
	
	Arguments:
		a - (Boolean) Value to test
		msg - (String) Description
	
	Example:
		(code)
		t.ok(BBC.DOM("#main a").size() > 5, "There must be at least 5 anchors");
		(end)
	*/
	ok: function(a, msg) {
		this.currentTest.addAssert( [ !!a, msg ] );
	},	
	/*
	Method: isSet
		Asserts that two arrays are the same. The elements in the array are compared with ==, so beware of types that compare by pointer rather than value.
		
	Arguments:
		a - (Array) Array to compare
		b - (Array) Array to compare
		msg - (String) Description
	
	Example:
		(code)
		//alter an array
		var aTest = BBC.Core.filter(["hello", "world", "yey"], function(x) {
		if (x == "hello" || x == "yey")
			return true;
		});
		//test against expected output
		t.isSet(aTest, ["hello", "yey"], "Basic filter test");
		(end)
	*/
	isSet: function(a, b, msg) {
		var ret = true;
		if ( a && b && a.length !== undefined && a.length == b.length ) {
			for ( var i = 0; i < a.length; i++ ) {
				if ( a[i] != b[i] ) { ret = false; }
			}
		} else {
			ret = false;
		}
		if ( !ret ) {
			this.currentTest.addAssert( [ ret, msg + " expected: " + serialArray(b) + " result: " + serialArray(a) ] );
		} else { 
			this.currentTest.addAssert( [ ret, msg ] );
		}
	},	
	/*
	Method: isObj
		Asserts that two objects are the same. The properties of the object are compared with ==, so beware of types that compare by pointer rather than value.
		
	Arguments:
		a - (Object) Object to compare
		b - (Object) Object to compare
		msg - (String) Description
	
	Example:
		(code)
		t.isObj(BBC.Forms.toObj("#myForm"), {name:"Jake",age:"23",gender:"Male"}, "Returns value set");
		(end)
	*/
	isObj: function(a, b, msg) {
		var ret = true;
		
		if ( a && b ) {
			for ( var i in a ) {
				if ( a[i] != b[i] ) { ret = false; }
			}
			for ( i in b ) {
				if ( a[i] != b[i] ) { ret = false; }
			}				
		} else {
			ret = false;
		}
	
	    this.currentTest.addAssert( [ ret, msg ] );
	},
	/*
	Method: selects
		Checks that selector returns the correct elements in the correct order.
		
	Arguments:
		selector - (String) CSS Selector
		ids - (Array) Array of ids / elements
		msg - (String) Description
	*/
	selects: function(selector,ids,msg) {
		msg = msg ? selector + " - " + msg : selector;
		this.isSet(glow.dom.get(selector), q.apply(window, ids), msg);
	},
	/*
	Method: equals
		Asserts two values are equal.
	
	Arguments:
		actual - Value to compare
		expected - Value to compare
		message - (String) Description
	
	Example:
		(code)
		t.equals(BBC.DOM("#check2").size(), 1, "Check only one item is returned for an ID");
		(end)
	*/
	equals: function(actual, expected, message) {
		var result = expected == actual;
		message = message || (result ? "okay" : "failed");
		this.currentTest.addAssert( [ result, result ? message + ": " + quoteSingleLine(expected) : (message + " expected: " + quoteSingleLine(expected) + " actual: " + quoteSingleLine(actual)) ] );
	},
	
	/*
	Method: notEqual
		Asserts two values are NOT equal.
	
	Arguments:
		val1 - Value to compare
		val2 - Value to compare
		message - (String) Description
	
	Example:
		(code)
		t.notEqual(BBC.DOM("#check2").size(), 0, "Check only one item is returned for an ID");
		(end)
	*/
	notEqual: function(val1, val2, message) {
		var result = val1 != val2;
		message = message || (result ? "okay" : "failed");
		this.currentTest.addAssert( [ result, result ? message + "val1: " + quoteSingleLine(val1) + " val2: " + quoteSingleLine(val2) : (message + " both values are: " + quoteSingleLine(val1)) ] );
	},

	/*
	Method: contains
		Asserts a piece of text is present.

	Arguments:
		actual - (String) Value to compare.
		expected - (String) Value expected to be present.
		message - (String) Description.

	Example:
		(code)
		t.contains('blah blah', 'h b', 'test a substring');
		(end)
	*/
	contains: function (actual, expected, message) {
		var result = actual.indexOf(expected) != -1;
		message = message || (result ? "okay" : "failed");
		this.currentTest.addAssert( [ result, result ? message + ": " + quoteSingleLine(expected) : (message + " expected to contain: " + quoteSingleLine(expected) + " actual: " + quoteSingleLine(actual)) ] );		
	},

	/*
	Method: doesNotContain
		Asserts a piece of text is not present.

	Arguments:
		actual - (String) Value to compare.
		notExpected - (String) Value not expected to be present.
		message - (String) Description.

	Example:
		(code)
		t.doesNotContain('blah blah', 'flannel', 'test a substring');
		(end)
	*/
	doesNotContain: function (actual, notExpected, message) {
		var result = actual.indexOf(notExpected) == -1;
		message = message || (result ? "okay" : "failed");
		this.currentTest.addAssert( [ result, result ? message + ": " + quoteSingleLine(notExpected) : (message + " expected to not contain: " + quoteSingleLine(notExpected) + " actual: " + quoteSingleLine(actual)) ] );		
	}
};
var t = new UnitTest();
//the replace bit at the end is for safari 1.3
t.moduleToTest = decodeURIComponent((window.location.search.match(/module=([^&]+)/) || ["", ""])[1]).replace(/\+/g, " ");
/*
Class: UnitTest.ModuleResult
	Represents the result for a module.

Constructor:
	>UnitTest.ModuleResult(name [, tests])

Arguments:
	name - (String) Name of module
	tests - (Array) Array of <UnitTest.TestResult> obejcts. Optional.
*/
UnitTest.ModuleResult = function(name, tests) {
	var oStats;
	
	return {
		/*
		Property: name
			Name of module
		*/
		name: name,
		/*
		Property: tests
			Array of <UnitTest.TestResult> objects associated with the module
		*/
		tests: tests || [],
		/*
		Method: passed
			Has the module passed all tests?
		Returns:
			True if all the tests within the module passed.
		*/
		passed: function() {
			return ! this.stats().testsFailed;
		},
		/*
		Method: addTest
			Adds a test object to the module.
		*/
		addTest: function(newTest) {
			this.tests[this.tests.length] = newTest;
			return this;
		},
		/*
		Method: stats
			Get stats on tests within the module
			
		Returns:
			Object in the following format:
			(code)
			{
				testsPassed: Number, //how many tests in module passed
				testsFailed: Number, //how many tests in module failed (opposite of pass)
				testsErrored: Number, //how many tests exited with an error (excluding todos)
				testsWithUnexpectedAsserts: Number, //how many tests contained an unexpected number of asserts (excluding todos)
				testsSkipped: Number, //how many tests were skipped
				testsTodo: Number, //how many tests are marked 'todo'
				testsTotal: Number //number of tests in module
			}
			(end)
		*/
		stats: function() {
			if (!oStats) {
				oStats = {testsPassed: 0, testsErrored: 0, testsWithUnexpectedAsserts: 0, testsSkipped: 0, testsTodo: 0, testsTotal: this.tests.length};
				for (var i = 0; i < this.tests.length; i++) {
					if (this.tests[i].skipped) {
						oStats.testsSkipped++;
						continue;
					}
					if (this.tests[i].todo) {
						oStats.testsTodo++;
					} else {
						//don't count todos with errors or unexpected asserts
						oStats.testsErrored += this.tests[i].error ? 1 : 0;
						oStats.testsWithUnexpectedAsserts += !this.tests[i].hasExpectedAsserts();
					}
					oStats.testsPassed += this.tests[i].passed();
				}
				oStats.testsFailed = oStats.testsTotal - oStats.testsPassed - oStats.testsSkipped;
			}
			return oStats;
		}
	};
};

/*
Class: UnitTest.TestResult
	Represents the result for a test.

Constructor:
	>UnitTest.TestResult(name [, asserts])

Arguments:
	name - (String) Name of module
	asserts - (Array) Array of asserts. Optional.
*/
UnitTest.TestResult = function(name, asserts) {
	var oStats;
	
	return {
		/*
		Property: name
			Name of the test
		*/
		name: name,
		/*
		Property: asserts
			An array of asserts associated with the test. Each assert is an Array in the following format:
			(code)
			[
				Boolean, //did the assert pass or fail?
				String //description of the assert
			]
			(end)
		*/
		asserts: asserts || [],
		/*
		Property: expectedAsserts
			How many asserts should this test have? Usually set via <expect()>.
		*/
		expectedAsserts: 0,
		/*
		Property: error
			Holds any uncaught exception thrown by the test. Set to null if the test completes without an error.
		*/
		error: null,
		/*
		Property: skipped
			Has this test been skipped?
		*/
		skipped: false,
		/*
		Property: todo
			Is this test a todo, as in expected to fail
		*/
		todo: false,
		/*
		Method: hasExpectedAsserts
			Does the test contain the expected number of inserts?
		Returns:
			True if test contains the expected number of inserts, otherwise false.
		*/
		hasExpectedAsserts: function() {
			return (this.expectedAsserts == this.stats().assertsTotal);
		},
		/*
		Method: passed
			Has this test passed?
		Returns:
			Returns true if all asserts passed, the number of <asserts> matches <expectedAsserts>, and error is null. Return value is inverted if the test is a todo list.
		*/
		passed: function() {
			var r = !this.skipped && !this.error && this.hasExpectedAsserts() && (this.stats().assertsPassed == this.stats().assertsTotal);
			if (this.todo) { r = !r; }
			return r;
		},
		/*
		Method: addAssert
			Add a new assert result to the test
		Arguments:
			newAssert - (Array) assert result
		*/
		addAssert: function(newAssert) {
			this.asserts[this.asserts.length] = newAssert;
			return this;
		},
		/*
		Method: stats
			Get stats on asserts within the test. A test isn't solely made of asserts. A test with zero failed asserts will still fail if there is an unexpected number of asserts or the test exited with an error.
			
		Returns:
			Object in the following format:
			(code)
			{
				assertsPassed: Number, //how many asserts in test passed
				assertsFailed: Number, //how many asserts in test failed
				assertsTotal: Number //number of asserts in test
			}
			(end)
		*/
		stats: function() {
			if (!oStats) {
				oStats = {assertsPassed: 0, assertsTotal: this.asserts.length};
				for (var i = 0; i < this.asserts.length; i++) {
					oStats.assertsPassed += this.asserts[i][0];
				}
				oStats.assertsFailed = oStats.assertsTotal - oStats.assertsPassed;
			}
			return oStats;
		}
	};
};

UnitTest.XMLGenerator = function () {

	/*
	Class: BBC.xml.Generator
		Functional XML generator class.
	*/
	var Generator = function (generator, writer) {
		this.writer = writer;
		this.generator = generator;
	};

	/*
	Method: element
		Generate and XML element.

	Parameters:
		name - the name of the element.
		attributes - an object (hash) containing the attributes for the element, or null if there are no attributes.
		content - a string containing the content, or a function that generates it.
	*/
	Generator.prototype.element = function (name, attributes, content) {
		this.write('<' + escapeEntities(name));
		if (attributes) {
			// sorting is done so that it is easier to test
			var sorted = [];
			for (var i in attributes) {
				if (! glow.lang.hasOwnProperty(attributes, i)) continue;
				sorted[sorted.length] = i;
			}
			sorted = sorted.sort();
			for (var i = 0, sortedLength = sorted.length; i < sortedLength; i++) {
				this.write(' ' + sorted[i] + '="' + escapeEntities(attributes[sorted[i]]) + '"');
			}
		}
		if (content) {
			this.write('>');
			if (typeof content == 'string') {
				this.write(escapeEntities(content));
			}
			else {
				content.call(this);
			}
			this.write('</' + escapeEntities(name) + '>');
        }
		else {
			this.write('/>');
		}
    };

	/*
	Method: write
		Add to the resulting XML document. This must be properly escaped.

	Parameters:
		output - the content that should be added to the XML document.
	*/
	Generator.prototype.write = function (output) {
		this.writer(output);
    }
	
	/*
	Method: collect
		Run the generator and return the resulting XML as a string.
	*/
	Generator.prototype.collect = function () {
		var output = '';
		this.writer = function (out) { output += out; };
		this.generator();
		return output;
	};

	return Generator;
}();


/*
Namespace: UnitTest.Output
*/
UnitTest.Output = {};
/*
Method: html
	Analysises a unit test and outputs the results to the html page.

Arguements:
	unitTest - The unit test to report on
*/
UnitTest.Output.html = function() {
	var mainResults = [];
	//Is a particular module being tested
	var moduleRestricted = false;
	
	function buildSummary(unitTest) {
		stats = unitTest.stats();
		var oSummary = document.createElement("div");
		oSummary.innerHTML = '<h2>Summary</h2><p>Tests completed in ' +
			stats.time + ' milliseconds.<br />' +
			stats.asserts.total + ' assert(s).<br />' +
			stats.asserts.todo + ' assert(s) todo.<br />' +
			stats.tests.skipped + ' test(s) skipped.<br />' +
			(stats.asserts.failed + stats.tests.withUnexpectedAsserts) + ' unexpected failure(s).<br />' +
			stats.tests.errored + ' test(s) errored.</p>';
		
		if (moduleRestricted) {
			oSummary.innerHTML += '<p><a href="' + window.location.search.replace(/module=[^&;]*[&;]?/, "") + '">Show all tests</a></p>';
		}
		return oSummary;
	}
	
	function processModule(a) {
		var h2 = document.createElement("h2");
		h2.innerHTML = a.name;
		h2.className = "module";
		h2.ondblclick = function() {
			var text = this.textContent || this.innerText;
			location.search = location.search.replace(/module=[^&;]*[&;]?/, "") + "&module=" + encodeURIComponent(text);
		};
		
		mainResults[mainResults.length] = h2;
		
		//test results list
		var ul = document.createElement("ul");
		ul.className = "unitTests";
		//populate list
		for (var i = 0; i < a.tests.length; i++) {
			ul.appendChild(processTest(a.tests[i]));
		}
		mainResults[mainResults.length] = ul;
	}
	
	function processTest(a) {
		//list item to return
		var li = document.createElement("li");
		var className;
		var resultStr;
		
		//build the class name for the row
		if (a.skipped) {
			className = "skipped";
			if (a.todo) {
				className += " todo";
			}
			resultStr = "SKIPPED";
		} else if (a.todo) {
			className = a.passed() ? "todo" : "todo fail";
			resultStr = a.passed() ? "TODO" : "Done?";
		} else {
			className = a.passed() ? "pass" : "fail";
		}
		
		if (!resultStr) { resultStr = className.toUpperCase(); }
		li.className = className;
		
		//test heading
		var h3 = document.createElement("h3");
		var testInfo; //extra info about the test
		
		if (a.skipped) {
			testInfo = a.skipped;
		} else {
			testInfo = '' +
					'<span class="asserts">Asserts: ' + a.stats().assertsTotal + '</span>' +
					'<span class="asserts">Fails: ' + (a.stats().assertsFailed + !a.hasExpectedAsserts()) + '</span>' + 
					'<span class="asserts">Errors: ' + (a.error ? 1 : 0) + '</span>';
		}
		
		h3.innerHTML += '' +
				'<span class="testResult">' + resultStr + '</span>' +
				'<span class="testStats">' + testInfo +	'</span>' +
				a.name;
		
		h3.onclick = function() {
			var n = this.nextSibling;
			n.style.display = (n.style.display == "block") ? "none" : "block";
		};
		li.appendChild(h3);
		
		//asserts
		var ol = document.createElement("ol");
		//check for uncaught exception
		if (a.error) {
			ol.appendChild(processAssert([false, "ERROR: " + (isIE && a.error instanceof Error ? a.error.message : a.error)]));
		}
		//check expected asserts
		if (a.expectedAsserts != a.asserts.length) {
			ol.appendChild(processAssert([false, "Expected " + a.expectedAsserts + " assertions, but " + a.asserts.length + " were run"]));
		}
		//process assert results
		for (var i = 0; i < a.asserts.length; i++) {
			ol.appendChild(processAssert(a.asserts[i]));
		}
		//stripe table
		for (i = 0; i < ol.childNodes.length; i++) {
			ol.childNodes[i].className += i%2 ? " even" : " odd";
		}
		//show details by default if test failed, or is todo
		if ((!a.passed() || a.todo) && !a.skipped) {
			ol.style.display = "block";
		}
		li.appendChild(ol);
		
		return li;
	}
	
	function processAssert(a) {
		var li = document.createElement("li");
		li.className = a[0] ? "pass" : "fail";
		li.innerHTML = '<span class="assertResult">' + (a[0] ? "Pass" : "Fail") + '</span> ' + escapeEntities(a[1]);
		return li;
	}
	
	return function(oUnitTest) {
		glow.ready(function() {
			if (oUnitTest.moduleToTest) { moduleRestricted = true; }
			
			document.getElementById("ua").innerHTML = navigator.userAgent; //output user agent to page
			
			//process modules
			for (var i = 0; i < oUnitTest.modules.length; i++) {
				processModule(oUnitTest.modules[i]);
			}
			//output results
			var outputContainer = document.getElementById("mainOutput");
			
			//append summary
			outputContainer.appendChild(buildSummary(oUnitTest));
			
			for (i = 0; i < mainResults.length; i++) {
				outputContainer.appendChild(mainResults[i]);
			}
		});
	};
}();

/*
Method: UnitTest.Output.xUnitStyle
	Analyses a unit test and returns an xml generator that will output the results as xUnit style XML.
*/
UnitTest.Output.xUnitStyle = function (oUnitTest) {

	function outputTestSuite(module) {
		var stats = module.stats();
		this.element(
			'testsuite', {
				errors   : stats.testsErrored,
				failures : stats.testsFailed,
				time     : 0,
				tests    : stats.testsTotal,
				name     : module.name
			}, function () {
				for (var i = 0, tests_length = module.tests.length; i < tests_length; i++) {
					var test = module.tests[i];
					for (var j = 0, asserts_length = test.asserts.length; j < asserts_length; j++) {
						outputTestCase.call(this, test, test.asserts[j]);
					}
				}
			}
		);
	}


	function outputTestCase(test, assert) {
		this.element(
			'testcase', {
				time      : 0,
				classname : test.name,
				name      : assert[1]
			}, assert[0] ? null : function () {
				this.element(
					'failure', {
						message : 'TEST FAILED',
						type    : 'failure'
					},
					assert[0]
				);
			}
		);
	}
	
	return new UnitTest.XMLGenerator(function () {
		this.element('testsuites', {}, function () {
			for (var i = 0, modulesLength = oUnitTest.modules.length; i < modulesLength; i++) {
				outputTestSuite.call(this, oUnitTest.modules[i]);
			}
		});
	});
};

/*
Method: collect
	Same as print output, but returns the output as a string.

Arguments:
	unitTest - The unit test to report on.

*/
UnitTest.Output.collect = function (unitTest) {
	var output = '';
	var collector = function (out) {
		if (out == undefined) out = '';
		if (typeof out != 'string') out = out.toString();
		output += out + '\n';
	};
	UnitTest.Output.print(unitTest, collector);
	return output;
};

/*
Method: print
	Analysises a unit test and outputs the results to the command line.

Arguements:
	unitTest - The unit test to report on
*/
UnitTest.Output.print = function() {
	function printTestResult(outputMethod, module, test, assert) {
		var result;
		if (test.todo) {
			result = assert[0] ? "TODO DONE?" : "TODO";
			//return; //**********
		} else {
			//if (assert[0]) return; //**********
			result = assert[0] ? "PASS" : "FAIL";
		}
		outputMethod( result + " [" + module.name + "] " + assert[1] );
	}
	
	function printSkippedAlert(outputMethod, module, test) {
		outputMethod("SKIPPED" + " [" + module.name + "] " + test.name + " - " + test.skipped);
	}
	
	return function(oUnitTest, outputMethod) {
		if (! outputMethod) outputMethod = print;
		//loop through asserts
		outputMethod();
		
		for(var i = 0; i < oUnitTest.modules.length; i++) {
			for(var j = 0; j < oUnitTest.modules[i].tests.length; j++) {
				if (oUnitTest.modules[i].tests[j].skipped) {
					printSkippedAlert(outputMethod, oUnitTest.modules[i], oUnitTest.modules[i].tests[j]);
				} else {
					if (oUnitTest.modules[i].tests[j].error) {
						printTestResult(outputMethod, oUnitTest.modules[i], oUnitTest.modules[i].tests[j],
								[false, "Test " + oUnitTest.modules[i].tests[j].name +
								" died: " + oUnitTest.modules[i].tests[j].error]);
					}
					if (oUnitTest.modules[i].tests[j].expectedAsserts != oUnitTest.modules[i].tests[j].stats().assertsTotal) {
						printTestResult(outputMethod, oUnitTest.modules[i], oUnitTest.modules[i].tests[j],
								[false, oUnitTest.modules[i].tests[j].name +
								" - Expected " + oUnitTest.modules[i].tests[j].expectedAsserts +
								" assertions, but " + oUnitTest.modules[i].tests[j].stats().assertsTotal +
								" were run"]);
					}
					for(var k = 0; k < oUnitTest.modules[i].tests[j].asserts.length; k++) {
						printTestResult(outputMethod, oUnitTest.modules[i], oUnitTest.modules[i].tests[j], oUnitTest.modules[i].tests[j].asserts[k]);
					}
				}
			}
		}
		
		outputMethod('\nTests completed in ' +
			oUnitTest.stats().time + ' milliseconds.\n' +
			oUnitTest.stats().asserts.total + ' assert(s)\n' +
			oUnitTest.stats().asserts.todo + ' assert(s) todo\n' +
			oUnitTest.stats().tests.skipped + ' tests(s) skipped\n' +
			(oUnitTest.stats().asserts.failed + oUnitTest.stats().tests.withUnexpectedAsserts) + ' unexpected failure(s)\n' +
			oUnitTest.stats().tests.errored + ' error(s)');
	};
}();

/*
Namespace: Global
*/

/*
Property: isLocal
	Is the document being run from the filesystem? (url protocol == "file:")
*/
var isLocal = !!(window.location.protocol == 'file:');

var ua = navigator.userAgent;

/*
Property: isMoz
	Is the user agent mozilla based?
*/
var isMoz = /mozilla/.test(ua) && !(/(compatible|webkit)/.test(ua));
/*
Property: isIE
	Is the user agent IE based?
*/
var isIE = /msie/i.test(ua) && !(/opera/.test(ua));
/*
Property: isOpera
	Is the user agent Opera based?
*/
var isOpera = /opera/.test(ua);
/*
Property: isRhino
	Is the user agent Rhino based?
*/
var isRhino = !!window.load;

/*
Method: serialArray
	Makes an array human-readable. Used by <UnitTest.isSet()> automatically on a false assertion.

Arguments:
	a - (Array) Subject

Returns:
	String in the format [value, value, value, ...]
*/
function serialArray( a ) {
	var r = [];
	
	if ( a && a.length ) {
        for ( var i = 0; i < a.length; i++ ) {
            var str = a[i].nodeName;
            if ( str ) {
                str = str.toLowerCase();
                if ( a[i].id ) { str += "#" + a[i].id; }
            } else {
                str = a[i];
			}
            r[r.length] = str;
        }
	}

	return "[ " + r.join(", ") + " ]";
}

/*
Method: q
	Returns an array of elements.

Arguments:
	One or more ID strings / elements.
	
Example:
	>q("main", document.getElementsByTagName("title")[0], "bar"); // [<div id="main"/>, <title/>, <input id="bar"/>]

Returns:
	Array of nodes
*/
function q() {
	var r = [];
	var tmpNode;
	for ( var i = 0; i < arguments.length; i++ ) {
		tmpNode = document.getElementById(arguments[i]);
		if (tmpNode) { r[r.length] = tmpNode; }
	}
	return r;
}

/*
Method: url
	Adds a random number to the querystring of a given url. Works around IE's caching.

Arguments:
	url - (String) URL
	
Returns:
	The url with an additional random querystring parameter

Example:
	(code)
	url("data/index.shtml"); // "data/index.shtml?119003685586574592"
	url("data/index.shtml?foo=bar"); // "data/index.shtml?foo=bar&119003685634929421"
	(end)
*/
function url(url) {
	return url + (/\?/.test(url) ? "&" : "?") + new Date().getTime() + "" + parseInt(Math.random()*100000);
}

/*
Method: triggerEvent
	Trigger a mouse event on an element. This only works in Mozilla-based browsers, Opera & IE.
	
Arguments:
	elem - Element to trigger the event on
	type - type of event
	
Example:
	(code)
	triggerEvent(document.body, "click");
	(end)
*/
function triggerEvent( elem, type, event ) {	
	if (isMoz || isOpera) {
		event = document.createEvent("MouseEvents");
		event.initMouseEvent(type, true, true, elem.ownerDocument.defaultView,
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
		elem.dispatchEvent( event );
	} else if (isIE) {
		elem.fireEvent("on"+type);
	}
}

/*
Function: escapeEntities
	Returns the passed in string with the html entities escaped.

Arguments:
	toEscape - (String) the text to be escaped.

Returns:
	The text with the characters &, ", < and > replaced with &amp;, &quot;, &lt; and &gt;.

*/
// TODO: this should probably be reused from somewhere else
function escapeEntities (toEscape) {
	if (typeof toEscape == 'undefined') toEscape = "";
	if (typeof toEscape != 'string') toEscape = toEscape.toString();
	var div = document.createElement("div");
	div.innerText = div.textContent = toEscape;
	return div.innerHTML;
}

function quoteSingleLine (toQuote) {
	if (toQuote == undefined) return 'undefined';
	if (typeof toQuote != 'string') toQuote = toQuote.toString();
	toQuote = toQuote.replace(/([\\\'])/g, "\\$1");
	return '\'' + toQuote.replace(/\n/g, "\\n") + '\'';
}
