const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("fs");
const pdfParse = require("pdf-parse");

// ===========================
// 🔹 CREATION FENÊTRE PRINCIPALE
// ===========================
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 👉 Charger la page de connexion en premier
  mainWindow.loadFile(path.join(__dirname, "frontend", "login.html"));
}

// ===========================
// 🔹 LANCEMENT APPLICATION
// ===========================
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

// ===========================
// 👤 LOGIN & REGISTER
// ===========================
const usersPath = path.join(__dirname, "users.json");

// ➕ Enregistrement utilisateur
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

// 🔐 Connexion utilisateur
ipcMain.handle("login-user", async (_, { email, password }) => {
  try {
    const data = fs.readFileSync(usersPath, "utf8");
    const users = JSON.parse(data);

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      // ✅ Charger la page principale après connexion
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

// ===========================
// 📚 GESTION DES LIVRES
// ===========================
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
ipcMain.handle("add-book", async () => {
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

// ===========================
// 🗂️ GESTION DES CATÉGORIES
// ===========================
const categoriesPath = path.join(__dirname, "categories.json");

ipcMain.handle("get-categories", async () => {
  try {
    const data = fs.readFileSync(categoriesPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erreur lecture categories :", err);
    return [];
  }
});

ipcMain.handle("add-category", async (_, categorie) => {
  try {
    const data = fs.readFileSync(categoriesPath, "utf8");
    const categories = JSON.parse(data);
    categories.push(categorie);
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
    return true;
  } catch (err) {
    console.error("Erreur ajout catégorie :", err);
    return false;
  }
});

ipcMain.handle("delete-category", async (_, nom) => {
  try {
    const data = fs.readFileSync(categoriesPath, "utf8");
    let categories = JSON.parse(data);
    categories = categories.filter(c => c.nom !== nom);
    fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
    return true;
  } catch (err) {
    console.error("Erreur suppression catégorie :", err);
    return false;
  }
});
