

export function ModifyProfilePart() {
  return (
    <div className="central-container">
      <form method="post" className="central-container">
        <label className="form-para">nom</label>
          <input type="text" className="input-text" name="name"></input>
          <label className="form-para">prénom</label>
          <input type="text" className="input-text" name="family-name"></input>
        <label className="form-para">adresse mail</label>
        <input type="mail" className="input-text"></input>
        <label className="form-para">téléphone</label>
          <input type="tel" className="input-text"></input>
          <label className="form-para">compétences (minimum 1)</label>
          <input className="input-text" name="competences" type="text"></input>
        <label className="form-para">site web</label>
        <input className="input-text" name="website" type="text"></input>
        <label className="formation">formations</label>
        <input type="text" className="input-text" name="formation"></input>
        <label className="form-para">CV</label>
        <input type="file"></input>
        <input type="submit" className="button-form"></input>
        </form>
    </div>
  )
}
