

export function JobPosting() {
  return (
    <div className="central-container">
      <form className="central-container" method="post">
        <label className="form-para">titre de l'annonce</label>
        <input type="text" name="title" className="input-text"></input>
        <label className="form-para">type de contrat</label>
        <select name="regime">
          <option>CDD</option>
          <option>Stage</option>
          <option>CDI</option>
          <option>Freelance</option>
        </select>
        <label className="form-para">Régime de travail</label>
        <select name="regime">
          <option>Distanciel</option>
          <option>sur place</option>
          <option>hybride</option>
        </select>
        <label className="form-para">description de l'emploi</label>
        <textarea name="description" className="input-text"></textarea>
        <label className="form-para">Ville de l'emploi</label>
        <input type="text" name="city"></input>
        <label className="form-para">Salaire max</label>
        <input type="number" name="max-salary"></input>
        <label className="form-para">Salaire minimum</label>
        <input type="number" name="min-salary"></input>
        <label className="form-para">Niveau d'étude requis</label>
        <input type="text" name="studies"></input>
        <label className="form-para">compétences requises</label>
        <input type="text" name="studies"></input>
        <input type="submit" className="button-form"></input>
      </form>
    </div>
  )
}
