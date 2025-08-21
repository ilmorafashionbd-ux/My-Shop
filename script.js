/**************** CONFIG ****************/
// আপনার Google Sheet CSV URL
const DATA_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRvJSc-B0_uG9Yt1QOMq6Kcq0ccW4dbztEFeRXUYqZIIWvVQWhG4NrcHXB4WBq-5G2JXHRuz7lpbDGK/pub?gid=0&single=true&output=csv";

// আপনার WhatsApp নম্বর (Country code + Number, + ছাড়া)
const WHATSAPP = "8801778095805";

// GitHub image base path
const imageBaseURL = "https://ilmorafashionbd-ux.github.io/My-Shop/images/";

/**************** STATE ****************/
let PRODUCTS = []; 

/**************** UTILS ****************/
const el = sel => document.querySelector(sel);
const fmt = n => '৳'+(Number(n)||0).toLocaleString('bn-BD');
const safe = v => v==null? '' : String(v);

function setYear(){
  const y1=el('#yr'); const y2=el('#yr2'); const y3=el('#yr3');
  [y1,y2,y3].forEach(e=>{ if(e) e.textContent = new Date().getFullYear(); });
}

function setStatus(msg, ok=true){
  const s = el('#status')||el('#detailStatus');
  if(!s) return; s.textContent = msg; s.style.background = ok? '#0b1424' : '#3b0a0a';
}

/**************** FETCH & PARSE (CSV) ****************/
async function fetchProducts(){
  const res = await fetch(DATA_URL, {cache:'no-store'});
  const text = await res.text();

  // CSV → Array
  const rows = text.split("\n").map(r=>r.split(","));
  const header = rows[0].map(h=>h.trim().toLowerCase());

  const nameIdx = header.indexOf("name");
  const priceIdx = header.indexOf("price");
  const descIdx = header.indexOf("description");
  const imgIdx = header.indexOf("image");

  const list=[];
  for(let r=1; r<rows.length; r++){
    const cols = rows[r];
    if(!cols[nameIdx] || !cols[priceIdx] || !cols[imgIdx]) continue;

    list.push({
      id: r,
      title: cols[nameIdx],
      price: Number(cols[priceIdx]),
      desc: cols[descIdx],
      img: imageBaseURL + cols[imgIdx].trim()  // GitHub image ব্যবহার
    });
  }
  return list;
}

/**************** HOME RENDER ****************/
function renderGrid(){
  const grid = el('#grid'); if(!grid) return;
  const q = (el('#search')?.value||'').trim().toLowerCase();

  let list = PRODUCTS.filter(p=> (q==='' || p.title.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q)));

  grid.innerHTML = list.map(p=>`
    <article class="card">
      <img class="card-img" loading="lazy" src="${p.img}" alt="${p.title}" />
      <div class="card-body">
        <strong>${p.title}</strong>
        <div class="price">${fmt(p.price)}</div>
        <a class="btn primary" href="product.html?id=${encodeURIComponent(p.id)}">ডিটেইলস</a>
      </div>
    </article>
  `).join('');
}

/**************** PRODUCT DETAIL RENDER ****************/
function renderDetail(prod){
  const box = el('#product'); if(!box) return;

  box.innerHTML = `
    <div class="pd-gallery">
      <img class="pd-img" src="${prod.img}" alt="${prod.title}" />
    </div>
    <div class="pd-info">
      <h1>${prod.title}</h1>
      <div class="price">${fmt(prod.price)}</div>
      <p>${prod.desc||''}</p>

      <form id="orderForm" class="form">
        <label>পরিমাণ
          <select id="qty">
            <option>1</option><option>2</option><option>3</option>
          </select>
        </label>
        <label>নাম
          <input id="name" required placeholder="আপনার নাম" />
        </label>
        <label>ফোন
          <input id="phone" required placeholder="01XXXXXXXXX" />
        </label>
        <label>ঠিকানা
          <textarea id="address" rows="3" required></textarea>
        </label>
        <button class="btn primary" type="submit">✅ WhatsApp-এ অর্ডার করুন</button>
      </form>
    </div>
  `;

  const form = el('#orderForm');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const qty = Number(el('#qty').value||1);
    const name = safe(el('#name').value);
    const phone = safe(el('#phone').value);
    const address = safe(el('#address').value);
    const total = prod.price * qty;
    const msg = `অর্ডার দিতে চাই:%0A• পণ্য: ${prod.title}%0A• পরিমাণ: ${qty}%0A• মোট: ${fmt(total)}%0A—%0Aনাম: ${name}%0Aফোন: ${phone}%0Aঠিকানা: ${address}`;
    const url = `https://wa.me/${WHATSAPP}?text=${msg}`;
    window.open(url, '_blank');
  });
}

/**************** INIT ****************/
(async function init(){
  setYear();
  try{
    PRODUCTS = await fetchProducts();
    if(el('#status')) setStatus('✅ Google Sheets CSV কানেক্টেড! প্রোডাক্ট লোড হয়েছে।');

    // HOME
    if(el('#grid')){
      renderGrid();
      el('#search').addEventListener('input', renderGrid);
    }

    // PRODUCT DETAIL
    const params = new URLSearchParams(location.search);
    const pid = params.get('id');
    if(pid){
      const prod = PRODUCTS.find(p=> String(p.id)===String(pid));
      if(!prod) throw new Error('প্রোডাক্ট পাওয়া যায়নি');
      renderDetail(prod);
    }

  }catch(err){
    console.error(err);
    setStatus('❌ লোড হতে ব্যর্থ: '+err.message, false);
  }
})();