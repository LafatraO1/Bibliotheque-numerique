const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/documents.json');

// Lire tous les documents
exports.getDocuments = (req, res) => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  res.json(data);
};

// Ajouter un document
exports.addDocument = (req, res) => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const newDoc = req.body;
  newDoc.id_d = data.length ? data[data.length - 1].id_d + 1 : 1;
  data.push(newDoc);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  res.status(201).json({ message: "Document ajouté avec succès !" });
};
