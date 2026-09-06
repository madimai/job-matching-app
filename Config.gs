// =========================================================================
// CONFIGURATION & VARIABLES GLOBALES
// =========================================================================
const GEMINI_API_KEY = 'VOTRE_CLE_API_ICI'; 
const GEMINI_MODEL = 'gemini-3.6-flash'; 

const SHEET_DEMANDES = 'Demandes';
const SHEET_PROFIL = 'Profil';
const SHEET_STATS = 'Stats_Competences'; 

const MON_EMAIL_BCC = 'monmail@mail.com';
const MON_EMAIL_CONTACT = 'monmail@mail.com';
const MON_LINKEDIN = 'https://www.linkedin.com/in/votre-profil';
const MON_PORTFOLIO = 'https://votre-portfolio.com';

// Le superviseur lié au déclencheur Apps Script
function onGlideChange() {
  traiterNouvellesDemandes();
  evaluerSoumissionsCompetences();
}
