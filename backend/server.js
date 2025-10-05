const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Livre = require('./models/Livre');

const app = express();
app.use(cors());
app.use(express.json());

// Se connecter à base de données locale (SQLite na MongoDB arakaraka)
mongoose.connect('mongodb://localhost:27017/bibliotheque', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ Connecté à MongoDB"))
.catch(err => console.error("❌ Erreur MongoDB:", err));

// Endpoint: maka ny livres rehetra
app.get('/api/livres', async (req, res) => {
  try {
    const livres = await Livre.find();
    res.json(livres);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint: recherche de livre (mot-clé)
app.get('/api/recherche', async (req, res) => {
  const { q } = req.query;
  try {
    const livres = await Livre.find({
      $or: [
        { titre: { $regex: q, $options: 'i' } },
        { auteur: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });
    res.json(livres);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
