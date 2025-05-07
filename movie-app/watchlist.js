// Watchlist functionality for Cinevoxa
// This script adds the ability to save movies to a watchlist

// Initialize the watchlist system
document.addEventListener('DOMContentLoaded', function() {
    // Initialize watchlist buttons on movie cards
    initWatchlistButtons();
    
    // Load and display watchlist if on watchlist page
    if (window.location.pathname.includes('watchlist.html')) {
        displayWatchlist();
    }
});

// Initialize "Add to Watchlist" buttons on all movie cards
function initWatchlistButtons() {
    // Wait for movies to be loaded
    setTimeout(() => {
        const movieCards = document.querySelectorAll('.movie-card');
        
        movieCards.forEach(card => {
            // Don't add button if it already exists
            if (card.querySelector('.watchlist-btn')) return;
            
            // Get movie data from the card
            const title = card.querySelector('.movie-title').textContent;
            const year = card.querySelector('.movie-year').textContent;
            const description = card.querySelector('.movie-description').textContent;
            const rating = card.querySelector('.movie-rating').textContent.trim();
            const source = card.querySelector('.movie-source').textContent;
            const posterSrc = card.querySelector('.movie-poster').src;
            
            // Create movie object
            const movie = {
                id: generateMovieId(title, source),
                title,
                year,
                description,
                rating,
                source,
                poster: posterSrc
            };
            
            // Check if movie is already in watchlist
            const isInWatchlist = checkIfInWatchlist(movie.id);
            
            // Create watchlist button
            const watchlistBtn = document.createElement('button');
            watchlistBtn.className = `watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}`;
            watchlistBtn.innerHTML = isInWatchlist ? 
                '<span class="watchlist-icon">★</span> In Watchlist' : 
                '<span class="watchlist-icon">☆</span> Add to Watchlist';
            
            // Add click event to toggle watchlist status
            watchlistBtn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent card click event
                toggleWatchlist(movie, watchlistBtn);
            });
            
            // Add button to movie card
            const movieInfo = card.querySelector('.movie-info');
            movieInfo.appendChild(watchlistBtn);
        });
    }, 1000); // Wait for 1 second to ensure movies are loaded
}

// Generate a unique ID for the movie
function generateMovieId(title, source) {
    return `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${source.toLowerCase()}`;
}

// Check if a movie is already in the watchlist
function checkIfInWatchlist(movieId) {
    const watchlist = getWatchlist();
    return watchlist.some(item => item.id === movieId);
}

// Toggle movie in/out of watchlist
function toggleWatchlist(movie, button) {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('cinevoxa_current_user')) || 
                 JSON.parse(sessionStorage.getItem('cinevoxa_current_user'));
    
    if (!user) {
        // User not logged in, redirect to auth page
        showToast('Please log in to use watchlist feature');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return;
    }
    
    const watchlist = getWatchlist();
    const existingIndex = watchlist.findIndex(item => item.id === movie.id);
    
    if (existingIndex >= 0) {
        // Remove from watchlist
        watchlist.splice(existingIndex, 1);
        saveWatchlist(watchlist);
        
        button.classList.remove('in-watchlist');
        button.innerHTML = '<span class="watchlist-icon">☆</span> Add to Watchlist';
        showToast('Removed from watchlist');
    } else {
        // Add to watchlist
        watchlist.push(movie);
        saveWatchlist(watchlist);
        
        button.classList.add('in-watchlist');
        button.innerHTML = '<span class="watchlist-icon">★</span> In Watchlist';
        showToast('Added to watchlist');
    }
}

// Get watchlist from localStorage
function getWatchlist() {
    const user = JSON.parse(localStorage.getItem('cinevoxa_current_user')) || 
                 JSON.parse(sessionStorage.getItem('cinevoxa_current_user'));
    
    const userId = user ? user.id || user.email : 'guest';
    const watchlistKey = `cinevoxa_watchlist_${userId}`;
    
    return JSON.parse(localStorage.getItem(watchlistKey)) || [];
}

// Save watchlist to localStorage
function saveWatchlist(watchlist) {
    const user = JSON.parse(localStorage.getItem('cinevoxa_current_user')) || 
                 JSON.parse(sessionStorage.getItem('cinevoxa_current_user'));
    
    const userId = user ? user.id || user.email : 'guest';
    const watchlistKey = `cinevoxa_watchlist_${userId}`;
    
    localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
}

// Display watchlist on watchlist page
function displayWatchlist() {
    const watchlist = getWatchlist();
    const container = document.getElementById('watchlist-container');
    
    if (!container) return;
    
    // Clear container
    container.innerHTML = '';
    
    if (watchlist.length === 0) {
        container.innerHTML = `
            <div class="empty-watchlist">
                <h2>Your watchlist is empty</h2>
                <p>Movies you add to your watchlist will appear here.</p>
                <a href="index.html" class="browse-movies-btn">Browse Movies</a>
            </div>
        `;
        return;
    }
    
    // Create a movie card for each watchlist item
    watchlist.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        
        // Truncate description if needed
        const overview = movie.description && movie.description.length > 150 ? 
            movie.description.substring(0, 150) + '...' : 
            movie.description || 'No description available.';
        
        movieCard.innerHTML = `
            <img class="movie-poster" src="${movie.poster}" alt="${movie.title}" onerror="this.src='/api/placeholder/250/375'">
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-year">${movie.year}</p>
                <p class="movie-description">${overview}</p>
                <div class="movie-details">
                    <div class="movie-rating">
                        ${movie.rating}
                    </div>
                    <span class="movie-source">${movie.source}</span>
                </div>
                <button class="remove-watchlist-btn" data-id="${movie.id}">
                    <span class="watchlist-icon">✖</span> Remove
                </button>
            </div>
        `;
        
        container.appendChild(movieCard);
    });
    
    // Add event listeners to remove buttons
    document.querySelectorAll('.remove-watchlist-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const movieId = this.getAttribute('data-id');
            removeFromWatchlist(movieId);
        });
    });
}

// Remove movie from watchlist
function removeFromWatchlist(movieId) {
    const watchlist = getWatchlist();
    const newWatchlist = watchlist.filter(movie => movie.id !== movieId);
    saveWatchlist(newWatchlist);
    
    // Re-render the watchlist
    displayWatchlist();
    showToast('Removed from watchlist');
}

// Helper function to show toast notifications
// Reusing the same function from navbar.js for consistency
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

// Re-initialize watchlist buttons when new content is loaded
// This runs periodically to catch new movie cards that might be added
setInterval(initWatchlistButtons, 3000);