// =========================
// Navigation Toggle
// =========================
document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.querySelector('.menu-btn');
  const navbar = document.querySelector('.navbar');
  menuBtn.addEventListener('click', () => {
    navbar.classList.toggle('active');
  });
});

// =========================
// Product & Cart
// =========================
document.addEventListener('DOMContentLoaded', () => {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDl-cw7a6X_kIJh_e6Q_lIllD9_9R_IXPnCCs3HCGMhTHD9OG67rqKT2NGiHmY7hsSyeZ9sM6urutp/pub?gid=0&single=true&output=csv';
  const GITHUB_IMAGE_BASE_URL = 'https://ilmorafashionbd-ux.github.io/My-Bazaar-/images/';

  let allProducts = [];
  let cart = [];

  const productGrid = document.getElementById('product-grid');
  const productDetailModal = document.getElementById('product-detail-modal');
  const productDetailContainer = document.getElementById('product-detail-container');
  const productModalCloseBtn = document.getElementById('product-modal-close');
  const relatedProductsGrid = document.getElementById('related-products-grid');
  const orderModal = document.getElementById('order-modal');
  const orderForm = document.getElementById('order-form');
  const orderModalCloseBtn = document.getElementById('order-modal-close');
  const cartCountTop = document.querySelector('.cart-count');
  const cartCountBottom = document.querySelector('.cart-count-bottom');

  // Fetch products
  const fetchProducts = async () => {
    const response = await fetch(csvUrl);
    const text = await response.text();
    Papa.parse(text, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        allProducts = results.data.filter(p => p.id);
        displayProducts(allProducts);
      }
    });
  };

  // Display products on grid
  const displayProducts = (products) => {
    productGrid.innerHTML = '';
    products.forEach(product => {
      const img = GITHUB_IMAGE_BASE_URL + product.image_url;
      const card = document.createElement('div');
      card.classList.add('product-card');
      card.dataset.productId = product.id;
      card.innerHTML = `
        <div class="product-image">
          <img src="${img}" alt="${product.product_name}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.product_name}</h3>
          <div class="product-price">${product.price}৳</div>
        </div>
      `;
      card.addEventListener('click', () => showProductDetail(product));
      productGrid.appendChild(card);
    });
  };

  // Show product detail
  const showProductDetail = (product) => {
    const mainImage = GITHUB_IMAGE_BASE_URL + product.image_url;
    const otherImages = product.other_images ? product.other_images.split(',').map(i => GITHUB_IMAGE_BASE_URL + i.trim()) : [];
    const allImages = [mainImage, ...otherImages];

    productDetailContainer.innerHTML = `
      <div class="product-detail-layout">
        <div class="product-detail-images">
          <img id="main-product-image" class="main-image" src="${mainImage}">
          <div class="thumbnail-images">
            ${allImages.map((img, idx) => `<img class="thumbnail ${idx===0?'active':''}" src="${img}" data-img-url="${img}">`).join('')}
          </div>
        </div>
        <div class="product-detail-info">
          <h2>${product.product_name}</h2>
          <div class="product-price">${product.sale_price ? `<span style="text-decoration:line-through">${product.price}৳</span> <span style="color:red">${product.sale_price}৳</span>` : `${product.price}৳`}</div>
          <p>${product.description || 'কোনো বর্ণনা নেই।'}</p>
          <button class="order-btn" id="add-to-cart-btn">কার্টে যুক্ত করুন</button>
          <button class="order-btn" id="buy-now-btn">এখনই কিনুন</button>
        </div>
      </div>
    `;

    productDetailModal.style.display = 'block';

    // Thumbnails
    const mainImgEl = document.getElementById('main-product-image');
    document.querySelectorAll('.thumbnail').forEach(th => {
      th.addEventListener('click', (e) => {
        mainImgEl.src = e.target.dataset.imgUrl;
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Buttons
    document.getElementById('add-to-cart-btn').addEventListener('click', () => {
      cart.push(product);
      updateCartCount();
      alert('কার্টে যুক্ত হয়েছে!');
    });
    document.getElementById('buy-now-btn').addEventListener('click', () => {
      showOrderForm(product);
    });

    // Related Products
    relatedProductsGrid.innerHTML = '';
    allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0,4).forEach(rp => {
      const img = GITHUB_IMAGE_BASE_URL + rp.image_url;
      const card = document.createElement('div');
      card.classList.add('product-card');
      card.innerHTML = `
        <img src="${img}">
        <h4>${rp.product_name}</h4>
        <div class="product-price">${rp.price}৳</div>
      `;
      card.addEventListener('click', () => showProductDetail(rp));
      relatedProductsGrid.appendChild(card);
    });

    history.pushState({ modalOpen: true }, '', '#product');
  };

  // Close modals
  productModalCloseBtn.addEventListener('click', () => {
    productDetailModal.style.display = 'none';
    history.back();
  });
  orderModalCloseBtn.addEventListener('click', () => {
    orderModal.style.display = 'none';
  });
  window.addEventListener('popstate', (e) => {
    if (!e.state?.modalOpen) {
      productDetailModal.style.display = 'none';
      orderModal.style.display = 'none';
    }
  });

  // Show Order Form
  const showOrderForm = (product) => {
    orderModal.style.display = 'block';
    document.getElementById('product-name-input').value = product.product_name;
    document.getElementById('product-id-input').value = product.id;
  };

  // WhatsApp Submit
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('customer-name').value;
    const address = document.getElementById('customer-address').value;
    const mobile = document.getElementById('customer-mobile').value;
    const productName = document.getElementById('product-name-input').value;
    const url = `https://wa.me/8801778095805?text=অর্ডার:%20${productName}%0Aনাম:%20${name}%0Aঠিকানা:%20${address}%0Aমোবাইল:%20${mobile}`;
    window.open(url, '_blank');
  });

  // Cart Count Update
  const updateCartCount = () => {
    cartCountTop.textContent = cart.length;
    cartCountBottom.textContent = cart.length;
  };

  fetchProducts();
});