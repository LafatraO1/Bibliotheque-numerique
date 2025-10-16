
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Utilisateurs
  registerUser: (user) => ipcRenderer.invoke("register-user", user),
  loginUser: (data) => ipcRenderer.invoke("login-user", data),
  getCurrentUser: () => ipcRenderer.invoke("get-current-user"),

  // Livres
  getBooks: () => ipcRenderer.invoke("get-books"),
  addBook: () => ipcRenderer.invoke("add-book"),
  deleteBook: (file) => ipcRenderer.invoke("delete-book", file),
  openBook: (file) => ipcRenderer.invoke("open-book", file),

  // Téléchargement
  downloadDocument: (doc) => ipcRenderer.invoke("download-document", doc),
});
