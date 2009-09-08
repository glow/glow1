<?php
header('Content-type: text/plain');

// these headers will be output, along with anything starting HTTP_
$outputHeaders = array(
	'REQUEST_METHOD',
	'CONTENT_TYPE',
	'CONTENT_LENGTH'
);

foreach ($_SERVER as $key => $value) {
	// output only particular headers, we don't want to give away people's
	if ( substr($key, 0, 5) == 'HTTP_' || in_array($key, $outputHeaders) ) {
		echo $key . ': ' . $value . "\n";
	}
}