const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Fonctions utilitaires
function readData(file) {
  const path = `./data/${file}`;
  if (!fs.existsSync(path)) fs.writeFileSync(path, '[]');
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeData(file, data) {
  fs.writeFileSync(`./data/${file}`, JSON.stringify(data, null, 2));
}

// UTILISATEURS
app.get('/utilisateurs', (req, res) => {
  res.json(readData('users.json'));
});

app.post('/utilisateurs', (req, res) => {
  const users = readData('users.json');
  const newUser = req.body;
  newUser.id_u = users.length ? users[users.length - 1].id_u + 1 : 1;
  users.push(newUser);
  writeData('users.json', users);
  res.json({ message: 'Utilisateur ajouté', user: newUser });
});

app.put('/utilisateurs/:id', (req, res) => {
  const users = readData('users.json');
  const id = parseInt(req.params.id);
  const index = users.findIndex(u => u.id_u === id);
  if (index !== -1) {
    users[index] = { ...users[index], ...req.body };
    writeData('users.json', users);
    res.json({ message: 'Utilisateur modifié', user: users[index] });
  } else {
    res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
});

app.delete('/utilisateurs/:id', (req, res) => {
  const users = readData('users.json');
  const id = parseInt(req.params.id);
  const filtered = users.filter(u => u.id_u !== id);
  writeData('users.json', filtered);
  res.json({ message: 'Utilisateur supprimé' });
});

// DOCUMENTS
app.get('/documents', (req, res) => {
  res.json(readData('documents.json'));
});

app.post('/documents', (req, res) => {
  const docs = readData('documents.json');
  const newDoc = req.body;
  newDoc.id_d = docs.length ? docs[docs.length - 1].id_d + 1 : 1;
  docs.push(newDoc);
  writeData('documents.json', docs);
  res.json({ message: 'Document ajouté', document: newDoc });
});

app.put('/documents/:id', (req, res) => {
  const docs = readData('documents.json');
  const id = parseInt(req.params.id);
  const index = docs.findIndex(d => d.id_d === id);
  if (index !== -1) {
    docs[index] = { ...docs[index], ...req.body };
    writeData('documents.json', docs);
    res.json({ message: 'Document modifié', document: docs[index] });
  } else {
    res.status(404).json({ message: 'Document non trouvé' });
  }
});

app.delete('/documents/:id', (req, res) => {
  const docs = readData('documents.json');
  const id = parseInt(req.params.id);
  const filtered = docs.filter(d => d.id_d !== id);
  writeData('documents.json', filtered);
  res.json({ message: 'Document supprimé' });
});

// CATEGORIES
app.get('/categories', (req, res) => {
  res.json(readData('categories.json'));
});

app.post('/categories', (req, res) => {
  const cat = readData('categories.json');
  const newCat = req.body;
  newCat.id_cat = cat.length ? cat[cat.length - 1].id_cat + 1 : 1;
  cat.push(newCat);
  writeData('categories.json', cat);
  res.json({ message: 'Catégorie ajoutée', categorie: newCat });
});

app.put('/categories/:id', (req, res) => {
  const cat = readData('categories.json');
  const id = parseInt(req.params.id);
  const index = cat.findIndex(c => c.id_cat === id);
  if (index !== -1) {
    cat[index] = { ...cat[index], ...req.body };
    writeData('categories.json', cat);
    res.json({ message: 'Catégorie modifiée', categorie: cat[index] });
  } else {
    res.status(404).json({ message: 'Catégorie non trouvée' });
  }
});

app.delete('/categories/:id', (req, res) => {
  const cat = readData('categories.json');
  const id = parseInt(req.params.id);
  const filtered = cat.filter(c => c.id_cat !== id);
  writeData('categories.json', filtered);
  res.json({ message: 'Catégorie supprimée' });
});

// COMMENTAIRES
app.get('/commentaires', (req, res) => {
  res.json(readData('commentaires.json'));
});

app.post('/commentaires', (req, res) => {
  const com = readData('commentaires.json');
  const newCom = req.body;
  newCom.id_c = com.length ? com[com.length - 1].id_c + 1 : 1;
  com.push(newCom);
  writeData('commentaires.json', com);
  res.json({ message: 'Commentaire ajouté', commentaire: newCom });
});

app.put('/commentaires/:id', (req, res) => {
  const com = readData('commentaires.json');
  const id = parseInt(req.params.id);
  const index = com.findIndex(c => c.id_c === id);
  if (index !== -1) {
    com[index] = { ...com[index], ...req.body };
    writeData('commentaires.json', com);
    res.json({ message: 'Commentaire modifié', commentaire: com[index] });
  } else {
    res.status(404).json({ message: 'Commentaire non trouvé' });
  }
});

app.delete('/commentaires/:id', (req, res) => {
  const com = readData('commentaires.json');
  const id = parseInt(req.params.id);
  const filtered = com.filter(c => c.id_c !== id);
  writeData('commentaires.json', filtered);
  res.json({ message: 'Commentaire supprimé' });
});

// LANCEMENT DU SERVEUR
const PORT = 5000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
