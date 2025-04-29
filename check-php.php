<?php
// Simple PHP check file

header('Content-Type: application/json');

// Return some basic information
echo json_encode([
    'status' => 'success',
    'message' => 'PHP is working correctly!',
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'writable_directory' => is_writable('.'),
    'comments_file_exists' => file_exists('comments_data.json'),
    'comments_file_writable' => file_exists('comments_data.json') ? is_writable('comments_data.json') : null,
    'time' => date('Y-m-d H:i:s')
]);
?> 