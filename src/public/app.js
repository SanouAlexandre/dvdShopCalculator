let cart = [];

function isBTTF(title) {
    return /^Back to the Future\s*[123]$/i.test(title);
}

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

function removeMovie(index) {
    cart.splice(index, 1);
    updateUI();
}

function updateUI() {
    renderMovieList();
    calculateTotal();
}

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function calculateTotal() {
    const receipt = document.getElementById('receipt');
    
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

// Initialize event listeners when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Handle Enter key on input
    document.getElementById('movieInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addMovie();
    });

    // Event delegation for remove buttons
    document.getElementById('movieList').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const index = parseInt(e.target.dataset.index, 10);
            removeMovie(index);
        }
    });

    // Event delegation for add buttons (quick add)
    document.querySelectorAll('[data-add-movie]').forEach(btn => {
        btn.addEventListener('click', () => {
            addMovie(btn.dataset.addMovie);
        });
    });

    // Add movie button
    document.querySelector('.add-movie-btn').addEventListener('click', () => addMovie());
});
