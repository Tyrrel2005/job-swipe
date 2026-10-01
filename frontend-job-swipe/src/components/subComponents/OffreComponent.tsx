

export function OffreComponent({OFFRE}) {
  return (
    <div className="swipe-container">
      <h1 className="offre-title">{OFFRE.title} </h1>
      <p className="offre-para">{OFFRE.remoteMode} </p>
      <p className="offre-para">{OFFRE.city}</p>
      <p className="petit-para-offre">
        {OFFRE.description}
      </p>
      <p className="offre-para"> SALAIRE MIN: {OFFRE.salaryMin} SALAIRE MAX: {OFFRE.salaryMax}</p>
      <p className="offre-para">{OFFRE.minimumDegree}</p>
    </div>
  )
}
