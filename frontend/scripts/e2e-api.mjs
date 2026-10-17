/** Smoke test end-to-end du contrat API, avec MongoDB et backend démarrés.
 *  Usage : node scripts/e2e-api.mjs
 *  Ne jamais lancer contre une base de production : crée de vraies données.
 */
import assert from 'node:assert/strict';
const BASE = (process.env.JOBSWIPE_API_URL || 'http://localhost:3000/api').replace(/\/$/,'');
const stamp = `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
async function req(path, method='GET', data, jwt) {
  const headers = {};
  if(jwt) headers.Authorization = `Bearer ${jwt}`;
  if(data !== undefined)headers['Content-Type']='application/json';
  const response=await fetch(BASE+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
  const body=await response.json().catch(()=>null);
  if(!response.ok)throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(body)}`);
  return {body,status:response.status};
}
const log=label=>console.log(`✓ ${label}`);
try {
  const health=await fetch(BASE.replace(/\/api$/,'')+'/health');
  assert.equal(health.status,200);log('Serveur accessible');
  const recruiter=(await req('/auth/signup','POST',{email:`recruteur-e2e-${stamp}@example.net`,password:'Passw0rd!E2e',role:'recruiter'})).body;
  const candidate=(await req('/auth/signup','POST',{email:`candidat-e2e-${stamp}@example.net`,password:'Passw0rd!E2e',role:'candidate'})).body;
  assert.ok(recruiter.token&&candidate.token);log('Inscription des deux rôles');
  await req('/profile','PATCH',{companyName:'Entreprise E2E',companyCity:'Limoges',recruiterName:'Service Test',responseTime:'within24Hours'},recruiter.token);
  await req('/profile','PATCH',{firstName:'Camille',lastName:'Test',title:'Développeuse',skills:['React.js','Node.js','MongoDB'],desiredContractTypes:['CDI'],location:'Limoges',workMode:'hybrid'},candidate.token);
  const candidateProfile=(await req('/profile','GET',undefined,candidate.token)).body;
  assert.equal(candidateProfile.user.profile.firstName,'Camille');log('Profils candidat et recruteur persistés');
  const offer=(await req('/jobs','POST',{title:'Développeur E2E',contractType:'CDI',city:'Limoges',remoteMode:'hybrid',salaryMin:40000,salaryMax:50000,requiredSkills:['React.js','Node.js'],requiredLanguages:[{name:'Français',level:'C1 — Autonome'}],description:'Offre créée par un test automatique.'},recruiter.token)).body.jobOffer;
  assert.ok(offer._id);log('Création offre');
  const jobs=(await req('/jobs','GET',undefined,candidate.token)).body.jobOffers;
  const found=jobs.find(j=>j._id===offer._id);
  assert.ok(found);assert.equal(found.companyName,'Entreprise E2E');log('Offre publiée visible + nom entreprise');
  const match=(await req(`/matches/offers/${offer._id}`,'POST',undefined,candidate.token)).body.match;
  assert.equal(match.status,'pending');log('Candidat manifeste intérêt');
  const review=(await req('/matches','GET',undefined,recruiter.token)).body.matches;
  assert.ok(review.some(m=>m._id===match._id));log('Recruteur consulte la file de candidatures');
  const decision=(await req(`/matches/${match._id}/status`,'PATCH',{status:'accepted'},recruiter.token)).body;
  assert.equal(decision.match.status,'accepted');assert.ok(decision.conversation?._id);log('Acceptation et création automatique de conversation');
  const conversation=(await req(`/conversations/matches/${match._id}`,'POST',undefined,candidate.token)).body.conversation;
  assert.equal(conversation._id,decision.conversation._id);
  const message=(await req(`/conversations/${conversation._id}/messages`,'POST',{content:'Bonjour, message de test E2E.'},candidate.token)).body.data;
  assert.ok(message._id);const received=(await req(`/conversations/${conversation._id}/messages`,'GET',undefined,recruiter.token)).body.messages;
  assert.ok(received.some(m=>m._id===message._id));log('Messagerie HTTP et permissions du match');
  const notifications=(await req('/notifications','GET',undefined,recruiter.token)).body.notifications;
  assert.ok(notifications.length>0);log('Notifications du recruteur');
  console.log('\nSUCCÈS : parcours HTTP complet validé. Socket.IO et rendu React nécessitent leur test navigateur distinct.');
} catch(error){console.error('\nÉCHEC TEST E2E :',error.message);process.exitCode=1;}
