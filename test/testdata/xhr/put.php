<?php

if ($_SERVER['REQUEST_METHOD'] == 'PUT') {
	// since PHP doesn't have a $_PUT global variable, 
	// we need to get the body this way
	parse_str(file_get_contents('php://input'), $put_vars);
	// from a purist point of view, PUT doesn't send a response
	// apart from the headers, but this is useful for testing 
	// to see whether the body arrived properly
	echo 'PUT: ' . $put_vars['some'];
}
else {
	echo 'not a put request';
}
