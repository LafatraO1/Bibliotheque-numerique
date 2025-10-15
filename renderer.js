document.addEventListener("DOMContentLoaded", async () => {
  const searchInput = document.getElementById("searchInput");
  const resultsDiv = document.getElementById("results");
  const addBtn = document.getElementById("addBook");

  
  async function chargerCategories() {
    const categorySelect = document.getElementById("categorySelect");
    categorySelect.innerHTML = "<option value=''>-- Toutes les catégories --</option>";

    const categories = await window.electronAPI.chargerCategories();
    categories.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nom;
      categorySelect.appendChild(opt);
    });
    
  }

  document.addEventListener("DOMContentLoaded" , () => {
    chargerCategories();
  });

  // Maka sy mamerina ny lisitry ny livres
  async function chargerLivres() {
    const livres = await window.electronAPI.getBooks();
    afficherResultats(livres, searchInput.value);
  }

  // Manasongadina ny mot-clé
  function highlight(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, "gi");
    return text.replace(regex, "<span class='highlight'>$1</span>");
  }

  // Maka extrait kely amin'ny contenu
  function extraitContenu(contenu, query, longueur = 80) {
    if (!query || !contenu) return "";
    const index = contenu.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) return "";
    const start = Math.max(0, index - Math.floor(longueur / 2));
    const end = Math.min(contenu.length, index + Math.floor(longueur / 2));
    const extrait = contenu.substring(start, end);
    return "..." + highlight(extrait, query) + "...";
  }

  // Aseho amin'ny écran ny résultats
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
        <button class="deleteBtn" data-file="${livre.fichier}">🗑️ Supprimer</button>
        <h3 class="titre" data-file="${livre.fichier}">
          ${highlight(livre.titre, query)}
        </h3>
        ${extrait ? `<p class="preview">${extrait}</p>` : ""}
      `;

      //  Clique amin’ny titre → manokatra ilay PDF/TXT
      const titreElement = div.querySelector(".titre");
      titreElement.addEventListener("click", async (e) => {
        const file = e.target.getAttribute("data-file");
        // Alefa any amin’ny main process amin’ny alalan’ny preload
        await window.electronAPI.openBookInApp(file);
      });

      //  Supprimer un livre
      const deleteBtn = div.querySelector(".deleteBtn");
      deleteBtn.addEventListener("click", async (e) => {
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

  // Bouton Ajouter
  addBtn.addEventListener("click", async () => {
    const ok = await window.electronAPI.addBook();
    if (ok) chargerLivres();
  });

  // Chargement initial
  chargerLivres();
});
