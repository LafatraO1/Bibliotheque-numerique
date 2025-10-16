
const resultsDiv = document.getElementById("results");
const addBookBtn = document.getElementById("addBook");
const searchInput = document.getElementById("searchInput");

const paginationDiv = document.createElement("div");
paginationDiv.className = "pagination flex justify-center gap-3 mt-4";
resultsDiv.after(paginationDiv);

let allBooks = [];
let currentPage = 1;
const livresParPage = 10; //  10 livres par page

//  Charger tous les livres
async function chargerLivres() {
  allBooks = await window.electronAPI.getBooks();
  afficherLivres(allBooks);
}

//  Fonction highlight
function highlightText(texte, mot) {
  if (!mot) return texte;
  const regex = new RegExp(`(${mot})`, "gi");
  return texte.replace(regex, `<mark style="background:yellow;">$1</mark>`);
}

//  Fonction d’affichage (avec pagination)
function afficherLivres(livres, query = "") {
  resultsDiv.innerHTML = "";

  if (livres.length === 0) {
    resultsDiv.innerHTML = "<p>Aucun livre trouvé.</p>";
    paginationDiv.innerHTML = "";
    return;
  }

  // Pagination
  const totalPages = Math.ceil(livres.length / livresParPage);
  const startIndex = (currentPage - 1) * livresParPage;
  const endIndex = startIndex + livresParPage;
  const livresPage = livres.slice(startIndex, endIndex);

  livresPage.forEach((livre) => {
    const titreAffiche = highlightText(livre.titre, query);
    let extrait = "";

    if (query && livre.contenu) {
      const index = livre.contenu.toLowerCase().indexOf(query.toLowerCase());
      if (index !== -1) {
        const debut = Math.max(0, index - 40);
        const fin = Math.min(livre.contenu.length, index + 60);
        extrait = livre.contenu.substring(debut, fin);
        extrait = highlightText(extrait, query);
      }
    }

    const div = document.createElement("div");
    div.className = "livre border p-3 rounded-xl shadow mb-3 bg-white";
    div.innerHTML = `
      <h3 class="font-bold text-lg">${titreAffiche}</h3>
      ${extrait ? `<p class="text-gray-600 text-sm italic">${extrait}...</p>` : ""}
      <div class="flex gap-2 mt-2">
        <button class="openBtn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded" data-file="${livre.fichier}">📖 Ouvrir</button>
        <button class="downloadBtn bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded" data-id="${livre.id_d}" data-file="${livre.fichier}">⬇️ Télécharger</button>
        <button class="deleteBtn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded" data-file="${livre.fichier}">🗑️ Supprimer</button>
      </div>
    `;

    // Boutons
    div.querySelector(".openBtn").addEventListener("click", async (e) => {
      const file = e.target.getAttribute("data-file");
      await window.electronAPI.openBook(file);
    });

    div.querySelector(".downloadBtn").addEventListener("click", async (e) => {
      const id_d = e.target.getAttribute("data-id");
      const fichier = e.target.getAttribute("data-file");
      const res = await window.electronAPI.downloadDocument({ id_d, fichier });
      if (res.success) alert("📥 Téléchargement réussi !");
      else alert("Erreur: " + res.message);
    });

    div.querySelector(".deleteBtn").addEventListener("click", async (e) => {
      const file = e.target.getAttribute("data-file");
      if (!confirm("Supprimer ce livre ?")) return;
      const ok = await window.electronAPI.deleteBook(file);
      if (ok) chargerLivres();
    });

    resultsDiv.appendChild(div);
  });

  //  Pagination buttons
  paginationDiv.innerHTML = `
    <button id="prevPage" class="px-3 py-1 bg-gray-300 rounded ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}">⬅️ Précédent</button>
    <span>Page ${currentPage} / ${totalPages}</span>
    <button id="nextPage" class="px-3 py-1 bg-gray-300 rounded ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}">Suivant ➡️</button>
  `;

  // Events pagination
  document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      afficherLivres(livres, query);
    }
  });

  document.getElementById("nextPage").addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      afficherLivres(livres, query);
    }
  });
}

//  Recherche avec highlight
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  currentPage = 1; // revenir page 1 à chaque recherche

  if (query === "") {
    afficherLivres(allBooks);
    return;
  }

  const filtres = allBooks.filter(
    (livre) =>
      livre.titre.toLowerCase().includes(query) ||
      livre.contenu.toLowerCase().includes(query)
  );

  afficherLivres(filtres, query);
});

// Ajouter livre
addBookBtn.addEventListener("click", async () => {
  const ok = await window.electronAPI.addBook();
  if (ok) chargerLivres();
});

// Charger au démarrage
chargerLivres();
