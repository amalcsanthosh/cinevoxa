document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    // Check if user is logged in
    const loggedInUser = JSON.parse(localStorage.getItem('cinevoxa_current_user')) || 
                         JSON.parse(sessionStorage.getItem('cinevoxa_current_user'));
    
    // Update the navbar based on login status
    updateNavbar(loggedInUser);
    
    // Toggle menu on mobile
    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('show');
            
            // Toggle between hamburger and X icon
            this.classList.toggle('active');
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        const isClickInsideNav = navMenu.contains(event.target) || navToggle.contains(event.target);
        if (!isClickInsideNav && navMenu.classList.contains('show')) {
            navMenu.classList.remove('show');
            navToggle.classList.remove('active');
        }
    });
    
    // Add scroll effect to navbar
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });
    
    // Handle logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

// Function to update navbar UI based on login status
function updateNavbar(user) {
    const authNavItem = document.querySelector('.nav-item:last-child');
    
    if (user) {
        // User is logged in, show profile and logout option
        authNavItem.innerHTML = `
            <div class="user-profile-dropdown">
                <a href="#" class="nav-link profile-link">
                    <span class="user-name">${user.name}</span>
                    <span class="dropdown-icon">▼</span>
                </a>
                <div class="dropdown-menu">
                    <a href="#" class="dropdown-item">My Profile</a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item" id="logout-btn">Logout</a>
                </div>
            </div>
        `;
        
        // Add dropdown toggle functionality
        const profileLink = document.querySelector('.profile-link');
        const dropdownMenu = document.querySelector('.dropdown-menu');
        
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownMenu.classList.toggle('show-dropdown');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.user-profile-dropdown')) {
                if (dropdownMenu.classList.contains('show-dropdown')) {
                    dropdownMenu.classList.remove('show-dropdown');
                }
            }
        });
        
    } else {
        // User is not logged in, show login/signup link
        authNavItem.innerHTML = `
            <a href="auth.html" class="nav-link highlight">Login / Sign Up</a>
        `;
    }
}

// Function to handle logout
function logout() {
    // Remove user data from storage
    localStorage.removeItem('cinevoxa_current_user');
    sessionStorage.removeItem('cinevoxa_current_user');
    
    // Show feedback toast
    showToast('Logged out successfully!');
    
    // Redirect to home page after short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Helper function to show toast notifications
function showToast(message) {
    // Create toast element if it doesn't exist
    let toast = document.getElementById('toast-notification');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        document.body.appendChild(toast);
    }
    
    // Set message and show toast
    toast.textContent = message;
    toast.classList.add('show-toast');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show-toast');
    }, 3000);
}