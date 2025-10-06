const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Fichier users.json
const USERS_FILE = './users.json';

// Function mamaky sy manoratra fichier
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  const data = fs.readFileSync(USERS_FILE);
  return JSON.parse(data);
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Route Register
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Utilisateur déjà existant' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashedPassword });
  writeUsers(users);
  res.status(201).json({ message: 'Inscription réussie' });
});

// Route Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ message: 'Identifiants invalides' });
  }

  res.json({ message: 'Connexion réussie' });
});

//  Lancer le serveur
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`));
