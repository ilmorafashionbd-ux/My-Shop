// Open product detail
function openProductDetail(title, originalPrice, discountPrice, desc, mainImg, galleryImgs) {
  document.getElementById("productDetailModal").style.display = "flex";
  document.getElementById("productTitle").innerText = title;
  document.getElementById("originalPrice").innerText = "৳" + originalPrice;
  document.getElementById("discountPrice").innerText = "৳" + discountPrice;
  document.getElementById("productDesc").innerText = desc;
  document.getElementById("mainImage").src = mainImg;

  // Gallery
  let thumbHTML = "";
  galleryImgs.forEach(img => {
    thumbHTML += `<img src="${img}" onclick="document.getElementById('mainImage').src='${img}'">`;
  });
  document.getElementById("thumbnailContainer").innerHTML = thumbHTML;

  // WhatsApp button
  let qty = document.getElementById("qtyInput").value;
  document.getElementById("whatsappBtn").href = 
    `https://wa.me/8801778095805?text=I want to buy ${title}, Quantity: ${qty}`;

  // Related Products (demo)
  let relatedHTML = `
    <div class="product-card"><img src="img/https://ilmorafashionbd-ux.github.io/My-Shop/images/banner.jpg"><h4>Product 3</h4><p>৳899</p></div>
    <div class="product-card"><img src="img/product4.jpg"><h4>Product 4</h4><p>৳1099</p></div>
  `;
  document.getElementById("relatedProducts").innerHTML = relatedHTML;
}

// Close modal
function closeProductDetail() {
  document.getElementById("productDetailModal").style.display = "none";
}

// Quantity functions
function increaseQty() {
  let qty = document.getElementById("qtyInput");
  qty.value = parseInt(qty.value) + 1;
  updateWhatsAppLink();
}
function decreaseQty() {
  let qty = document.getElementById("qtyInput");
  if (qty.value > 1) qty.value = parseInt(qty.value) - 1;
  updateWhatsAppLink();
}

// Update WhatsApp link with qty
function updateWhatsAppLink() {
  let title = document.getElementById("productTitle").innerText;
  let qty = document.getElementById("qtyInput").value;
  document.getElementById("whatsappBtn").href = 
    `https://wa.me/8801778095805?text=I want to buy ${title}, Quantity: ${qty}`;
}