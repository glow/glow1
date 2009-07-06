// ADD FORM AND PLAY AREA

	var tmpForm = document.createElement('FORM');

	tmpForm.id = "interaction_test_form";

	tmpForm.innerHTML = '<input type="hidden" id="comment" /><textarea id="stepComment">Write a comment...</textarea><input type="button" value="PASS" id="button_pass" /><input type="button" value="FAIL" id="button_fail" /><input type="button" value="SKIP" id="button_skip" /><input type="hidden" id="test_finished" value="0" /><input type="hidden" id="test_result" value="" />';

	document.getElementById('blq-content').insertBefore(tmpForm, document.getElementById('play_area'));

	//var tmpDiv = document.createElement('DIV');

	//tmpDiv.innerHTML = 'PLAY AREA';

	//tmpDiv.id = 'play_area';

	//document.getElementById('blq-content').appendChild(tmpDiv);

// FORM CONTROLS

	document.getElementById('button_fail').onclick = function() {

		document.getElementById('test_result').value = 'FAIL';

		if ( document.getElementById('stepComment').value == 'Write a comment...' )
		{

			if (!document.getElementById('validation'))
			{
				tmpDiv = document.createElement('div');

				tmpDiv.id = 'validation';

				tmpDiv.innerHTML = 'Please enter a comment.';

				tmpDiv.style.width = '400px';

				tmpDiv.style.padding = '1em';

				tmpDiv.style.margin = '0 auto';

				document.getElementsByTagName('FORM')[0].insertBefore(tmpDiv, document.getElementById('stepComment'));

			}
			else
			{

				document.getElementById('validation').style.background = 'yellow';

			}

			document.getElementById('stepComment').focus();

		}
		else
		{

			document.getElementById('comment').value += document.getElementById('stepComment').value + 'QQQQQ';

			document.getElementById('test_finished').value = 1; // FINISHES SELENIUM TEST
		
		}

	}

	document.getElementById('button_pass').onclick = function() {

		document.getElementById('test_result').value = 'PASS';

		next_step();
	
	}

	document.getElementById('button_skip').onclick = function() {

		document.getElementById('test_result').value = 'SKIP';

		next_step();

	}

	document.getElementById('stepComment').onfocus = function() {

		if (this.value == 'Write a comment...' ) this.value = '';

	}

	document.getElementById('stepComment').onblur = function() {

		if (this.value == '' ) this.value = 'Write a comment...';

	}


// STEP CONTROLS

	arrLi = document.getElementById('steps').getElementsByTagName('LI');
	var len = arrLi.length;
	for (var x = 0; x < len; x++)
	{
		if (arrLi[x].getElementsByTagName('H2')[0])
		{
			arrLi[x].getElementsByTagName('H2')[0].innerHTML += (' of ' + len);
		}
	}

	next_step();