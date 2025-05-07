// API Keys and URLs
const TMDB_API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c'; // This is a public API key for TMDB
const OMDB_API_KEY = 'fc1fef96'; // Free API key for OMDb

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const OMDB_BASE_URL = 'https://www.omdbapi.com';
const TVMAZE_BASE_URL = 'https://api.tvmaze.com';

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// DOM Elements
const showsContainer = document.getElementById('shows-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const filterButtons = document.querySelectorAll('.filter-btn');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const genreSelector = document.getElementById('genre-selector');
const genreGrid = document.querySelector('.genre-grid');

// Current states
let currentFilter = 'popular';
let currentPage = 1;
let totalPages = 1;
let isSearchMode = false;
let selectedGenre = null;

// TV Show genres from TMDB
const tvGenres = [
    { id: 10759, name: "Action & Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 10762, name: "Kids" },
    { id: 9648, name: "Mystery" },
    { id: 10763, name: "News" },
    { id: 10764, name: "Reality" },
    { id: 10765, name: "Sci-Fi & Fantasy" },
    { id: 10766, name: "Soap" },
    { id: 10767, name: "Talk" },
    { id: 10768, name: "War & Politics" },
    { id: 37, name: "Western" }
];

// Fetch TV shows from TMDB
async function fetchTMDBShows(filter, page = 1) {
    try {
        let url;
        
        if (isSearchMode && searchInput.value.trim() !== '') {
            url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchInput.value.trim())}&page=${page}`;
        } else if (filter === 'genres' && selectedGenre) {
            url = `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=${selectedGenre}&page=${page}`;
        } else {
            // Map our filter names to TMDB endpoints
            const endpointMap = {
                'popular': 'popular',
                'top_rated': 'top_rated',
                'airing_today': 'airing_today'
            };
            const endpoint = endpointMap[filter] || 'popular';
            url = `${TMDB_BASE_URL}/tv/${endpoint}?api_key=${TMDB_API_KEY}&page=${page}`;
        }
        
        console.log("Fetching from TMDB URL:", url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        // Update pagination info
        totalPages = Math.min(data.total_pages || 1, 10);
        
        return data.results ? data.results.map(show => ({
            id: show.id,
            title: show.name,
            year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'Unknown',
            description: show.overview || 'No description available.',
            poster: show.poster_path ? `${TMDB_IMAGE_BASE_URL}${show.poster_path}` : null,
            rating: show.vote_average || 'N/A',
            source: 'TMDB'
        })) : [];
    } catch (error) {
        console.error('Error fetching TMDB shows:', error);
        return [];
    }
}

// Fetch shows from TVMaze
async function fetchTVMazeShows(searchTerm, page = 1) {
    try {
        let url;
        let isSearchQuery = searchTerm && searchTerm.trim() !== '';
        
        if (isSearchQuery) {
            // TVMaze search API
            url = `${TVMAZE_BASE_URL}/search/shows?q=${encodeURIComponent(searchTerm)}`;
        } else {
            // For browsing, use the shows endpoint with page parameter
            url = `${TVMAZE_BASE_URL}/shows?page=${page - 1}`; // TVMaze pages are 0-indexed
        }
        
        console.log("Fetching from TVMaze URL:", url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (isSearchQuery && data && data.length > 0) {
            // Search results are returned as an array of {score, show} objects
            return data.map(item => {
                const show = item.show;
                let description = 'No description available.';
                
                // TVMaze returns HTML in summary, clean it
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
        } else if (!isSearchQuery && Array.isArray(data)) {
            // Regular shows listing
            return data.map(show => {
                let description = 'No description available.';
                
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
        }
        return [];
    } catch (error) {
        console.error('Error fetching TVMaze shows:', error);
        return [];
    }
}

// Fetch shows from OMDb (specific TV shows)
async function fetchOMDbShows(searchTerm, page = 1) {
    try {
        const searchQuery = searchTerm || getRandomTVTerm();
        const url = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(searchQuery)}&type=series&page=${page}`;
        
        console.log("Fetching from OMDb URL:", url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.Response === 'True' && data.Search) {
            // Update OMDb pagination info
            const omdbTotalPages = Math.min(Math.ceil(data.totalResults / 10) || 1, 10);
            
            const shows = [];
            
            // For each show in search results, fetch more details (limited to avoid rate limits)
            const showsToProcess = data.Search.slice(0, 5);
            for (const show of showsToProcess) {
                try {
                    const detailUrl = `${OMDB_BASE_URL}/?apikey=${OMDB_API_KEY}&i=${show.imdbID}`;
                    const detailResponse = await fetch(detailUrl);
                    const detailData = await detailResponse.json();
                    
                    if (detailData.Response === 'True' && detailData.Type === 'series') {
                        shows.push({
                            id: detailData.imdbID,
                            title: detailData.Title,
                            year: detailData.Year,
                            description: detailData.Plot || 'No description available.',
                            poster: detailData.Poster !== 'N/A' ? detailData.Poster : null,
                            rating: detailData.imdbRating,
                            source: 'OMDb'
                        });
                    }
                } catch (err) {
                    console.error('Error fetching show details:', err);
                }
            }
            
            return shows;
        }
        return [];
    } catch (error) {
        console.error('Error fetching OMDb shows:', error);
        return [];
    }
}

// Get random search term for TV shows
function getRandomTVTerm() {
    const terms = ['tv', 'series', 'show', 'drama', 'comedy', 'sitcom', 'netflix', 'hbo', 'amazon'];
    return terms[Math.floor(Math.random() * terms.length)];
}

// Fetch shows based on current filter
async function fetchShows() {
    showsContainer.innerHTML = '<div class="loading">Loading TV shows...</div>';
    
    let tmdbShows = [];
    let tvmazeShows = [];
    let omdbShows = [];
    
    const searchTerm = searchInput.value.trim();
    
    try {
        // TMDB API fetching
        tmdbShows = await fetchTMDBShows(currentFilter, currentPage);
        
        // TVMaze API fetching
        tvmazeShows = await fetchTVMazeShows(isSearchMode ? searchTerm : '', currentPage);
        
        // OMDb API fetching
        omdbShows = await fetchOMDbShows(isSearchMode ? searchTerm : '', currentPage);
        
        const allShows = [...tmdbShows, ...tvmazeShows, ...omdbShows];
        console.log(`Fetched ${allShows.length} shows. TMDB: ${tmdbShows.length}, TVMaze: ${tvmazeShows.length}, OMDb: ${omdbShows.length}`);
        
        if (allShows.length > 0) {
            displayShows(allShows);
        } else {
            showsContainer.innerHTML = '<div class="error">No TV shows found. Try another search or category.</div>';
        }
        
        // Update pagination buttons
        updatePaginationButtons();
    } catch (error) {
        console.error('Error in fetchShows:', error);
        showsContainer.innerHTML = '<div class="error">An error occurred while fetching TV shows. Please try again.</div>';
    }
}

// Display shows in the container
function displayShows(shows) {
    showsContainer.innerHTML = '';
    
    shows.forEach((show, index) => {
        const showCard = document.createElement('div');
        showCard.classList.add('movie-card'); // Reusing movie card styles for consistency
        showCard.style.setProperty('--card-index', index);
        
        // Default placeholder if poster is missing
        const posterPath = show.poster || '/api/placeholder/250/375';
        
        // Truncate overview if too long
        const overview = show.description
            ? (show.description.length > 150 ? show.description.substring(0, 150) + '...' : show.description)
            : 'No description available.';
        
        showCard.innerHTML = `
            <img class="movie-poster" src="${posterPath}" alt="${show.title}" onerror="this.src='/api/placeholder/250/375'">
            <div class="movie-info">
                <h3 class="movie-title">${show.title}</h3>
                <p class="movie-year">${show.year}</p>
                <p class="movie-description">${overview}</p>
                <div class="movie-details">
                    <div class="movie-rating">
                        ${show.rating}
                    </div>
                    <span class="movie-source">${show.source}</span>
                </div>
            </div>
        `;
        
        showsContainer.appendChild(showCard);
    });
}

// Update pagination buttons
function updatePaginationButtons() {
    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
    
    console.log(`Pagination buttons updated: Current page ${currentPage}, Total pages ${totalPages}`);
}

// Handle page change
function changePage(direction) {
    if (direction === 'prev' && currentPage > 1) {
        currentPage--;
    } else if (direction === 'next' && currentPage < totalPages) {
        currentPage++;
    } else {
        console.log(`Cannot change page: currentPage=${currentPage}, totalPages=${totalPages}, direction=${direction}`);
        return;
    }
    
    console.log(`Page changed to: ${currentPage}`);
    fetchShows();
    window.scrollTo(0, 0);
}

// Generate genre buttons
function generateGenreButtons() {
    genreGrid.innerHTML = '';
    
    tvGenres.forEach(genre => {
        const genreButton = document.createElement('button');
        genreButton.classList.add('genre-button');
        genreButton.setAttribute('data-genre-id', genre.id);
        genreButton.textContent = genre.name;
        
        if (selectedGenre === genre.id) {
            genreButton.classList.add('active');
        }
        
        genreButton.addEventListener('click', () => {
            // Toggle selection if clicking the same genre
            if (selectedGenre === genre.id) {
                selectedGenre = null;
                genreButton.classList.remove('active');
            } else {
                document.querySelectorAll('.genre-button').forEach(btn => btn.classList.remove('active'));
                selectedGenre = genre.id;
                genreButton.classList.add('active');
            }
            
            currentPage = 1;
            fetchShows();
        });
        
        genreGrid.appendChild(genreButton);
    });
}

// Initialize the app
function init() {
    // Load initial shows
    fetchShows();
    
    // Generate genre buttons
    generateGenreButtons();
    
    // Set up search event listeners
    searchButton.addEventListener('click', () => {
        if (searchInput.value.trim() !== '') {
            isSearchMode = true;
            currentPage = 1;
            fetchShows();
        }
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== '') {
            isSearchMode = true;
            currentPage = 1;
            fetchShows();
        }
    });
    
    // Set up filter button event listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update filter and fetch shows
            currentFilter = button.getAttribute('data-filter');
            console.log(`Filter changed to: ${currentFilter}`);
            
            // Toggle genre selector visibility
            if (currentFilter === 'genres') {
                genreSelector.classList.remove('hidden');
            } else {
                genreSelector.classList.add('hidden');
                selectedGenre = null;
            }
            
            isSearchMode = false;
            currentPage = 1;
            searchInput.value = '';
            fetchShows();
        });
    });
    
    // Set up pagination event listeners
    prevPageButton.addEventListener('click', () => {
        changePage('prev');
    });
    
    nextPageButton.addEventListener('click', () => {
        changePage('next');
    });
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);