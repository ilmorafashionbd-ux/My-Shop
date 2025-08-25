
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const productGrid = document.getElementById('product-grid');
    const productDetailModal = document.getElementById('product-detail-modal');
    const productDetailContent = document.getElementById('product-detail-content');
    const relatedProductsGrid = document.getElementById('related-products-grid');
    const orderForm = document.getElementById('order-form');
    const menuBtn = document.querySelector('.menu-btn');
    const navbar = document.querySelector('.navbar');

    // --- Configuration ---
    const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRvJSc-B0_uG9Yt1QOMq6Kcq0ccW4dbztEFeRXUYqZIIWvVQWhG4NrcHXB4WBq-5G2JXHRuz7lpbDGK/pub?gid=0&single=true&output=csv';
    const IMAGE_BASE_URL = 'https://ilmorafashionbd-ux.github.io/My-Shop/images/';
    const WHATSAPP_NUMBER = '8801778095805'; // Your WhatsApp Number with country code

    let allProducts = [];
    let currentSelectedProduct = null;

    // --- Data Fetching and Parsing ---
    function fetchProducts() {
        Papa.parse(GOOGLE_SHEET_URL, {
            download: true,
            header: true,
            complete: (results) => {
                // Filter out empty rows and trim whitespace from data
                allProducts = results.data.filter(p => p.ID && p.Name).map(p => {
                    const cleanProduct = {};
                    for (const key in p) {
                        cleanProduct[key] = typeof p[key] === 'string' ? p[key].trim() : p[key];
                    }
                    return cleanProduct;
                });
                displayProducts(allProducts, productGrid);
                setupEventListeners();
            },
            error: (error) => {
                console.error("Error fetching or parsing data:", error);
                productGrid.innerHTML = '<p>Error loading products. Please try again later.</p>';
            }
        });
    }

    // --- Display Logic ---
    function displayProducts(products, gridElement) {
        gridElement.innerHTML = '';
        products.forEach(product => {
            const isOutOfStock = product.Stock && product.Stock.toLowerCase() === 'out';
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = product.ID;

            card.innerHTML = `
                <div class="product-image">
                    <img src="${IMAGE_BASE_URL}${product.Image}" alt="${product.Name}" onerror="this.onerror=null;this.src='https://placehold.co/600x600/e0e0e0/555?text=Image+Unavailable'">
                    ${isOutOfStock ? '<div class="stock-status">স্টক নেই</div>' : ''}
                </div>
                <div class="product-info">
                    <div>
                        <h3 class="product-name">${product.Name}</h3>
                        <p class="product-price">৳${product.Price}</p>
                    </div>
                    <button class="order-btn" data-id="${product.ID}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'স্টক নেই' : 'অর্ডার করুন'}
                    </button>
                </div>
            `;
            gridElement.appendChild(card);
        });
    }

    // --- Modal Handling ---
    function openModal(modal) {
        modal.style.display = 'block';
        document.body.classList.add('modal-open');
    }

    function closeModal(modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }

    function showProductDetail(productId) {
        currentSelectedProduct = allProducts.find(p => p.ID === productId);
        if (!currentSelectedProduct) return;

        productDetailContent.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <img src="${IMAGE_BASE_URL}${currentSelectedProduct.Image}" alt="${currentSelectedProduct.Name}" onerror="this.onerror=null;this.src='https://placehold.co/600x600/e0e0e0/555?text=Image+Unavailable'">
                </div>
                <div class="product-detail-info">
                    <h2>${currentSelectedProduct.Name}</h2>
                    <p class="product-price">মূল্য: ৳${currentSelectedProduct.Price}</p>
                    <button id="order-now-btn" class="order-btn">${currentSelectedProduct.Stock && currentSelectedProduct.Stock.toLowerCase() === 'out' ? 'স্টক নেই' : 'এখনই অর্ডার করুন'}</button>
                    <div class="product-description" style="margin-top: 20px;">
                        <h3>ডেসক্রিপশন</h3>
                        <p>${currentSelectedProduct.Description || 'কোনো ডেসক্রিপশন দেওয়া নেই।'}</p>
                    </div>
                </div>
            </div>
        `;

        showRelatedProducts(currentSelectedProduct.Category, currentSelectedProduct.ID);
        openModal(productDetailModal);
    }

    function showRelatedProducts(category, currentProductId) {
        const related = allProducts.filter(p => p.Category === category && p.ID !== currentProductId);
        if (related.length > 0) {
            // Shuffle the related products and take a few
            const shuffled = related.sort(() => 0.5 - Math.random());
            const displayCount = Math.min(shuffled.length, 4);
            displayProducts(shuffled.slice(0, displayCount), relatedProductsGrid);
            document.getElementById('related-products').style.display = 'block';
        } else {
            document.getElementById('related-products').style.display = 'none';
        }
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Product clicks for details
        document.body.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                showProductDetail(productCard.dataset.id);
            }
        });

        // "এখনই অর্ডার করুন" button in modal
        document.body.addEventListener('click', (e) => {
            if (e.target.id === 'order-now-btn') {
                if (currentSelectedProduct) {
                    const message = `হ্যালো Ilmora Fashion, আমি একটি পণ্য অর্ডার করতে চাই।\n\nপণ্যের নাম: ${currentSelectedProduct.Name}\nপণ্যের মূল্য: ৳${currentSelectedProduct.Price}\n\nআপনার নাম:\nআপনার সম্পূর্ণ ঠিকানা:\nআপনার মোবাইল নম্বর:`;
                    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                }
            }
        });

        // Modal close buttons
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal(btn.closest('.modal'));
            });
        });

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeModal(e.target);
            }
        });

        // Mobile menu toggle
        menuBtn.addEventListener('click', () => {
            navbar.classList.toggle('active');
        });

    }

    // --- Initial Load ---
    fetchProducts();
});