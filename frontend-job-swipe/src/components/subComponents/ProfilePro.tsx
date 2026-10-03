


export function ProfilePro() {
  let COMPANY = {
    companyName: { type: 'string', example: 'Tech Solutions' },
    companySector: { type: 'string', example: 'Technologie' },
    companySize: { type: 'string', example: '50-100' },
    companyCity: { type: 'string', example: 'Paris' },
    recruiterName: { type: 'string', example: 'Sophie Bernard' },
    recruiterPosition: { type: 'string', example: 'Responsable recrutement' },
    responseTime: { type: 'string', enum: ['under1Hour', 'within24Hours', 'within48Hours'] },
    companyLogoUrl: { type: 'string', example: '/api/profile/company-logo' }
  }
  return (
    <div>
      <p>nom de l'entreprise: {COMPANY.companyName.example}</p>
      <p>secteur: {COMPANY.companySector.example}</p>
      <p>nombre d'employés: {COMPANY.companySize.example}</p>
      <p>ville : {COMPANY.companyCity.example}</p>
      <p>nom du recruteur: {COMPANY.recruiterName.example}</p>
      <p>position du recruteur: {COMPANY.recruiterPosition.example}</p>
      <p>temps moyen de réponse: {COMPANY.responseTime.enum}</p>
    </div>
  )
}
