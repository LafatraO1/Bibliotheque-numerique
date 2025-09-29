import * as pdfjsLib from "pdfjs-dist";

async function extraireTextePDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let texteComplet = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    texteComplet += strings.join(" ") + "\n";
  }

  return texteComplet.toLowerCase(); // ho an’ny recherche
}

async function ajouterLivre() {
  const titre = document.getElementById("titre").value.trim();
  const auteur = document.getElementById("auteur").value.trim();
  const fichier = document.getElementById("fichier").files[0];

  if (!titre || !auteur || !fichier) {
    alert("⚠️ Ampidiro ny titre, auteur ary PDF !");
    return;
  }

  // Vakiana ny contenu PDF
  const contenuPDF = await extraireTextePDF(fichier);

  // Avadika ho URL ilay fichier PDF
  const pdfURL = URL.createObjectURL(fichier);

  livres.push({ titre, auteur, pdf: pdfURL, contenu: contenuPDF });
  afficherLivres();

  document.getElementById("titre").value = "";
  document.getElementById("auteur").value = "";
  document.getElementById("fichier").value = "";
}
