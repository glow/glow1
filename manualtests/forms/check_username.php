<?php
	$username = strToLower($_REQUEST['username']);
	if (empty($username)) { print "ERROR"; }
	else if ($username == "glow") { print "NOT AVAILABLE"; }
	else { print "AVAILABLE"; }
?>