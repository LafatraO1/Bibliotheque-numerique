const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/commentaires.json');

// Lire tous les commentaires
exports.getCommentaires = (req, res) => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  res.json(data);
};

// Ajouter un commentaire
exports.addCommentaire = (req, res) => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const newComment = req.body;
  newComment.id_c = data.length ? data[data.length - 1].id_c + 1 : 1;
  data.push(newComment);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.status(201).json({ message: "Commentaire ajouté avec succès !" });
};
