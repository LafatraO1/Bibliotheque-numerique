const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getBooks: () => ipcRenderer.invoke("get-books"),
  addBook: () => ipcRenderer.invoke("add-book"),
  deleteBook: (filePath) => ipcRenderer.invoke("delete-book", filePath)
});
