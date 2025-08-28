// Function to handle the navigation menu toggle on mobile
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.menu-btn');
    const navbar = document.querySelector('.navbar');

    menuBtn.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });
});

// Main JavaScript for handling products, modals, and cart functionality
document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDl-cw7a6X_kIJh_e6Q_lIllD9_9R_IXPnCCs3HCGMhTHD9OG67rqKT2NGiHmY7hsSyeZ9sM6urutp/pub?gid=0&single=true&output=csv';
    const GITHUB_IMAGE_BASE_URL = 'https://ilmorafashionbd-ux.github.io/My-Shop/images/';

    let allProducts = [];
    let cart = [];

    // Selectors
    const productGrid = document.getElementById('product-grid');
    const productDetailModal = document.getElementById('product-detail-modal');
    const productDetailContainer = document.getElementById('product-detail-container');
    const productModalCloseBtn = document.getElementById('product-modal-close');
    const orderModal = document.getElementById('order-modal');
    const orderForm = document.getElementById('order-form');
    const cartCountTop = document.querySelector('.cart-count');
    const cartCountBottom = document.querySelector('.cart-count-bottom');
    const categoryItems = document.querySelectorAll('.category-item');

    // Fetch products from Google Sheet
    const fetchProducts = async () => {
        try {
            const response = await fetch(csvUrl);
            const text = await response.text();
            Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    allProducts = results.data.filter(product => product.id);
                    if (allProducts.length > 0) {
                        displayProducts(allProducts);
                    } else {
                        productGrid.innerHTML = '<p>কোনো প্রোডাক্ট পাওয়া যায়নি।</p>';
                    }
                }
            });
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    // Display products
    const displayProducts = (productsToDisplay) => {
        productGrid.innerHTML = '';
        if (productsToDisplay.length === 0) {
            productGrid.innerHTML = '<p>এই ক্যাটাগরিতে কোনো পণ্য নেই।</p>';
            return;
        }

        productsToDisplay.forEach(product => {
            if (!product.id || !product.product_name || !product.price || !product.image_url) return;

            const mainImageUrl = GITHUB_IMAGE_BASE_URL + product.image_url;
            const isOutOfStock = product.stock_status && product.stock_status.toLowerCase() === 'out of stock';

            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.productId = product.id;

            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${mainImageUrl}" alt="${product.product_name}" 
                        onerror="this.onerror=null;this.src='https://placehold.co/400x400?text=No+Image';">
                    ${isOutOfStock ? `<span class="stock-status">Out of stock</span>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.product_name}</h3>
                    <div class="product-price">${product.price}৳</div>
                </div>
            `;
            productGrid.appendChild(productCard);

            productCard.addEventListener('click', () => showProductDetail(product));
        });
    };

    // Show product detail (Redesigned)
    const showProductDetail = (product) => {
        const mainImageUrl = GITHUB_IMAGE_BASE_URL + product.image_url;
        const otherImages = product.other_images ? product.other_images.split(',').map(img => GITHUB_IMAGE_BASE_URL + img.trim()) : [];
        const allImages = [mainImageUrl, ...otherImages];
        
        // Generate variant options if available
        const variants = product.variants ? product.variants.split(',').map(v => v.trim()) : ['500g', '1kg'];
        const variantOptions = variants.map(v => 
            `<div class="variant-option" data-value="${v}">${v}</div>`
        ).join('');
        
        // Generate related products
        const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
        const relatedProductsHTML = relatedProducts.map(p => {
            const imgUrl = GITHUB_IMAGE_BASE_URL + p.image_url;
            return `
                <div class="product-card" data-product-id="${p.id}">
                    <div class="product-image">
                        <img src="${imgUrl}" alt="${p.product_name}" 
                            onerror="this.onerror=null;this.src='https://placehold.co/400x400?text=No+Image';">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${p.product_name}</h3>
                        <div class="product-price">${p.price}৳</div>
                    </div>
                </div>
            `;
        }).join('');

        productDetailContainer.innerHTML = `
            <div class="product-detail-premium">
                <div class="product-detail-images">
                    <img id="main-product-image" class="main-image" src="${mainImageUrl}" alt="${product.product_name}">
                    <div class="thumbnail-images">
                        ${allImages.map((img, index) => 
                            `<img class="thumbnail ${index === 0 ? 'active' : ''}" 
                                src="${img}" alt="Thumbnail ${index + 1}" data-index="${index}">`
                        ).join('')}
                    </div>
                </div>
                <div class="product-detail-info">
                    <h2 class="product-title">${product.product_name}</h2>
                    <div class="product-meta">
                        <div class="meta-item">
                            <i class="fas fa-box"></i>
                            <strong>স্টক:</strong> ${product.stock_status || 'In Stock'}
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-tag"></i>
                            <strong>ক্যাটাগরি:</strong> ${product.category || 'General'}
                        </div>
                    </div>
                    <div class="product-price-section">
                        <div class="price-main">${product.price}৳</div>
                        <div class="price-range">${product.price_range || 'সকল সাইজের জন্য'}</div>
                    </div>
                    
                    <div class="variant-selector">
                        <label class="variant-label">সাইজ/ভ্যারিয়েন্ট সিলেক্ট করুন:</label>
                        <div class="variant-options">
                            ${variantOptions}
                        </div>
                    </div>
                    
                    <div class="quantity-selector">
                        <span class="quantity-label">পরিমাণ:</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn" id="decrease-qty">-</button>
                            <input type="number" class="quantity-input" id="product-quantity" value="1" min="1">
                            <button class="quantity-btn" id="increase-qty">+</button>
                        </div>
                    </div>
                    
                    <div class="order-buttons">
                        <button class="whatsapp-order-btn" onclick="openWhatsAppOrder('${product.product_name}', '${product.id}')">
                            <i class="fab fa-whatsapp"></i> হোয়াটসঅ্যাপে অর্ডার
                        </button>
                        <button class="messenger-order-btn" onclick="openMessengerOrder('${product.product_name}', '${product.id}')">
                            <i class="fab fa-facebook-messenger"></i> মেসেঞ্জারে অর্ডার
                        </button>
                    </div>
                    
                    <div class="product-description">
                        <h3 class="description-title">পণ্যের বিবরণ</h3>
                        <div class="description-content">
                            ${product.description || 'এই পণ্যের জন্য কোনো বিবরণ নেই।'}
                        </div>
                    </div>
                </div>
                
                ${relatedProducts.length > 0 ? `
                <div class="related-products">
                    <h3 class="related-title">সম্পর্কিত পণ্য</h3>
                    <div class="related-grid">
                        ${relatedProductsHTML}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        // Add event listeners for thumbnails
        const thumbnails = productDetailContainer.querySelectorAll('.thumbnail');
        const mainImage = productDetailContainer.querySelector('#main-product-image');
        
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                thumbnails.forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
                mainImage.src = thumb.src;
            });
        });

        // Add event listeners for variant options
        const variantOptionsEl = productDetailContainer.querySelectorAll('.variant-option');
        variantOptionsEl.forEach(option => {
            option.addEventListener('click', () => {
                variantOptionsEl.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
            });
        });

        // Add event listeners for quantity controls
        const decreaseBtn = productDetailContainer.querySelector('#decrease-qty');
        const increaseBtn = productDetailContainer.querySelector('#increase-qty');
        const quantityInput = productDetailContainer.querySelector('#product-quantity');
        
        decreaseBtn.addEventListener('click', () => {
            if (parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            quantityInput.value = parseInt(quantityInput.value) + 1;
        });

        // Add event listeners for related products
        const relatedProductCards = productDetailContainer.querySelectorAll('.product-card');
        relatedProductCards.forEach(card => {
            const productId = card.dataset.productId;
            const relatedProduct = allProducts.find(p => p.id == productId);
            if (relatedProduct) {
                card.addEventListener('click', () => {
                    showProductDetail(relatedProduct);
                });
            }
        });

        // Show the modal
        productDetailModal.style.display = 'block';
        document.body.classList.add('modal-open');
    };

    // Close product detail modal
    productModalCloseBtn.addEventListener('click', () => {
        productDetailModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === productDetailModal) {
            productDetailModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    });

    // Category filtering
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.dataset.category;
            categoryItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            if (category === 'all') {
                displayProducts(allProducts);
            } else {
                const filteredProducts = allProducts.filter(product => 
                    product.category && product.category.toLowerCase() === category.toLowerCase()
                );
                displayProducts(filteredProducts);
            }
        });
    });

    // Initialize
    fetchProducts();
});

// Global functions for WhatsApp and Messenger orders
function openWhatsAppOrder(productName, productId) {
    const quantity = document.getElementById('product-quantity') ? document.getElementById('product-quantity').value : 1;
    const variantOption = document.querySelector('.variant-option.selected');
    const variant = variantOption ? variantOption.dataset.value : 'Default';
    
    const message = `আমি "${productName}" (${variant}) অর্ডার করতে চাই। পরিমাণ: ${quantity}। পণ্য ID: ${productId}`;
    const whatsappUrl = `https://wa.me/8801778095805?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function openMessengerOrder(productName, productId) {
    const quantity = document.getElementById('product-quantity') ? document.getElementById('product-quantity').value : 1;
    const variantOption = document.querySelector('.variant-option.selected');
    const variant = variantOption ? variantOption.dataset.value : 'Default';
    
    const message = `আমি "${productName}" (${variant}) অর্ডার করতে চাই। পরিমাণ: ${quantity}। পণ্য ID: ${productId}`;
    const messengerUrl = `https://www.facebook.com/messages/t/61578353266944?text=${encodeURIComponent(message)}`;
    window.open(messengerUrl, '_blank');
}

// Function to add product to cart
function addToCart(productId, productName, price, imageUrl, quantity = 1) {
    // This function would be implemented when the cart functionality is added
    console.log(`Adding to cart: ${productName}, Quantity: ${quantity}`);
    // Update cart count
    const cartCountTop = document.querySelector('.cart-count');
    const cartCountBottom = document.querySelector('.cart-count-bottom');
    
    if (cartCountTop && cartCountBottom) {
        const currentCount = parseInt(cartCountTop.textContent);
        cartCountTop.textContent = currentCount + 1;
        cartCountBottom.textContent = currentCount + 1;
    }
}
