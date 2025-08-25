document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const productGrid = document.getElementById('product-grid');
    const productDetailModal = document.getElementById('product-detail-modal');
    const orderModal = document.getElementById('order-modal');
    const productDetailContent = document.getElementById('product-detail-content');
    const relatedProductsGrid = document.getElementById('related-products-grid');
    const orderForm = document.getElementById('order-form');
    const productNameInput = document.getElementById('product-name-input');
    const menuBtn = document.querySelector('.menu-btn');
    const navbar = document.querySelector('.navbar');

    // --- Configuration ---
    const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRvJSc-B0_uG9Yt1QOMq6Kcq0ccW4dbztEFeRXUYqZIIWvVQWhG4NrcHXB4WBq-5G2JXHRuz7lpbDGK/pub?gid=0&single=true&output=csv';
    const IMAGE_BASE_URL = 'https://ilmorafashionbd-ux.github.io/My-Shop/images/';
    const WHATSAPP_NUMBER = '8801778095805'; // Your WhatsApp Number with country code

    let allProducts = [];

    // --- Data Fetching and Parsing ---
    function fetchProducts() {
        Papa.parse(GOOGLE_SHEET_URL, {
            download: true,
            header: true,
            complete: (results) => {
                allProducts = results.data.filter(p => p.ID && p.Name); // Filter out empty rows
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
            const isOutOfStock = product.Stock === 'Out';
            const card = document.createElement('div');
            card.className = 'product-card';
            card.dataset.id = product.ID;

            card.innerHTML = `
                <div class="product-image">
                    <img src="${IMAGE_BASE_URL}${product.Image}" alt="${product.Name}">
                    ${isOutOfStock ? '<div class="stock-status">Stock Out</div>' : ''}
                </div>
                <div class="product-info">
                    <div>
                        <h3 class="product-name">${product.Name}</h3>
                        <p class="product-price">৳${product.Price}</p>
                    </div>
                    <button class="order-btn" data-id="${product.ID}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Unavailable' : 'অর্ডার করুন'}
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
        const product = allProducts.find(p => p.ID === productId);
        if (!product) return;

        productDetailContent.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <img src="${IMAGE_BASE_URL}${product.Image}" alt="${product.Name}">
                </div>
                <div class="product-detail-info">
                    <h2>${product.Name}</h2>
                    <p class="product-price">Price: ৳${product.Price}</p>
                    <p class="product-description">${product.Description || 'No description available.'}</p>
                </div>
            </div>
        `;

        showRelatedProducts(product.Category, product.ID);
        openModal(productDetailModal);
    }

    function showRelatedProducts(category, currentProductId) {
        const related = allProducts.filter(p => p.Category === category && p.ID !== currentProductId).slice(0, 4);
        if (related.length > 0) {
            displayProducts(related, relatedProductsGrid);
            document.getElementById('related-products').style.display = 'block';
        } else {
            document.getElementById('related-products').style.display = 'none';
        }
    }

    function showOrderForm(productId) {
        const product = allProducts.find(p => p.ID === productId);
        if (!product) return;

        productNameInput.value = product.Name;
        openModal(orderModal);
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        // Product clicks for details or ordering
        document.body.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            const orderBtn = e.target.closest('.order-btn');

            if (orderBtn) {
                e.stopPropagation(); // Prevent card click when button is clicked
                showOrderForm(orderBtn.dataset.id);
            } else if (productCard) {
                showProductDetail(productCard.dataset.id);
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

        // Order form submission
        orderForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const customerName = document.getElementById('customer-name').value.trim();
            const customerAddress = document.getElementById('customer-address').value.trim();
            const customerMobile = document.getElementById('customer-mobile').value.trim();
            const productName = productNameInput.value;

            if (!customerName || !customerAddress || !customerMobile) {
                alert('Please fill in all the fields.');
                return;
            }

            const message = `
Hello Ilmora Fashion,

I would like to order the following product:
*Product:* ${productName}

My details are:
*Name:* ${customerName}
*Address:* ${customerAddress}
*Mobile:* ${customerMobile}

Please confirm my order.
Thank you!
            `;

            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

            orderForm.reset();
            closeModal(orderModal);
        });
    }

    // --- Initial Load ---
    fetchProducts();
});