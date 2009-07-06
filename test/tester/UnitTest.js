
t.module("UnitTest");

t.test("Basic Assertions", function() {
	t.expect(11);
 
	// simple wrapper to run some tests and then test the result of those tests
	function testTester (options, simulatedTests, testChecks) {
		var tester = new UnitTest();
		tester.module("Simulated Module");
		var testMethod = options['todo'] ? tester.todo : tester.test;
		testMethod.call(tester, "Simulated Test", function () {
			simulatedTests(tester);
		});
		tester.run(function () {
			var report = UnitTest.Output.collect(tester);
			testChecks(tester, UnitTest.Output.collect(tester));
		});
	}

	// test ok
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.ok(true, 'desc');
		},
		function (tester, report) {
			t.contains(report, 'PASS [Simulated Module] desc', 'report contains pass for simple ok');
		}
	);

	// test ok fails
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.ok(false, 'desc');
		},
		function (tester, report) {
			t.contains(report, 'FAIL [Simulated Module] desc', 'report contains fail for failed ok');
		}
	);
	// test equals pass
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.equals('asdf', 'asdf', 'desc');
		},
		function (tester, report) {
			t.contains(report, 'PASS [Simulated Module] desc', 'report contains pass for successful equals');
		}
	);

	// test equals fails
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.equals('asdf', 'fdsa', 'desc');
		},
		function (tester, report) {
			t.contains(report, 'FAIL [Simulated Module] desc', 'report contains pass for unsuccessful equals');
		}
	);

	// test contains pass
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.contains('blah blah blah asdf blah', 'asdf', 'desc');
		},
		function (tester, report) {
			t.contains(report, 'PASS [Simulated Module] desc', 'report contains pass for successful contains');
		}
	);

	// test contains fails
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.contains('blah blah asdf blah', 'fdsa', 'desc');
		},
		function (tester, report) {
			t.contains(report, 'FAIL [Simulated Module] desc', 'report contains pass for unsuccessful contains');
		}
	);
	
	// test doesNotContain passes
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.doesNotContain('blah blah blah fdsa blah', 'asdf', 'desc');
		},
		function (tester, report) {
			t.contains(report, 'PASS [Simulated Module] desc', 'report contains pass for successful doesNotContain');
		}
	);

	// test doesNotContain fails
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.doesNotContain('blah blah fdsa blah', 'fdsa', 'desc');
		},
		function (tester, report) {
			t.contains(report, 'FAIL [Simulated Module] desc', 'report contains pass for unsuccessful doesNotContain');
		}
	);

	// test todo test
	testTester(
		{ todo : true },
		function (tester) {
			tester.expect(1);
			tester.ok(false, 'desc');
		},
		function (tester, report) {
			t.contains(report, 'TODO [Simulated Module] desc', 'report contains pass for unsuccessful but todo test');
		}
	);
	
	// test todo test
	testTester(
		{ todo : true },
		function (tester) {
			tester.expect(1);
			tester.ok(true, 'desc');
		},
		function (tester, report) {
			t.contains(report, 'TODO DONE? [Simulated Module] desc', 'report contains pass for unexpectedly successful todo test');
		}
	);


	/* This causes problems with which module the tests appear under, so removed for now
	// test async tests
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.stop();
			t.stop();
			setTimeout(function () {
				tester.ok(true, 'run async test');
				t.start();
				tester.start();
			}, 10);
		},
		function (tester, report) {
			t.contains(report, 'PASS [Simulated Module] run async test', 'async test passes');
		}
	);
	*/
	
	// test skipped tests
	testTester(
		{},
		function (tester) {
			tester.expect(1);
			tester.skip();
			tester.ok(true, 'skipped');
		},
		function (tester, report) {
			t.contains(report, 'SKIPPED [Simulated Module] Simulated Test - Skipped');
		}
	);


});

