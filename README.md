🎯 Job Match — ATS personnalisé inversé

    Job Match est un outil de matching professionnel : au lieu qu'un candidat postule à une offre, c'est l'offre qui vient se mesurer au profil. Un recruteur colle son offre (ou swipe ses critères) et obtient en quelques secondes un score de compatibilité justifié, calculé par IA.

Le point de départ est simple : un profil (compétences, sections, niveaux, preuves concrètes) vit dans un Google Sheets. Les recruteurs viennent le confronter à leurs offres, sans compte, sans friction.
✨ Comment ça marche

Deux parcours, un même moteur d'analyse :
Mode	Parcours utilisateur
⚡ Mode Rapide	Le recruteur colle le texte de l'offre (ou décrit ses exigences). L'IA extrait les critères, les classe (exigences / souhaits) et les évalue contre le profil.
🎡 Mode Fun (Swipe & Match)	Parcours ludique type Tinder : swipe des domaines (❤️ = ça compte / ✕ = pas nécessaire), niveau attendu, compétences requises par domaine, écran de validation, puis analyse.

Dans les deux cas, le recruteur obtient :

    un score de compatibilité (0–100) avec un message par palier (« 🔥 C'est un match ! », « 👀 Très intéressant… », …) ;
    une justification rédigée par l'IA, qui explique en quoi le profil répond à ses besoins (les écarts sont assumés et explicites) ;
    en option, un récapitulatif détaillé par email (tableau compétences/niveaux : ✅ acquis · 🔶 partiel · ❌ non acquis) — l'adresse email n'est jamais conservée (RGPD).

Côté propriétaire, chaque analyse déclenche :

    une notification (lead : entreprise, offre, score, date) ;
    une journalisation dans Stats_Competences → tableau de bord des compétences les plus demandées par le marché (aide à la décision de formation) ;
    la collecte des suggestions de compétences des recruteurs (classées par l'IA : synonyme / sous-entendue / nouvelle).

L'interface est responsive (mobile-first, confortable sur ordinateur) et s'affiche en français par défaut, automatiquement en anglais si la langue du dispositif n'est pas le français.
🏗️ Architecture

mermaid

flowchart LR
    
    A[Recruteur] -->|colle l'offre ou swipe ses critères| B[Glide<br/>interface]
    
    B -->|écrit une ligne «En attente»| C[Google Sheets<br/>Demandes]
    
    C -->|déclencheur toutes les 1 min| D[Apps Script<br/>orchestrateur]
    
    D -->|lit le profil| E[Google Sheets<br/>Profil]
    
    D -->|construit le prompt| F[Gemini API]
    
    F -->|score + justification| D
    
    D -->|écrit le résultat| C
    
    C -->|affiche le résultat| B
    
    D -->|email récapitulatif| G[Recruteur]
    
    D -->|journalise l'analyse| H[Stats_Competences]

Le flux en une ligne : le recruteur remplit Glide → une ligne « En attente » apparaît dans Demandes → Apps Script récupère les lignes en attente + le profil → envoie le tout à Gemini → écrit % Match, Justification, Statut → Glide recharge et affiche, puis un email part (facultatif) et l'analyse est journalisée.

Les onglets du Sheets :

    Profil : compétences du candidat (intitulé, section, niveau, preuve/contexte) — source de vérité ;
    Carroussel : configuration du mode Fun (sections, compétences, niveau de maîtrise, preuve) ;
    Demandes : file d'attente + résultats (une ligne = un recruteur : mode, offre/carrousel, statut, % match, justification, erreur, email) ;
    Soumissions_Competences : suggestions des recruteurs et décision de l'IA ;
    Stats_Competences : journal d'analyse (date, entreprise, compétence identifiée).

Les briques :

    Glide — l'interface (accès anonyme, deux modes, résultat, suggestions).
    Google Sheets — la base de données (voir onglets ci-dessus).
    Apps Script — l'orchestration : déclencheur périodique, construction du contexte profil, appel unique à l'IA (les deux modes partagent la même fonction), écriture des résultats, envoi du mail, purge de l'email.
    Gemini API — l'analyse (plan gratuit).
    Gemini API — l'analyse (plan gratuit).

📁 Structure du dépôt (proposée)

text

job-match/

├── apps-script/           # Code Google Apps Script (backend)                                                        
│   ├── Code.gs            #   traiterNouvellesDemandes(), interrogerGemini(), …                                               
│   └── appsscript.json    #   manifest (déclencheur, permissions)                                         
├── docs/                                                                                    
│   ├── mapping-produit.md #   User Story Mapping (épics, US, tâches)                                              
│   ├── prompt-ia.md       #   Prompt système (contrat JSON)                                              
│   └── screenshots/                                              
│       └── mail-recap.png #   Exemple d'email récapitulatif                                              
├── demo/                                              
│   └── index.html         #   Maquette de démo (parcours complet, données simulées)                                              
└── README.md

🚀 Mise en route
1. Le Google Sheets

Crée le classeur avec les onglets Profil, Carroussel, Demandes, Soumissions_Competences, Stats_Competences (voir le schéma de données dans docs/ et le mapping produit).
2. Le backend (Apps Script)

    Ouvre Extensions → Apps Script depuis le classeur.
    Colle Code.gs (dans apps-script/).
    Renseigne la clé API :
        soit dans Propriétés du script → Propriétés du projet (GEMINI_API_KEY) — recommandé ;
        soit dans la constante GEMINI_API_KEY du fichier (⚠️ à ne jamais committer si le repo devient public).
    Exécute une fois configurerDeclencheur() pour installer le polling (Glide écrit via l'API : l'onEdit ne se déclenche pas tout seul).
    Teste avec testerGemini() (lecture des logs).

3. L'interface (Glide)

Le prompt de construction de l'application est dans docs/ (prompt IA Glide, en anglais, avec la palette, les 7 écrans et les règles d'écriture dans les Sheets).
🗺️ État d'avancement
Brique	État
Backend (Sheets → Gemini → résultats + email + stats + suggestions)	✅ Opérationnel et testé
Prompt IA unique (les deux modes, contrat JSON score / justification / competences_identifiees)	✅
Interface Glide (accueil, 2 modes, résultat, suggestions)	✅ Livrée — Sprint 6 terminé
Maquette de démo (demo/index.html)	✅ (parcours complet, données simulées)

Le détail complet (épics, user stories, tâches) est dans docs/mapping-produit.md.
🔐 Données personnelles (RGPD)

    Aucun compte : le recruteur ne fournit que le nom de son entreprise.
    L'email du recruteur n'est demandé qu'en option (pour recevoir le récapitulatif) et est effacé de la feuille immédiatement après l'envoi. Il n'est jamais stocké.
    Les données conservées : profil du candidat, résultats d'analyse (date, entreprise, score, justification), suggestions de compétences.

🛠️ Technologies

Glide (no-code) · Google Sheets · Google Apps Script · Gemini API : aucun serveur, coût d'exploitation nul (plans gratuits).

Projet portfolio, approche « code d'abord, interface ensuite » : back-end testé avant l'UI. Projet livré dans son intégralité (Sprints 1 à 6).
