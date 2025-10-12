const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("node:path");
const fs = require("fs");
const pdfParse = require("pdf-parse");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, "frontend", "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Récupérer tous les livres
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
