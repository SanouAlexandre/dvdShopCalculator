/**
 * DVD Shop Calculator - Frontend Application
 *
 * This JavaScript module handles the client-side functionality:
 * - Shopping cart management (add/remove movies)
 * - Real-time price calculation via API calls
 * - Dynamic UI updates and receipt rendering
 * - XSS prevention through HTML escaping
 *
 * The application communicates with the backend API at /api/calculate
 * to get accurate pricing with Back to the Future trilogy discounts.
 *
 * @file Frontend application logic for DVD Shop Calculator
 * @version 1.0.0
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Shopping cart array containing movie titles.
 * @type {string[]}
 */
let cart = [];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a movie title is a Back to the Future movie.
 * Uses regex to match "Back to the Future" followed by 1, 2, or 3.
 *
 * @param {string} title - The movie title to check
 * @returns {boolean} True if the title is a BTTF movie
 */
function isBTTF(title) {
    return /^Back to the Future\s*[123]$/i.test(title);
}

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Uses the browser's built-in text encoding.
 *
 * @param {string} text - The text to escape
 * @returns {string} HTML-safe escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// CART OPERATIONS
// ============================================================================

/**
 * Adds a movie to the cart.
 * If no title is provided, reads from the input field.
 *
 * @param {string} [title] - Optional movie title to add
 */
function addMovie(title) {
    if (!title) {
        const input = document.getElementById('movieInput');
        title = input.value.trim();
        input.value = '';
    }
    
    if (!title) return;
    
    cart.push(title);
    updateUI();
}

/**
 * Removes a movie from the cart by index.
 *
 * @param {number} index - The index of the movie to remove
 */
function removeMovie(index) {
    cart.splice(index, 1);
    updateUI();
}

// ============================================================================
// UI RENDERING
// ============================================================================

/**
 * Updates the entire UI by re-rendering the list and recalculating totals.
 */
function updateUI() {
    renderMovieList();
    calculateTotal();
}

/**
 * Renders the movie list in the cart panel.
 * Displays each movie with its price and a remove button.
 * BTTF movies are highlighted differently.
 */
function renderMovieList() {
    const list = document.getElementById('movieList');
    
    if (cart.length === 0) {
        list.innerHTML = '';
        return;
    }

    list.innerHTML = cart.map((title, index) => {
        const bttf = isBTTF(title);
        const price = bttf ? 15 : 20;
        return `
            <div class="movie-item ${bttf ? 'bttf' : ''}">
                <span class="title">${escapeHtml(title)}</span>
                <span class="price">${price} €</span>
                <button class="remove-btn" data-index="${index}">×</button>
            </div>
        `;
    }).join('');
}

// ============================================================================
// API COMMUNICATION
// ============================================================================

/**
 * Calculates the cart total by calling the backend API.
 * Updates the receipt display with the calculation result.
 * Displays an empty cart message if no items are present.
 *
 * @async
 * @returns {Promise<void>}
 */
async function calculateTotal() {
    const receipt = document.getElementById('receipt');
    
    // Display empty cart message if no items
    if (cart.length === 0) {
        receipt.innerHTML = `
            <div class="empty-cart">
                <div class="icon">🎬</div>
                <p>Votre panier est vide</p>
                <p>Ajoutez des DVDs pour voir le total</p>
            </div>
        `;
        return;
    }

    try {
        // Call the calculate API endpoint
        const response = await fetch('/api/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart })
        });

        const data = await response.json();
        renderReceipt(data);
    } catch (error) {
        console.error('Error:', error);
    }
}

/**
 * Renders the receipt with calculation results.
 * Shows itemized breakdown, discounts, and total.
 *
 * @param {object} data - The calculation result from the API
 * @param {number} data.totalPrice - The final total price
 * @param {number} data.itemsCount - Number of items in cart
 * @param {string|null} data.discountApplied - Discount name if applied
 * @param {object} data.breakdown - Detailed price breakdown
 */
function renderReceipt(data) {
    const receipt = document.getElementById('receipt');
    const breakdown = data.breakdown?.breakdown || {};
    
    const bttfCount = breakdown.bttfMovies?.count || 0;
    const bttfBase = breakdown.bttfMovies?.basePrice || 0;
    const bttfDiscounted = breakdown.bttfMovies?.discountedPrice || 0;
    const otherCount = breakdown.otherMovies?.count || 0;
    const otherPrice = breakdown.otherMovies?.price || 0;
    
    let itemsHtml = '';
    
    if (bttfCount > 0) {
        itemsHtml += `
            <div class="receipt-line">
                <span>BTTF DVD x${bttfCount}</span>
                <span>${bttfBase} €</span>
            </div>
        `;
        
        if (data.discountApplied) {
            const savings = bttfBase - bttfDiscounted;
            itemsHtml += `
                <div class="receipt-line discount">
                    <span>↳ Remise ${escapeHtml(data.discountApplied)}</span>
                    <span>-${savings.toFixed(2)} €</span>
                </div>
            `;
        }
    }
    
    if (otherCount > 0) {
        itemsHtml += `
            <div class="receipt-line">
                <span>DVD Standard x${otherCount}</span>
                <span>${otherPrice} €</span>
            </div>
        `;
    }

    receipt.innerHTML = `
        <div class="receipt">
            <div class="receipt-header">
                <h3>🎬 DVD SHOP</h3>
                <small>${new Date().toLocaleDateString('fr-FR')}</small>
            </div>
            <div class="receipt-items">
                ${itemsHtml}
            </div>
            <div class="receipt-divider"></div>
            <div class="receipt-line">
                <span>Articles</span>
                <span>${data.itemsCount}</span>
            </div>
            ${data.discountApplied ? `
                <div class="receipt-line">
                    <span>Promotion</span>
                    <span style="color: #e74c3c">-${escapeHtml(data.discountApplied)}</span>
                </div>
            ` : ''}
            <div class="receipt-total">
                <span>TOTAL</span>
                <span>${data.totalPrice} €</span>
            </div>
        </div>
    `;
}

// ============================================================================
// EVENT HANDLING
// ============================================================================

/**
 * Initializes all event listeners when the DOM is fully loaded.
 * Uses event delegation for dynamically created elements.
 */
document.addEventListener('DOMContentLoaded', () => {
    /**
     * Handle Enter key on the movie input field.
     * Allows quick addition without clicking the button.
     */
    document.getElementById('movieInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMovie();
    });

    /**
     * Event delegation for remove buttons.
     * Handles clicks on dynamically created remove buttons in the movie list.
     */
    document.getElementById('movieList').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const index = Number.parseInt(e.target.dataset.index, 10);
            removeMovie(index);
        }
    });

    /**
     * Event delegation for quick-add buttons.
     * Pre-defined buttons that add specific movies with one click.
     */
    document.querySelectorAll('[data-add-movie]').forEach(btn => {
        btn.addEventListener('click', () => {
            addMovie(btn.dataset.addMovie);
        });
    });

    /**
     * Main add movie button click handler.
     * Adds the movie from the input field.
     */
    document.querySelector('.add-movie-btn').addEventListener('click', () => addMovie());
});
