const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup multer for collection covers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'public/uploads/collections';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /collections - List all collections
router.get('/', async (req, res) => {
  const db = getDb();
  const collections = await db.query(`
    SELECT c.*, 
           COUNT(ci.drink_id) as drink_count,
           (SELECT d.image_path FROM collection_items ci2 
            JOIN drinks d ON ci2.drink_id = d.id 
            WHERE ci2.collection_id = c.id AND d.image_path != '' LIMIT 1) as first_drink_img
    FROM collections c
    LEFT JOIN collection_items ci ON c.id = ci.collection_id
    GROUP BY c.id
    ORDER BY c.name
  `);
  
  res.render('pages/collections', { page: 'collections', collections });
});

// POST /collections/add - Create new collection
router.post('/add', upload.single('cover_image'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.redirect('/collections');
  
  const cover_image = req.file ? `/uploads/collections/${req.file.filename}` : '';
  const db = getDb();
  await db.execute('INSERT INTO collections (name, description, cover_image) VALUES (?, ?, ?)', [name, description || '', cover_image]);
  res.redirect('/collections');
});

// GET /collections/:id - View collection detail
router.get('/:id', async (req, res) => {
  const db = getDb();
  const collection = await db.getOne('SELECT * FROM collections WHERE id = ?', [req.params.id]);
  if (!collection) return res.redirect('/collections');

  const drinks = await db.query(`
    SELECT d.* FROM drinks d
    JOIN collection_items ci ON d.id = ci.drink_id
    WHERE ci.collection_id = ?
    ORDER BY ci.sort_order, d.name_th
  `, [collection.id]);

  const allDrinks = await db.query(`
    SELECT id, name_th, name_en, category, image_path 
    FROM drinks 
    WHERE id NOT IN (SELECT drink_id FROM collection_items WHERE collection_id = ?)
    ORDER BY name_th
  `, [collection.id]);

  res.render('pages/collection-detail', { 
    page: 'collections', 
    collection, 
    drinks, 
    allDrinks 
  });
});

// POST /collections/:id/add-drink
router.post('/:id/add-drink', async (req, res) => {
  const collectionId = req.params.id;
  const { drink_id, return_to } = req.body;
  const db = getDb();

  const addOne = async (did) => {
    await db.execute('INSERT OR IGNORE INTO collection_items (collection_id, drink_id) VALUES (?, ?)', [collectionId, did]);
  };
  
  if (Array.isArray(drink_id)) {
    for (const id of drink_id) await addOne(id);
  } else if (drink_id) {
    await addOne(drink_id);
  }

  res.redirect(return_to || `/collections/${collectionId}`);
});

// POST /collections/:id/remove-drink
router.post('/:id/remove-drink', async (req, res) => {
  const collectionId = req.params.id;
  const { drink_id, return_to } = req.body;
  
  const db = getDb();
  await db.execute('DELETE FROM collection_items WHERE collection_id = ? AND drink_id = ?', [collectionId, drink_id]);
  res.redirect(return_to || `/collections/${collectionId}`);
});

// POST /collections/:id/delete - Delete collection
router.post('/:id/delete', async (req, res) => {
  const db = getDb();
  const id = req.params.id;
  
  await db.execute('DELETE FROM collection_items WHERE collection_id = ?', [id]);
  await db.execute('DELETE FROM collections WHERE id = ?', [id]);
  
  res.redirect('/collections');
});

module.exports = router;
