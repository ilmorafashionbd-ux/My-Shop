// 👉 আপনার Google Sheet publish link
const sheetURL = "YOUR_GOOGLE_SHEET_CSV_LINK";

// 👉 GitHub এ image ফোল্ডারের বেস URL
const imageBaseURL = "https://ilmorafashionbd-ux.github.io/My-Shop/images/";

// Product ডাটা ফেচ করা
async function loadProducts() {
    try {
        const response = await fetch(sheetURL);
        const data = await response.text();

        const rows = data.split("\n").slice(1); // header বাদ
        const productList = document.getElementById("product-list");

        rows.forEach(row => {
            if (!row.trim()) return;
            const [name, price, description, imageFile] = row.split(",");

            // Image URL তৈরি করা (GitHub থেকে)
            const fullImageURL = imageBaseURL + imageFile.trim();

            // Product Card বানানো
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                <img src="${fullImageURL}" alt="${name}" class="product-img" />
                <h3>${name}</h3>
                <p>${description}</p>
                <p class="price">${price}</p>
                <a href="product.html?name=${encodeURIComponent(name)}" class="btn">View Details</a>
            `;
            productList.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// Call function
document.addEventListener("DOMContentLoaded", loadProducts);