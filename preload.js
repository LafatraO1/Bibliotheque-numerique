const { contextBridge, ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  };

  for (const type of ["chrome", "node", "electron"]) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

// Mamorona bridge azo ampiasaina any amin’ny renderer.js
contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (filePath, buffer) => ipcRenderer.invoke("save-file", filePath, buffer)
});
