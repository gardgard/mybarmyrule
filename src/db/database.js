const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname);
const DB_PATH = path.join(DB_DIR, 'bevwine.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS drinks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name_th     TEXT NOT NULL,
      name_en     TEXT DEFAULT '',
      category    TEXT NOT NULL DEFAULT 'other',
      subcategory TEXT DEFAULT '',
      brand       TEXT DEFAULT '',
      country     TEXT DEFAULT '',
      alcohol_pct REAL DEFAULT 0,
      nose_notes  TEXT DEFAULT '',
      palate      TEXT DEFAULT '',
      finish      TEXT DEFAULT '',
      sweetness   INTEGER DEFAULT 3,
      body        INTEGER DEFAULT 3,
      sourness    INTEGER DEFAULT 3,
      ingredients TEXT DEFAULT '[]',
      method      TEXT DEFAULT '',
      glass_type  TEXT DEFAULT '',
      garnish     TEXT DEFAULT '',
      price_sell  REAL DEFAULT 0,
      price_cost  REAL DEFAULT 0,
      supplier    TEXT DEFAULT '',
      status      TEXT DEFAULT 'active',
      rating      INTEGER DEFAULT 3,
      notes       TEXT DEFAULT '',
      image_path  TEXT DEFAULT '',
      tags        TEXT DEFAULT '[]',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collections (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collection_items (
      collection_id INTEGER,
      drink_id      INTEGER,
      sort_order    INTEGER DEFAULT 0,
      PRIMARY KEY (collection_id, drink_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (drink_id) REFERENCES drinks(id) ON DELETE CASCADE
    );
  `);

  // Seed sample data if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM drinks').get();
  if (count.c === 0) {
    const insert = db.prepare(`
      INSERT INTO drinks (name_th, name_en, category, subcategory, brand, country, alcohol_pct,
        nose_notes, palate, finish, sweetness, body, sourness,
        ingredients, method, glass_type, garnish, price_sell, price_cost,
        status, rating, notes, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seeds = [
      ['โมฮีโต', 'Mojito', 'cocktail', '', 'Havana Club', 'Cuba', 5,
       'มินต์สด, มะนาว', 'เปรี้ยวสดชื่น หวานกำลังดี', 'มินต์ยาว',
       4, 1, 4, JSON.stringify(['Rum 45ml','Lime Juice 30ml','Sugar Syrup 15ml','Soda Water','Fresh Mint']),
       'Muddle mint กับน้ำตาล เติม rum และ lime juice คนให้เข้ากัน เติม soda water',
       'Highball', 'Fresh Mint + Lime Wheel', 280, 85, 'active', 5,
       'เมนู Signature ขายดีที่สุด', JSON.stringify(['signature','bestseller','refreshing'])],

      ['เนโกรนี', 'Negroni', 'cocktail', '', 'Campari', 'Italy', 24,
       'ส้ม, ดอกไม้, ขม', 'ขม-หวานสมดุล มีส้ม', 'ยาว, ขมนุ่ม',
       2, 4, 2, JSON.stringify(['Gin 30ml','Campari 30ml','Sweet Vermouth 30ml']),
       'Stir ทุกอย่างรวมกับน้ำแข็ง แล้วกรองใส่แก้ว',
       'Rocks Glass', 'Orange Peel', 320, 110, 'active', 4,
       'คลาสสิก เหมาะสำหรับคนชอบขม', JSON.stringify(['classic','bitter','aperitif'])],

      ['ไวน์แดง Merlot', 'Merlot Red Wine', 'wine', 'Red Wine', 'Casillero del Diablo', 'Chile', 13.5,
       'เชอร์รี่, พลัม, วานิลลา', 'ผลไม้แดง, ทานิน นุ่ม', 'กลางถึงยาว',
       3, 2, 1, JSON.stringify([]),
       '', 'Wine Glass', '', 450, 180, 'active', 4,
       'ไวน์ราคาดี คุณภาพคุ้มค่า เหมาะกับอาหาร', JSON.stringify(['wine','bestseller'])],

      ['วิสกี้ Glenfiddich 12', 'Glenfiddich 12 Year', 'spirit', 'Single Malt Whisky', 'Glenfiddich', 'Scotland', 40,
       'แอปเปิ้ล, ลูกแพร์, โอ๊ค', 'ผลไม้สด, อ่อนหวาน, ไม้', 'ปานกลาง, สะอาด',
       3, 2, 1, JSON.stringify([]),
       'Neat หรือ On the Rocks', 'Whisky Glass', 'Orange Peel (optional)', 890, 350,
       'active', 5, 'Single Malt คุณภาพดี เหมาะสำหรับผู้เริ่มต้น', JSON.stringify(['whisky','premium','scotch'])],

      ['สกรูไดรเวอร์ไม่มีแอลกอฮอล์', 'Virgin Screwdriver', 'mocktail', '', '', 'Thailand', 0,
       'ส้ม, สดชื่น', 'ส้มสด หวานอ่อน', 'สั้น, สดชื่น',
       4, 0, 3, JSON.stringify(['Orange Juice 150ml','Soda Water 50ml','Sugar Syrup 10ml']),
       'เทส้มลงในแก้วที่มีน้ำแข็ง เติม soda water คนเบาๆ',
       'Highball', 'Orange Slice', 120, 35, 'active', 3,
       'เมนูสำหรับลูกค้าไม่ดื่มแอลกอฮอล์', JSON.stringify(['mocktail','non-alcoholic','refreshing'])]
    ];

    seeds.forEach(s => insert.run(...s));
  }

  // Seed collections if empty
  const cCount = db.prepare('SELECT COUNT(*) as c FROM collections').get();
  if (cCount.c === 0) {
    db.prepare("INSERT INTO collections (name, description) VALUES ('Welcome Drink', 'เครื่องดื่มสำหรับต้อนรับลูกค้า')").run();
    db.prepare("INSERT INTO collections (name, description) VALUES ('Zero Proof', 'เมนูไร้แอลกอฮอล์สำหรับ Pairing')").run();
  }

  console.log('✅ Database initialized:', DB_PATH);
}

module.exports = { getDb, initDatabase };
