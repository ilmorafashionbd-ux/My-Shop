/****************** CONFIG (এখানটাই বদলাবেন) ******************/
// 1) Google Sheets gviz JSON লিংক
const DATA_URL = "https://docs.google.com/spreadsheets/d/1Euf6Rz-fRAjtzVj7aEoxmzxLA7vrfOuAvNjfo-ctDf0/gviz/tq?tqx=out:json";

// 2) WhatsApp নম্বর (দেশ কোডসহ, + ছাড়া)
const WHATSAPP = "8801778095805";

// 3) ব্র্যান্ড কনফিগ: নাম, লোগো, ব্যানারগুলি (ড্রাইভ/ইমগুর/গিটহাব লিঙ্ক দিতে পারবেন)
const BRAND = {
  name: "Ilmora Fashion BD",
  logo: "https://ilmorafashionbd-ux.github.io/My-Shop/logo.png",
  banners: [
    "https://ilmorafashionbd-ux.github.io/My-Shop/banner.jpg"
  ]
};

// 4) শিটের কলাম হেডার (কেস-ইনসেনসিটিভ)
const HEADERS = {
  name: ["name","product","product name","পণ্য","পণ্যের নাম"],
  price: ["price","দাম","মূল্য"],
  description: ["description","বর্ণনা","details","বিস্তারিত"],
  image: ["image","photo","img","ছবি"],
  category: ["category","ক্যাটাগরি","ধরণ"],
  sku: ["sku","code","পণ্য কোড"],
  badge: ["badge","tag","লেবেল"],
  stock: ["stock","stok","স্টক"]
};

/****************** STATE ******************/
const els = {
  grid: document.getElementById('grid'),
  q: document.getElementById('q'),
  cat: document.getElementById('cat'),
  sort: document.getElementById('sort'),
  status: document.getElementById('status'),
  cc1: document.getElementById('cc1'),
  cc2: document.getElementById('cc2'),
  cart: document.getElementById('cart'),
  items: document.getElementById('items'),
  total: document.getElementById('total'),
  openCart: document.getElementById('openCart'),
  closeCart: document.getElementById('closeCart'),
  fab: document.getElementById('fab'),
  slides: document.getElementById('slides'),
  dots: document.getElementById('dots'),
  brandLogo: document.getElementById('brandLogo'),
  brandName: document.getElementById('brandName'),
  footerBrand: document.getElementById('footerBrand')
};

let PRODUCTS = []; // {id,title,price,img,cat,desc,sku,badge,createdAt}
let STATE = {q:'',cat:'all',sort:'recent',cart:[]};

/****************** UTILS ******************/
const fmt = n => '৳'+(+n||0).toLocaleString('bn-BD');
const safe = s => (s==null? '' : String(s));
const by = (a,b,k)=> (a[k]||'').toString().localeCompare((b[k]||'').toString(), 'bn');

function setStatus(msg, ok=true){
  els.status.textContent = msg;
  els.status.style.background = ok? '#0b1220' : '#3b0a0a';
}

// ✅ Google Drive লিঙ্ক ফিক্সার (id=... / file/d/... দুই ক্ষেত্রেই কাজ করবে)
function fixGoogleDriveLink(url){
  if(!url) return '';
  if(url.includes('drive.google.com')){
    let idMatch = url.match(/[?&]id=([^&]+)/);
    if(!idMatch){
      const m2 = url.match(/\/d\/([\w-]+)/); // file/d/FILEID/view
      if(m2) idMatch = [, m2[1]];
    }
    const fileId = idMatch? idMatch[1] : null;
    if(fileId) return `https://drive.google.com/uc?id=${fileId}`;
  }
  return url;
}

// ইমেজ লোড ফেল হলে প্লেসহোল্ডার
function withFallback(imgEl){
  imgEl.onerror = ()=>{ imgEl.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="%230b1220"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="sans-serif" font-size="18">Image not available</text></svg>'; };
}

/****************** FETCH & PARSE (GVIZ) ******************/
async function loadFromGviz(){
  const res = await fetch(DATA_URL, {cache:'no-store'});
  const text = await res.text();
  const json = JSON.parse(text.substring(text.indexOf('(')+1, text.lastIndexOf(')')));
  const table = json.table;
  const rows = table.rows || [];
  if(!rows.length){ throw new Error('শিটে কোনো ডেটা নেই'); }

  const headerRow = rows[0].c.map(c=> (c? String(c.v).trim().toLowerCase(): ''));
  const map = {};
  Object.entries(HEADERS).forEach(([key, aliases])=>{
    const idx = headerRow.findIndex(h=> aliases.includes(h));
    if(idx>-1) map[key]=idx;
  });

  const noHeader = Object.keys(map).length<2;
  let startIndex = 1;
  if(noHeader){
    startIndex = 0;
    table.cols.forEach((col,i)=>{ map[Object.keys(HEADERS)[i]] = i; });
  }

  const list = [];
  for(let r=startIndex; r<rows.length; r++){
    const c = rows[r].c || [];
    const name = safe(c[map.name]?.v);
    const price = safe(c[map.price]?.v);
    const image = safe(c[map.image]?.v);
    if(!name || !price || !image) continue;
    list.push({
      id: r,
      title: name,
      price: +price,
      img: fixGoogleDriveLink(image),
      desc: safe(c[map.description]?.v),
      cat: safe(c[map.category]?.v)||'অন্যান্য',
      sku: safe(c[map.sku]?.v),
      badge: safe(c[map.badge]?.v),
      stock: safe(c[map.stock]?.v),
      createdAt: Date.now()-r*100000
    });
  }
  return list;
}

/****************** HERO (LOGO & BANNERS) ******************/
function renderBrand(){
  els.brandName.textContent = BRAND.name || 'My Shop';
  els.footerBrand.textContent = BRAND.name || 'My Shop';
  const lg = fixGoogleDriveLink(BRAND.logo||'');
  els.brandLogo.src = lg || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="100%" height="100%" rx="16" fill="%2322c55e"/></svg>';
  withFallback(els.brandLogo);

  const banners = (BRAND.banners||[]).slice(0,5).map(fixGoogleDriveLink);
  els.slides.innerHTML = banners.map((b,i)=>`<div class="slide"><img src="${b}" alt="Banner ${i+1}" loading="lazy"></div>`).join('');
  els.dots.innerHTML = banners.map((_,i)=>`<span class="dot ${i===0?'active':''}"></span>`).join('');

  // Auto slide
  let idx=0; const sc = els.slides;
  setInterval(()=>{
    idx = (idx+1)%banners.length; sc.scrollTo({left: idx*sc.clientWidth, behavior:'smooth'});
    [...els.dots.children].forEach((d,j)=> d.classList.toggle('active', j===idx));
  }, 3500);
}

/****************** RENDER ******************/
function renderCats(){
  const cats = ['all', ...new Set(PRODUCTS.map(p=>p.cat))];
  els.cat.innerHTML = cats.map(c=>`<option value="${c}">${c==='all'?'সব ক্যাটাগরি':c}</option>`).join('');
}

function render(){
  let list = PRODUCTS.filter(p=> (STATE.cat==='all'||p.cat===STATE.cat) &&
                                 (STATE.q===''|| p.title.toLowerCase().includes(STATE.q) || p.desc.toLowerCase().includes(STATE.q)));
  if(STATE.sort==='price-asc') list.sort((a,b)=>a.price-b.price);
  else if(STATE.sort==='price-desc') list.sort((a,b)=>b.price-a.price);
  else list.sort((a,b)=>b.createdAt-a.createdAt);

  els.grid.innerHTML = list.map(p=>`
    <div class="card">
      <img loading="lazy" src="${p.img}" alt="${p.title}" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"600\"><rect width=\"100%\" height=\"100%\" fill=\"%230b1220\"/><text x=\"50%\" y=\"50%\" dominant-baseline=\"middle\" text-anchor=\"middle\" fill=\"%2394a3b8\" font-family=\"sans-serif\" font-size=\"18\">Image not available</text></svg>'">
      <div class="content">
        <div class="row"><strong>${p.title}</strong>${p.badge?`<span class="tag">${p.badge}</span>`:''}</div>
        <div class="muted" style="margin-top:4px">${p.desc||''}</div>
        <div class="row" style="margin-top:8px"><span class="price">${fmt(p.price)}</span>
          <button class="btn primary" onclick="add(${p.id})">➕ কার্টে নিন</button></div>
        <div class="muted" style="margin-top:6px">ক্যাটাগরি: ${p.cat}${p.sku?` • কোড: ${p.sku}`:''}${p.stock?` • স্টক: ${p.stock}`:''}</div>
      </div>
    </div>`).join('');
}

/****************** CART ******************/
function add(id){
  const prod = PRODUCTS.find(p=>p.id===id);
  const ex = STATE.cart.find(i=>i.id===id);
  if(ex) ex.qty++; else STATE.cart.push({id:prod.id,title:prod.title,price:prod.price,img:prod.img,qty:1});
  syncCart();
}
function qty(id,d){
  const it = STATE.cart.find(i=>i.id===id); if(!it) return; it.qty+=d; if(it.qty<=0) STATE.cart=STATE.cart.filter(i=>i.id!==id); syncCart();
}
function syncCart(){
  const count = STATE.cart.reduce((s,i)=>s+i.qty,0); els.cc1.textContent=count; els.cc2.textContent=count;
  const total = STATE.cart.reduce((s,i)=>s+i.qty*i.price,0); els.total.textContent = fmt(total);
  els.items.innerHTML = STATE.cart.map(i=>`
    <div class="item">
      <img loading="lazy" src="${i.img}" alt="${i.title}" onerror="this.onerror=null;this.src='data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"64\" height=\"64\"><rect width=\"100%\" height=\"100%\" fill=\"%230b1220\"/></svg>'">
      <div><div style="font-weight:700">${i.title}</div><div class="muted">${fmt(i.price)} × ${i.qty}</div></div>
      <div class="qty"><button onclick="qty(${i.id},-1)">−</button><span>${i.qty}</span><button onclick="qty(${i.id},1)">+</button></div>
    </div>`).join('');
}
function toggleCart(open){ els.cart.classList[open?'add':'remove']('open'); }
function checkout(){
  if(!STATE.cart.length) { alert('কার্ট খালি!'); return; }
  const lines = STATE.cart.map(i=>`• ${i.title} x${i.qty} = ৳${i.price*i.qty}`).join('%0A');
  const total = STATE.cart.reduce((s,i)=>s+i.qty*i.price,0);
  const msg = `অর্ডার দিতে চাই:%0A${lines}%0Aমোট: ৳${total}%0Aনাম:%0Aঠিকানা:%0Aফোন:`;
  window.open(`https://wa.me/${WHATSAPP}?text=${msg}`,'_blank');
}

/****************** INIT ******************/
(async function(){
  document.getElementById('yr').textContent = new Date().getFullYear();
  renderBrand();
  // Skeleton cards
  els.grid.innerHTML = Array.from({length:8}).map(()=>`<div class='card'><div class='skeleton' style='width:100%;aspect-ratio:1/1;border-bottom:1px solid var(--line)'></div><div class='content'><div class='skeleton' style='height:18px;border-radius:8px'></div><div class='skeleton' style='height:12px;margin-top:8px;border-radius:8px'></div><div class='skeleton' style='height:36px;margin-top:10px;border-radius:10px'></div></div></div>`).join('');
  try{
    PRODUCTS = await loadFromGviz();
    if(!PRODUCTS.length) setStatus('⚠️ শিটে কোনো প্রোডাক্ট পাওয়া যায়নি', false);
    else setStatus('✅ Google Sheets কানেক্টেড! প্রোডাক্ট লোড হয়েছে।');
    renderCats();
    render();
  }catch(err){
    console.error(err);
    setStatus('❌ লোড হতে ব্যর্থ: '+err.message, false);
    els.grid.innerHTML = '';
  }
})();

// Events
els.q.addEventListener('input', e=>{ STATE.q = e.target.value.trim().toLowerCase(); render(); });
els.cat.addEventListener('change', e=>{ STATE.cat = e.target.value; render(); });
els.sort.addEventListener('change', e=>{ STATE.sort = e.target.value; render(); });
els.openCart.addEventListener('click', ()=>toggleCart(true));
els.fab.addEventListener('click', ()=>toggleCart(true));
els.closeCart.addEventListener('click', ()=>toggleCart(false));
</script>
