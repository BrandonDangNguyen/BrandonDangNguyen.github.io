// Comments System
document.addEventListener('DOMContentLoaded', () => {
  // Debug check at the start
  console.log("Comments system initializing...");
  console.log("localStorage available:", typeof localStorage !== 'undefined');
  
  const commentForm = document.getElementById('comment-form');
  const commentsContainer = document.getElementById('comments-container');
  
  // Debug check for elements
  console.log("Found comment form:", commentForm !== null);
  console.log("Found comments container:", commentsContainer !== null);
  
  // Check if we're on a devotional page
  if (!commentForm || !commentsContainer) {
    console.log("Not on a devotional page or missing elements. Stopping initialization.");
    return;
  }
  
  // Load comments from localStorage (simulated database)
  loadComments();
  
  // Handle form submission
  commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log("Form submitted");
    
    // Get form values
    const name = document.getElementById('comment-name').value.trim();
    const content = document.getElementById('comment-content').value.trim();
    const replyTo = commentForm.getAttribute('data-reply-to') || null;
    const date = new Date();
    
    console.log("Form values:", { name, content, replyTo });
    
    // Simple validation
    if (!name || !content) {
      alert('Please fill out all fields');
      return;
    }
    
    // Create comment object
    const comment = {
      id: Date.now().toString(),
      name,
      content,
      date: date.toISOString(),
      postId: getPostId(),
      replyTo: replyTo
    };
    
    console.log("Created comment object:", comment);
    
    // Save comment locally
    saveComment(comment);
    
    // If it's a reply, add it under the parent comment
    if (replyTo) {
      const parentComment = document.querySelector(`.comment[data-id="${replyTo}"]`);
      if (parentComment) {
        const repliesContainer = parentComment.querySelector('.comment-replies') || 
                                createRepliesContainer(parentComment);
        addReplyToDOM(comment, repliesContainer, { prepend: true });
      }
      
      // Reset form to normal comment mode
      resetReplyForm();
    } else {
      // Add comment to DOM at the top level
      addCommentToDOM(comment, { prepend: true });
    }
    
    // Reset form
    commentForm.reset();
    
    // Send to server
    sendCommentToServer(comment);
  });
  
  // Cancel reply button event
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('cancel-reply')) {
      e.preventDefault();
      resetReplyForm();
    }
    
    // Reply button
    if (e.target.classList.contains('reply-button')) {
      e.preventDefault();
      const commentId = e.target.closest('.comment').getAttribute('data-id');
      const commentAuthor = e.target.closest('.comment').querySelector('.comment-author').textContent;
      setupReplyForm(commentId, commentAuthor);
    }
  });
  
  // Load comments 
  function loadComments() {
    const postId = getPostId();
    console.log("Loading comments for postId:", postId);
    
    // First try to load from server
    fetchCommentsFromServer(postId)
      .then(serverComments => {
        // If we got server comments, use those
        if (serverComments && serverComments.length > 0) {
          console.log("Loaded server comments:", serverComments.length);
          displayComments(serverComments);
        } else {
          // Fall back to localStorage if no server comments
          console.log("No server comments, checking localStorage");
          const localComments = JSON.parse(localStorage.getItem('devotionalComments') || '[]');
          console.log("Local comments (all):", localComments.length);
          const filteredComments = localComments.filter(comment => comment.postId === postId);
          console.log("Filtered comments for this post:", filteredComments.length);
          
          // If we have local comments, display them and try to sync to server
          if (filteredComments.length > 0) {
            displayComments(filteredComments);
            
            // Try to sync local comments to server
            filteredComments.forEach(comment => {
              sendCommentToServer(comment, false); // Don't refresh UI on sync
            });
          } else {
            // No comments found
            commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
          }
        }
      })
      .catch(error => {
        console.error('Error loading comments:', error);
        
        // Fall back to localStorage if server fetch fails
        const localComments = JSON.parse(localStorage.getItem('devotionalComments') || '[]');
        const filteredComments = localComments.filter(comment => comment.postId === postId);
        
        if (filteredComments.length > 0) {
          displayComments(filteredComments);
        } else {
          commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
        }
      });
  }
  
  // Display comments in the UI
  function displayComments(allComments) {
    console.log("Displaying comments:", allComments.length);

    // Create a map of replies grouped by their parent ID for efficient lookup
    const repliesByParentId = allComments.reduce((map, comment) => {
        if (comment.replyTo) {
            // Initialize array if it doesn't exist, then push the reply
            (map[comment.replyTo] = map[comment.replyTo] || []).push(comment);
        }
        return map;
    }, {});

    // Sort replies within each group by date (newest first)
    Object.values(repliesByParentId).forEach(group => group.sort((a, b) => new Date(b.date) - new Date(a.date)));

    // Filter and sort top-level comments (newest first)
    const topLevelComments = allComments
        .filter(comment => !comment.replyTo)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); 

    console.log("Top-level comments:", topLevelComments.length);
    
    // Clear the main container before rendering
    commentsContainer.innerHTML = ''; 

    if (topLevelComments.length === 0 && Object.keys(repliesByParentId).length === 0) { // Check if there are truly no comments at all
      commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
      return;
    }

    // Helper function to create the DOM element for a single comment or reply
    function renderCommentElement(comment, isReply = false) {
        const element = document.createElement('div');
        element.classList.add('comment');
        if (isReply) {
            element.classList.add('comment-reply');
        }
        element.setAttribute('data-id', comment.id);

        const commentDate = new Date(comment.date);
        const formattedDate = formatTimeAgo(commentDate);

        // Re-use the existing HTML structure for consistency
        element.innerHTML = `
          <div class="comment-header">
            <div class="comment-avatar">${getInitials(comment.name)}</div>
            <div class="comment-meta">
              <span class="comment-author">${escapeHTML(comment.name)}</span>
              <span class="comment-date">${formattedDate}</span>
            </div>
          </div>
          <div class="comment-content">
            <p>${escapeHTML(comment.content).replace(/\n/g, '<br>')}</p>
          </div>
          <div class="comment-actions">
            <button class="reply-button">Reply</button>
          </div>
        `;
        return element;
    }

    // Recursive function to render a comment and its entire reply subtree
    function appendCommentTree(comment, containerElement) {
        // Create the element for the current comment (could be top-level or a reply)
        const commentElement = renderCommentElement(comment, !!comment.replyTo);
        // Append it to the appropriate container (either main container or a parent's reply container)
        containerElement.appendChild(commentElement); 

        // Find replies specifically for THIS comment
        const replies = repliesByParentId[comment.id] || [];
        
        // If this comment has replies, render them recursively
        if (replies.length > 0) {
            // Ensure the .comment-replies container exists within the current comment element
            const repliesContainer = createRepliesContainer(commentElement); 
            // Append each reply (which are already sorted) into the replies container
            replies.forEach(reply => appendCommentTree(reply, repliesContainer));
        }
    }

    // Start the rendering process for each top-level comment
    topLevelComments.forEach(comment => appendCommentTree(comment, commentsContainer));
  }
  
  // Fetch comments from server
  function fetchCommentsFromServer(postId) {
    console.log("Fetching comments from server for postId:", postId);
    return fetch(`comments.php?postId=${encodeURIComponent(postId)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }
        return response.json();
      });
  }
  
  // Send comment to server
  function sendCommentToServer(comment, refreshUI = true) {
    console.log("Sending comment to server:", comment.id);
    fetch('comments.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(comment)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Comment saved to server:', data);
      if (refreshUI) {
        // Optionally refresh comments after server confirmation
        loadComments();
      }
    })
    .catch(error => {
      console.error('Error saving comment to server:', error);
      // Comment is already saved locally as fallback
    });
  }
  
  // Save comment to localStorage
  function saveComment(comment) {
    console.log("Saving comment to localStorage:", comment.id);
    try {
      const comments = JSON.parse(localStorage.getItem('devotionalComments') || '[]');
      comments.push(comment);
      localStorage.setItem('devotionalComments', JSON.stringify(comments));
      console.log("Comment saved to localStorage successfully");
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }
  
  // Add a single comment to the DOM
  function addCommentToDOM(comment, { prepend = false } = {}) {
    console.log("Adding comment to DOM:", comment.id, "prepend:", prepend);
    // Remove "no comments" message if it exists
    const noComments = commentsContainer.querySelector('.no-comments');
    if (noComments) {
      commentsContainer.removeChild(noComments);
    }
    
    // Create comment element
    const commentElement = document.createElement('div');
    commentElement.classList.add('comment');
    commentElement.setAttribute('data-id', comment.id);
    
    // Format date
    const commentDate = new Date(comment.date);
    const formattedDate = formatTimeAgo(commentDate);
    
    // Set comment HTML
    commentElement.innerHTML = `
      <div class="comment-header">
        <div class="comment-avatar">${getInitials(comment.name)}</div>
        <div class="comment-meta">
          <span class="comment-author">${escapeHTML(comment.name)}</span>
          <span class="comment-date">${formattedDate}</span>
        </div>
      </div>
      <div class="comment-content">
        <p>${escapeHTML(comment.content).replace(/\n/g, '<br>')}</p>
      </div>
      <div class="comment-actions">
        <button class="reply-button">Reply</button>
      </div>
    `;
    
    // Add to container (newest first if prepend is true, otherwise append)
    if (prepend) {
      commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
    } else {
      commentsContainer.appendChild(commentElement);
    }
  }
  
  // Add a reply to the DOM
  function addReplyToDOM(reply, repliesContainer, { prepend = false } = {}) {
    console.log("Adding reply to DOM:", reply.id, "prepend:", prepend);
    // Create reply element
    const replyElement = document.createElement('div');
    replyElement.classList.add('comment', 'comment-reply');
    replyElement.setAttribute('data-id', reply.id);
    
    // Format date
    const replyDate = new Date(reply.date);
    const formattedDate = formatTimeAgo(replyDate);
    
    // Set reply HTML
    replyElement.innerHTML = `
      <div class="comment-header">
        <div class="comment-avatar">${getInitials(reply.name)}</div>
        <div class="comment-meta">
          <span class="comment-author">${escapeHTML(reply.name)}</span>
          <span class="comment-date">${formattedDate}</span>
        </div>
      </div>
      <div class="comment-content">
        <p>${escapeHTML(reply.content).replace(/\n/g, '<br>')}</p>
      </div>
      <div class="comment-actions">
        <button class="reply-button">Reply</button>
      </div>
    `;
    
    // Add to replies container (insert at beginning for prepend, otherwise append)
    if (prepend) {
      repliesContainer.insertBefore(replyElement, repliesContainer.firstChild);
    } else {
      repliesContainer.appendChild(replyElement);
    }
  }
  
  // Create a container for replies
  function createRepliesContainer(commentElement) {
    let repliesContainer = commentElement.querySelector('.comment-replies');
    
    if (!repliesContainer) {
      repliesContainer = document.createElement('div');
      repliesContainer.classList.add('comment-replies');
      commentElement.appendChild(repliesContainer);
    }
    
    return repliesContainer;
  }
  
  // Setup form for replying
  function setupReplyForm(commentId, authorName) {
    const formTitle = commentForm.querySelector('h4');
    formTitle.innerHTML = `Reply to <span class="reply-to-name">${escapeHTML(authorName)}</span>`;
    
    commentForm.setAttribute('data-reply-to', commentId);
    commentForm.classList.add('replying');
    
    // Add cancel button if not already there
    if (!commentForm.querySelector('.cancel-reply')) {
      const submitButton = commentForm.querySelector('.submit-comment');
      const cancelButton = document.createElement('button');
      cancelButton.type = 'button';
      cancelButton.classList.add('cancel-reply');
      cancelButton.textContent = 'Cancel';
      submitButton.parentNode.insertBefore(cancelButton, submitButton);
    }
    
    // Focus the comment textarea
    commentForm.querySelector('textarea').focus();
    
    // Scroll to the form
    commentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  // Reset reply form to normal comment mode
  function resetReplyForm() {
    const formTitle = commentForm.querySelector('h4');
    formTitle.textContent = 'Share Your Thoughts';
    
    commentForm.removeAttribute('data-reply-to');
    commentForm.classList.remove('replying');
    
    // Remove cancel button if it exists
    const cancelButton = commentForm.querySelector('.cancel-reply');
    if (cancelButton) {
      cancelButton.remove();
    }
  }
  
  // Format a date as time ago (e.g. "2 hours ago")
  function formatTimeAgo(date) {
    // Convert to Pacific Time
    const pacificTime = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    
    // Calculate time difference in seconds
    const seconds = Math.floor((now - pacificTime) / 1000);
    
    // If the time difference is negative (server time is ahead of PT time),
    // default to "Just now" to avoid showing future times
    if (seconds < 0) {
      return 'Just now';
    }
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval === 1 ? '1 year ago' : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval === 1 ? '1 month ago' : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? '1 day ago' : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
    }
    
    return 'Just now';
  }
  
  // Clear all comments from localStorage
  function clearAllComments() {
    localStorage.removeItem('devotionalComments');
    commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
    console.log('All comments have been cleared');
  }
  
  // Get initials from name for avatar
  function getInitials(name) {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  }
  
  // Get current post ID from URL
  function getPostId() {
    // Extract filename from URL path
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return filename.replace('.html', '');
  }
  
  // Sanitize HTML to prevent XSS
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}); 
