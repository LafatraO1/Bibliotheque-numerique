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

// DOCUMENTS CRUD
app.get('/documents', (req, res) => {
  const docs = readData('documents.json');
  res.json(docs);
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

  if (index === -1) {
    return res.status(404).json({ message: 'Document introuvable' });
  }

  docs[index] = { ...docs[index], ...req.body };
  writeData('documents.json', docs);
  res.json({ message: 'Document modifié', document: docs[index] });
});

app.delete('/documents/:id', (req, res) => {
  const docs = readData('documents.json');
  const id = parseInt(req.params.id);
  const filtered = docs.filter(d => d.id_d !== id);

  if (docs.length === filtered.length) {
    return res.status(404).json({ message: 'Document introuvable' });
  }

  writeData('documents.json', filtered);
  res.json({ message: 'Document supprimé' });
});

// LANCEMENT
const PORT = 5000;
app.listen(PORT, () => console.log(` Serveur lancé sur http://localhost:${PORT}`));
