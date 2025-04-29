# Brandon Nguyen's Devotional Blog

This repository contains the code for Brandon Nguyen's personal devotional blog.

## Comments System

The comments system uses a combination of client-side storage and server-side PHP:

1. **Client-side**: Comments are initially stored in the browser's localStorage as a fallback
2. **Server-side**: Comments are sent to and retrieved from a PHP backend that stores them in a JSON file

### Setting Up the Comments System

#### Server Requirements

- PHP 7.0 or higher
- Write permissions for the web server in the website directory (to create and modify the `comments_data.json` file)

#### Hosting Instructions

1. Make sure your hosting provider supports PHP (most do)
2. Upload all files to your web hosting server
3. Ensure the web server has write permissions in the directory where `comments.php` is located
4. Test the comments system by adding a comment to one of the devotional pages

#### Local Development

For local development, you'll need a PHP server. You can use:

- XAMPP (Windows, Mac, Linux)
- MAMP (Mac, Windows)
- PHP's built-in server: `php -S localhost:8000`

#### Troubleshooting

If comments aren't showing across devices:

1. Check that `comments.php` is accessible (try visiting it directly in your browser)
2. Check that the `comments_data.json` file exists and is writable
3. Look for errors in your browser's console
4. Verify the server's PHP error log

#### Moving to a Database (Future Enhancement)

For higher traffic or more robust storage, consider upgrading from file-based storage to a database:

1. Set up a MySQL/MariaDB database
2. Create a comments table with appropriate fields
3. Modify `comments.php` to use database queries instead of file I/O

## License

All rights reserved. © 2025 Brandon Nguyen. 