// =========================================================================
// GESTION DES NOUVELLES COMPÉTENCES PROPOSÉES
// =========================================================================
function evaluerSoumissionsCompetences() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetSoumissions = ss.getSheetByName('Soumissions_Competences');
  const sheetProfil = ss.getSheetByName(SHEET_PROFIL);
  const sheetCarrousel = ss.getSheetByName('Carroussel'); 
  
  if (!sheetSoumissions || !sheetProfil || !sheetCarrousel) return;
  
  const dataProfil = sheetProfil.getDataRange().getValues();
  let profilTexte = "PROFIL ACTUEL :\n";
  for (let i = 1; i < dataProfil.length; i++) {
    if (dataProfil[i][1]) {
      profilTexte += `- ${dataProfil[i][1]} (Section: ${dataProfil[i][2]})\n`;
    }
  }

  const dataSoumissions = sheetSoumissions.getDataRange().getValues();
  
  for (let i = 1; i < dataSoumissions.length; i++) {
    const row = dataSoumissions[i];
    const competence = row[3];
    const statut = row[4];
    
    if (statut !== "Traité" && competence !== "") {
      const rowIndex = i + 1;
      
      try {
        console.log("➡️ Analyse de la nouvelle compétence : " + competence);
        const analyse = analyserNouvelleCompetenceGemini(profilTexte, competence);
        let actionMessage = "";
        
        if (analyse.action === "SYNONYME") {
          actionMessage = `Aucun ajout. C'est un synonyme de : ${analyse.cible}.`;
        } else if (analyse.action === "SOUS_ENTENDU") {
          const newId = "SK-AUTO-" + new Date().getTime().toString().slice(-4);
          sheetProfil.appendRow([newId, competence, "Compétence déduite", "Confirmé", analyse.justification]);
          actionMessage = `Ajouté au Profil. Déduit car : ${analyse.justification}`;
        } else if (analyse.action === "NOUVEAU") {
          const newIdCA = "CA-AUTO-" + new Date().getTime().toString().slice(-4);
          sheetCarrousel.appendRow([newIdCA, "Autre", "9", competence, "Non maîtrisé", "❌ " + analyse.justification]);
          actionMessage = `Ajouté au Carroussel comme "Non maîtrisé".`;
        }
        
        sheetSoumissions.getRange(rowIndex, 5).setValue("Traité");
        sheetSoumissions.getRange(rowIndex, 6).setValue(analyse.action);
        sheetSoumissions.getRange(rowIndex, 7).setValue(actionMessage);
        
      } catch (e) {
        console.error("❌ Erreur Soumission : " + e.toString());
        sheetSoumissions.getRange(rowIndex, 5).setValue("Erreur");
        sheetSoumissions.getRange(rowIndex, 7).setValue(e.toString());
      }
    }
  }
}

function analyserNouvelleCompetenceGemini(profilContext, nouvelleCompetence) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINS_API_KEY}`;
  
  const systemInstruction = `Tu es un gestionnaire de base de données de compétences RH. Un recruteur suggère une nouvelle compétence. Compare-la au PROFIL ACTUEL.
  Réponds UNIQUEMENT en JSON strict :
  - "action": "SYNONYME", "SOUS_ENTENDU", ou "NOUVEAU".
  - "cible": nom de la compétence existante si SYNONYME, sinon vide.
  - "justification": explication courte.`;

  const userPrompt = `${profilContext}\n\nNOUVELLE COMPÉTENCE PROPOSÉE :\n${nouvelleCompetence}`;

  const payload = {
    "system_instruction": { "parts": { "text": systemInstruction } },
    "contents": [{ "parts": { "text": userPrompt } }],
    "generationConfig": { "response_mime_type": "application/json" }
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload),
    "muteHttpExceptions": true
  };

  const response = UrlFetchApp.fetch(url, options);
  const texteReponse = JSON.parse(response.getContentText()).candidates[0].content.parts[0].text;
  return JSON.parse(texteReponse);
}
