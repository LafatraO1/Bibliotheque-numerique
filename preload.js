const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getBooks: () => ipcRenderer.invoke("get-books"),
  addBook: () => ipcRenderer.invoke("add-book"),
  deleteBook: (file) => ipcRenderer.invoke("delete-book", file),

  // Catégories
  getCategories: () => ipcRenderer.invoke("get-categories"),
  addCategory: (categorie) => ipcRenderer.invoke("add-category", categorie),
  deleteCategory: (nom) => ipcRenderer.invoke("delete-category", nom),

  // Utilisateurs
  registerUser: (user) => ipcRenderer.invoke("register-user", user),
  loginUser: (data) => ipcRenderer.invoke("login-user", data)
});
