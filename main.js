const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");


// CREATION FENÊTRE PRINCIPALE

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  //  Charger la page de connexion en premier
  mainWindow.loadFile(path.join(__dirname, "frontend", "login.html"));
}


// LANCEMENT APPLICATION

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Créer les dossiers/fichiers nécessaires
  const livresFolder = path.join(__dirname, "livres");
  if (!fs.existsSync(livresFolder)) fs.mkdirSync(livresFolder);

  const usersFile = path.join(__dirname, "users.json");
  if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]));

  const categoriesPath = path.join(__dirname, "categories.json");
  if (!fs.existsSync(categoriesPath)) fs.writeFileSync(categoriesPath, JSON.stringify([]));
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});


// LOGIN & REGISTER
const usersPath = path.join(__dirname, "users.json");

// Enregistrement utilisateur
ipcMain.handle("register-user", async (_, user) => {
  try {
    const data = fs.readFileSync(usersPath, "utf8");
    const users = JSON.parse(data);

    const exists = users.find(u => u.email === user.email);
    if (exists) return { success: false, message: "Email déjà utilisé !" };

    users.push(user);
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    return { success: true };
  } catch (err) {
    console.error("Erreur register :", err);
    return { success: false, message: "Erreur interne." };
  }
});

//  Connexion utilisateur
ipcMain.handle("login-user", async (_, { email, password }) => {
  try {
    const data = fs.readFileSync(usersPath, "utf8");
    const users = JSON.parse(data);

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      //  Charger la page principale après connexion
      mainWindow.loadFile(path.join(__dirname, "frontend", "index.html"));
      return { success: true, user };
    } else {
      return { success: false, message: "Identifiants invalides !" };
    }
  } catch (err) {
    console.error("Erreur login :", err);
    return { success: false, message: "Erreur interne." };
  }
});


// GESTION DES LIVRES

ipcMain.handle("get-books", async () => {
  const folderPath = path.join(__dirname, "livres");
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
  const files = fs.readdirSync(folderPath);
  const results = [];

  for (const file of files) {
    const filePath = path.join(folderPath, file);

    try {
      if (file.endsWith(".pdf")) {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        results.push({
          titre: file.replace(".pdf", ""),
          fichier: "livres/" + file,
          contenu: pdfData.text.toLowerCase()
        });
      } else if (file.endsWith(".txt")) {
        const textData = fs.readFileSync(filePath, "utf8");
        results.push({
          titre: file.replace(".txt", ""),
          fichier: "livres/" + file,
          contenu: textData.toLowerCase()
        });
      } else {
        results.push({
          titre: file,
          fichier: "livres/" + file,
          contenu: ""
        });
      }
    } catch (err) {
      console.error("Erreur lecture fichier :", err);
    }
  }

  return results;
});

// Ajouter un livre
ipcMain.handle("add-book", async (_, categorie) => {
  try {
    const result = await dialog.showOpenDialog({
      title: "Choisir un livre à ajouter",
      filters: [{ name: "Livres", extensions: ["pdf", "txt"] }],
      properties: ["openFile"]
    });

    if (result.canceled || result.filePaths.length === 0) return false;

    const src = result.filePaths[0];
    const destFolder = path.join(__dirname, "livres");
    if (!fs.existsSync(destFolder)) fs.mkdirSync(destFolder);

    const dest = path.join(destFolder, path.basename(src));
    fs.copyFileSync(src, dest);

    // Sauvegarder la catégorie dans un fichier JSON de meta
    const metaPath = path.join(__dirname, "livres_meta.json");
    let metas = [];
    if (fs.existsSync(metaPath)) {
      metas = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    }

    metas.push({
      titre: path.basename(src),
      fichier: "livres/" + path.basename(src),
      categorie: categorie || "Non classé"
    });

    fs.writeFileSync(metaPath, JSON.stringify(metas, null, 2));

    return true;
  } catch (err) {
    console.error("Erreur ajout livre :", err);
    return false;
  }
});

// Supprimer un livre
ipcMain.handle("delete-book", async (_, fileRelativePath) => {
  try {
    const filePath = path.join(__dirname, fileRelativePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    } else {
      console.warn("Fichier non trouvé :", filePath);
      return false;
    }
  } catch (err) {
    console.error("Erreur suppression :", err);
    return false;
  }
});

// GESTION DES CATÉGORIES
const categoriesFile = path.join(__dirname, "categories.json");

// Assurer que le fichier existe
if (!fs.existsSync(categoriesFile)) {
  fs.writeFileSync(categoriesFile, JSON.stringify([]));
}

// Obtenir toutes les catégories
ipcMain.handle("get-categories", async () => {
  try {
    const data = fs.readFileSync(categoriesFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erreur lecture catégories:", error);
    return [];
  }
});

// Ajouter une catégorie
ipcMain.handle("add-category", async (_, cat) => {
  const file = path.join(__dirname, "categories.json");
  let categories = [];

  if (fs.existsSync(file)) {
    categories = JSON.parse(fs.readFileSync(file, "utf-8"));
  }

  if (categories.some(c => c.nom === cat.nom)) {
    return { success: false, message: "Catégorie déjà existante" };
  }

  categories.push(cat);
  fs.writeFileSync(file, JSON.stringify(categories, null, 2), "utf-8");
  console.log(" Catégorie ajoutée :", cat);
  return { success: true };
});



// Supprimer une catégorie
ipcMain.handle("delete-category", async (event, nom) => {
  try {
    const data = fs.readFileSync(categoriesFile, "utf-8");
    let categories = JSON.parse(data);

    const updated = categories.filter(cat => cat.nom !== nom);
    fs.writeFileSync(categoriesFile, JSON.stringify(updated, null, 2));

    return { success: true };
  } catch (error) {
    console.error("Erreur suppression catégorie:", error);
    return { success: false };
  }
});


// Ouvrir un livre dans une nouvelle fenêtre interne
ipcMain.handle("open-book", async (_, fileRelativePath) => {
  const filePath = path.join(__dirname, fileRelativePath);

  if (!fs.existsSync(filePath)) {
    console.error("Fichier introuvable :", filePath);
    return false;
  }

  const lectureWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    title: "Lecture du livre",
  });

  // Pour PDF → affichage direct
  if (filePath.endsWith(".pdf")) {
    lectureWindow.loadURL("file://" + filePath);
  }
  // Pour TXT → afficher contenu dans HTML
  else if (filePath.endsWith(".txt")) {
    const contenu = fs.readFileSync(filePath, "utf8");
    lectureWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(`
      <html>
        <head>
          <title>${path.basename(filePath)}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.6; background:#f9f9f9; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h2>${path.basename(filePath)}</h2>
          <pre>${contenu}</pre>
        </body>
      </html>
    `));
  } 
  else {
    lectureWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent("<p>Format non supporté.</p>"));
  }

  return true;
});

// ----------------------
// 🗨️  GESTION COMMENTAIRES
// ----------------------
const commentairesPath = path.join(__dirname, "commentaires.json");

// Atao azo antoka fa misy ilay fichier
if (!fs.existsSync(commentairesPath)) {
  fs.writeFileSync(commentairesPath, JSON.stringify([]));
}

// Maka ny commentaires rehetra amin'ilay livre iray
ipcMain.handle("get-commentaires", async (_, titreLivre) => {
  const data = fs.readFileSync(commentairesPath, "utf8");
  const commentaires = JSON.parse(data);
  return commentaires.filter(c => c.livre === titreLivre);
});

// Manampy commentaire vaovao
ipcMain.handle("add-commentaire", async (_, commentaire) => {
  try {
    let data = [];
    if (fs.existsSync(commentairesPath)) {
      data = JSON.parse(fs.readFileSync(commentairesPath, "utf8"));
    }
    data.push(commentaire);
    fs.writeFileSync(commentairesPath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (err) {
    console.error("Erreur ajout commentaire:", err);
    return { success: false };
  }
});

