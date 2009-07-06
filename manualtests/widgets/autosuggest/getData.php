<?php
	$q = $_GET['q'];
	
	if (empty($q)) {
		print '[]';
	}
	else {
		@$xml = file_get_contents(
			'http://google.com/complete/search?output=toolbar&q='.urlencode($q)
		);
		
		preg_match_all('/ data="([^"]+)"/', $xml, $matches);
		
		print '[';
		for ($i = 0, $c = count($matches[1]); $i < $c; $i++) {
			print'{name:"'.$matches[1][$i].'"}';
			if ($i < $c-1) print ",\n";
		}
		print '];';
	}