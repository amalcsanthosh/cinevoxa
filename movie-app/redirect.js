// This script enables automatic redirection to login/profile pages
// based on user authentication status

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const loggedInUser = JSON.parse(localStorage.getItem('cinevoxa_current_user')) || 
                         JSON.parse(sessionStorage.getItem('cinevoxa_current_user'));
    
    // Get URL parameters to check if redirected from login or logout
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    // Show welcome message if just logged in
    if (action === 'login' && loggedInUser) {
        showWelcomeMessage(loggedInUser.name);
    }
    
    // If user clicks on profile-only features while not logged in
    const profileLinks = document.querySelectorAll('.requires-auth');
    profileLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!loggedInUser) {
                e.preventDefault();
                
                // Store the intended destination
                sessionStorage.setItem('cinevoxa_redirect_after_login', this.getAttribute('href'));
                
                // Show notification
                showLoginPrompt();
                
                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = 'auth.html';
                }, 1500);
            }
        });
    });
});

// Function to show welcome message after login
function showWelcomeMessage(userName) {
    // Create welcome toast
    let toast = document.createElement('div');
    toast.id = 'welcome-toast';
    toast.innerHTML = `
        <div class="welcome-icon">👋</div>
        <div class="welcome-message">
            <strong>Welcome back, ${userName}!</strong>
            <p>Enjoy exploring the latest movies</p>
        </div>
    `;
    
    // Add styles
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = 'rgba(20, 20, 40, 0.95)';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.border = '1px solid rgba(76, 0, 255, 0.3)';
    toast.style.borderLeft = '5px solid #4c00ff';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2), 0 0 15px rgba(76, 0, 255, 0.2)';
    toast.style.padding = '15px';
    toast.style.color = '#ffffff';
    toast.style.zIndex = '9999';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '15px';
    toast.style.maxWidth = '350px';
    toast.style.transform = 'translateX(400px)';
    toast.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    
    // Welcome icon styles
    const icon = toast.querySelector('.welcome-icon');
    icon.style.fontSize = '28px';
    icon.style.background = 'linear-gradient(135deg, #4c00ff, #00e8ff)';
    icon.style.WebkitBackgroundClip = 'text';
    icon.style.WebkitTextFillColor = 'transparent';
    icon.style.padding = '5px';
    
    // Message styles
    const message = toast.querySelector('.welcome-message');
    message.style.display = 'flex';
    message.style.flexDirection = 'column';
    message.style.gap = '5px';
    
    message.querySelector('strong').style.fontSize = '16px';
    message.querySelector('p').style.margin = '0';
    message.querySelector('p').style.fontSize = '14px';
    message.querySelector('p').style.opacity = '0.8';
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide toast after 5 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 5000);
}

// Function to show login prompt for protected features
function showLoginPrompt() {
    // Create login prompt toast
    let toast = document.createElement('div');
    toast.id = 'login-prompt-toast';
    toast.innerHTML = `
        <div class="login-icon">🔒</div>
        <div class="login-message">
            <strong>Login Required</strong>
            <p>Please log in to access this feature</p>
        </div>
    `;
    
    // Add styles
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = 'rgba(20, 20, 40, 0.95)';
    toast.style.backdropFilter = 'blur(10px)';
    toast.style.border = '1px solid rgba(255, 76, 76, 0.3)';
    toast.style.borderLeft = '5px solid #ff4c4c';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.2), 0 0 15px rgba(255, 76, 76, 0.2)';
    toast.style.padding = '15px';
    toast.style.color = '#ffffff';
    toast.style.zIndex = '9999';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '15px';
    toast.style.maxWidth = '350px';
    toast.style.transform = 'translateX(400px)';
    toast.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
    
    // Icon styles
    const icon = toast.querySelector('.login-icon');
    icon.style.fontSize = '28px';
    icon.style.background = 'linear-gradient(135deg, #ff4c4c, #ff8f8f)';
    icon.style.WebkitBackgroundClip = 'text';
    icon.style.WebkitTextFillColor = 'transparent';
    icon.style.padding = '5px';
    
    // Message styles
    const message = toast.querySelector('.login-message');
    message.style.display = 'flex';
    message.style.flexDirection = 'column';
    message.style.gap = '5px';
    
    message.querySelector('strong').style.fontSize = '16px';
    message.querySelector('p').style.margin = '0';
    message.querySelector('p').style.fontSize = '14px';
    message.querySelector('p').style.opacity = '0.8';
    
    // Add to document
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}