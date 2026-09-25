const degreeRanks = {
  'Sans diplôme': 0,
  'CAP / BEP': 1,
  Bac: 2,
  'Bac +2 (BTS / DUT)': 3,
  'Bac +3 (Licence)': 4,
  'Bac +5 (Master / Ingénieur)': 5,
  Doctorat: 6,
};

const experienceRanks = {
  "Moins d'1 an": 0,
  '1 à 3 ans': 2,
  '3 à 6 ans': 4,
  'Plus de 6 ans': 7,
};

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function ratio(matched, total) {
  return total === 0 ? 1 : matched / total;
}

function calculateMatchingScore(profile = {}, offer = {}) {
  const candidateSkills = new Set((profile.skills || []).map(normalize));
  const requiredSkills = offer.requiredSkills || [];
  const matchingSkills = requiredSkills.filter((skill) => candidateSkills.has(normalize(skill)));
  const skills = ratio(matchingSkills.length, requiredSkills.length);

  const contract = (profile.desiredContractTypes || []).some(
    (type) => normalize(type) === normalize(offer.contractType)
  ) ? 1 : 0;

  const location = normalize(profile.location);
  const city = normalize(offer.city);
  const locationMatch = city && location && (location.includes(city) || city.includes(location));
  const remoteMatch = normalize(profile.workMode) === normalize(offer.remoteMode);
  const locationAndMode = locationMatch || remoteMatch ? 1 : 0;

  const candidateLanguages = new Map(
    (profile.languages || []).map((language) => [normalize(language.name), normalize(language.level)])
  );
  const matchingLanguages = (offer.requiredLanguages || []).filter((language) => {
    const candidateLevel = candidateLanguages.get(normalize(language.name));
    return candidateLevel && candidateLevel === normalize(language.level);
  });
  const languages = ratio(matchingLanguages.length, (offer.requiredLanguages || []).length);

  const experience = profile.experience ? 1 : 0;
  const candidateDegree = degreeRanks[profile.degree] ?? 0;
  const requiredDegree = degreeRanks[offer.minimumDegree] ?? 0;
  const degree = !offer.minimumDegree || candidateDegree >= requiredDegree ? 1 : 0;

  const breakdown = {
    skills: Math.round(skills * 40),
    locationAndMode: Math.round(locationAndMode * 20),
    contract: Math.round(contract * 15),
    languages: Math.round(languages * 10),
    experience: Math.round(experience * 10),
    degree: Math.round(degree * 5),
  };

  return {
    score: Object.values(breakdown).reduce((total, points) => total + points, 0),
    breakdown,
    matchingSkills,
  };
}

module.exports = { calculateMatchingScore };