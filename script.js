// ===================================
// CONFIGURATION
// ===================================
// অনুগ্রহ করে এখানে আপনার Google Sheet-এর "Publish to the web" করা CSV লিংকটি দিন।
// লিংকটি অবশ্যই "output=csv" দিয়ে শেষ হতে হবে।
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ22y4aV-V-pAL_N9ODunL-25mKn2e0yI_sttY20Cr52I1n22uu-s3j_kH21GSsPz28-_b-t-wi8uDF/pub?output=csv';
const WHATSAPP_NUMBER = '8801778095805'; // আপনার WhatsApp নম্বর দিন

// ===================================
// GLOBAL STATE
// ===================================
let allProducts = [];
let isDataLoaded = false;
let dataLoadPromise = null;

// ===================================
// UTILITY FUNCTIONS
// ===================================

/**
 * যেকোনো স্ট্রিংকে লোয়ারকেস এবং স্পেস/আন্ডারস্কোর ছাড়া একটি স্ট্যান্ডার্ড ফরম্যাটে আনে।
 * যেমন: "Product ID", "product_id", "productid" -> "productid"
 * @param {string} s - The input string.
 * @returns {string} The normalized string.
 */
function normalizeKey(s) {
    return String(s || '').toLowerCase().replace(/[\s_]+/g, '');
}

/**
 * একটি রো (অবজেক্ট) থেকে বিভিন্ন সম্ভাব্য কী (key) ব্যবহার করে ডেটা খুঁজে বের করে।
 * @param {object} row - The data object (e.g., from CSV).
 * @param {string[]} variants - An array of possible keys (e.g., ['id', 'product id']).
 * @returns {string} The found value or an empty string.
 */
function getAny(row, variants = []) {
    for (const v of variants) {
        const normalizedVariant = normalizeKey(v);
        for (const key in row) {
            if (normalizeKey(key) === normalizedVariant) {
                const val = String(row[key] ?? '').trim();
                if (val) return val;
            }
        }
    }
    return '';
}

/**
 * Google Drive-এর শেয়ারিং লিংককে সরাসরি ব্যবহারযোগ্য ইমেজ লিংকে রূপান্তর করে।
 * @param {string} url - The original image URL.
 * @returns {string} A direct image URL.
 */
function fixImageUrl(url) {
    if (!url) return 'https://via.placeholder.com/300?text=No+Image'; // একটি ফলব্যাক ইমেজ
    const gDriveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (gDriveMatch && gDriveMatch[1]) {
        return `https://drive.google.com/uc?export=view&id=${gDriveMatch[1]}`;
    }
    return url;
}

/**
 * CSV থেকে পাওয়া একটি রো-কে আমাদের স্ট্যান্ডার্ড প্রোডাক্ট অবজেক্টে রূপান্তর করে।
 * @param {object} row - A single row object from PapaParse.
 * @returns {object} A standardized product object.
 */
function normalizeRow(row) {
    const id = getAny(row, ['id', 'product id', 'product_id', 'পণ্যআইডি']);
    const name = getAny(row, ['name', 'product name', 'title', 'পণ্যের নাম']);
    const price = getAny(row, ['price', 'মূল্য', 'mrp', 'sale price']);
    const category = getAny(row, ['category', 'ক্যাটাগরি', 'type']);
    const description = getAny(row, ['description', 'details', 'বিবরণ']);
    const stockStatus = getAny(row, ['stockstatus', 'stock', 'availability', 'স্টক']);
    const imageRaw = getAny(row, ['imageurl', 'image url', 'image', 'photo', 'ছবি', 'thumbnail']);

    return {
        id,
        name,
        price: parseFloat(price) || 0,
        category,
        description,
        stockStatus: stockStatus.toLowerCase() === 'out of stock' ? 'Out of Stock' : 'In Stock',
        imageUrl: fixImageUrl(imageRaw),
    };
}


// ===================================
// DATA LOADING
// ===================================

/**
 * Google Sheet থেকে CSV ডেটা লোড করে এবং `allProducts` অ্যারে পপুলেট করে।
 * @returns {Promise<void>}
 */
function loadProducts() {
    if (dataLoadPromise) {
        return dataLoadPromise;
    }

    dataLoadPromise = new Promise((resolve, reject) => {
        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.data) {
                    const normalized = results.data
                        .map(normalizeRow)
                        .filter(p => p.id && p.name && p.imageUrl); // জরুরি ফিল্ডগুলো থাকতে হবে

                    allProducts = normalized;
                    isDataLoaded = true;
                    console.log('Products loaded and normalized successfully.');
                    console.table(allProducts.slice(0, 5));
                    resolve();
                } else {
                    console.error('CSV parsing completed but no data found.');
                    reject(new Error('No data found in the CSV file.'));
                }
            },
            error: (err) => {
                console.error('Error loading or parsing CSV:', err);
                reject(err);
            }
        });
    });

    return dataLoadPromise;
}

// ===================================
// RENDERING FUNCTIONS
// ===================================

/**
 * প্রোডাক্ট কার্ডের জন্য HTML স্ট্রিং তৈরি করে।
 * @param {object} product - The product object.
 * @returns {string} HTML string for a product card.
 */
function createProductCardHTML(product) {
    const isOutOfStock = product.stockStatus === 'Out of Stock';
    const detailUrl = `product-detail.html?id=${product.id}`;

    return `
        <div class="product-card" data-id="${product.id}">
            <a href="${detailUrl}">
                <div class="product-image">
                    <img src="${product.imageUrl}" alt="${product.name}">
                    ${isOutOfStock ? '<span class="stock-status">Out of Stock</span>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">৳ ${product.price}</p>
                    <button class="order-btn" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Unavailable' : 'Order Now'}
                    </button>
                </div>
            </a>
        </div>
    `;
}


/**
 * নির্দিষ্ট একটি DOM এলিমেন্টে প্রোডাক্টগুলো প্রদর্শন করে।
 * @param {object[]} products - Array of product objects to display.
 * @param {HTMLElement} gridElement - The DOM element to render products into.
 */
function displayProducts(products, gridElement) {
    if (!gridElement) return;

    if (products.length === 0) {
        gridElement.innerHTML = '<p>এই ক্যাটাগরিতে কোনো প্রোডাক্ট পাওয়া যায়নি।</p>';
        return;
    }

    gridElement.innerHTML = products.map(createProductCardHTML).join('');
}

// ===================================
// EVENT LISTENERS & UI LOGIC
// ===================================

/**
 * প্রোডাক্ট কার্ড এবং অর্ডার বাটনে ক্লিক ইভেন্ট যোগ করে।
 */
function addEventListeners() {
    document.body.addEventListener('click', (event) => {
        const orderBtn = event.target.closest('.order-btn');
        const productCardLink = event.target.closest('.product-card a');

        if (orderBtn) {
            event.preventDefault(); // লিংক অনুসরণ করা থেকে বিরত রাখে
            event.stopPropagation(); // কার্ডের ক্লিক ইভেন্ট থামায়
            const productId = orderBtn.dataset.id;
            const product = allProducts.find(p => p.id === productId);
            if (product) {
                openOrderModal(product);
            }
        } else if (productCardLink) {
             // লিংক স্বাভাবিকভাবে কাজ করবে, তাই কিছু করার দরকার নেই
        }
    });
}


/**
 * নির্দিষ্ট একটি প্রোডাক্টের জন্য অর্ডার মডাল খুলে দেয়।
 * @param {object} product - The product to order.
 */
function openOrderModal(product) {
    const modal = document.getElementById('order-modal');
    if (!modal) return;

    document.getElementById('product-name-input').value = product.name;
    modal.style.display = 'flex';

    // মডালের ক্লোজ বাটন সেটআপ
    const closeBtn = modal.querySelector('.order-close-btn');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // মডালের বাইরে ক্লিক করলে বন্ধ হবে
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

/**
 * অর্ডার ফর্ম সাবমিট হলে WhatsApp মেসেজ তৈরি করে এবং পাঠায়।
 */
function handleOrderFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const productName = form.querySelector('#product-name-input').value;
    const customerName = form.querySelector('#customer-name').value;
    const customerAddress = form.querySelector('#customer-address').value;
    const customerMobile = form.querySelector('#customer-mobile').value;

    const message = `
        *New Order Request*
        -----------------------------------
        *Product:* ${productName}
        *Name:* ${customerName}
        *Address:* ${customerAddress}
        *Mobile:* ${customerMobile}
        -----------------------------------
        Order from Website.
    `;

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    form.reset();
    document.getElementById('order-modal').style.display = 'none';
}

// ===================================
// PAGE-SPECIFIC LOGIC
// ===================================

async function initHomePage() {
    const featuredGrid = document.getElementById('product-grid');
    if (!featuredGrid) return;

    featuredGrid.innerHTML = '<p>প্রোডাক্ট লোড হচ্ছে...</p>';
    try {
        await loadProducts();
        // হোমপেজে প্রথম ৮টি প্রোডাক্ট দেখানো যেতে পারে
        displayProducts(allProducts.slice(0, 8), featuredGrid);
    } catch (error) {
        featuredGrid.innerHTML = '<p>দুঃখিত, প্রোডাক্ট লোড করা সম্ভব হচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।</p>';
    }
}

async function initProductsPage() {
    const allProductsGrid = document.getElementById('product-grid');
    if (!allProductsGrid) return;
    
    allProductsGrid.innerHTML = '<p>প্রোডাক্ট লোড হচ্ছে...</p>';
    try {
        await loadProducts();
        displayProducts(allProducts, allProductsGrid);
    } catch (error) {
        allProductsGrid.innerHTML = '<p>দুঃখিত, প্রোডাক্ট লোড করা সম্ভব হচ্ছে না। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।</p>';
    }
}

async function initProductDetailPage() {
    const detailContainer = document.getElementById('product-detail-container');
    const relatedGrid = document.getElementById('related-products-grid');
    if (!detailContainer || !relatedGrid) return;

    detailContainer.innerHTML = '<p>প্রোডাক্টের বিবরণ লোড হচ্ছে...</p>';
    
    try {
        await loadProducts();
        
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const product = allProducts.find(p => p.id === productId);

        if (product) {
            const isOutOfStock = product.stockStatus === 'Out of Stock';
            detailContainer.innerHTML = `
                <div class="product-detail-image">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </div>
                <div class="product-detail-content">
                    <h1>${product.name}</h1>
                    <p class="price">৳ ${product.price}</p>
                    <p class="description">${product.description || 'No description available.'}</p>
                    <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
                    <p><strong>Availability:</strong> ${product.stockStatus}</p>
                    <button class="order-btn" data-id="${product.id}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Unavailable' : 'Order via WhatsApp'}
                    </button>
                </div>
            `;

            // রিলেটেড প্রোডাক্ট দেখানো
            const relatedProducts = allProducts
                .filter(p => p.category === product.category && p.id !== product.id)
                .slice(0, 4);
            displayProducts(relatedProducts, relatedGrid);

        } else {
            detailContainer.innerHTML = '<p>দুঃখিত, এই প্রোডাক্টটি খুঁজে পাওয়া যায়নি।</p>';
        }

    } catch (error) {
        detailContainer.innerHTML = '<p>প্রোডাক্টের বিবরণ লোড করা সম্ভব হচ্ছে না।</p>';
    }
}


// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // সাধারণ ইভেন্টগুলো সব পেজের জন্য যোগ করা
    addEventListeners();
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', handleOrderFormSubmit);
    }

    // কোন পেজে আছি তার উপর ভিত্তি করে নির্দিষ্ট ফাংশন চালানো
    const path = window.location.pathname;
    if (path.endsWith('/') || path.endsWith('index.html')) {
        initHomePage();
    } else if (path.endsWith('products.html')) {
        initProductsPage();
    } else if (path.endsWith('product-detail.html')) {
        initProductDetailPage();
    }
});