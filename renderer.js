document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput")
  const resultsDiv = document.getElementById("results")

  let livres = await window.electronAPI.getBooks()

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
      const div = document.createElement("div")
      div.className = "livre"
      div.innerHTML = `<h3 class="titre" data-file="${livre.fichier}">${livre.titre}</h3>`
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
