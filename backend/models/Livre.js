const mongoose = require('mongoose');

const livreSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  auteur: { type: String, required: true },
  description: String,
  categorie: String,
  annee: Number,
  cheminFichier: String
});

const Livre = mongoose.model('Livre', livreSchema);
module.exports = Livre;
