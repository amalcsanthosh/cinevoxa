// API Keys and URLs
const TMDB_API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c'; // This is a public API key for TMDB
const OMDB_API_KEY = 'fc1fef96'; // Free API key for OMDb

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OMDB_BASE_URL = 'https://www.omdbapi.com';
const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// DOM Elements
const moviesContainer = document.getElementById('movies-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const filterButtons = document.querySelectorAll('.filter-btn');
const apiButtons = document.querySelectorAll('.api-btn');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');

// Current states
let currentFilter = 'now_playing';
let currentApi = 'all';
let currentPage = 1;
let totalPages = 1;
let isSearchMode = false;
let isIndianFilter = false;
let isLoading = false;

// Cache system
const movieCache = {
    tmdb: {},
    omdb: {},
    tvmaze: {},
    getKey(source, filter, page, searchTerm = '') {
        return `${source}_${filter}_${page}_${searchTerm}`;
    },
    store(source, filter, page, searchTerm, data) {
        const key = this.getKey(source, filter, page, searchTerm);
        this[source][key] = {
            data: data,
            timestamp: Date.now()
        };
        // Limit cache size
        this.cleanupCache(source);
    },
    get(source, filter, page, searchTerm) {
        const key = this.getKey(source, filter, page, searchTerm);
        const cached = this[source][key];
        
        // Check if cache exists and is fresh (less than 5 minutes old)
        if (cached && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
            return cached.data;
        }
        
        return null;
    },
    cleanupCache(source) {
        // Keep cache size reasonable by removing oldest entries
        const MAX_CACHE_ITEMS = 20;
        const cache = this[source];
        const keys = Object.keys(cache);
        
        if (keys.length > MAX_CACHE_ITEMS) {
            // Sort by timestamp (oldest first)
            keys.sort((a, b) => cache[a].timestamp - cache[b].timestamp);
            // Remove oldest items
            for (let i = 0; i < keys.length - MAX_CACHE_ITEMS; i++) {
                delete cache[keys[i]];
            }
        }
    }
};

// Store pagination info for each API source separately
let paginationInfo = {
    tmdb: { currentPage: 1, totalPages: 1 },
    omdb: { currentPage: 1, totalPages: 1 },
    tvmaze: { currentPage: 1, totalPages: 1 }
};

// Batch process API requests using Promise.all
async function fetchTMDBMovies(filter, page = 1, searchTerm = '') {
    // Check cache first
    const cachedData = movieCache.get('tmdb', filter, page, searchTerm);
    if (cachedData) {
        console.log('Using cached TMDB data');
        // Update pagination info from cache
        paginationInfo.tmdb.totalPages = Math.min(cachedData.totalPages || 1, 10);
        paginationInfo.tmdb.currentPage = page;
        updateOverallPagination();
        return cachedData.results;
    }
    
    try {
        let url;
        
        if (filter === 'indian') {
            url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi|ta|te|ml|bn&region=IN&page=${page}`;
            isIndianFilter = true;
        } else if (isSearchMode && searchTerm) {
            url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTerm)}&page=${page}`;
            isIndianFilter = false;
        } else {
            url = `${TMDB_BASE_URL}/movie/${filter}?api_key=${TMDB_API_KEY}&page=${page}`;
            isIndianFilter = false;
        }
        
        console.log("Fetching from TMDB URL:", url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Update TMDB pagination info
        paginationInfo.tmdb.totalPages = Math.min(data.total_pages || 1, 10);
        paginationInfo.tmdb.currentPage = page;
        
        // Update overall pagination
        updateOverallPagination();
        
        // Transform and cache results
        const results = data.results ? data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown',
            description: movie.overview || 'No description available.',
            poster: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : null,
            rating: movie.vote_average || 'N/A',
            source: 'TMDB'
        })) : [];
        
        // Store in cache
        movieCache.store('tmdb', filter, page, searchTerm, {
            results: results,
            totalPages: data.total_pages || 1
        });
        
        return results;
    } catch (error) {
        console.error('Error fetching TMDB movies:', error);
        return [];
    }
}

// Optimized OMDb fetch with batch processing
async function fetchOMDbMovies(searchTerm, page = 1) {
    // Check cache first
    const cachedData = movieCache.get('omdb', isIndianFilter ? 'indian' : 'general', page, searchTerm);
    if (cachedData) {
        console.log('Using cached OMDb data');
        // Update pagination info from cache
        paginationInfo.omdb.totalPages = cachedData.totalPages;
        paginationInfo.omdb.currentPage = page;
        updateOverallPagination();
        return cachedData.results;
    }
    
    try {
        let searchQuery;
        
        if (isIndianFilter) {
            // For Indian filter, use specific terms related to Indian cinema
            const indianTerms = ['bollywood', 'tollywood', 'indian', 'hindi', 'tamil', 'telugu'];
            searchQuery = indianTerms[Math.floor(Math.random() * indianTerms.length)];
        } else {
            searchQuery = searchTerm || getRandomTerm();
        }
        
        const url = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchQuery)}&type=movie&page=${page}`;
        
        console.log("Fetching from OMDb URL:", url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.Response === 'True' && data.Search) {
            // Update OMDb pagination info
            const totalPagesCalc = Math.min(Math.ceil(data.totalResults / 10) || 1, 5);
            paginationInfo.omdb.totalPages = totalPagesCalc;
            paginationInfo.omdb.currentPage = page;
            
            // Update overall pagination
            updateOverallPagination();
            
            // Process movies in parallel instead of sequentially
            const moviesToProcess = data.Search.slice(0, 5);
            const detailPromises = moviesToProcess.map(movie => 
                fetch(`${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${movie.imdbID}`)
                    .then(resp => resp.json())
                    .catch(err => {
                        console.error('Error fetching movie details:', err);
                        return null;
                    })
            );
            
            // Wait for all detail requests to complete
            const detailResults = await Promise.all(detailPromises);
            
            // Transform results
            const movies = detailResults
                .filter(detail => detail && detail.Response === 'True')
                .filter(detail => {
                    if (!isIndianFilter) return true;
                    
                    // If in Indian filter mode, only include Indian movies
                    return (detail.Country && detail.Country.includes('India')) ||
                           (detail.Language && 
                            (detail.Language.includes('Hindi') || 
                             detail.Language.includes('Tamil') ||
                             detail.Language.includes('Telugu') ||
                             detail.Language.includes('Malayalam') ||
                             detail.Language.includes('Bengali')));
                })
                .map(detail => ({
                    id: detail.imdbID,
                    title: detail.Title,
                    year: detail.Year,
                    description: detail.Plot || 'No description available.',
                    poster: detail.Poster !== 'N/A' ? detail.Poster : null,
                    rating: detail.imdbRating,
                    source: 'OMDb'
                }));
            
            // Store in cache
            movieCache.store('omdb', isIndianFilter ? 'indian' : 'general', page, searchTerm, {
                results: movies,
                totalPages: totalPagesCalc
            });
            
            return movies;
        }
        return [];
    } catch (error) {
        console.error('Error fetching OMDb movies:', error);
        return [];
    }
}

// Optimized TVMaze fetch
async function fetchTVMazeShows(searchTerm, page = 1) {
    // Check cache first
    const cachedData = movieCache.get('tvmaze', isIndianFilter ? 'indian' : 'general', page, searchTerm);
    if (cachedData) {
        console.log('Using cached TVMaze data');
        // Update pagination info from cache
        paginationInfo.tvmaze.totalPages = cachedData.totalPages;
        paginationInfo.tvmaze.currentPage = page;
        updateOverallPagination();
        return cachedData.results;
    }
    
    try {
        let searchQuery;
        
        if (isIndianFilter) {
            // Use Indian-specific terms
            const indianTerms = ['bollywood', 'indian', 'hindi', 'tamil', 'telugu'];
            searchQuery = indianTerms[Math.floor(Math.random() * indianTerms.length)];
        } else {
            searchQuery = searchTerm || getRandomTerm();
        }
        
        // For pagination (TVMaze doesn't support page parameter directly)
        const offset = (page - 1) * 5;
        const url = `${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(searchQuery + (offset > 0 ? ' ' + offset : ''))}`;
        
        console.log("Fetching from TVMaze URL:", url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.length > 0) {
            // Update TVMaze pagination info
            paginationInfo.tvmaze.totalPages = 3; // Reasonable limit
            paginationInfo.tvmaze.currentPage = page;
            
            // Update overall pagination
            updateOverallPagination();
            
            // Process results
            let results = data.map(item => {
                const show = item.show;
                let description = 'No description available.';
                
                // Clean HTML from summary
                if (show.summary) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = show.summary;
                    description = tempDiv.textContent || tempDiv.innerText || 'No description available.';
                }
                
                return {
                    id: show.id,
                    title: show.name,
                    year: show.premiered ? new Date(show.premiered).getFullYear() : 'Unknown',
                    description: description,
                    poster: show.image && show.image.medium ? show.image.medium : null,
                    rating: show.rating && show.rating.average ? show.rating.average : 'N/A',
                    source: 'TVMaze'
                };
            });
            
            // Filter for Indian content if needed
            if (isIndianFilter) {
                results = results.filter(show => 
                    show.title.includes('Indian') || 
                    show.title.includes('Hindi') || 
                    show.title.includes('Tamil') || 
                    show.title.includes('Telugu') || 
                    show.description.includes('India') ||
                    show.description.includes('Indian')
                );
            }
            
            // Store in cache
            movieCache.store('tvmaze', isIndianFilter ? 'indian' : 'general', page, searchTerm, {
                results: results,
                totalPages: 3
            });
            
            return results;
        }
        return [];
    } catch (error) {
        console.error('Error fetching TVMaze shows:', error);
        return [];
    }
}

// Get random search term for initial load
function getRandomTerm() {
    const terms = ['movie', 'adventure', 'action', 'comedy', 'drama', 'sci-fi'];
    return terms[Math.floor(Math.random() * terms.length)];
}

// Update the overall pagination
function updateOverallPagination() {
    if (currentApi === 'all') {
        // For 'all' sources, use the maximum totalPages from all sources
        totalPages = Math.max(
            paginationInfo.tmdb.totalPages,
            paginationInfo.omdb.totalPages,
            paginationInfo.tvmaze.totalPages
        );
    } else if (currentApi === 'tmdb') {
        totalPages = paginationInfo.tmdb.totalPages;
    } else if (currentApi === 'omdb') {
        totalPages = paginationInfo.omdb.totalPages;
    } else if (currentApi === 'tvmaze') {
        totalPages = paginationInfo.tvmaze.totalPages;
    }
    
    // Update button states
    updatePaginationButtons();
}

// Progressive loading optimization
async function fetchMovies() {
    if (isLoading) return; // Prevent multiple simultaneous fetches
    isLoading = true;
    
    // Show loading indicator
    moviesContainer.innerHTML = '<div class="loading">Loading movies...</div>';
    
    const searchTerm = searchInput.value.trim();
    
    // Set Indian filter flag based on currentFilter
    isIndianFilter = (currentFilter === 'indian');
    
    try {
        // Use Promise.all to fetch from multiple APIs simultaneously
        const fetchPromises = [];
        
        // TMDB API fetching
        if (currentApi === 'all' || currentApi === 'tmdb') {
            fetchPromises.push(fetchTMDBMovies(currentFilter, 
                currentApi === 'tmdb' ? currentPage : paginationInfo.tmdb.currentPage, 
                searchTerm)
                .then(results => ({ source: 'tmdb', results })));
        }
        
        // OMDb API fetching (only if not searching for a specific filter)
        if ((currentApi === 'all' || currentApi === 'omdb') && 
            (isSearchMode || currentFilter === 'popular' || currentFilter === 'indian')) {
            fetchPromises.push(fetchOMDbMovies(searchTerm, 
                currentApi === 'omdb' ? currentPage : paginationInfo.omdb.currentPage)
                .then(results => ({ source: 'omdb', results })));
        }
        
        // TVMaze API fetching (only if not filtering by specific categories)
        if ((currentApi === 'all' || currentApi === 'tvmaze') && 
            (isSearchMode || currentFilter === 'popular' || currentFilter === 'indian')) {
            fetchPromises.push(fetchTVMazeShows(searchTerm, 
                currentApi === 'tvmaze' ? currentPage : paginationInfo.tvmaze.currentPage)
                .then(results => ({ source: 'tvmaze', results })));
        }
        
        // Wait for fastest API to respond first, then update UI progressively
        let displayedAny = false;
        const results = await Promise.all(fetchPromises.map(p => p.catch(e => ({ source: 'error', results: [] }))));
        
        // Combine all results
        const allMovies = results.flatMap(r => r.results);
        
        if (allMovies.length > 0) {
            displayMovies(allMovies);
            displayedAny = true;
        }
        
        if (!displayedAny) {
            moviesContainer.innerHTML = '<div class="error">No movies found. Try another search or category.</div>';
        }
    } catch (error) {
        console.error('Error in fetchMovies:', error);
        moviesContainer.innerHTML = '<div class="error">An error occurred while fetching movies. Please try again.</div>';
    } finally {
        isLoading = false;
    }
}

// Optimized display function with proper DOM management
function displayMovies(movies) {
    // Clear container if needed
    if (moviesContainer.querySelector('.loading')) {
        moviesContainer.innerHTML = '';
    }
    
    // Use DocumentFragment for batch DOM updates
    const fragment = document.createDocumentFragment();
    
    movies.forEach((movie, index) => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.style.setProperty('--card-index', index);
        
        // Default placeholder if poster is missing
        const posterPath = movie.poster || '/api/placeholder/250/375';
        
        // Truncate overview if too long
        const overview = movie.description
            ? (movie.description.length > 150 ? movie.description.substring(0, 150) + '...' : movie.description)
            : 'No description available.';
        
        // Check if movie is in watchlist
        const movieId = generateMovieId(movie.title, movie.source);
        const isInWatchlist = checkIfInWatchlist(movieId);
        
        // Use template literals for efficient HTML construction
        movieCard.innerHTML = `
            <img class="movie-poster" src="${posterPath}" alt="${movie.title}" onerror="this.src='/api/placeholder/250/375'">
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
                <button class="watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}">
                    <span class="watchlist-icon">${isInWatchlist ? '★' : '☆'}</span> 
                    ${isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
            </div>
        `;
        
        // Optimize event listener with proper binding
        const watchlistBtn = movieCard.querySelector('.watchlist-btn');
        watchlistBtn.addEventListener('click', function() {
            toggleWatchlist({
                id: movieId,
                title: movie.title,
                year: movie.year,
                description: movie.description,
                rating: movie.rating,
                source: movie.source,
                poster: posterPath
            }, watchlistBtn);
        });
        
        fragment.appendChild(movieCard);
    });
    
    // Add all cards to the DOM at once
    moviesContainer.appendChild(fragment);
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

// Get watchlist from localStorage
function getWatchlist() {
    const user = JSON.parse(localStorage.getItem('cinevoxa_current_user')) || 
                 JSON.parse(sessionStorage.getItem('cinevoxa_current_user'));
    
    const userId = user ? user.id || user.email : 'guest';
    const watchlistKey = `cinevoxa_watchlist_${userId}`;
    
    return JSON.parse(localStorage.getItem(watchlistKey)) || [];
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

// Save watchlist to localStorage
function saveWatchlist(watchlist) {
    const user = JSON.parse(localStorage.getItem('cinevoxa_current_user')) || 
                 JSON.parse(sessionStorage.getItem('cinevoxa_current_user'));
    
    const userId = user ? user.id || user.email : 'guest';
    const watchlistKey = `cinevoxa_watchlist_${userId}`;
    
    localStorage.setItem(watchlistKey, JSON.stringify(watchlist));
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

// Update pagination buttons
function updatePaginationButtons() {
    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
}

// Debounce function to prevent rapid clicks
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Handle page change with debounce
const debouncedChangePage = debounce(function(direction) {
    if (isLoading) return;
    
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    } else {
        return;
    }
    
    // If using all sources, update each API's current page
    if (currentApi === 'all') {
        paginationInfo.tmdb.currentPage = currentPage;
        paginationInfo.omdb.currentPage = currentPage;
        paginationInfo.tvmaze.currentPage = currentPage;
    }
    
    fetchMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}, 300);

// Initialize the app
function init() {
    // Initialize pagination info
    paginationInfo = {
        tmdb: { currentPage: 1, totalPages: 1 },
        omdb: { currentPage: 1, totalPages: 1 },
        tvmaze: { currentPage: 1, totalPages: 1 }
    };
    
    // Load initial movies with a slight delay to let page render first
    setTimeout(() => {
        fetchMovies();
    }, 100);
    
    // Set up search with debounce
    const performSearch = debounce(() => {
        if (searchInput.value.trim() !== '') {
            isSearchMode = true;
            currentPage = 1;
            
            // Reset all API pagination to page 1
            paginationInfo.tmdb.currentPage = 1;
            paginationInfo.omdb.currentPage = 1;
            paginationInfo.tvmaze.currentPage = 1;
            
            fetchMovies();
        }
    }, 500);
    
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    // Set up filter button event listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Prevent clicking if already loading
            if (isLoading) return;
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update filter and fetch movies
            currentFilter = button.getAttribute('data-filter');
            isSearchMode = false;
            currentPage = 1;
            
            // Reset all API pagination to page 1
            paginationInfo.tmdb.currentPage = 1;
            paginationInfo.omdb.currentPage = 1;
            paginationInfo.tvmaze.currentPage = 1;
            
            searchInput.value = '';
            fetchMovies();
        });
    });
    
    // Set up API selector event listeners
    apiButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Prevent clicking if already loading
            if (isLoading) return;
            
            // Update active button
            apiButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update API source and fetch movies
            currentApi = button.getAttribute('data-api');
            currentPage = 1;
            
            // Reset pagination appropriately
            if (currentApi === 'all') {
                paginationInfo.tmdb.currentPage = 1;
                paginationInfo.omdb.currentPage = 1;
                paginationInfo.tvmaze.currentPage = 1;
            } else {
                paginationInfo[currentApi].currentPage = 1;
            }
            
            fetchMovies();
        });
    });
    
    // Set up pagination event listeners with debounce
    prevPageButton.addEventListener('click', () => debouncedChangePage('prev'));
    nextPageButton.addEventListener('click', () => debouncedChangePage('next'));
    
    // Add lazy loading for images
    if ('IntersectionObserver' in window) {
        // Set up lazy loading after initial content is loaded
        document.addEventListener('DOMContentLoaded', () => {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.getAttribute('data-src');
                        if (src) {
                            img.src = src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            });
            
            // Observe all images with data-src attribute
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        });
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);