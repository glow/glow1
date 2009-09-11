<?php

$statusCode = 200;
if (isset($_GET['code'])) {
	$statusCode = (int)$_GET['code'];
}

$host = $_SERVER['HTTP_HOST'];
$uri  = rtrim(dirname($_SERVER['PHP_SELF']), '/\\');

header('Status: ' . $statusCode);
header('Location: http://' . $host . $uri . '/basictext.txt');