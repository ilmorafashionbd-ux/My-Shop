document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------------------
    // গুরুত্বপূর্ণ: এখানে আপনার গুগল শিট CSV ফাইলের লিঙ্কটি যেমন ছিল তেমনই থাকবে।
    // ----------------------------------------------------------------------------------
    const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRvJSc-B0_uG9Yt1QOMq6Kcq0ccW4dbztEFeRXUYqZIIWvVQWhG4NrcHXB4WBq-5G2JXHRuz7lpbDGK/pub?gid=0&single=true&output=csv'; // <<<<<<< আপনার লিঙ্কটি এখানে থাকবে

    const productGrid = document.getElementById('product-grid');
    const detailModal = document.getElementById('product-detail-modal');
    const orderModal = document.getElementById('order-modal');
    const detailContent = document.getElementById('product-detail-content');
    const relatedProductsGrid = document.getElementById('related-products-grid');
    const closeBtns = document.querySelectorAll('.close-btn');
    const orderForm = document.getElementById('order-form');

    let allProducts = [];

    function loadProducts() {
        productGrid.innerHTML = '<p>প্রোডাক্ট লোড হচ্ছে...</p>';

        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true,
            complete: (results) => {
                allProducts = results.data.filter(p => p.id && p.id.trim() !== '');
                if(allProducts.length > 0) {
                    displayProducts(allProducts);
                } else {
                    productGrid.innerHTML = '<p>কোনো প্রোডাক্ট পাওয়া যায়নি।</p>';
                }
            },
            error: (err) => {
                console.error("CSV parsing error:", err);
                productGrid.innerHTML = `<p>প্রোডাক্ট লোড করা যায়নি।</p>`;
            }
        });
    }

    function displayProducts(products, gridElement = productGrid) {
        gridElement.innerHTML = '';
        products.forEach(product => {
            if (!product.name || !product.imageUrl) return;

            const isOutOfStock = product.stockStatus && product.stockStatus.toLowerCase() === 'out of stock';
            
            // New product card structure to match the new design
            const productCardHTML = `
                <div class="product-card" data-id="${product.id}">
                    ${isOutOfStock ? '<span class="stock-status">Out of Stock</span>' : ''}
                    <img src="${product.imageUrl}" alt="${product.name}">
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p>৳ ${product.price}</p>
                        <button class="btn" data-product-name="${product.name}" ${isOutOfStock ? 'disabled' : ''}>
                            ${isOutOfStock ? 'Out of Stock' : 'অর্ডার করুন'}
                        </button>
                    </div>
                </div>
            `;
            gridElement.innerHTML += productCardHTML;
        });
        addCardEventListeners();
    }
    
    function addCardEventListeners() {
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn')) {
                    const productId = card.dataset.id;
                    showProductDetail(productId);
                }
            });
        });

        document.querySelectorAll('.btn[data-product-name]').forEach(button => {
            button.addEventListener('click', (e) => {
                if (!button.disabled) {
                    const productName = e.target.dataset.productName;
                    openOrderModal(productName);
                }
            });
        });
    }

    function showProductDetail(productId) {
        const product = allProducts.find(p => p.id == productId);
        if (!product) return;
        
        const isOutOfStock = product.stockStatus && product.stockStatus.toLowerCase() === 'out of stock';

        detailContent.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h2>${product.name}</h2>
                    <p class="product-price">৳ ${product.price}</p>
                    <p class="product-description">${product.description || 'এই প্রোডাক্টের কোনো বিবরণ নেই।'}</p>
                     <button class="btn" data-product-name="${product.name}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Out of Stock' : 'অর্ডার করুন'}
                    </button>
                </div>
            </div>
        `;
        
        const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
        displayProducts(relatedProducts, relatedProductsGrid);

        detailModal.style.display = 'flex';

        detailContent.querySelector('.btn').addEventListener('click', (e) => {
            if(!e.target.disabled){
                const productName = e.target.dataset.productName;
                openOrderModal(productName);
            }
        });
    }
    
    function openOrderModal(productName) {
        document.getElementById('product-name-input').value = productName;
        orderModal.style.display = 'flex';
    }

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const productName = document.getElementById('product-name-input').value;
        const customerName = document.getElementById('customer-name').value;
        const customerAddress = document.getElementById('customer-address').value;
        const customerMobile = document.getElementById('customer-mobile').value;

        const yourWhatsAppNumber = '8801778095805'; 

        const message = `Hello Ilmora Fashion,\nI would like to place an order:\n\nProduct: ${productName}\nName: ${customerName}\nAddress: ${customerAddress}\nMobile: ${customerMobile}`;

        const whatsappURL = `https://wa.me/${yourWhatsAppNumber}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappURL, '_blank');
        
        orderForm.reset();
        orderModal.style.display = 'none';
    });
    
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            detailModal.style.display = 'none';
            orderModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target == detailModal) {
            detailModal.style.display = 'none';
        }
        if (e.target == orderModal) {
            orderModal.style.display = 'none';
        }
    });

    loadProducts();
});