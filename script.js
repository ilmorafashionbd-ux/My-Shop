document.addEventListener('DOMContentLoaded', () => {
    // Replace this URL with your published Google Sheet CSV URL
    const googleSheetCSVUrl = 'YOUR_PUBLISHED_GOOGLE_SHEET_CSV_URL_HERE';
    const productListContainer = document.getElementById('product-list');
    const phoneNumber = '01778095805'; // Your WhatsApp number

    fetch(googleSheetCSVUrl)
        .then(response => response.text())
        .then(csvText => {
            const products = parseCSV(csvText);
            displayProducts(products);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            productListContainer.innerHTML = '<p>পণ্য লোড করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।</p>';
        });

    function parseCSV(csv) {
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const products = [];

        for (let i = 1; i < lines.length; i++) {
            const data = lines[i].split(',');
            if (data.length === headers.length) {
                const product = {};
                for (let j = 0; j < headers.length; j++) {
                    product[headers[j]] = data[j].trim();
                }
                products.push(product);
            }
        }
        return products;
    }

    function displayProducts(products) {
        productListContainer.innerHTML = ''; // Clear existing products
        products.forEach(product => {
            if (product.image_url && product.name && product.price) {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';

                productCard.innerHTML = `
                    <img src="${product.image_url}" alt="${product.name}" class="product-image">
                    <div class="product-details">
                        <h3>${product.name}</h3>
                        <p class="price">৳ ${product.price}</p>
                        <button class="order-button" onclick="sendWhatsAppOrder('${product.name}', '${product.price}')">
                            অর্ডার করুন
                        </button>
                    </div>
                `;
                productListContainer.appendChild(productCard);
            }
        });
    }

    window.sendWhatsAppOrder = (productName, productPrice) => {
        const message = `হ্যালো, আমি ${productName} পণ্যটি অর্ডার করতে চাই। মূল্য: ৳ ${productPrice}`;
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };
});
