document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput");
  const resultsDiv = document.getElementById("results");
  const addBtn = document.getElementById("addBook");

  // Maka ny livres rehetra
  async function chargerLivres() {
    const livres = await window.electronAPI.getBooks();
    afficherResultats(livres, searchInput.value);
  }

  // Highlight texte
  function highlight(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<span class='highlight'>$1</span>");
  }

  // Maka extrait amin’ny contenu
  function extraitContenu(contenu, query, longueur = 80) {
    if (!query || !contenu) return "";
    const index = contenu.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return "";
    const start = Math.max(0, index - Math.floor(longueur / 2));
    const end = Math.min(contenu.length, index + Math.floor(longueur / 2));
    const extrait = contenu.substring(start, end);
    return "..." + highlight(extrait, query) + "...";
  }

  // Afficher les résultats
  async function afficherResultats(livres, query = "") {
    resultsDiv.innerHTML = "";
    const lowerQuery = query.toLowerCase();

    const filtres = livres.filter(livre =>
      livre.titre.toLowerCase().includes(lowerQuery) ||
      livre.contenu.toLowerCase().includes(lowerQuery)
    );

    if (filtres.length === 0) {
      resultsDiv.innerHTML = "<p>Aucun résultat trouvé.</p>";
      return;
    }

    filtres.forEach(livre => {
      const extrait = extraitContenu(livre.contenu, query);
      const div = document.createElement("div");
      div.className = "livre";
      div.innerHTML = `
        <button class="deleteBtn" data-file="${livre.fichier}">Supprimer</button>
        <h3 class="titre" data-file="${livre.fichier}">
          ${highlight(livre.titre, query)}
        </h3>
        ${extrait ? `<p class="preview">${extrait}</p>` : ""}
      `;
      // Ouvrir le livre
      div.querySelector(".titre").addEventListener("click", () => {
        window.open(livre.fichier, "_blank");
      });
      // Supprimer un livre
      div.querySelector(".deleteBtn").addEventListener("click", async (e) => {
        const file = e.target.getAttribute("data-file");
        const confirmDelete = confirm("Supprimer ce livre ?");
        if (!confirmDelete) return;
        const ok = await window.electronAPI.deleteBook(file);
        if (ok) chargerLivres();
      });

      resultsDiv.appendChild(div);
    });
  }

  // Recherche dynamique
  searchInput.addEventListener("input", async e => {
    const livres = await window.electronAPI.getBooks();
    afficherResultats(livres, e.target.value);
  });

  // Bouton Ajouter un livre
  addBtn.addEventListener("click", async () => {
    const ok = await window.electronAPI.addBook();
    if (ok) chargerLivres();
  });

  // Charger initialement
  chargerLivres();
});
