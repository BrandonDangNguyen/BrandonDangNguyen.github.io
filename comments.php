<?php
// Enable CORS for development (you may want to restrict this in production)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Set the storage file
$commentsFile = 'comments_data.json';

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get the post ID from the query string
        $postId = isset($_GET['postId']) ? $_GET['postId'] : '';
        
        // Return all comments or filter by postId
        getComments($postId, $commentsFile);
        break;
        
    case 'POST':
        // Get the JSON data sent to the script
        $jsonData = file_get_contents('php://input');
        $comment = json_decode($jsonData, true);
        
        // Validate the comment data
        if (
            !$comment || 
            !isset($comment['id']) || 
            !isset($comment['name']) || 
            !isset($comment['content']) ||
            !isset($comment['date']) ||
            !isset($comment['postId'])
        ) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid comment data']);
            exit;
        }
        
        // Save the comment
        saveComment($comment, $commentsFile);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}

// Function to get comments
function getComments($postId, $commentsFile) {
    // Check if comments file exists
    if (!file_exists($commentsFile)) {
        echo json_encode([]);
        return;
    }
    
    // Read all comments
    $comments = json_decode(file_get_contents($commentsFile), true);
    
    // Filter by postId if provided
    if ($postId) {
        $comments = array_filter($comments, function($comment) use ($postId) {
            return $comment['postId'] === $postId;
        });
    }
    
    // Return comments as JSON
    echo json_encode(array_values($comments));
}

// Function to save a comment
function saveComment($comment, $commentsFile) {
    // Load existing comments
    $comments = [];
    if (file_exists($commentsFile)) {
        $comments = json_decode(file_get_contents($commentsFile), true);
    }
    
    // Add the new comment
    $comments[] = $comment;
    
    // Save the updated comments
    file_put_contents($commentsFile, json_encode($comments));
    
    // Return success response
    echo json_encode(['success' => true, 'comment' => $comment]);
}
?> 