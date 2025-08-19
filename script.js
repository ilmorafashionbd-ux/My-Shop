# ===============================
/**************** CONFIG ****************/
// আপনার Google Sheet ID
const SHEET_ID = "1Euf6Rz-fRAjtzVj7aEoxmzxLA7vrfOuAvNjfo-ctDf0";
// gviz JSON URL (হেডারসহ শিটের প্রথম শিট ব্যবহার হবে)
const DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
// আপনার WhatsApp নম্বর (+ ছাড়া, কান্ট্রি কোডসহ)
const WHATSAPP = "8801778095805";

// শিটের কলাম হেডার—আপনার শিটে বাংলা/ইংরেজি যেটাই থাকুক, এগুলোর কোনো একটা মেললেই কাজ করবে
const HEADERS = {
  name: ["name","product","product name","পণ্য","পণ্যের নাম"],
  price: ["price","দাম","মূল্য"],
  description: ["description","বর্ণনা","details","বিস্তারিত"],
  image: ["image","photo","img","ছবি"],
  category: ["category","ক্যাটাগরি","ধরণ"],
  sku: ["sku","code","পণ্য কোড"],
  badge: ["badge","tag","লেবেল"],
  stock: ["stock","stok","স্টক"],
  images: ["images","gallery","more images","আরও ছবি"] // ঐচ্ছিক, কমা দিয়ে একাধিক URL
};

/**************** STATE ****************/
let PRODUCTS = []; // {id,title,price,img,desc,cat,sku,badge,stock,images[]}

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

// Google Drive লিংক ফিক্সার + GitHub blob → raw হ্যান্ডলার
function fixImageLink(url){
  if(!url) return '';
  url = url.trim();
  // Already /uc?id= style → ensure export
  if(url.includes('drive.google.com')){
    // accept both id= and /d/{id}/
    let idMatch = url.match(/[?&]id=([^&]+)/);
    let fileId = idMatch? idMatch[1] : null;
    if(!fileId){
      const m2 = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if(m2) fileId = m2[1];
    }
    if(fileId) return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  // GitHub blob → raw
  if(url.includes('github.com') && url.includes('/blob/')){
    return url.replace('github.com/','raw.githubusercontent.com/').replace('/blob/','/');
  }
  return url; // normal URL or relative path (images/...) as-is
}

/**************** FETCH & PARSE (GVIZ) ****************/
async function fetchProducts(){
  const res = await fetch(DATA_URL, {cache:'no-store'});
  const text = await res.text();
  const json = JSON.parse(text.substring(text.indexOf('(')+1, text.lastIndexOf(')')));
  const table = json.table;
  const rows = table.rows||[];
  if(!rows.length) throw new Error('শিটে কোনো ডেটা পাওয়া যায়নি');

  // ধরলাম প্রথম সারি হেডার
  const headerRow = rows[0].c.map(c=> (c? String(c.v).trim().toLowerCase(): ''));
  const map = {};
  Object.entries(HEADERS).forEach(([key, aliases])=>{
    const idx = headerRow.findIndex(h=> aliases.includes(h));
    if(idx>-1) map[key]=idx;
  });

  // যদি হেডার না মেলে, কলাম অর্ডার ধরে নেয়া
  const noHeader = Object.keys(map).length < 2; // name+price দরকার
  let startIndex = 1;
  if(noHeader){ startIndex=0; table.cols.forEach((col,i)=>{ map[Object.keys(HEADERS)[i]] = i; }); }

  const list=[];
  for(let r=startIndex; r<rows.length; r++){
    const c = rows[r].c||[];
    const name = safe(c[map.name]?.v);
    const price = safe(c[map.price]?.v);
    const img = safe(c[map.image]?.v);
    if(!name || !price || !img) continue; // মিনিমাম ফিল্ড

    const galleryRaw = safe(c[map.images]?.v);
    const gallery = galleryRaw? galleryRaw.split(',').map(s=>fixImageLink(s.trim())).filter(Boolean): [];

    list.push({
      id: r, // row index as id
      title: name,
      price: Number(price),
      img: fixImageLink(img),
      desc: safe(c[map.description]?.v),
      cat: safe(c[map.category]?.v)||'অন্যান্য',
      sku: safe(c[map.sku]?.v),
      badge: safe(c[map.badge]?.v),
      stock: safe(c[map.stock]?.v),
      images: gallery
    });
  }
  return list;
}

/**************** HOME RENDER ****************/
function renderFilters(){
  const catSel = el('#cat'); if(!catSel) return;
  const cats = ['all', ...new Set(PRODUCTS.map(p=>p.cat))];
  catSel.innerHTML = cats.map(c=>`<option value="${c}">${c==='all'? 'সব ক্যাটাগরি' : c}</option>`).join('');
}

function renderGrid(){
  const grid = el('#grid'); if(!grid) return;
  const q = (el('#search')?.value||'').trim().toLowerCase();
  const cat = (el('#cat')?.value||'all');
  const sort = (el('#sort')?.value||'recent');

  let list = PRODUCTS.filter(p=> (cat==='all'||p.cat===cat) &&
    (q==='' || p.title.toLowerCase().includes(q) || (p.desc||'').toLowerCase().includes(q)));

  if(sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  else if(sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  else list.sort((a,b)=> (b.id - a.id)); // recent by row order

  grid.innerHTML = list.map(p=>`
    <article class="card">
      <img class="card-img" loading="lazy" src="${p.img}" alt="${p.title}" onerror="this.src='images/product1.jpg'" />
      <div class="card-body">
        <div class="row">
          <strong>${p.title}</strong>
          ${p.badge? `<span class="tag">${p.badge}</span>`:''}
        </div>
        <div class="muted" style="margin-top:4px">${p.cat}${p.sku? ` • ${p.sku}`:''}${p.stock? ` • স্টক: ${p.stock}`:''}</div>
        <div class="row" style="margin-top:8px">
          <span class="price">${fmt(p.price)}</span>
          <a class="btn primary" href="product.html?id=${encodeURIComponent(p.id)}">ডিটেইলস</a>
        </div>
      </div>
    </article>
  `).join('');
}

/**************** PRODUCT DETAIL RENDER ****************/
function renderDetail(prod){
  const box = el('#product'); if(!box) return;
  const images = [prod.img, ...prod.images].filter(Boolean);

  box.innerHTML = `
    <div class="pd-gallery">
      <img class="pd-img" src="${images[0]}" alt="${prod.title}" onerror="this.src='images/product1.jpg'" />
    </div>
    <div class="pd-info">
      <h1>${prod.title}</h1>
      <div class="muted">ক্যাটাগরি: ${prod.cat}${prod.sku? ` • কোড: ${prod.sku}`:''}${prod.stock? ` • স্টক: ${prod.stock}`:''}</div>
      <div class="price" style="font-size:1.4rem">${fmt(prod.price)}</div>
      <p>${prod.desc||''}</p>

      <form id="orderForm" class="form">
        <label>পরিমাণ
          <select id="qty">
            <option>1</option><option>2</option><option>3</option><option>4</option><option>5</option>
          </select>
        </label>
        <label>নাম
          <input id="name" required placeholder="আপনার নাম" />
        </label>
        <label>ফোন
          <input id="phone" required placeholder="01XXXXXXXXX" />
        </label>
        <label>ঠিকানা
          <textarea id="address" rows="3" required placeholder="পূর্ণ ঠিকানা"></textarea>
        </label>
        <button class="btn primary" type="submit">✅ WhatsApp‑এ অর্ডার করুন</button>
      </form>

      <div class="muted">নগদ/বিকাশে হ্যান্ড‑টু‑হ্যান্ড বা ক্যাশ অন ডেলিভারি — WhatsApp‑এ ঠিকানা নিশ্চিত করুন।</div>
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
    const msg = `অর্ডার দিতে চাই:%0A• পণ্য: ${prod.title}%0A• পরিমাণ: ${qty}%0A• একক মূল্য: ${fmt(prod.price)}%0A• মোট: ${fmt(total)}%0A—%0Aনাম: ${name}%0Aফোন: ${phone}%0Aঠিকানা: ${address}`;
    const url = `https://wa.me/${WHATSAPP}?text=${msg}`;
    window.open(url, '_blank');
  });
}

/**************** CONTACT FORM ****************/
function initContact(){
  const f = el('#contactForm'); if(!f) return;
  f.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = safe(el('#c_name').value);
    const phone = safe(el('#c_phone').value);
    const address = safe(el('#c_address').value);
    const note = safe(el('#c_msg').value);
    const msg = `কাস্টমার কন্টাক্ট:%0Aনাম: ${name}%0Aফোন: ${phone}%0Aঠিকানা: ${address}%0Aবার্তা: ${note}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank');
  });
}

/**************** INIT ****************/
(async function init(){
  setYear();

  // skeletons for home grid
  const grid = el('#grid');
  if(grid){
    grid.innerHTML = Array.from({length:8}).map(()=>`<div class='card'>
      <div class='card-img skeleton'></div>
      <div class='card-body'>
        <div class='skeleton' style='height:18px;border-radius:8px'></div>
        <div class='skeleton' style='height:12px;margin-top:8px;border-radius:8px'></div>
        <div class='skeleton' style='height:36px;margin-top:10px;border-radius:10px'></div>
      </div>
    </div>`).join('');
  }

  try{
    PRODUCTS = await fetchProducts();
    if(el('#status')) setStatus('✅ Google Sheets কানেক্টেড! প্রোডাক্ট লোড হয়েছে।');
    if(el('#cat')) renderFilters();

    // HOME
    if(grid){
      renderGrid();
      el('#search').addEventListener('input', renderGrid);
      el('#cat').addEventListener('change', renderGrid);
      el('#sort').addEventListener('change', renderGrid);
    }

    // PRODUCT DETAIL
    const params = new URLSearchParams(location.search);
    const pid = params.get('id');
    if(pid){
      const prod = PRODUCTS.find(p=> String(p.id)===String(pid));
      if(!prod) throw new Error('প্রোডাক্ট পাওয়া যায়নি');
      if(el('#detailStatus')) el('#detailStatus').remove();
      renderDetail(prod);
    }

  }catch(err){
    console.error(err);
    setStatus('❌ লোড হতে ব্যর্থ: '+err.message, false);
  }

  // Contact page init
  initContact();
})();