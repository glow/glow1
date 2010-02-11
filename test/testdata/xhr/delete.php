<?php

if ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
	echo 'DELETE request';
}
else {
	echo 'NOT a delete request';
}


