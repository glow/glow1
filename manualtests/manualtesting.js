var ManualTestCase = function () {
	var ManualTestCase = function (opts) {
		this.name = opts.name;
		this.setupTest = opts.setup;
		this.resetTest = opts.reset;
		this.check = opts.check;
		this.userResult = opts.userResult;
	};

	/* setup */

	ManualTestCase.prototype.attachTest = function (container) {
		this.container = container;
		this.container.addClass("not-started");
		this.testData = container.get(".test-steps").html();
		this.addStartButton();
	};

	/* start button */

	ManualTestCase.prototype.addStartButton = function () {
		this.container.get(".test-name").parent().append('<span class="start">&nbsp;<a href="#">start</a></span>');
		this.startEvent = glow.events.addListener(this.container.get(".start > a")[0], "click", this.start, this);
	};

	ManualTestCase.prototype.removeStartButton = function () {
		glow.events.removeListener(this.startEvent);
		this.container.get(".start").remove();
	};

	ManualTestCase.prototype.start = function () {
		var res = this.setupTest();
		if (typeof res == 'boolean' && ! res) { return; }
		this.removeStartButton();
		this.addResetButton();
		this.container.removeClass("not-started");
		this.container.addClass("started");
		this.container.get(".test-steps").removeClass("hidden");
		if (! this.userResult) {
			this.addFinishButton();
		}
		return false;
	};

	/* finish button */

	ManualTestCase.prototype.addFinishButton = function () {
		this.container.append('<p class=\"finish\"><a href="#">finish</a></p>');
		this.finishEvent = glow.events.addListener(this.container.get(".finish > a")[0], 'click', this.finish, this);
	};

	ManualTestCase.prototype.removeFinishButton = function () {
		if (this.userResult) return;
		glow.events.removeListener(this.finishEvent);
		this.container.get(".finish").remove();
	};

	ManualTestCase.prototype.finish = function () {
		this.removeFinishButton();
		this.addDiagnostics();
		var err;
		try {
			this.check();
		}
		catch (e) {
			err = e;
		}
		if (err) {
			this.addFailureMessage(err);
		} else {
			this.addSuccessMessage();
		}
		this.container.removeClass("started");
		this.container.addClass("finished");
		return false;
	};

	/* reset button */

	ManualTestCase.prototype.addResetButton = function () {
		this.container.get(".test-name").parent().append('<span class="reset">&nbsp;<a href="#">reset</a></span>');
		this.resetEvent = glow.events.addListener(this.container.get(".reset > a")[0], "click", this.reset, this);
	};

	ManualTestCase.prototype.removeResetButton = function () {
		glow.events.removeListener(this.resetEvent);
		this.container.get(".reset").remove();
	};

	ManualTestCase.prototype.reset = function () {
		this.container.removeClass("finished");
		this.container.addClass("not-started");
		this.resetTest();
		this.removeDiagnostics();
		this.removeSuccessMessage();
		this.removeFailureMessage();
		var steps = this.container.get(".test-steps");
		this.container.get(".test-steps").html(this.testData);
		this.removeFinishButton();
		this.removeResetButton();
		this.addStartButton();
		return false;
	};

	/* diagnostics */
	
	ManualTestCase.prototype.diag = function (msg) {
		var diag = glow.dom.create("<li></li>");
		diag.text(msg);
		this.container.get("ul.diagnostics").append(diag);
	};

	ManualTestCase.prototype.addDiagnostics = function () {
		this.container.append('<ul class="diagnostics"></ul>');
	};

	ManualTestCase.prototype.removeDiagnostics = function () {
		var diagnostics = this.container.get("ul.diagnostics");
		if (diagnostics) diagnostics.remove();
	};

	/* success */

	ManualTestCase.prototype.addSuccessMessage = function () {
		this.container.get(".test-name").parent().append('<span class="success">success</span>')
		this.container.append('<p class="success">Test Passed</p>');
	};

	ManualTestCase.prototype.removeSuccessMessage = function () {
		var quietSuccess = this.container.get("span.success");
		if (quietSuccess) { quietSuccess.remove(); }
		var verboseSuccess = this.container.get("p.success");
		if (verboseSuccess) verboseSuccess.remove();
	};

	/* failure */

	ManualTestCase.prototype.addFailureMessage = function (msg) {
		var text = "Test Failed: " + msg;
		var quietFailure = glow.dom.create('<span class="failure quiet"><span>');
		quietFailure.text(text);
		this.container.get(".test-name").parent().append(quietFailure);
		var verboseFailure = glow.dom.create('<p class="failure verbose"></p>');
		verboseFailure.text(text);
		this.container.append(verboseFailure);
	};

	ManualTestCase.prototype.removeFailureMessage = function () {
		var quietFailure = this.container.get("span.failure");
		if (quietFailure) { quietFailure.remove(); }
		var verboseFailure = this.container.get("p.failure");
		if (verboseFailure) verboseFailure.remove();
	};

	return ManualTestCase;
}();


var testCases = {};

function registerTestCase (testCase) {
	testCases[testCase.name] = testCase;
}

function attachTests () {
	var listItems = glow.dom.get(".test-cases > li");
	for (var i = 0, len = listItems.length; i < len; i++) {
		var listItem = listItems.slice(i, i + 1);
		var testName = listItem.get(".test-name").text();
		var testCase = testCases[testName];
		if (! testCase) { throw "unknown test case '" + testName + "'"; }
		testCase.attachTest(listItem);
	}
}

function setVerbose (ck) {
	var testCases = glow.dom.get(".test-cases");
	if (ck.checked) {
		testCases.removeClass("quiet");
	} else {
		testCases.addClass("quiet");
	}	
}

glow.events.addListener(
	glow.dom.get("#verbose")[0],
	"change",
	function () { setVerbose(this); }
);

setVerbose(glow.dom.get("#verbose")[0]);



