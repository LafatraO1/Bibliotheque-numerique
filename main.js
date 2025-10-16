
const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("fs");
const pdfParse = require("pdf-parse");

// Variables globales
let mainWindow;
let currentUser = null;

// Chemins importants
const livresFolder = path.join(__dirname, "livres");
const usersPath = path.join(__dirname, "users.json");
const telechargementsPath = path.join(__dirname, "telechargements.json");
const categoriesPath = path.join(__dirname, "categories.json");

// Assurer les fichiers/dossiers
function initFiles() {
  if (!fs.existsSync(livresFolder)) fs.mkdirSync(livresFolder);
  if (!fs.existsSync(usersPath)) fs.writeFileSync(usersPath, JSON.stringify([]));
  if (!fs.existsSync(telechargementsPath)) fs.writeFileSync(telechargementsPath, JSON.stringify([]));
  if (!fs.existsSync(categoriesPath)) fs.writeFileSync(categoriesPath, JSON.stringify([]));
}

// Création de la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "frontend", "login.html"));
}

app.whenReady().then(() => {
  initFiles();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// LOGIN / REGISTER UTILISATEUR

// Enregistrement utilisateur
ipcMain.handle("register-user", async (_, user) => {
  try {
    const data = fs.readFileSync(usersPath, "utf8");
    const users = JSON.parse(data);

    if (users.find(u => u.email === user.email)) {
      return { success: false, message: "Email déjà utilisé !" };
    }

    user.id_u = users.length ? users[users.length - 1].id_u + 1 : 1;
    users.push(user);

    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    return { success: true };
  } catch (err) {
    console.error("Erreur register:", err);
    return { success: false, message: "Erreur interne." };
  }
});

// Connexion utilisateur
ipcMain.handle("login-user", async (_, { email, password }) => {
  try {
    const data = fs.readFileSync(usersPath, "utf8");
    const users = JSON.parse(data);

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      currentUser = user;
      mainWindow.loadFile(path.join(__dirname, "frontend", "index.html"));
      return { success: true, user };
    }
    return { success: false, message: "Identifiants invalides !" };
  } catch (err) {
    console.error("Erreur login:", err);
    return { success: false, message: "Erreur interne." };
  }
});

ipcMain.handle("get-current-user", () => currentUser);

//  GESTION DES LIVRES

ipcMain.handle("get-books", async () => {
  const files = fs.readdirSync(livresFolder);
  const results = [];

  for (const [i, file] of files.entries()) {
    const filePath = path.join(livresFolder, file);
    try {
      if (file.endsWith(".pdf")) {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        results.push({
          id_d: i + 1,
          titre: file.replace(".pdf", ""),
          fichier: "livres/" + file,
          contenu: pdfData.text.toLowerCase(),
        });
      } else if (file.endsWith(".txt")) {
        const textData = fs.readFileSync(filePath, "utf8");
        results.push({
          id_d: i + 1,
          titre: file.replace(".txt", ""),
          fichier: "livres/" + file,
          contenu: textData.toLowerCase(),
        });
      }
    } catch (err) {
      console.error("Erreur lecture fichier:", err);
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
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) return false;
    const src = result.filePaths[0];
    const dest = path.join(livresFolder, path.basename(src));
    fs.copyFileSync(src, dest);
    return true;
  } catch (err) {
    console.error("Erreur ajout livre:", err);
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
    }
    return false;
  } catch (err) {
    console.error("Erreur suppression:", err);
    return false;
  }
});


//  TÉLÉCHARGEMENT LIVRES

ipcMain.handle("download-document", async (_, { id_d, fichier }) => {
  try {
    const src = path.join(__dirname, fichier);
    if (!fs.existsSync(src)) {
      return { success: false, message: "Fichier introuvable" };
    }

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Enregistrer le livre",
      defaultPath: path.basename(src),
    });

    if (canceled || !filePath) return { success: false, message: "Annulé" };

    fs.copyFileSync(src, filePath);

    const data = JSON.parse(fs.readFileSync(telechargementsPath, "utf8"));
    const nextId = data.length ? Math.max(...data.map(d => d.id_t)) + 1 : 1;

    const record = {
      id_t: nextId,
      date_t: new Date().toISOString(),
      id_utilisateur: currentUser ? currentUser.id_u : null,
      id_document: id_d,
      dest: filePath,
    };

    data.push(record);
    fs.writeFileSync(telechargementsPath, JSON.stringify(data, null, 2));
    return { success: true, path: filePath };
  } catch (err) {
    console.error("Erreur download-document:", err);
    return { success: false, message: err.message };
  }
});

// OUVERTURE LIVRE

ipcMain.handle("open-book", async (_, fileRelativePath) => {
  const filePath = path.join(__dirname, fileRelativePath);
  if (!fs.existsSync(filePath)) return false;

  const lectureWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    title: "Lecture du livre",
  });

  if (filePath.endsWith(".pdf")) {
    lectureWindow.loadURL("file://" + filePath);
  } else if (filePath.endsWith(".txt")) {
    const contenu = fs.readFileSync(filePath, "utf8");
    lectureWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(`<pre>${contenu}</pre>`)
    );
  } else {
    lectureWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent("<p>Format non supporté.</p>")
    );
  }
});
