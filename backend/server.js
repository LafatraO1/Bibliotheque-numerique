const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());
app.use(cors());

// CONNEXION BD
const db = new sqlite3.Database('./data/bibliotheque.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS utilisateurs (
    id_u INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT,
    email TEXT UNIQUE,
    mot_de_passe TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS documents (
    id_d INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT,
    auteur TEXT,
    annee INTEGER,
    fichier TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS categories (
    id_cat INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS commentaires (
    id_c INTEGER PRIMARY KEY AUTOINCREMENT,
    contenu TEXT,
    date_c TEXT,
    id_u INTEGER,
    id_d INTEGER,
    FOREIGN KEY (id_u) REFERENCES utilisateurs(id_u),
    FOREIGN KEY (id_d) REFERENCES documents(id_d)
  )`);
});

// ROUTES UTILISATEURS
app.post('/register', (req, res) => {
  const { nom, email, mot_de_passe } = req.body;
  if (!nom || !email || !mot_de_passe)
    return res.status(400).json({ message: 'Tous les champs sont requis' });

  db.get(`SELECT * FROM utilisateurs WHERE email = ?`, [email], (err, user) => {
    if (user) return res.status(400).json({ message: 'Email déjà utilisé' });

    const hash = bcrypt.hashSync(mot_de_passe, 10);
    db.run(
      `INSERT INTO utilisateurs (nom, email, mot_de_passe) VALUES (?, ?, ?)`,
      [nom, email, hash],
      function (err) {
        if (err) return res.status(500).json({ message: 'Erreur serveur' });
        res.json({ message: 'Utilisateur enregistré', user: { id_u: this.lastID, nom, email } });
      }
    );
  });
});

app.post('/login', (req, res) => {
  const { email, mot_de_passe } = req.body;
  db.get(`SELECT * FROM utilisateurs WHERE email = ?`, [email], (err, user) => {
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    const valid = bcrypt.compareSync(mot_de_passe, user.mot_de_passe);
    if (!valid) return res.status(401).json({ message: 'Mot de passe incorrect' });
    res.json({ message: 'Connexion réussie', user: { id_u: user.id_u, nom: user.nom, email: user.email } });
  });
});

app.get('/utilisateurs', (req, res) => {
  db.all(`SELECT * FROM utilisateurs`, [], (err, rows) => res.json(rows));
});

app.post('/utilisateurs', (req, res) => {
  const { nom, email, mot_de_passe } = req.body;
  const hash = bcrypt.hashSync(mot_de_passe || '1234', 10);
  db.run(
    `INSERT INTO utilisateurs (nom, email, mot_de_passe) VALUES (?, ?, ?)`,
    [nom, email, hash],
    function (err) {
      if (err) return res.status(400).json({ message: 'Erreur insertion' });
      res.json({ message: 'Utilisateur ajouté', id_u: this.lastID });
    }
  );
});

app.put('/utilisateurs/:id', (req, res) => {
  const { nom, email } = req.body;
  db.run(
    `UPDATE utilisateurs SET nom = ?, email = ? WHERE id_u = ?`,
    [nom, email, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ message: 'Erreur mise à jour' });
      res.json({ message: 'Utilisateur modifié' });
    }
  );
});

app.delete('/utilisateurs/:id', (req, res) => {
  db.run(`DELETE FROM utilisateurs WHERE id_u = ?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ message: 'Erreur suppression' });
    res.json({ message: 'Utilisateur supprimé' });
  });
});

// DOCUMENTS
app.get('/documents', (req, res) => {
  db.all(`SELECT * FROM documents`, [], (err, rows) => res.json(rows));
});

app.post('/documents', (req, res) => {
  const { titre, auteur, annee, fichier } = req.body;
  db.run(
    `INSERT INTO documents (titre, auteur, annee, fichier) VALUES (?, ?, ?, ?)`,
    [titre, auteur, annee, fichier],
    function (err) {
      if (err) return res.status(400).json({ message: 'Erreur ajout' });
      res.json({ message: 'Document ajouté', id_d: this.lastID });
    }
  );
});

app.put('/documents/:id', (req, res) => {
  const { titre, auteur, annee, fichier } = req.body;
  db.run(
    `UPDATE documents SET titre=?, auteur=?, annee=?, fichier=? WHERE id_d=?`,
    [titre, auteur, annee, fichier, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ message: 'Erreur mise à jour' });
      res.json({ message: 'Document modifié' });
    }
  );
});

app.delete('/documents/:id', (req, res) => {
  db.run(`DELETE FROM documents WHERE id_d=?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ message: 'Erreur suppression' });
    res.json({ message: 'Document supprimé' });
  });
});

// CATEGORIES
app.get('/categories', (req, res) => {
  db.all(`SELECT * FROM categories`, [], (err, rows) => res.json(rows));
});

app.post('/categories', (req, res) => {
  const { nom } = req.body;
  db.run(`INSERT INTO categories (nom) VALUES (?)`, [nom], function (err) {
    if (err) return res.status(400).json({ message: 'Erreur ajout' });
    res.json({ message: 'Catégorie ajoutée', id_cat: this.lastID });
  });
});

app.put('/categories/:id', (req, res) => {
  const { nom } = req.body;
  db.run(`UPDATE categories SET nom=? WHERE id_cat=?`, [nom, req.params.id], function (err) {
    if (err) return res.status(400).json({ message: 'Erreur mise à jour' });
    res.json({ message: 'Catégorie modifiée' });
  });
});

app.delete('/categories/:id', (req, res) => {
  db.run(`DELETE FROM categories WHERE id_cat=?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ message: 'Erreur suppression' });
    res.json({ message: 'Catégorie supprimée' });
  });
});

// COMMENTAIRES
app.get('/commentaires', (req, res) => {
  db.all(`SELECT * FROM commentaires`, [], (err, rows) => res.json(rows));
});

app.post('/commentaires', (req, res) => {
  const { contenu, date_c, id_u, id_d } = req.body;
  db.run(
    `INSERT INTO commentaires (contenu, date_c, id_u, id_d) VALUES (?, ?, ?, ?)`,
    [contenu, date_c, id_u, id_d],
    function (err) {
      if (err) return res.status(400).json({ message: 'Erreur ajout' });
      res.json({ message: 'Commentaire ajouté', id_c: this.lastID });
    }
  );
});

app.put('/commentaires/:id', (req, res) => {
  const { contenu, date_c } = req.body;
  db.run(
    `UPDATE commentaires SET contenu=?, date_c=? WHERE id_c=?`,
    [contenu, date_c, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ message: 'Erreur mise à jour' });
      res.json({ message: 'Commentaire modifié' });
    }
  );
});

app.delete('/commentaires/:id', (req, res) => {
  db.run(`DELETE FROM commentaires WHERE id_c=?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ message: 'Erreur suppression' });
    res.json({ message: 'Commentaire supprimé' });
  });
});

//LIVRES
app.get("/livres", (req, res) => {
  db.all("SELECT * FROM livres", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});
app.post("/livres", (req, res) => {
  const { titre, auteur, categorie } = req.body;
  db.run(
    "INSERT INTO livres (titre, auteur, categorie) VALUES (?, ?, ?)",
    [titre, auteur, categorie],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Livre ajouté", id: this.lastID });
    }
  );
});
app.delete("/livres/:id", (req, res) => {
  db.run("DELETE FROM livres WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Livre supprimé" });
  });
});

// LANCEMENT SERVEUR
const PORT = 5000;
app.listen(PORT, () => console.log(` Serveur SQLite lancé sur http://localhost:${PORT}`));
