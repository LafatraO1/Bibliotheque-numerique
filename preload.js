const { contextBridge, ipcRenderer, shell } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getBooks: () => ipcRenderer.invoke("get-books"),
  addBook: () => ipcRenderer.invoke("add-book"),
  deleteBook: (file) => ipcRenderer.invoke("delete-book", file),
  openBookInApp: (file) => ipcRenderer.invoke("open-book", file),

  // Catégories
  getCategories: () => ipcRenderer.invoke("get-categories"),
  addCategory: (cat) => ipcRenderer.invoke("add-category", cat),
  deleteCategory: (nom) => ipcRenderer.invoke("delete-category", nom),

  // Utilisateurs
  registerUser: (user) => ipcRenderer.invoke("register-user", user),
  loginUser: (data) => ipcRenderer.invoke("login-user", data),
});
