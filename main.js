const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("node:path")
const fs = require("fs")
const pdfParse = require("pdf-parse")

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js")
    }
  })
  win.loadFile("index.html")
}

app.whenReady().then(() => {
  createWindow()
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})

ipcMain.handle("get-books", async () => {
  const folderPath = path.join(__dirname, "livres")
  const files = fs.readdirSync(folderPath)
  const results = []

  for (const file of files) {
    const filePath = path.join(folderPath, file)

    if (file.endsWith(".pdf")) {
      const dataBuffer = fs.readFileSync(filePath)
      const pdfData = await pdfParse(dataBuffer)
      results.push({
        titre: file.replace(".pdf", ""),
        fichier: "livres/" + file,
        contenu: pdfData.text.toLowerCase()
      })
    } 
    else if (file.endsWith(".txt")) {
      const textData = fs.readFileSync(filePath, "utf8")
      results.push({
        titre: file.replace(".txt", ""),
        fichier: "livres/" + file,
        contenu: textData.toLowerCase()
      })
    } 
    else {
      results.push({
        titre: file,
        fichier: "livres/" + file,
        contenu: ""
      })
    }
  }

  return results
})
