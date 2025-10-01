document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput")
  const resultsDiv = document.getElementById("results")

  let livres = await window.electronAPI.getBooks()

  // Highlight texte
  function highlight(text, query) {
    if (!query) return text
    const regex = new RegExp(`(${query})`, "gi")
    return text.replace(regex, "<span class='highlight'>$1</span>")
  }

  // Maka sombiny manodidina ny query
  function extraitContenu(contenu, query, longueur = 80) {
    if (!query || !contenu) return ""
    const index = contenu.toLowerCase().indexOf(query.toLowerCase())
    if (index === -1) return ""

    const start = Math.max(0, index - Math.floor(longueur / 2))
    const end = Math.min(contenu.length, index + Math.floor(longueur / 2))
    const extrait = contenu.substring(start, end)
    return "..." + highlight(extrait, query) + "..."
  }

  function afficherResultats(query = "") {
    resultsDiv.innerHTML = ""
    const lowerQuery = query.toLowerCase()

    const filtres = livres.filter(livre =>
      livre.titre.toLowerCase().includes(lowerQuery) ||
      livre.contenu.includes(lowerQuery)
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
        <h3 class="titre" data-file="${livre.fichier}">
          ${highlight(livre.titre, query)}
        </h3>
        ${extrait ? `<p class="preview">${extrait}</p>` : ""}
      `
      div.querySelector(".titre").addEventListener("click", () => {
        window.open(livre.fichier, "_blank")
      })
      resultsDiv.appendChild(div)
    })
  }

  // Recherche automatique
  searchInput.addEventListener("input", e => {
    afficherResultats(e.target.value)
  })

  // Afficher tout au début
  afficherResultats()
})
