// আপনার Google Sheet JSON লিঙ্ক
const DATA_URL = "https://docs.google.com/spreadsheets/d/1Euf6Rz-fRAjtzVj7aEoxmzxLA7vrfOuAvNjfo-ctDf0/gviz/tq?tqx=out:json";

// WhatsApp নম্বর (দেশ কোডসহ, + ছাড়া)
const WHATSAPP = "8801778095805";

// ব্র্যান্ড কনফিগ: নাম, লোগো, ব্যানারগুলি (ড্রাইভ/ইমগুর/গিটহাব লিঙ্ক দিতে পারবেন)
const BRAND = {
  name: "Ilmora Fashion BD",
  logo: "https://ilmorafashionbd-ux.github.io/My-Shop/images/logo.png",
  banners: [
    // যেকোনো সংখ্যক ব্যানার যোগ করুন
    "https://ilmorafashionbd-ux.github.io/My-Shop/images/banner.jpg"
  ]
};

// শিটের কলাম হেডার (কেস-ইনসেনসিটিভ)
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

// ... নিচে বাকি কোডটি অপরিবর্তিত থাকবে ...
