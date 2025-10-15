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

  // Affichage des catégories
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

  //  Ajouter une catégorie
  addBtn.addEventListener("click", async () => {
  const nom = newCategoryInput.value.trim();
  console.log("🔹 Bouton Ajouter cliqué :", nom);

  if (!nom) {
    alert("Veuillez entrer un nom de catégorie !");
    return;
  }

  const cat = { nom }; // ➕ Izay no manamboatra ilay olana "cat is not defined"

  try {
    const result = await window.electronAPI.addCategory(cat);
    console.log("Réponse main.js :", result);

    if (result.success) {
      alert("Catégorie ajoutée !");
      newCategoryInput.value = "";
      chargerCategories(); // Mamerina mijery ny liste
    } else {
      alert(result.message || "Erreur lors de l'ajout de la catégorie !");
    }
  } catch (err) {
    console.error("Erreur :", err);
    alert("Erreur lors de l'ajout de la catégorie !");
  }
});


  // Bouton retour
  retourBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Charger les catégories au démarrage
  chargerCategories();
});

// Supprimer
async function afficherCategories() {
  const categories = await window.electronAPI.getCategories();
  const list = document.getElementById("categoriesList");
  list.innerHTML = "";

  if (categories.length === 0) {
    list.textContent = "Aucune catégorie trouvée.";
    return;
  }

  categories.forEach(cat => {
    const div = document.createElement("div");
    div.textContent = cat.nom;

    const btnSupprimer = document.createElement("button");
    btnSupprimer.textContent = "Supprimer";
    btnSupprimer.classList.add("btn-supprimer");

    btnSupprimer.addEventListener("click", async () => {
      if (confirm(`Supprimer la catégorie "${cat.nom}" ?`)) {
        const result = await window.electronAPI.deleteCategory(cat.nom);
        if (result.success) {
          alert("Catégorie supprimée !");
          afficherCategories(); 
        } else {
          alert("Erreur lors de la suppression !");
        }
      }
    });

    div.appendChild(btnSupprimer);
    list.appendChild(div);
  });
}

