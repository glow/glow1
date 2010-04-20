<?php

parse_str(file_get_contents('php://input'), $inputVars);
echo $_SERVER['REQUEST_METHOD'] . ': ' . $inputVars['hello'];
