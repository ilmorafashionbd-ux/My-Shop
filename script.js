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
    
    // NEW: Load cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

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
    const relatedProductsSection = document.querySelector('.related-products');
    const relatedProductsGrid = document.getElementById('related-products-grid');

    // NEW: Cart modal selectors
    const cartModal = document.getElementById('cart-modal');
    const cartModalCloseBtn = document.getElementById('cart-modal-close');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalElement = document.getElementById('cart-total-price');
    const openCartBtns = document.querySelectorAll('#open-cart-btn, #open-cart-btn-bottom');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Check if URL has product ID parameter for single product view
    const urlParams = new URLSearchParams(window.location.search);
    const productIdFromUrl = urlParams.get('product');
    const isSingleProductView = productIdFromUrl !== null;

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
                    
                    if (isSingleProductView) {
                        // Show single product view if product ID is in URL
                        const product = allProducts.find(p => p.id == productIdFromUrl);
                        if (product) {
                            showSingleProductView(product);
                            // After showing single product, display related products
                            displayRelatedProducts(product);
                        } else {
                            document.body.innerHTML = '<div class="container"><p>পণ্যটি পাওয়া যায়নি। <a href="index.html">হোমপেজে ফিরে যান</a></p></div>';
                        }
                    } else if (allProducts.length > 0) {
                        displayProducts(allProducts);
                    } else {
                        productGrid.innerHTML = '<p>কোনো প্রোডাক্ট পাওয়া যায়নি।</p>';
                    }
                    updateCartCount();
                }
            });
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    // Display products on homepage
    const displayProducts = (productsToDisplay, targetGrid = productGrid) => {
        targetGrid.innerHTML = '';
        if (productsToDisplay.length === 0) {
            targetGrid.innerHTML = '<p>এই ক্যাটাগরিতে কোনো পণ্য নেই।</p>';
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
                    <button class="order-btn add-to-cart-home-btn"
                        data-id="${product.id}"
                        data-name="${product.product_name}"
                        data-price="${product.price}"
                        data-image="${mainImageUrl}"
                        ${isOutOfStock ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i> Add to Cart
                    </button>
                </div>
            `;
            targetGrid.appendChild(productCard);

            // NEW: Add to Cart button listener for product cards
            productCard.querySelector('.add-to-cart-home-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent product card click event
                const id = e.target.dataset.id;
                const name = e.target.dataset.name;
                const price = e.target.dataset.price;
                const image = e.target.dataset.image;
                addToCart({
                    id: id,
                    product_name: name,
                    price: price,
                    image_url: image,
                    quantity: 1,
                    selectedVariant: ''
                });
            });

            productCard.addEventListener('click', () => {
                // Redirect to single product view
                window.location.href = `index.html?product=${product.id}`;
            });
        });
    };

    // Show single product view when product ID is in URL
    const showSingleProductView = (product) => {
        // Hide elements that are not needed in single product view
        document.querySelector('.banner').style.display = 'none';
        document.querySelector('.categories').style.display = 'none';
        // Check for the new class to hide only the specific title
        const homePageTitle = document.querySelector('.section-title.homepage-title');
        if (homePageTitle) {
            homePageTitle.style.display = 'none';
        }
        document.querySelector('.footer').style.marginBottom = '0';
        
        // Change page title
        document.title = `${product.product_name} - Ilmora Fashion BD`;
        
        const mainImageUrl = GITHUB_IMAGE_BASE_URL + product.image_url;
        const otherImages = product.other_images ? product.other_images.split(',').map(img => GITHUB_IMAGE_BASE_URL + img.trim()) : [];
        const allImages = [mainImageUrl, ...otherImages];

        const oldPriceHtml = product.old_price ? `<span class="old-price">${product.old_price}৳</span>` : '';
        const sizes = product.size ? product.size.split(',').map(s => s.trim()) : [];
        const sizeOptionsHtml = sizes.map(s => `<div class="variant-option" data-value="${s}">${s}</div>`).join('');
        
        // Replace product grid with single product view
        productGrid.innerHTML = `
            <div class="single-product-container">
                <div class="breadcrumb">
                    <a href="index.html">হোম</a> > <a href="#products">শপ</a> > <span>${product.product_name}</span>
                </div>
                
                <div class="product-main-details">
                    <div class="product-images">
                        <img id="main-product-image" class="main-image" src="${allImages[0]}" alt="${product.product_name}">
                        ${allImages.length > 1 ? `
                            <div class="thumbnail-images">
                                ${allImages.map((img, i) => `<img class="thumbnail ${i===0?'active':''}" src="${img}" data-img-url="${img}">`).join('')}
                            </div>` : ''}
                    </div>
                    
                    <div class="product-info-panel">
                        <div class="product-meta">
                            <h2 class="product-title">${product.product_name}</h2>
                            <div class="price-section">
                                <span class="main-price">${product.price}৳</span>
                                ${oldPriceHtml}
                            </div>
                            <div class="product-code">PCODE: ${product.sku || 'N/A'}</div>
                        </div>
                        
                        ${sizes.length > 0 ? `
                            <div class="variant-section">
                                <label class="variant-label">Size:</label>
                                <div class="variant-options">
                                    ${sizeOptionsHtml}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="quantity-section">
                            <span class="quantity-label">Quantity:</span>
                            <div class="quantity-controls">
                                <button class="quantity-btn minus">-</button>
                                <input type="number" class="quantity-input" value="1" min="1">
                                <button class="quantity-btn plus">+</button>
                            </div>
                        </div>
                        
                        <div class="order-buttons">
                            <button class="whatsapp-order-btn" id="whatsapp-order-btn">
                                <i class="fab fa-whatsapp"></i> WhatsApp Order
                            </button>
                            <button class="messenger-order-btn" id="messenger-order-btn">
                                <i class="fab fa-facebook-messenger"></i> Messenger Order
                            </button>
                            <button class="add-to-cart-btn" id="add-to-cart-btn">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="product-description-section">
                    <h3 class="section-title">Product Description</h3>
                    <div class="description-content">
                        ${product.description || 'বিবরণ পাওয়া যায়নি।'}
                    </div>
                </div>
            </div>
        `;
        
        // Thumbnails functionality
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', e => {
                document.getElementById('main-product-image').src = e.target.dataset.imgUrl;
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Variant selection
        const variantOptionsEl = document.querySelectorAll('.variant-option');
        if (variantOptionsEl.length > 0) {
            variantOptionsEl[0].classList.add('selected');
            
            variantOptionsEl.forEach(option => {
                option.addEventListener('click', () => {
                    variantOptionsEl.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                });
            });
        }

        // Quantity controls
        const quantityInput = document.querySelector('.quantity-input');
        document.querySelector('.quantity-btn.plus').addEventListener('click', () => {
            quantityInput.value = parseInt(quantityInput.value) + 1;
        });
        
        document.querySelector('.quantity-btn.minus').addEventListener('click', () => {
            if (parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
            }
        });

        // WhatsApp order button
        document.querySelector('#whatsapp-order-btn').addEventListener('click', () => {
            const selectedVariant = document.querySelector('.variant-option.selected')?.dataset.value || '';
            const quantity = quantityInput.value;
            showOrderForm(product, selectedVariant, quantity);
        });

        // Messenger order button
        document.querySelector('#messenger-order-btn').addEventListener('click', () => {
            const selectedVariant = document.querySelector('.variant-option.selected')?.dataset.value || '';
            const quantity = quantityInput.value;
            const productNameWithVariant = `${product.product_name} (${selectedVariant})`.trim();
            
            // Open Facebook Messenger with pre-filled message
            const msg = `I want to order: ${productNameWithVariant} (Quantity: ${quantity})`;
            window.open(`https://m.me/61578353266944?text=${encodeURIComponent(msg)}`, '_blank');
        });

        // Add to Cart button
        document.querySelector('#add-to-cart-btn').addEventListener('click', () => {
            const selectedVariant = document.querySelector('.variant-option.selected')?.dataset.value || '';
            const quantity = parseInt(quantityInput.value);
            addToCart({ ...product, selectedVariant, quantity });
        });
    };

    // Function to display related products
    const displayRelatedProducts = (currentProduct) => {
        const related = allProducts.filter(p => 
            p.category === currentProduct.category && p.id !== currentProduct.id
        );

        if (related.length > 0) {
            relatedProductsSection.style.display = 'block';
            displayProducts(related, relatedProductsGrid);
        } else {
            relatedProductsSection.style.display = 'none';
        }
    };

    // Show product detail in modal (for homepage)
    const showProductDetailModal = (product) => {
        const mainImageUrl = GITHUB_IMAGE_BASE_URL + product.image_url;
        const otherImages = product.other_images ? product.other_images.split(',').map(img => GITHUB_IMAGE_BASE_URL + img.trim()) : [];
        const allImages = [mainImageUrl, ...otherImages];
        
        const oldPriceHtml = product.old_price ? `<span class="old-price">${product.old_price}৳</span>` : '';
        const sizes = product.size ? product.size.split(',').map(s => s.trim()) : [];
        const sizeOptionsHtml = sizes.map(s => `<div class="variant-option" data-value="${s}">${s}</div>`).join('');

        productDetailContainer.innerHTML = `
            <div class="product-main-details">
                <div class="product-images">
                    <img id="main-product-image" class="main-image" src="${allImages[0]}" alt="${product.product_name}">
                    ${allImages.length > 1 ? `
                        <div class="thumbnail-images">
                            ${allImages.map((img, i) => `<img class="thumbnail ${i===0?'active':''}" src="${img}" data-img-url="${img}">`).join('')}
                        </div>` : ''}
                </div>
                
                <div class="product-info-panel">
                    <div class="product-meta">
                        <h2 class="product-title">${product.product_name}</h2>
                        <div class="price-section">
                            <span class="main-price">${product.price}৳</span>
                            ${oldPriceHtml}
                        </div>
                        <div class="product-code">PCODE: ${product.sku || 'N/A'}</div>
                    </div>
                    
                    ${sizes.length > 0 ? `
                        <div class="variant-section">
                            <label class="variant-label">Size:</label>
                            <div class="variant-options">
                                ${sizeOptionsHtml}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="quantity-section">
                        <span class="quantity-label">Quantity:</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" class="quantity-input" value="1" min="1">
                            <button class="quantity-btn plus">+</button>
                        </div>
                    </div>
                    
                    <div class="order-buttons">
                        <button class="whatsapp-order-btn" id="whatsapp-order-btn">
                            <i class="fab fa-whatsapp"></i> WhatsApp Order
                        </button>
                        <button class="messenger-order-btn" id="messenger-order-btn">
                            <i class="fab fa-facebook-messenger"></i> Messenger Order
                        </button>
                        <button class="add-to-cart-btn" id="add-to-cart-btn">
                            <i class="fas fa-shopping-cart"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="product-description-section">
                <h3 class="section-title">Product Description</h3>
                <div class="description-content">
                    ${product.description || 'বিবরণ পাওয়া যায়নি।'}
                </div>
            </div>
        `;
        
        productDetailModal.style.display = 'block';
        document.body.classList.add('modal-open');

        // Thumbnails functionality
        productDetailContainer.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', e => {
                document.getElementById('main-product-image').src = e.target.dataset.imgUrl;
                productDetailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Variant selection
        const variantOptionsEl = productDetailContainer.querySelectorAll('.variant-option');
        if (variantOptionsEl.length > 0) {
            variantOptionsEl[0].classList.add('selected');
            
            variantOptionsEl.forEach(option => {
                option.addEventListener('click', () => {
                    variantOptionsEl.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                });
            });
        }

        // Quantity controls
        const quantityInput = productDetailContainer.querySelector('.quantity-input');
        productDetailContainer.querySelector('.quantity-btn.plus').addEventListener('click', () => {
            quantityInput.value = parseInt(quantityInput.value) + 1;
        });
        
        productDetailContainer.querySelector('.quantity-btn.minus').addEventListener('click', () => {
            if (parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
            }
        });

        // WhatsApp order button
        productDetailContainer.querySelector('#whatsapp-order-btn').addEventListener('click', () => {
            const selectedVariant = productDetailContainer.querySelector('.variant-option.selected')?.dataset.value || '';
            const quantity = quantityInput.value;
            showOrderForm(product, selectedVariant, quantity);
        });

        // Messenger order button
        productDetailContainer.querySelector('#messenger-order-btn').addEventListener('click', () => {
            const selectedVariant = productDetailContainer.querySelector('.variant-option.selected')?.dataset.value || '';
            const quantity = quantityInput.value;
            const productNameWithVariant = `${product.product_name} (${selectedVariant})`.trim();
            
            // Open Facebook Messenger with pre-filled message
            const msg = `I want to order: ${productNameWithVariant} (Quantity: ${quantity})`;
            window.open(`https://m.me/61578353266944?text=${encodeURIComponent(msg)}`, '_blank');
        });

        // Add to Cart button
        document.querySelector('#add-to-cart-btn').addEventListener('click', () => {
            const selectedVariant = document.querySelector('.variant-option.selected')?.dataset.value || '';
            const quantity = parseInt(quantityInput.value);
            addToCart({ ...product, selectedVariant, quantity });
        });

        history.pushState({ modalOpen: true }, '', '#product-' + product.id);
    };

    // Close product modal
    const closeProductDetailModal = () => {
        productDetailModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    };

    productModalCloseBtn.addEventListener('click', closeProductDetailModal);

    window.addEventListener('popstate', e => {
        if (!(e.state && e.state.modalOpen)) closeProductDetailModal();
    });

    // NEW: Cart Functionality
    const saveCart = () => {
        localStorage.setItem('cart', JSON.stringify(cart));
    };

    const addToCart = (product) => {
        const existing = cart.find(p => p.id === product.id && p.selectedVariant === product.selectedVariant);
        if (existing) {
            existing.quantity += product.quantity;
        } else {
            cart.push(product);
        }
        saveCart();
        updateCartCount();
        alert(`${product.product_name} কার্টে যোগ হয়েছে!`);
    };

    const removeFromCart = (productId, variant) => {
        cart = cart.filter(p => !(p.id === productId && p.selectedVariant === variant));
        saveCart();
        updateCartCount();
        renderCartItems();
    };

    const updateQuantity = (productId, variant, change) => {
        const product = cart.find(p => p.id === productId && p.selectedVariant === variant);
        if (product) {
            product.quantity += change;
            if (product.quantity <= 0) {
                removeFromCart(productId, variant);
            } else {
                saveCart();
                renderCartItems();
            }
        }
    };
    
    // NEW: Render cart items dynamically
    const renderCartItems = () => {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `<p id="empty-cart-message">আপনার কার্ট খালি।</p>`;
            cartTotalElement.textContent = '0';
            checkoutBtn.style.display = 'none';
            return;
        }

        checkoutBtn.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        let totalPrice = 0;

        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            
            const price = parseFloat(item.price);
            const subtotal = price * item.quantity;
            totalPrice += subtotal;

            const variantText = item.selectedVariant ? ` (${item.selectedVariant})` : '';

            itemElement.innerHTML = `
                <img src="${item.image_url}" alt="${item.product_name}">
                <div class="cart-item-details">
                    <h4>${item.product_name}${variantText}</h4>
                    <div class="cart-item-price">${price}৳ x ${item.quantity} = ${subtotal}৳</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-change-btn minus" data-id="${item.id}" data-variant="${item.selectedVariant}">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-change-btn plus" data-id="${item.id}" data-variant="${item.selectedVariant}">+</button>
                    </div>
                </div>
                <button class="remove-btn" data-id="${item.id}" data-variant="${item.selectedVariant}">&times;</button>
            `;
            cartItemsContainer.appendChild(itemElement);
        });

        cartTotalElement.textContent = totalPrice.toFixed(2);

        // Add listeners to new buttons
        document.querySelectorAll('.quantity-change-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const variant = e.target.dataset.variant;
                const change = e.target.classList.contains('plus') ? 1 : -1;
                updateQuantity(id, variant, change);
            });
        });

        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const variant = e.target.dataset.variant;
                removeFromCart(id, variant);
            });
        });
    };

    const updateCartCount = () => {
        const total = cart.reduce((s, i) => s + i.quantity, 0);
        cartCountTop.textContent = total;
        cartCountBottom.textContent = total;
    };

    // Open Cart Modal
    openCartBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            cartModal.style.display = 'block';
            document.body.classList.add('modal-open');
            renderCartItems();
        });
    });

    // Close Cart Modal
    cartModalCloseBtn.addEventListener('click', () => {
        cartModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });

    // Checkout button logic (from cart)
    checkoutBtn.addEventListener('click', () => {
        const total = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2);
        const productsList = cart.map(p => {
            const variantText = p.selectedVariant ? ` (${p.selectedVariant})` : '';
            return `${p.product_name}${variantText} - পরিমাণ: ${p.quantity}, মূল্য: ${parseFloat(p.price) * p.quantity}৳`;
        }).join('\n');
        
        const msg = `🛒 নতুন অর্ডার!\n\n${productsList}\n\nমোট মূল্য: ${total}৳\n\nদয়া করে আপনার নাম, ঠিকানা ও মোবাইল নম্বর দিন:`;
        
        // Open WhatsApp with pre-filled message
        window.open(`https://wa.me/8801778095805?text=${encodeURIComponent(msg)}`, '_blank');
    });

    // Order form (for single product)
    const showOrderForm = (product, variant = '', quantity = 1) => {
        const productNameWithVariant = `${product.product_name} (${variant})`.trim();
        document.getElementById('product-name-input').value = productNameWithVariant;
        document.getElementById('product-id-input').value = product.id;
        orderModal.style.display = 'block';
        document.body.classList.add('modal-open');
    };

    document.getElementById('order-modal-close').addEventListener('click', () => {
        orderModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });

    orderForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('customer-name').value;
        const address = document.getElementById('customer-address').value;
        const mobile = document.getElementById('customer-mobile').value;
        const productName = document.getElementById('product-name-input').value;
        const productId = document.getElementById('product-id-input').value;

        const msg = `🛒 নতুন অর্ডার!\nপণ্যের নাম: ${productName}\nID: ${productId}\n\nক্রেতা: ${name}\nঠিকানা: ${address}\nমোবাইল: ${mobile}`;
        window.open(`https://wa.me/8801778095805?text=${encodeURIComponent(msg)}`, '_blank');
        orderModal.style.display = 'none';
    });

    // Category filter
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const cat = item.dataset.category;
            const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category && p.category.toLowerCase().replace(/\s/g,'-') === cat);
            displayProducts(filtered);
        });
    });

    // Init
    fetchProducts();
});