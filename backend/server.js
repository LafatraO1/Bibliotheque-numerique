const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const { readUsers, writeUsers } = require("./models/User");

app.use(cors());
app.use(express.json());

// Route test
app.get("/", (req, res) => {
  res.send("Bienvenue sur le serveur 📚");
});

//  REGISTER
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: "Utilisateur déjà existant" });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ username, password: hashedPassword });
  writeUsers(users);

  res.status(201).json({ message: "Inscription réussie" });
});

//  LOGIN
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();

  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(400).json({ message: "Identifiants invalides" });
  }

  res.json({ message: "Connexion réussie ✅", user: { username } });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
