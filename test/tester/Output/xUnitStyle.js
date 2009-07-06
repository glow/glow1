

t.module("UnitTest.Output.xUnitStyle");

function testXml (name, expectedXml, test) {

	var tester = new UnitTest();

	t.test(name, function () {
		
		t.expect(1);

		test(tester);

		t.stop();

		tester.run(function () {

			var generator = UnitTest.Output.xUnitStyle(tester);

			var xml = generator.collect();

			xml = xml.replace(/(time\=\")\d+(\")/, "$10$2");

			t.equals(xml, expectedXml, name);

			t.start();
		});

	});

}

testXml(
	'xUnit style - simple test',
	'<testsuites><testsuite errors="0" failures="0" name="Blah Module" tests="1" time="0">' +
      '<testcase classname="Blah Test" name="test assert" time="0"/>' +
      '</testsuite></testsuites>',
	function (tester) {

		tester.module("Blah Module");

		tester.test("Blah Test", function () {

			tester.expect(1);
		
			tester.ok(true, 'test assert');
		});

	}
);


testXml(
	'xUnit style - simple test failure',
	'<testsuites><testsuite errors="0" failures="1" name="Blah Module" tests="1" time="0">' +
		'<testcase classname="Blah Test" name="test assert" time="0">' +
		'<failure message="TEST FAILED" type="failure"/></testcase></testsuite></testsuites>',
	function (tester) {
		tester.module("Blah Module");

		tester.test("Blah Test", function () {
			tester.expect(1);
		
			tester.ok(false, 'test assert');
		});

	}
);

