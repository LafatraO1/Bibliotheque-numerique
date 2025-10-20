const resultsDiv = document.getElementById("results");
const addBookBtn = document.getElementById("addBook");
const searchInput = document.getElementById("searchInput");

// Créer la zone de pagination une seule fois
let paginationDiv = document.querySelector(".pagination");
if (!paginationDiv) {
  paginationDiv = document.createElement("div");
  paginationDiv.className = "pagination flex justify-center gap-2 mt-6";
  resultsDiv.after(paginationDiv);
}

let allBooks = [];
let currentPage = 1;
const livresParPage = 10;

// === Charger les livres ===
async function chargerLivres() {
  allBooks = await window.electronAPI.getBooks();
  afficherLivres(allBooks);
}

// === Highlight ===
function highlightText(texte, mot) {
  if (!mot) return texte;
  const regex = new RegExp(`(${mot})`, "gi");
  return texte.replace(regex, `<mark class="bg-yellow-300 text-black">$1</mark>`);
}

// === Total des livres ===
function mettreAJourTotalLivres() {
  const totalElement = document.getElementById("totalLivres");
  const total = allBooks.length;
  if (totalElement) {
    totalElement.innerHTML = `
      <div class="text-center mt-4 text-lg font-semibold text-gray-800 bg-blue-100 inline-block px-4 py-2 rounded-full shadow-sm">
        📚 Total livres : ${total}
      </div>
    `;
  }
}

// === Affichage principal ===
function afficherLivres(livres, query = "") {
  resultsDiv.innerHTML = "";

  if (livres.length === 0) {
    resultsDiv.innerHTML = "<p class='text-gray-600 text-center'>Aucun livre trouvé.</p>";
    paginationDiv.innerHTML = "";
    mettreAJourTotalLivres();
    return;
  }

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
    div.className =
      "livre border p-4 rounded-2xl shadow-md bg-white hover:shadow-lg transition-all duration-200 mb-4";
    div.innerHTML = `
      <h3 class="font-semibold text-lg text-gray-800">${titreAffiche}</h3>
      ${extrait ? `<p class="text-gray-500 text-sm italic mt-1">${extrait}...</p>` : ""}
      <div class="flex gap-3 mt-3">
        <button class="openBtn bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-1.5 rounded-full shadow transition-all flex-1" data-file="${livre.fichier}">📖 Ouvrir</button>
        <button class="downloadBtn bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-1.5 rounded-full shadow transition-all flex-1" data-id="${livre.id_d}" data-file="${livre.fichier}">⬇️ Télécharger</button>
        <button class="deleteBtn bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-1.5 rounded-full shadow transition-all flex-1" data-file="${livre.fichier}">🗑️ Supprimer</button>
      </div>
    `;

    // === Boutons ===
    div.querySelector(".openBtn").addEventListener("click", async (e) => {
      const file = e.target.getAttribute("data-file");
      await window.electronAPI.openBook(file);
    });

    div.querySelector(".downloadBtn").addEventListener("click", async (e) => {
      const id_d = e.target.getAttribute("data-id");
      const fichier = e.target.getAttribute("data-file");
      const res = await window.electronAPI.downloadDocument({ id_d, fichier });

      if (res.success) {
        new Notification("Téléchargement réussi ✅", { body: res.message });
      } else if (!res.canceled && res.message) {
        new Notification("Erreur ⚠️", { body: res.message });
      }
    });

    div.querySelector(".deleteBtn").addEventListener("click", async (e) => {
      const file = e.target.getAttribute("data-file");
      if (!confirm("Supprimer ce livre ?")) return;
      const ok = await window.electronAPI.deleteBook(file);
      if (ok) chargerLivres();
    });

    resultsDiv.appendChild(div);
  });

  mettreAJourTotalLivres();
  afficherPagination(livres, totalPages, query);
}
// Paginage
function afficherPagination(livres, totalPages, query) {
  paginationDiv.innerHTML = "";
  if (totalPages <= 1) return;

  //  Centrage + style de base
  paginationDiv.style.display = "flex";
  paginationDiv.style.justifyContent = "center";
  paginationDiv.style.alignItems = "center";
  paginationDiv.style.flexWrap = "wrap";
  paginationDiv.style.gap = "8px";
  paginationDiv.style.marginTop = "35px";

  const maxVisible = 6;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  //  Style global bouton
  const baseBtn =
    "px-3 py-2 text-sm font-semibold border rounded-lg shadow-sm transition-all duration-200";

  //  Bouton « ≪ » (First)
  const firstBtn = document.createElement("button");
  firstBtn.innerHTML = "≪";
  firstBtn.className = `${baseBtn} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`;
  if (currentPage > 1) {
    firstBtn.onclick = () => {
      currentPage = 1;
      afficherLivres(livres, query);
    };
  } else {
    firstBtn.classList.add("opacity-40", "cursor-not-allowed");
  }
  paginationDiv.appendChild(firstBtn);

  //  Numéros de pages
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.innerText = i;

    if (i === currentPage) {
      //  Page active
      btn.className = `${baseBtn} text-white font-bold shadow-md scale-105`;
      btn.style.background = "linear-gradient(135deg, #00c853, #009688)";
      btn.style.border = "none";
    } else {
      btn.className = `${baseBtn} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`;
      btn.onclick = () => {
        currentPage = i;
        afficherLivres(livres, query);
      };
    }

    paginationDiv.appendChild(btn);
  }

  
  //  Bouton « ≫ »
  const lastBtn = document.createElement("button");
  lastBtn.innerHTML = "≫";
  lastBtn.className = `${baseBtn} border-gray-300 bg-white text-gray-700 hover:bg-gray-100`;
  if (currentPage < totalPages) {
    lastBtn.onclick = () => {
      currentPage = totalPages;
      afficherLivres(livres, query);
    };
  } else {
    lastBtn.classList.add("opacity-40", "cursor-not-allowed");
  }
  paginationDiv.appendChild(lastBtn);
}

// === Recherche ===
searchInput.addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  currentPage = 1;

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

// === Ajouter un livre ===
addBookBtn.addEventListener("click", async () => {
  const ok = await window.electronAPI.addBook();
  if (ok) chargerLivres();
});

// === Charger au démarrage ===
chargerLivres();
