const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Fonction mamaky sy manoratra fichier JSON
function readData(file) {
  return JSON.parse(fs.readFileSync(`./data/${file}`, 'utf8'));
}

function writeData(file, data) {
  fs.writeFileSync(`./data/${file}`, JSON.stringify(data, null, 2));
}

// UTILISATEURS
app.get('/utilisateurs', (req, res) => {
  const users = readData('users.json');
  res.json(users);
});

app.post('/utilisateurs', (req, res) => {
  const users = readData('users.json');
  const newUser = req.body;
  newUser.id_u = users.length + 1;
  users.push(newUser);
  writeData('users.json', users);
  res.json({ message: 'Utilisateur ajouté', user: newUser });
});

// DOCUMENTS
app.get('/documents', (req, res) => {
  const docs = readData('documents.json');
  res.json(docs);
});

app.post('/documents', (req, res) => {
  const docs = readData('documents.json');
  const newDoc = req.body;
  newDoc.id_d = docs.length + 1;
  docs.push(newDoc);
  writeData('documents.json', docs);
  res.json({ message: 'Document ajouté', document: newDoc });
});

// CATEGORIES
app.get('/categories', (req, res) => {
  const cat = readData('categories.json');
  res.json(cat);
});

app.post('/categories', (req, res) => {
  const cat = readData('categories.json');
  const newCat = req.body;
  newCat.id_c = cat.length + 1;
  cat.push(newCat);
  writeData('categories.json', cat);
  res.json({ message: 'Catégorie ajoutée', categorie: newCat });
});

// COMMENTAIRES
app.get('/commentaires', (req, res) => {
  const com = readData('commentaires.json');
  res.json(com);
});

app.post('/commentaires', (req, res) => {
  const com = readData('commentaires.json');
  const newCom = req.body;
  newCom.id_c = com.length + 1;
  com.push(newCom);
  writeData('commentaires.json', com);
  res.json({ message: 'Commentaire ajouté', commentaire: newCom });
});

// LANCEMENT
const PORT = 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
