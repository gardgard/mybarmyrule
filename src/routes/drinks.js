const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db/database');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `drink_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: parse drink from request body
function parseDrink(body) {
  return {
    name_th: body.name_th || '',
    name_en: body.name_en || '',
    category: body.category || 'other',
    subcategory: body.subcategory || '',
    brand: body.brand || '',
    country: body.country || '',
    alcohol_pct: parseFloat(body.alcohol_pct) || 0,
    nose_notes: body.nose_notes || '',
    palate: body.palate || '',
    finish: body.finish || '',
    sweetness: parseInt(body.sweetness) || 3,
    body: parseInt(body.drink_body) || parseInt(body.body) || 3,
    sourness: parseInt(body.sourness) || 3,
    ingredients: body.ingredients || '[]',
    method: body.method || '',
    glass_type: body.glass_type || '',
    garnish: body.garnish || '',
    price_sell: parseFloat(body.price_sell) || 0,
    price_cost: parseFloat(body.price_cost) || 0,
    supplier: body.supplier || '',
    status: body.status || 'active',
    rating: parseInt(body.rating) || 3,
    notes: body.notes || '',
    tags: body.tags || '[]'
  };
}

// GET /drinks — Library
router.get('/', (req, res) => {
  const db = getDb();
  const { category, subcategory, search, sort, collection_id, f_sweet, f_body, f_sour } = req.query;

  let sql = 'SELECT * FROM drinks WHERE 1=1';
  const params = [];

  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (subcategory) {
    sql += ' AND subcategory = ?';
    params.push(subcategory);
  }
  if (collection_id) {
    sql += ' AND id IN (SELECT drink_id FROM collection_items WHERE collection_id = ?)';
    params.push(collection_id);
  }
  if (f_sweet) {
    sql += ' AND sweetness = ?';
    params.push(f_sweet);
  }
  if (f_body) {
    sql += ' AND body = ?';
    params.push(f_body);
  }
  if (f_sour) {
    sql += ' AND sourness = ?';
    params.push(f_sour);
  }
  if (search) {
    sql += ' AND (name_th LIKE ? OR name_en LIKE ? OR brand LIKE ? OR tags LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  const sortMap = {
    newest: 'created_at DESC',
    oldest: 'created_at ASC',
    rating: 'rating DESC',
    name: 'name_th ASC',
    price: 'price_sell DESC'
  };
  sql += ` ORDER BY ${sortMap[sort] || 'created_at DESC'}`;

  const drinks = db.prepare(sql).all(...params);
  const counts = db.prepare(`SELECT category, COUNT(*) as c FROM drinks GROUP BY category`).all();
  const catCount = {};
  counts.forEach(r => { catCount[r.category] = r.c; });

  let subcategories = [];
  if (category && category !== 'all') {
    subcategories = db.prepare('SELECT DISTINCT subcategory FROM drinks WHERE category = ? AND subcategory != \'\' AND subcategory IS NOT NULL ORDER BY subcategory').all(category).map(r => r.subcategory);
  }

  const customCollections = db.prepare('SELECT id, name FROM collections ORDER BY name').all();

  let drinksNotInCollection = [];
  if (collection_id) {
    drinksNotInCollection = db.prepare(`
      SELECT id, name_th, category, image_path 
      FROM drinks 
      WHERE id NOT IN (SELECT drink_id FROM collection_items WHERE collection_id = ?)
      ORDER BY name_th
    `).all(collection_id);
  }

  res.render('pages/library', {
    title: 'Library',
    page: 'library',
    drinks,
    catCount,
    subcategories,
    customCollections,
    drinksNotInCollection,
    currentCategory: category || 'all',
    currentSubcategory: subcategory || '',
    currentCollection: collection_id || '',
    f_sweet: f_sweet || '',
    f_body: f_body || '',
    f_sour: f_sour || '',
    search: search || '',
    sort: sort || 'newest'
  });
});

// GET /drinks/add — Add form
router.get('/add', (req, res) => {
  const db = getDb();
  const customCollections = db.prepare('SELECT id, name FROM collections ORDER BY name').all();
  res.render('pages/form', { title: 'Add Drink', page: 'add', drink: null, customCollections, drinkCollections: [], error: null });
});

// POST /drinks/add — Create
router.post('/add', upload.single('image'), (req, res) => {
  const db = getDb();
  const drink = parseDrink(req.body);
  if (req.file) drink.image_path = `/uploads/${req.file.filename}`;
  else drink.image_path = '';

  if (!drink.name_th) {
    return res.render('pages/form', { title: 'Add Drink', page: 'add', drink: req.body, error: 'กรุณาใส่ชื่อเครื่องดื่ม' });
  }

  const insertStmt = db.prepare(`
    INSERT INTO drinks (name_th,name_en,category,subcategory,brand,country,alcohol_pct,
      nose_notes,palate,finish,sweetness,body,sourness,
      ingredients,method,glass_type,garnish,price_sell,price_cost,
      supplier,status,rating,notes,image_path,tags)
    VALUES (@name_th,@name_en,@category,@subcategory,@brand,@country,@alcohol_pct,
      @nose_notes,@palate,@finish,@sweetness,@body,@sourness,
      @ingredients,@method,@glass_type,@garnish,@price_sell,@price_cost,
      @supplier,@status,@rating,@notes,@image_path,@tags)
  `);
  const info = insertStmt.run(drink);
  const newDrinkId = info.lastInsertRowid;

  // Handle collections
  if (req.body.collections) {
    let colIds = Array.isArray(req.body.collections) ? req.body.collections : [req.body.collections];
    const insertCol = db.prepare('INSERT INTO collection_items (collection_id, drink_id) VALUES (?, ?)');
    for (const cid of colIds) {
      insertCol.run(cid, newDrinkId);
    }
  }

  res.redirect('/drinks');
});

// GET /drinks/:id — Detail
router.get('/:id', (req, res) => {
  const db = getDb();
  const drink = db.prepare('SELECT * FROM drinks WHERE id = ?').get(req.params.id);
  if (!drink) return res.redirect('/drinks');
  res.render('pages/detail', { title: drink.name_th, page: 'library', drink });
});

// GET /drinks/:id/edit — Edit form
router.get('/:id/edit', (req, res) => {
  const db = getDb();
  const drink = db.prepare('SELECT * FROM drinks WHERE id = ?').get(req.params.id);
  if (!drink) return res.redirect('/drinks');
  
  const customCollections = db.prepare('SELECT id, name FROM collections ORDER BY name').all();
  const drinkCollections = db.prepare('SELECT collection_id FROM collection_items WHERE drink_id = ?').all(drink.id).map(r => r.collection_id);
  
  res.render('pages/form', { title: 'Edit Drink', page: 'library', drink, customCollections, drinkCollections, error: null });
});

// POST /drinks/:id/edit — Update
router.post('/:id/edit', upload.single('image'), (req, res) => {
  const db = getDb();
  const drink = parseDrink(req.body);
  drink.id = req.params.id;

  if (req.file) {
    drink.image_path = `/uploads/${req.file.filename}`;
  } else {
    const existing = db.prepare('SELECT image_path FROM drinks WHERE id = ?').get(drink.id);
    drink.image_path = existing ? existing.image_path : '';
  }

  db.prepare(`
    UPDATE drinks SET name_th=@name_th,name_en=@name_en,category=@category,subcategory=@subcategory,
      brand=@brand,country=@country,alcohol_pct=@alcohol_pct,nose_notes=@nose_notes,palate=@palate,
      finish=@finish,sweetness=@sweetness,body=@body,sourness=@sourness,
      ingredients=@ingredients,method=@method,glass_type=@glass_type,garnish=@garnish,
      price_sell=@price_sell,price_cost=@price_cost,supplier=@supplier,status=@status,
      rating=@rating,notes=@notes,image_path=@image_path,tags=@tags,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=@id
  `).run(drink);

  // Update collections
  db.prepare('DELETE FROM collection_items WHERE drink_id = ?').run(drink.id);
  if (req.body.collections) {
    let colIds = Array.isArray(req.body.collections) ? req.body.collections : [req.body.collections];
    const insertCol = db.prepare('INSERT INTO collection_items (collection_id, drink_id) VALUES (?, ?)');
    for (const cid of colIds) {
      insertCol.run(cid, drink.id);
    }
  }

  res.redirect(`/drinks/${drink.id}`);
});

// POST /drinks/:id/delete — Delete
router.post('/:id/delete', (req, res) => {
  const db = getDb();
  const drink = db.prepare('SELECT image_path FROM drinks WHERE id = ?').get(req.params.id);
  if (drink && drink.image_path) {
    const imgPath = path.join(__dirname, '../../public', drink.image_path);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  db.prepare('DELETE FROM drinks WHERE id = ?').run(req.params.id);
  res.redirect('/drinks');
});

module.exports = router;
