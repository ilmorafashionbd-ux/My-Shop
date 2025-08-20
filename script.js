/**************** CONFIG ****************/
const SHEET_ID = "1Euf6Rz-fRAjtzVj7aEoxmzxLA7vrfOuAvNjfo-ctDf0";
const DATA_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;
const WHATSAPP = "8801778095805";

// 🖼️ GitHub Image Base URL
const imageBaseURL = "https://ilmorafashionbd-ux.github.io/My-Shop/images/";

const HEADERS = {
  name: ["name","product","product name","পণ্য","পণ্যের নাম"],
  price: ["price","দাম","মূল্য"],
  description: ["description","বর্ণনা","details","বিস্তারিত"],
  image: ["image","photo","img","ছবি"], // 👉 এখানে শুধু ফাইল নাম (যেমন product1.jpg) আসবে
  category: ["category","ক্যাটাগরি","ধরণ"],
  sku: ["sku","code","পণ্য কোড"],
  badge: ["badge","tag","লেবেল"],
  stock: ["stock","stok","স্টক"],
  images: ["images","gallery","more images","আরও ছবি"]
};

let PRODUCTS = [];

/**************** UTILS ****************/
function safe(val){ return val===undefined || val===null ? "" : String(val).trim(); }
function currency(n){ return new Intl.NumberFormat('bn-BD',{style:'currency',currency:'BDT'}).format(n); }

/**************** FETCH PRODUCTS ****************/
async function fetchProducts(){
  const res = await fetch(DATA_URL, {cache:'no-store'});
  const text = await res.text();
  const json = JSON.parse(text.substring(text.indexOf('(')+1, text.lastIndexOf(')')));
  const table = json.table;
  const rows = table.rows||[];
  if(!rows.length) throw new Error('শিটে কোনো ডেটা পাওয়া যায়নি');

  const headerRow = rows[0].c.map(c=> (c? String(c.v).trim().toLowerCase(): ''));
  const map = {};
  Object.entries(HEADERS).forEach(([key, aliases])=>{
    const idx = headerRow.findIndex(h=> aliases.includes(h));
    if(idx>-1) map[key]=idx;
  });

  const noHeader = Object.keys(map).length < 2;
  let startIndex = noHeader? 0 : 1;

  const list=[];
  for(let r=startIndex; r<rows.length; r++){
    const c = rows[r].c||[];
    const name = safe(c[map.name]?.v);
    const price = safe(c[map.price]?.v);
    const imgFile = safe(c[map.image]?.v);
    const img = imgFile ? (imageBaseURL + imgFile) : "";
    if(!name || !price || !img) continue;

    const galleryRaw = safe(c[map.images]?.v);
    const gallery = galleryRaw
      ? galleryRaw.split(',').map(s => imageBaseURL + s.trim()).filter(Boolean)
      : [];

    list.push({
      id: r,
      title: name,
      price: Number(price),
      img: img,
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

/**************** RENDER ****************/
function renderProducts(items){
  const grid = document.getElementById("product-grid");
  grid.innerHTML = "";
  if(!items.length){
    grid.innerHTML = "<p class='text-center text-gray-500'>কোনো পণ্য পাওয়া যায়নি</p>";
    return;
  }
  items.forEach(p=>{
    const div=document.createElement("div");
    div.className="border rounded-lg shadow hover:shadow-lg transition p-2 bg-white";
    div.innerHTML=`
      <img src="${p.img}" alt="${p.title}" class="w-full h-48 object-cover rounded">
      <div class="p-2">
        <h3 class="font-semibold text-lg">${p.title}</h3>
        <p class="text-green-600 font-bold">${currency(p.price)}</p>
        <button onclick="buyNow('${p.title}','${p.price}')" 
          class="mt-2 w-full bg-green-500 text-white py-1 rounded">অর্ডার করুন</button>
      </div>`;
    grid.appendChild(div);
  });
}

/**************** BUY NOW ****************/
function buyNow(name,price){
  const msg=`আমি ${name} (${price} টাকা) অর্ডার করতে চাই।`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`,'_blank');
}

/**************** INIT ****************/
async function init(){
  try{
    PRODUCTS = await fetchProducts();
    renderProducts(PRODUCTS);
  }catch(e){
    console.error(e);
    document.getElementById("product-grid").innerHTML="<p class='text-red-500'>ডেটা লোড করতে সমস্যা হয়েছে</p>";
  }
}
init();