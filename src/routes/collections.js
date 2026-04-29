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
router.get('/', (req, res) => {
  const db = getDb();
  // Get collections with count of drinks and a cover image (either collection cover or first drink image)
  const collections = db.prepare(`
    SELECT c.*, 
           COUNT(ci.drink_id) as drink_count,
           (SELECT d.image_path FROM collection_items ci2 
            JOIN drinks d ON ci2.drink_id = d.id 
            WHERE ci2.collection_id = c.id AND d.image_path != '' LIMIT 1) as first_drink_img
    FROM collections c
    LEFT JOIN collection_items ci ON c.id = ci.collection_id
    GROUP BY c.id
    ORDER BY c.name
  `).all();
  
  res.render('pages/collections', { page: 'collections', collections });
});

// POST /collections/add - Create new collection
router.post('/add', upload.single('cover_image'), (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.redirect('/collections');
  
  const cover_image = req.file ? `/uploads/collections/${req.file.filename}` : '';
  const db = getDb();
  db.prepare('INSERT INTO collections (name, description, cover_image) VALUES (?, ?, ?)').run(name, description || '', cover_image);
  res.redirect('/collections');
});

// GET /collections/:id - View collection detail
router.get('/:id', (req, res) => {
  const db = getDb();
  const collection = db.prepare('SELECT * FROM collections WHERE id = ?').get(req.params.id);
  if (!collection) return res.redirect('/collections');

  // Get drinks in this collection
  const drinks = db.prepare(`
    SELECT d.* FROM drinks d
    JOIN collection_items ci ON d.id = ci.drink_id
    WHERE ci.collection_id = ?
    ORDER BY ci.sort_order, d.name_th
  `).all(collection.id);

  // Get all drinks for the "Add Drink" modal, excluding those already in collection
  const allDrinks = db.prepare(`
    SELECT id, name_th, name_en, category, image_path 
    FROM drinks 
    WHERE id NOT IN (SELECT drink_id FROM collection_items WHERE collection_id = ?)
    ORDER BY name_th
  `).all(collection.id);

  res.render('pages/collection-detail', { 
    page: 'collections', 
    collection, 
    drinks, 
    allDrinks 
  });
});

// POST /collections/:id/add-drink
router.post('/:id/add-drink', (req, res) => {
  const collectionId = req.params.id;
  const { drink_id, return_to } = req.body; // Can be an array if multiple selected
  const db = getDb();

  const insert = db.prepare('INSERT OR IGNORE INTO collection_items (collection_id, drink_id) VALUES (?, ?)');
  
  if (Array.isArray(drink_id)) {
    const insertMany = db.transaction((drinks) => {
      for (const id of drinks) insert.run(collectionId, id);
    });
    insertMany(drink_id);
  } else if (drink_id) {
    insert.run(collectionId, drink_id);
  }

  if (return_to) {
    res.redirect(return_to);
  } else {
    res.redirect(`/collections/${collectionId}`);
  }
});

// POST /collections/:id/remove-drink
router.post('/:id/remove-drink', (req, res) => {
  const collectionId = req.params.id;
  const { drink_id, return_to } = req.body;
  
  const db = getDb();
  db.prepare('DELETE FROM collection_items WHERE collection_id = ? AND drink_id = ?').run(collectionId, drink_id);
  if (return_to) {
    res.redirect(return_to);
  } else {
    res.redirect(`/collections/${collectionId}`);
  }
});

// POST /collections/:id/delete - Delete collection
router.post('/:id/delete', (req, res) => {
  const db = getDb();
  const id = req.params.id;
  
  // First delete items in collection
  db.prepare('DELETE FROM collection_items WHERE collection_id = ?').run(id);
  // Then delete the collection itself
  db.prepare('DELETE FROM collections WHERE id = ?').run(id);
  
  res.redirect('/collections');
});

module.exports = router;
