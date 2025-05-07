// DOM Elements
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showLoginPasswordCheckbox = document.getElementById('show-login-password');
const showSignupPasswordCheckbox = document.getElementById('show-signup-password');
const loginPasswordInput = document.getElementById('login-password');
const signupPasswordInput = document.getElementById('signup-password');
const signupConfirmPasswordInput = document.getElementById('signup-confirm-password');
const strengthMeterFill = document.querySelector('.strength-meter-fill');
const strengthText = document.querySelector('.strength-text');

// Users database (would be replaced by server-side storage in a real application)
let users = JSON.parse(localStorage.getItem('cinevoxa_users')) || [];

// Tab switching functionality
authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and forms
        authTabs.forEach(t => t.classList.remove('active'));
        authForms.forEach(f => f.classList.remove('active'));
        
        // Add active class to current tab and form
        tab.classList.add('active');
        const targetFormId = `${tab.getAttribute('data-tab')}-form`;
        document.getElementById(targetFormId).classList.add('active');
        
        // Clear any previous error/success messages
        clearMessages();
    });
});

// Show/hide password toggle
showLoginPasswordCheckbox.addEventListener('change', function() {
    loginPasswordInput.type = this.checked ? 'text' : 'password';
});

showSignupPasswordCheckbox.addEventListener('change', function() {
    signupPasswordInput.type = this.checked ? 'text' : 'password';
    signupConfirmPasswordInput.type = this.checked ? 'text' : 'password';
});

// Password strength meter
signupPasswordInput.addEventListener('input', checkPasswordStrength);

function checkPasswordStrength() {
    const password = signupPasswordInput.value;
    let strength = 0;
    
    // Check password length
    if (password.length >= 8) {
        strength += 1;
    }
    
    // Check for mixed case
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
        strength += 1;
    }
    
    // Check for numbers
    if (password.match(/\d/)) {
        strength += 1;
    }
    
    // Check for special characters
    if (password.match(/[^a-zA-Z\d]/)) {
        strength += 1;
    }
    
    // Update strength meter
    strengthMeterFill.setAttribute('data-strength', strength);
    
    // Update strength text
    const strengthTexts = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    strengthText.textContent = `Password strength: ${strengthTexts[strength]}`;
    
    // Add appropriate color class
    const strengthColors = ['', '#ff3860', '#ffdd57', '#48c9b0', '#28c76f'];
    strengthMeterFill.style.backgroundColor = strengthColors[strength];
    strengthMeterFill.style.width = `${strength * 25}%`;
}

// Form submissions
loginForm.addEventListener('submit', handleLogin);
signupForm.addEventListener('submit', handleSignup);

function handleLogin(e) {
    e.preventDefault();
    clearMessages();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me').checked;
    
    // Validate inputs
    if (!email || !password) {
        showMessage('login-form', 'error', 'Please fill in all fields');
        return;
    }
    
    // Check if user exists
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        showMessage('login-form', 'error', 'Invalid email or password');
        return;
    }
    
    // Successful login
    showMessage('login-form', 'success', 'Login successful! Redirecting...');
    
    // Store login state if remember me is checked
    if (rememberMe) {
        localStorage.setItem('cinevoxa_current_user', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
        }));
    } else {
        sessionStorage.setItem('cinevoxa_current_user', JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email
        }));
    }
    
    // Redirect after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

function handleSignup(e) {
    e.preventDefault();
    clearMessages();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const termsAgreed = document.getElementById('terms').checked;
    
    // Validate inputs
    if (!name || !email || !password || !confirmPassword) {
        showMessage('signup-form', 'error', 'Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('signup-form', 'error', 'Passwords do not match');
        return;
    }
    
    if (password.length < 8) {
        showMessage('signup-form', 'error', 'Password must be at least 8 characters long');
        return;
    }
    
    if (!termsAgreed) {
        showMessage('signup-form', 'error', 'You must agree to the Terms of Service');
        return;
    }
    
    // Check if email is already registered
    if (users.some(u => u.email === email)) {
        showMessage('signup-form', 'error', 'Email is already registered');
        return;
    }
    
    // Create new user
    const newUser = {
        id: generateUserId(),
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
        preferences: {
            favoriteGenres: [],
            watchlist: []
        }
    };
    
    // Add user to database
    users.push(newUser);
    localStorage.setItem('cinevoxa_users', JSON.stringify(users));
    
    // Show success message
    showMessage('signup-form', 'success', 'Account created successfully! You can now log in.');
    
    // Auto-login the user after successful signup
    if (true) { // Set to false if you want them to manually log in instead
        localStorage.setItem('cinevoxa_current_user', JSON.stringify({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
        }));
        
        // Redirect to home page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } else {
        // Switch to login tab after a short delay
        setTimeout(() => {
            document.querySelector('[data-tab="login"]').click();
        }, 1500);
    }
}

// Helper functions
function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9);
}

function showMessage(formId, type, message) {
    const form = document.getElementById(formId);
    
    // Create message element if it doesn't exist
    let messageEl = form.querySelector(`.${type}-message`);
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = `${type}-message`;
        form.insertBefore(messageEl, form.firstChild);
    }
    
    messageEl.textContent = message;
    messageEl.style.display = 'block';
    
    // Apply cyberpunk styling
    messageEl.style.animation = 'formFadeIn 0.3s ease';
}

function clearMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => {
        msg.style.display = 'none';
    });
}

// Check if user is already logged in
function checkLoggedInUser() {
    const loggedInUser = JSON.parse(localStorage.getItem('cinevoxa_current_user')) || 
                         JSON.parse(sessionStorage.getItem('cinevoxa_current_user'));
    
    if (loggedInUser) {
        // Redirect to index.html if already logged in
        window.location.href = 'index.html';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkLoggedInUser();
    
    // Add cool effects
    addCyberpunkEffects();
    
    // Initialize with some test users if none exist
    if (users.length === 0) {
        initializeTestUsers();
    }
});

// Add cyberpunk visual effects
function addCyberpunkEffects() {
    // Simulate data flow effect on form inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('glowing-input');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('glowing-input');
        });
    });
    
    // Add glitch effect on buttons
    const buttons = document.querySelectorAll('.auth-button');
    
    buttons.forEach(button => {
        button.addEventListener('mouseover', function() {
            this.classList.add('glitch-effect');
        });
        
        button.addEventListener('mouseout', function() {
            this.classList.remove('glitch-effect');
        });
    });
}

// Initialize with test users for demo purposes
function initializeTestUsers() {
    const testUsers = [
        {
            id: 'user_demo123',
            name: 'Demo User',
            email: 'demo@example.com',
            password: 'Password123',
            createdAt: new Date().toISOString(),
            preferences: {
                favoriteGenres: ['action', 'sci-fi'],
                watchlist: []
            }
        },
        {
            id: 'user_test456',
            name: 'Test Account',
            email: 'test@example.com',
            password: 'Password123',
            createdAt: new Date().toISOString(),
            preferences: {
                favoriteGenres: ['comedy', 'drama'],
                watchlist: []
            }
        }
    ];
    
    users = testUsers;
    localStorage.setItem('cinevoxa_users', JSON.stringify(users));
}