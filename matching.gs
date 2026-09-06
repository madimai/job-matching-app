// =========================================================================
// GESTION DES DEMANDES DE MATCHING
// =========================================================================
function traiterNouvellesDemandes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetDemandes = ss.getSheetByName(SHEET_DEMANDES);
  const sheetProfil = ss.getSheetByName(SHEET_PROFIL);
  const sheetStats = ss.getSheetByName(SHEET_STATS);
  
  if (!sheetDemandes || !sheetProfil) return;
  
  const dataDemandes = sheetDemandes.getDataRange().getValues();
  const headers = dataDemandes[0].map(h => h.toString().toLowerCase().trim());
  const getIndex = (nom) => headers.indexOf(nom.toLowerCase());
  
  const idxDate = getIndex('date');
  const idxOffre = getIndex('offre');
  const idxCarrousel = headers.includes('carroussel') ? getIndex('carrousel') : getIndex('carrousel');
  const idxStatut = getIndex('statut');
  const idxMatch = getIndex('% match');
  const idxJustification = getIndex('justification');
  const idxErreur = getIndex('erreur');
  const idxEntreprise = getIndex('entreprise');
  const idxEmail = getIndex('email');
  const idxConsentement = getIndex('consentement_mail'); 
  
  if (idxStatut === -1 || idxMatch === -1) return;

  const dataProfil = sheetProfil.getDataRange().getValues();
  let profilTexte = "Voici mon profil et mes exigences (avantages/culture) :\n";
  for (let i = 1; i < dataProfil.length; i++) { 
    if (dataProfil[i][1]) { 
      profilTexte += `- ${dataProfil[i][1]} (Niveau/Attente: ${dataProfil[i][3]} | Détail: ${dataProfil[i][4]})\n`;
    }
  }

  let isUpdated = false;

  for (let i = 1; i < dataDemandes.length; i++) {
    const row = dataDemandes[i];
    const offre = idxOffre !== -1 ? row[idxOffre] : "";
    const carrousel = idxCarrousel !== -1 ? row[idxCarrousel] : "";
    const statut = row[idxStatut];
    const entreprise = idxEntreprise !== -1 ? row[idxEntreprise] : "Non précisée";
    const emailRecruteur = idxEmail !== -1 ? row[idxEmail] : "";
    const dateDemande = idxDate !== -1 ? row[idxDate] : new Date();
    
    if (statut !== "Traité" && (offre !== "" || carrousel !== "")) {
      const contenuAAnalyser = offre !== "" ? offre : carrousel;
      const rowIndex = i + 1; 
      
      try {
        console.log(`➡️ Analyse de la ligne ${rowIndex} (Entreprise : ${entreprise})`);
        
        const reponseGemini = interrogerGemini(profilTexte, contenuAAnalyser);
        
        sheetDemandes.getRange(rowIndex, idxStatut + 1).setValue("Traité");
        sheetDemandes.getRange(rowIndex, idxMatch + 1).setValue(reponseGeminte ? reponseGemini.score : 0);
        sheetDemandes.getRange(rowIndex, idxJustification + 1).setValue(reponseGemini.justification);
        if (idxErreur !== -1) sheetDemandes.getRange(rowIndex, idxErreur + 1).setValue(""); 
        
        let lignesTableauHTML = "";
        if (reponseGemini.competences_identifiees && reponseGemini.competences_identifiees.length > 0) {
          reponseGemini.competences_identifiees.forEach(comp => {
            if (sheetStats) sheetStats.appendRow([dateDemande, entreprise, comp.nom]);
            
            let emoji = "❌";
            if (comp.statut === "ACQUIS") emoji = "✅";
            else if (comp.statut === "PARTIEL") emoji = "🔶";
            
            lignesTableauHTML += `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">${comp.nom}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; font-size: 16px;">${emoji}</td>
                <td style="padding: 8px; border: 1px solid #ddd;">${comp.explication}</td>
              </tr>
            `;
          });
        }
        
        let aDonneConsentement = false;
        if (idxConsentement !== -1) {
          const val = row[idxConsentement].toString().toLowerCase().trim();
          if (val === 'true' || val === 'vrai' || val === 'oui') aDonneConsentement = true;
        } else {
          aDonneConsentement = true; 
        }

        if (aDonneConsentement && emailRecruteur && emailRecruteur.includes("@")) {
          const sujetEmail = `Résultat du matching : Votre offre vs Mon profil (${reponseGemini.score}%)`;
          const htmlCorpsEmail = `
            <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.5; font-size: 14px;">
              <p>Bonjour,</p>
              <p>Vous avez souhaité recevoir le résultat de l'application de matching pour l'entreprise <strong>${entreprise}</strong>.</p>
              <p><strong>🎯 Score de compatibilité global :</strong> ${reponseGemini.score}%</p>
              <p><strong>📝 Analyse de l'IA en résumé :</strong><br>${reponseGemini.justification}</p>
              <p><strong>🔍 Détail des compétences et critères repérés dans votre offre :</strong></p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
                <thead>
                  <tr style="background-color: #f2f2f2; text-align: left;">
                    <th style="padding: 8px; border: 1px solid #ddd; width: 30%;">Compétence / Critère</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center; width: 15%;">Statut</th>
                    <th style="padding: 8px; border: 1px solid #ddd; width: 55%;">Explication</th>
                  </tr>
                </thead>
                <tbody>${lignesTableauHTML}</tbody>
              </table>
              <p>Si ce profil correspond à vos attentes, n'hésitez pas à me contacter pour en discuter de vive voix.</p>
              <p>Bonne journée !</p>
              <p style="margin-top: 25px;">
                Mes coordonnées :<br>
                ✉️ Email : <a href="mailto:${MON_EMAIL_CONTACT}">${MON_EMAIL_CONTACT}</a><br>
                💼 LinkedIn : <a href="${MON_LINKEDIN}">Mon profil</a><br>
                🌐 Portfolio : <a href="${MON_PORTFOLIO}">Mon site</a>
              </p>
            </div>
          `;
          
          MailApp.sendEmail({
            to: emailRecruteur,
            bcc: MON_EMAIL_BCC, 
            subject: sujetEmail,
            htmlBody: htmlCorpsEmail
          });
          
          sheetDemandes.getRange(rowIndex, idxEmail + 1).clearContent();
          if (idxConsentement !== -1) sheetDemandes.getRange(rowIndex, idxConsentement + 1).clearContent();
        }
        isUpdated = true;
      } catch (e) {
        console.error(`❌ Erreur ligne ${rowIndex} : ${e.toString()}`);
        sheetDemandes.getRange(rowIndex, idxStatut + 1).setValue("Erreur");
        if (idxErreur !== -1) sheetDemandes.getRange(rowIndex, idxErreur + 1).setValue(e.toString());
      }
    }
  }
  if (isUpdated) SpreadsheetApp.flush();
}

function interrogerGemini(profilContext, offreContext) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  
  const systemInstruction = `Tu es une IA de matching RH, objective, rigoureuse et totalement honnête. Tu évalues le profil d'un candidat par rapport à une offre.
  RÈGLES IMPÉRATIVES DE RÉDACTION :
  1. TON ET STYLE : Parle TOUJOURS à la troisième personne du singulier ("le profil", "ce profil", "le candidat", "la candidate"). N'utilise JAMAIS les mots "tu", "ton", "vous" ou "votre".
  2. HONNÊTETÉ ET OBJECTIVITÉ : Sois intransigeant et parfaitement honnête. Si une compétence majeure ou un critère indispensable manque, le score doit être sévèrement pénalisé et le statut doit être "NON_ACQUIS".
  Tu dois répondre UNIQUEMENT par un objet JSON valide avec ces clés :
  - "score": nombre entier strict entre 0 et 100.
  - "justification": un résumé global rédigé à la 3ème personne (2-3 phrases).
  - "competences_identifiees": tableau d'objets listant chaque critère repéré ("nom", "statut" [ACQUIS/PARTIEL/NON_ACQUIS], "explication").`;

  const userPrompt = `PROFIL À ÉVALUER :\n${profilContext}\n\nL'OFFRE / LA DEMANDE À ANALYSER :\n${offreContext}`;

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
  const responseCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (responseCode !== 200) {
    let messageErreur = `Erreur HTTP ${responseCode}`;
    try { messageErreur += ` : ${JSON.parse(responseText).error.message}`; } 
    catch(e) { messageErreur += ` : ${responseText}`; }
    throw new Error(messageErreur);
  }
  
  const texteReponse = JSON.parse(responseText).candidates[0].content.parts[0].text;
  return JSON.parse(texteReponse);
}
