document.addEventListener('DOMContentLoaded', () => {

    // IMPORTANT: REPLACE THIS WITH YOUR PUBLISHED GOOGLE SHEET LINK
    const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRvJSc-B0_uG9Yt1QOMq6Kcq0ccW4dbztEFeRXUYqZIIWvVQWhG4NrcHXB4WBq-5G2JXHRuz7lpbDGK/pub?gid=0&single=true&output=csv';

    // IMPORTANT: REPLACE THIS WITH YOUR WHATSAPP NUMBER
    const WHATSAPP_NUMBER = '8801778095805';

    const GITHUB_REPO = 'https://ilmorafashionbd-ux.github.io/My-Shop/images/';

    const path = window.location.pathname;

    async function fetchData() {
        try {
            const response = await fetch(GOOGLE_SHEET_URL);
            const csvText = await response.text();
            const products = parseCSV(csvText);
            return products;
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length <= 1) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1);

        return data.map(line => {
            const values = line.split(',').map(v => v.trim());
            const product = {};
            headers.forEach((header, i) => {
                product[header] = values[i];
            });
            return product;
        });
    }

    function createProductCard(product) {
        const productCard = document.createElement('a');
        productCard.href = `product-detail.html?name=${encodeURIComponent(product.Name)}`;
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${GITHUB_REPO}${product.ImageFileName}" alt="${product.Name}">
            <div class="product-card-content">
                <h3>${product.Name}</h3>
                <p>${product.Price}</p>
            </div>
        `;
        return productCard;
    }

    // Home Page Logic
    if (path.includes('index.html') || path === '/' || path.endsWith('/My-Shop/')) {
        fetchData().then(products => {
            const featuredProductsGrid = document.getElementById('featured-products-grid');
            if (featuredProductsGrid) {
                const featured = products.slice(0, 3); // Show first 3 products
                featured.forEach(product => {
                    featuredProductsGrid.appendChild(createProductCard(product));
                });
            }
        });
    }

    // Products Page Logic
    if (path.includes('products.html')) {
        fetchData().then(products => {
            const allProductsGrid = document.getElementById('all-products-grid');
            if (allProductsGrid) {
                products.forEach(product => {
                    allProductsGrid.appendChild(createProductCard(product));
                });
            }
        });
    }

    // Product Detail Page Logic
    if (path.includes('product-detail.html')) {
        const params = new URLSearchParams(window.location.search);
        const productName = params.get('name');

        if (productName) {
            fetchData().then(products => {
                const product = products.find(p => p.Name === productName);
                if (product) {
                    renderProductDetail(product);
                } else {
                    document.getElementById('product-detail-container').innerHTML = '<p>Product not found.</p>';
                }
            });
        }
    }

    function renderProductDetail(product) {
        const container = document.getElementById('product-detail-container');
        if (!container) return;

        container.innerHTML = `
            <img src="${GITHUB_REPO}${product.ImageFileName}" alt="${product.Name}" class="product-detail-image">
            <div class="product-detail-content">
                <h1>${product.Name}</h1>
                <p class="price">${product.Price}</p>
                <p class="description">${product.Description}</p>
                <button class="btn" id="order-now-btn">Order Now</button>
            </div>
        `;

        const orderBtn = document.getElementById('order-now-btn');
        if (orderBtn) {
            orderBtn.addEventListener('click', () => {
                const modal = document.getElementById('order-modal');
                modal.style.display = 'flex';
                document.getElementById('product-name-input').value = product.Name;
                document.getElementById('product-price-input').value = product.Price;
            });
        }

        const modal = document.getElementById('order-modal');
        const closeBtn = document.querySelector('.close-btn');

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });

        const orderForm = document.getElementById('order-form');
        if (orderForm) {
            orderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const customerName = document.getElementById('customer-name').value;
                const customerPhone = document.getElementById('customer-phone').value;
                const customerAddress = document.getElementById('customer-address').value;
                const productName = document.getElementById('product-name-input').value;
                const productPrice = document.getElementById('product-price-input').value;

                const message = `New Order:\n-----------\nProduct: ${productName}\nPrice: ${productPrice}\nCustomer Name: ${customerName}\nPhone: ${customerPhone}\nAddress: ${customerAddress}`;
                const encodedMessage = encodeURIComponent(message);
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
            });
        }
    }

    // Contact Page Logic
    if (path.includes('contact.html')) {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = document.getElementById('contact-name').value;
                const phone = document.getElementById('contact-phone').value;
                const address = document.getElementById('contact-address').value;
                const message = document.getElementById('contact-message').value;

                const whatsappMessage = `New Contact Message:\n---------------------\nName: ${name}\nPhone: ${phone}\nAddress: ${address}\nMessage: ${message}`;
                const encodedMessage = encodeURIComponent(whatsappMessage);
                window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`, '_blank');
            });
        }
    }
});