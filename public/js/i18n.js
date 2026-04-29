const translations = {
  th: {
    brandSub: 'บันทึกเครื่องดื่ม',
    navDashboard: 'แดชบอร์ด',
    navLibrary: 'คลังเครื่องดื่ม',
    navAdd: 'เพิ่มเครื่องดื่ม',
    navWelcome: 'Welcome Drink',
    navCollections: 'จัดหมวดหมู่พิเศษ',
    categories: 'หมวดหมู่',
    catCocktail: 'ค็อกเทล',
    catMocktail: 'ม็อกเทล',
    catWine: 'ไวน์',
    catSpirit: 'สุรา',
    catBeer: 'เบียร์',
    catOther: 'อื่นๆ',
    logout: 'ออกจากระบบ',
    searchPlaceholder: 'ค้นหาเครื่องดื่ม...',
    dashTitle: 'แดชบอร์ด',
    statTotal: 'เครื่องดื่มทั้งหมด',
    recentAdded: 'เพิ่มล่าสุด',
    topRated: 'คะแนนสูงสุด',
    catDist: 'สัดส่วนหมวดหมู่',
    viewAll: 'ดูทั้งหมด',
    backToLib: 'กลับไปคลัง',
    flavorProfile: 'โปรไฟล์รสชาติ',
    sweetness: 'ความหวาน',
    body: 'บอดี้ / ความหนัก',
    sourness: 'ความเปรี้ยว',
    nose: 'กลิ่น',
    palate: 'รสชาติ',
    finish: 'กลิ่นท้าย',
    recipe: 'สูตร',
    garnish: 'การตกแต่ง',
    businessInfo: 'ข้อมูลธุรกิจ',
    priceSell: 'ราคาขาย',
    priceCost: 'ต้นทุน',
    supplier: 'แหล่งซื้อ',
    personalNotes: 'บันทึกส่วนตัว',
    editBtn: 'แก้ไข',
    deleteBtn: 'ลบ',
    noResults: 'ไม่พบเครื่องดื่ม',
    basicInfo: 'ข้อมูลพื้นฐาน',
    nameThLabel: 'ชื่อภาษาไทย *',
    nameEnLabel: 'ชื่ออังกฤษ',
    categoryLabel: 'หมวดหมู่ *',
    subcategoryLabel: 'หมวดย่อย',
    brandLabel: 'แบรนด์',
    countryLabel: 'ประเทศ',
    alcoholLabel: 'แอลกอฮอล์ %',
    statusLabel: 'สถานะ',
    imageLabel: 'รูปภาพ',
    uploadHint: 'คลิกหรือลากรูปมาวางที่นี่',
    ingredientsLabel: 'ส่วนผสม (1 บรรทัด/ชิ้น)',
    methodLabel: 'วิธีทำ',
    glassLabel: 'ประเภทแก้ว',
    garnishLabel: 'การตกแต่ง',
    supplierLabel: 'แหล่งซื้อ',
    ratingLabel: 'คะแนน',
    notesLabel: 'บันทึกส่วนตัว',
    tagsLabel: 'แท็ก (คั่นด้วยจุลภาค)',
    saveBtn: 'บันทึก',
    cancelBtn: 'ยกเลิก',
  },
  en: {
    brandSub: 'Beverage Journal',
    navDashboard: 'Dashboard',
    navLibrary: 'Library',
    navAdd: 'Add Drink',
    navWelcome: 'Welcome Drink',
    navCollections: 'Collections',
    categories: 'Categories',
    catCocktail: 'Cocktail',
    catMocktail: 'Mocktail',
    catWine: 'Wine',
    catSpirit: 'Spirit',
    catBeer: 'Beer',
    catOther: 'Other',
    logout: 'Logout',
    searchPlaceholder: 'Search drinks...',
    dashTitle: 'Dashboard',
    statTotal: 'Total Drinks',
    recentAdded: 'Recently Added',
    topRated: 'Top Rated',
    catDist: 'Category Distribution',
    viewAll: 'View All',
    backToLib: 'Back to Library',
    flavorProfile: 'Flavor Profile',
    sweetness: 'Sweetness',
    body: 'Body',
    sourness: 'Sourness',
    nose: 'Nose',
    palate: 'Palate',
    finish: 'Finish',
    recipe: 'Recipe',
    garnish: 'Garnish',
    businessInfo: 'Business Info',
    priceSell: 'Sell Price',
    priceCost: 'Cost Price',
    supplier: 'Supplier',
    personalNotes: 'Personal Notes',
    editBtn: 'Edit',
    deleteBtn: 'Delete',
    noResults: 'No drinks found',
    basicInfo: 'Basic Info',
    nameThLabel: 'Thai Name *',
    nameEnLabel: 'English Name',
    categoryLabel: 'Category *',
    subcategoryLabel: 'Subcategory',
    brandLabel: 'Brand',
    countryLabel: 'Country',
    alcoholLabel: 'Alcohol %',
    statusLabel: 'Status',
    imageLabel: 'Photo',
    uploadHint: 'Click or drag image here',
    ingredientsLabel: 'Ingredients (1 per line)',
    methodLabel: 'Method',
    glassLabel: 'Glass Type',
    garnishLabel: 'Garnish',
    supplierLabel: 'Supplier',
    ratingLabel: 'Rating',
    notesLabel: 'Personal Notes',
    tagsLabel: 'Tags (comma separated)',
    saveBtn: 'Save Drink',
    cancelBtn: 'Cancel',
  }
};

let currentLang = localStorage.getItem('bw-lang') || 'th';

function applyTranslations(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang]?.[key]) el.textContent = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang]?.[key]) el.placeholder = translations[lang][key];
  });
  const flag  = document.getElementById('langFlag');
  const label = document.getElementById('langLabel');
  if (flag)  flag.textContent  = lang === 'th' ? '🇹🇭' : '🇬🇧';
  if (label) label.textContent = lang.toUpperCase();
  document.getElementById('html-root')?.setAttribute('lang', lang);
}

function toggleLanguage() {
  currentLang = currentLang === 'th' ? 'en' : 'th';
  localStorage.setItem('bw-lang', currentLang);
  applyTranslations(currentLang);
}

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations(currentLang);
  document.getElementById('langToggle')?.addEventListener('click', toggleLanguage);
});
