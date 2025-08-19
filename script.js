
// আপনার Google Sheet JSON লিঙ্ক
const sheetURL = "https://docs.google.com/spreadsheets/d/1Euf6Rz-fRAjtzVj7aEoxmzxLA7vrfOuAvNjfo-ctDf0/gviz/tq?tqx=out:json";

// Drive link ফিক্সার
function fixLink(url) {
  if (url.includes("drive.google.com")) {
    const match = url.match(/id=([^&]+)/);
    return match ? `https://drive.google.com/uc?id=${match[1]}` : url;
  }
  return url;
}

// GitHub repo link হলে 그대로 রাখবে
function fixImageLink(url) {
  if (url.includes("github.io")) {
    return url;
  }
  return fixLink(url);
}

// Google Sheet থেকে ডাটা লোড করা
fetch(sheetURL)
  .then(res => res.text())
  .then(data => {
    const json = JSON.parse(data.substring(47).slice(0, -2));
    const rows = json.table.rows;
    const productList = document.getElementById("product-list");

    rows.forEach(row => {
      const product = {
        name: row.c[0]?.v || "No Name",
        description: row.c[1]?.v || "",
        price: row.c[2]?.v || "0",
        image: row.c[3]?.v || ""
      };

      const card = document.createElement("div");
      card.classList.add("product-card");

      card.innerHTML = `
        <img src="${fixImageLink(product.image)}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <p class="price">৳ ${product.price}</p>
      `;

      productList.appendChild(card);
    });
  })
  .catch(err => console.error("Error loading data: ", err));
