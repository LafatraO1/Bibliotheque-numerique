document.addEventListener("DOMContentLoaded", async () => {
  const listDiv = document.getElementById("categoryList");
  const addBtn = document.getElementById("addBtn");
  const retourBtn = document.getElementById("retourBtn");
  const newCategoryInput = document.getElementById("newCategory");

  // Charger toutes les catégories
  async function chargerCategories() {
    const categories = await window.electronAPI.getCategories();
    afficher(categories);
  }

  // Affichage
  function afficher(categories) {
    listDiv.innerHTML = "";
    if (categories.length === 0) {
      listDiv.innerHTML = "<p>Aucune catégorie trouvée.</p>";
      return;
    }

    categories.forEach(c => {
      const div = document.createElement("div");
      div.className = "categorie";
      div.innerHTML = `
        <span>${c.nom}</span>
        <button class="deleteBtn" data-nom="${c.nom}">🗑️ Supprimer</button>
      `;
      div.querySelector(".deleteBtn").addEventListener("click", async (e) => {
        const nom = e.target.getAttribute("data-nom");
        const confirmDelete = confirm(`Supprimer la catégorie "${nom}" ?`);
        if (!confirmDelete) return;
        await window.electronAPI.deleteCategory(nom);
        chargerCategories();
      });
      listDiv.appendChild(div);
    });
  }

  // Ajouter une catégorie
  addBtn.addEventListener("click", async () => {
    const nom = newCategoryInput.value.trim();
    if (!nom) return alert("Veuillez entrer un nom de catégorie !");
    await window.electronAPI.addCategory({ nom });
    newCategoryInput.value = "";
    chargerCategories();
  });

  // Bouton retour → vers index.html
  retourBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Charger au démarrage
  chargerCategories();
});
