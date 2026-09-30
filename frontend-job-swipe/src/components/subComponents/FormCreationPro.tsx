
function FormCreationPro() {
  return (
    <div className="central-container">
      <form method="post" className="central-container">
        <label className="form-para">nom de l'entreprise</label>
        <input type="text" className="input-text" name="name"></input>
        <label className="form-para">adresse mail</label>
        <input type="mail" className="input-text" name="mail"></input>
        <label className="form-para">téléphone</label>
        <input type="tel" className="input-text" name="tel"></input>
        <label className="form-para">site web</label>
        <input className="input-text" name="website" type="text"></input>
        <label className="form-para">mot de passe</label>
        <input className="input-text" name="password" type="password"></input>
        <label className="form-para">confirmez mot de passe</label>
        <input className="input-text" name="passwordC" type="password"></input>

        <input type="submit" className="button-form"></input>
        </form>
    </div>
  )
}

export default FormCreationPro
