
t.module("UnitTest.XMLGenerator");

t.test("Functional XML Generator", function() {
	t.expect(5);

	var generator = new UnitTest.XMLGenerator(function () {
		this.element('blah');
    });

	t.equals(typeof generator, 'object', 'create an xml generator');

	t.equals(generator.collect(), '<blah/>', 'generate a simple xml doc');

	generator = new UnitTest.XMLGenerator(function () {
		this.element('blah', { attribute1 : 'value1', attribute2 : 'value2&' });
	});

	t.equals(generator.collect(), '<blah attribute1="value1" attribute2="value2&amp;"/>', 'generate attributes');

	generator = new UnitTest.XMLGenerator(function () {
		this.element('blah', null, 'content');
	});

	t.equals(generator.collect(), '<blah>content</blah>', 'tag with simple content');

	generator = new UnitTest.XMLGenerator(function () {
		this.element('blah', null, function () {
			this.element('foo', null, 'b<a>h');
			this.element('bah');
		});
	});

	t.equals(generator.collect(), '<blah><foo>b&lt;a&gt;h</foo><bah/></blah>', 'xml with nested elements');
});

