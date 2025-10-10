document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput")
  const resultsDiv = document.getElementById("results")
  const addButton = document.getElementById("addButton")

  // Maka ny boky rehetra avy amin'ny main process
  let livres = await window.electronAPI.getBooks()

  // Fonction famirapiratana
  function highlight(text, query) {
    if (!query) return text
    const regex = new RegExp(`(${query})`, "gi")
    return text.replace(regex, "<span class='highlight'>$1</span>")
  }

  // Maka sombiny amin'ny texte misy ny recherche
  function extraitContenu(contenu, query, longueur = 80) {
    if (!query || !contenu) return ""
    const index = contenu.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return ""
    const start = Math.max(0, index - Math.floor(longueur / 2))
    const end = Math.min(contenu.length, index + Math.floor(longueur / 2))
    const extrait = contenu.substring(start, end)
    return "..." + highlight(extrait, query) + "..."
  }

  // Fampisehoana an’ireo boky rehetra na résultat
  function afficherResultats(query = "") {
    resultsDiv.innerHTML = ""
    const lowerQuery = query.toLowerCase()

    const filtres = livres.filter(livre =>
      livre.titre.toLowerCase().includes(lowerQuery) ||
      livre.contenu.toLowerCase().includes(lowerQuery)
    )

    if (filtres.length === 0) {
      resultsDiv.innerHTML = "<p>Aucun résultat trouvé.</p>"
      return
    }

    filtres.forEach(livre => {
      const extrait = extraitContenu(livre.contenu, query)

      const div = document.createElement("div")
      div.className = "livre"
      div.innerHTML = `
        <h3 class="titre">${highlight(livre.titre, query)}</h3>
        ${extrait ? `<p class="preview">${extrait}</p>` : ""}
        <button class="delete-btn">🗑 Supprimer</button>
      `
      div.querySelector(".titre").addEventListener("click", () => {
        window.open(livre.fichier, "_blank")
      })

      // Supprimer un livre précis
      div.querySelector(".delete-btn").addEventListener("click", async () => {
        if (confirm(`Supprimer "${livre.titre}" ?`)) {
          const ok = await window.electronAPI.deleteBook(livre.fichier)
          if (ok) {
            livres = livres.filter(l => l.fichier !== livre.fichier)
            afficherResultats(searchInput.value)
          } else {
            alert("Erreur lors de la suppression.")
          }
        }
      })

      resultsDiv.appendChild(div)
    })
  }

  // Bouton ajout de livre
  addButton.addEventListener("click", async () => {
    const ok = await window.electronAPI.addBook()
    if (ok) {
      livres = await window.electronAPI.getBooks()
      afficherResultats(searchInput.value)
    }
  })

  // Recherche automatique
  searchInput.addEventListener("input", e => {
    afficherResultats(e.target.value)
  })

  afficherResultats()
})
