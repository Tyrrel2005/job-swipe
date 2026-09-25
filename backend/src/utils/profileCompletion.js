const candidateCompletionFields = [
  'firstName',
  'lastName',
  'title',
  'location',
  'experience',
  'availability',
  'workMode',
  'desiredContractTypes',
  'salaryMin',
  'salaryMax',
  'skills',
  'languages',
  'degree',
  'diploma',
  'school',
  'graduationYear',
  'bio',
  'cvUrl',
];

const recruiterCompletionFields = [
  'companyName',
  'companySector',
  'companySize',
  'companyCity',
  'recruiterName',
  'recruiterPosition',
  'responseTime',
];

function isCompletedField(field, value) {
  if (Array.isArray(value)) {
    return field === 'skills' ? value.length >= 3 : value.length > 0;
  }

  if (typeof value === 'number') {
    return value > 0;
  }

  return value !== null && value !== undefined && String(value).trim().length > 0;
}

function calculateCompletion(profile, role) {
  const fields = role === 'candidate' ? candidateCompletionFields : recruiterCompletionFields;
  const completed = fields.filter((field) => isCompletedField(field, profile?.[field])).length;

  return Math.round((completed / fields.length) * 100);
}

module.exports = { calculateCompletion };