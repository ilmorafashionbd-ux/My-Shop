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
    const relatedProductsGrid = document.getElementById('related-products-grid');

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

    // Show product detail
    const showProductDetail = (product) => {
        const mainImageUrl = GITHUB_IMAGE_BASE_URL + product.image_url;
        const otherImages = product.other_images ? product.other_images.split(',').map(img => GITHUB_IMAGE_BASE_URL + img.trim()) : [];
        const allImages = [mainImageUrl, ...otherImages];

        productDetailContainer.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-images">
                    <img id="main-product-image" class="main-image" src="${allImages[0]}" alt="${product.product_name}">
                    ${allImages.length > 1 ? `
                        <div class="thumbnail-images">
                            ${allImages.map((img, i) => `<img class="thumbnail ${i===0?'active':''}" src="${img}" data-img-url="${img}">`).join('')}
                        </div>` : ''}
                </div>
                <div class="product-detail-info">
                    <h2>${product.product_name}</h2>
                    <div class="product-price">মূল্য: ${product.price}৳</div>
                    <p>${product.description || 'বিবরণ পাওয়া যায়নি।'}</p>
                    <button class="order-btn" id="add-to-cart-btn">কার্টে যুক্ত করুন</button>
                    <button class="order-btn" id="buy-now-btn">এখনই কিনুন</button>
                </div>
            </div>
        `;
        productDetailModal.style.display = 'block';
        document.body.classList.add('modal-open');

        // Thumbnails
        productDetailContainer.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', e => {
                document.getElementById('main-product-image').src = e.target.dataset.imgUrl;
                productDetailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Add to cart
        document.getElementById('add-to-cart-btn').addEventListener('click', () => addToCart(product));

        // Buy now
        document.getElementById('buy-now-btn').addEventListener('click', () => showOrderForm(product));

        // Related products
        showRelatedProducts(product);
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

    // Cart
    const addToCart = (product) => {
        const existing = cart.find(p => p.id === product.id);
        if (existing) existing.quantity++;
        else cart.push({...product, quantity:1});
        updateCartCount();
        alert(`${product.product_name} কার্টে যুক্ত হয়েছে`);
    };

    const updateCartCount = () => {
        const total = cart.reduce((s, i) => s + i.quantity, 0);
        cartCountTop.textContent = total;
        cartCountBottom.textContent = total;
    };

    // Order form
    const showOrderForm = (product) => {
        document.getElementById('product-name-input').value = product.product_name;
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

    // Related products
    const showRelatedProducts = (product) => {
        relatedProductsGrid.innerHTML = '';
        const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0,4);
        related.forEach(r => {
            const img = GITHUB_IMAGE_BASE_URL + r.image_url;
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.innerHTML = `
                <div class="product-image"><img src="${img}"></div>
                <div class="product-info"><h3>${r.product_name}</h3><div class="product-price">${r.price}৳</div></div>
            `;
            card.addEventListener('click', () => showProductDetail(r));
            relatedProductsGrid.appendChild(card);
        });
    };

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