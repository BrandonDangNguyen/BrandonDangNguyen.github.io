// Comments System
document.addEventListener('DOMContentLoaded', () => {
  const commentForm = document.getElementById('comment-form');
  const commentsContainer = document.getElementById('comments-container');
  
  // Check if we're on a devotional page
  if (!commentForm || !commentsContainer) return;
  
  // Clear existing test comments once
  localStorage.removeItem('devotionalComments');
  
  // Load comments from localStorage (simulated database)
  loadComments();
  
  // Handle form submission
  commentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('comment-name').value.trim();
    const content = document.getElementById('comment-content').value.trim();
    const replyTo = commentForm.getAttribute('data-reply-to') || null;
    const date = new Date();
    
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
    
    // Save comment locally
    saveComment(comment);
    
    // If it's a reply, add it under the parent comment
    if (replyTo) {
      const parentComment = document.querySelector(`.comment[data-id="${replyTo}"]`);
      if (parentComment) {
        const repliesContainer = parentComment.querySelector('.comment-replies') || 
                                createRepliesContainer(parentComment);
        addReplyToDOM(comment, repliesContainer);
      }
      
      // Reset form to normal comment mode
      resetReplyForm();
    } else {
      // Add comment to DOM at the top level
      addCommentToDOM(comment);
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
    
    // First try to load from server
    fetchCommentsFromServer(postId)
      .then(serverComments => {
        // If we got server comments, use those
        if (serverComments && serverComments.length > 0) {
          displayComments(serverComments);
        } else {
          // Fall back to localStorage if no server comments
          const localComments = JSON.parse(localStorage.getItem('devotionalComments') || '[]');
          const filteredComments = localComments.filter(comment => comment.postId === postId);
          
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
    // Separate top-level comments and replies
    const topLevelComments = allComments.filter(comment => !comment.replyTo);
    const replies = allComments.filter(comment => comment.replyTo);
    
    if (topLevelComments.length === 0) {
      commentsContainer.innerHTML = '<p class="no-comments">No comments yet. Be the first to share your thoughts!</p>';
      return;
    }
    
    // Sort comments by date (newest first)
    topLevelComments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear container
    commentsContainer.innerHTML = '';
    
    // Add each top-level comment to DOM
    topLevelComments.forEach(comment => {
      addCommentToDOM(comment);
      
      // Find replies for this comment
      const commentReplies = replies.filter(reply => reply.replyTo === comment.id);
      if (commentReplies.length > 0) {
        const commentElement = document.querySelector(`.comment[data-id="${comment.id}"]`);
        const repliesContainer = createRepliesContainer(commentElement);
        
        // Sort replies by date (newest first)
        commentReplies.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Add replies
        commentReplies.forEach(reply => {
          addReplyToDOM(reply, repliesContainer);
        });
      }
    });
  }
  
  // Fetch comments from server
  function fetchCommentsFromServer(postId) {
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
    const comments = JSON.parse(localStorage.getItem('devotionalComments') || '[]');
    comments.push(comment);
    localStorage.setItem('devotionalComments', JSON.stringify(comments));
  }
  
  // Add a single comment to the DOM
  function addCommentToDOM(comment) {
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
    
    // Add to container (newest first)
    commentsContainer.insertBefore(commentElement, commentsContainer.firstChild);
  }
  
  // Add a reply to the DOM
  function addReplyToDOM(reply, repliesContainer) {
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
    
    // Add to replies container (insert at beginning for newest first)
    repliesContainer.insertBefore(replyElement, repliesContainer.firstChild);
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