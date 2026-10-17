export const idOf = val => typeof val === 'object' && val !== null ? String(val._id || val.id || '') : String(val || '');
export function fullName(profile) { return [profile?.firstName,profile?.lastName].filter(Boolean).join(' ') || 'Candidat'; }
export function initials(text = '') { return String(text).trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('') || 'JS'; }
export function money(val) { return Number(val) > 0 ? `${new Intl.NumberFormat('fr-FR').format(Number(val))} €` : 'Non communiqué'; }
export function salaryRange(obj) {
  const min = Number(obj?.salaryMin || 0), max = Number(obj?.salaryMax || 0);
  if (!min && !max) return 'Salaire non communiqué';
  if (!max) return `Dès ${money(min)}`;
  if (!min) return `Jusqu’à ${money(max)}`;
  return `${money(min)} – ${money(max)}`;
}
export function timeAgo(date) {
  if (!date) return '';
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `il y a ${Math.max(1,Math.floor(seconds/60))} min`;
  if (seconds < 86400) return `il y a ${Math.floor(seconds/3600)} h`;
  return `il y a ${Math.floor(seconds/86400)} j`;
}
export const isMatchAccepted = m => m?.status === 'accepted';
export const companyOf = (offer, recruiter) => offer?.companyName || recruiter?.recruiterProfile?.companyName || offer?.recruiterId?.recruiterProfile?.companyName || 'Entreprise';
