export const CONTRACTS = ['CDI','CDD','Alternance','Stage','Freelance','Temps partiel'];
export const DEGREES = ['Sans diplôme','CAP / BEP','Bac','Bac +2 (BTS / DUT)','Bac +3 (Licence)','Bac +5 (Master / Ingénieur)','Doctorat'];
export const LEVELS = ['A1 — Débutant','A2 — Élémentaire','B1 — Intermédiaire','B2 — Avancé','C1 — Autonome','C2 — Maîtrise','Langue maternelle'];
export const LANGUAGES = ['Français','Anglais','Espagnol','Allemand','Italien','Arabe','Portugais','Chinois','Autre'];
export const WORK_MODES = [{value:'onsite', label:'Sur site'},{value:'hybrid', label:'Hybride'},{value:'remote', label:'Télétravail total'}];
export const AVAILABILITY = [{value:'immediate',label:'Immédiate'},{value:'within1Month',label:'Sous 1 mois'},{value:'within3Months',label:'Sous 3 mois'}];
export const RESPONSE_TIMES = [{value:'under1Hour',label:"Moins d’1 h"},{value:'within24Hours',label:'Sous 24 h'},{value:'within48Hours',label:'Sous 48 h'}];
export const SKILL_GROUPS = [
  {name:'Frontend', icon:'web', items:['React.js','Next.js','TypeScript','Vue.js','JavaScript ES6+','HTML / CSS','Tailwind CSS','Redux','Accessibilité web']},
  {name:'Backend', icon:'dns', items:['Node.js','Express.js','API REST','Socket.IO','NestJS','Python / Django','PHP / Laravel','Java / Spring','JWT / bcrypt']},
  {name:'Bases de données', icon:'database', items:['MongoDB','Mongoose','PostgreSQL','MySQL','Redis','SQL','Modélisation de données']},
  {name:'Réseau & Infra', icon:'lan', items:['Docker','Kubernetes','Linux','Nginx','AWS','CI/CD','TCP/IP','Cybersécurité','Supervision']},
  {name:'Outils', icon:'handyman', items:['Git / GitHub','Figma','Jira','Postman','Tests unitaires','Méthode Agile']},
];
export const workLabel = val => WORK_MODES.find(v=>v.value===val)?.label || '—';
export const availabilityLabel = val => AVAILABILITY.find(v=>v.value===val)?.label || '—';
export const responseLabel = val => RESPONSE_TIMES.find(v=>v.value===val)?.label || '—';
