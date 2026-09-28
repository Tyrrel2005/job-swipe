


function Connection() {
  return (
    <div>
      <h2 className="secondary-title">connectez vous</h2>
      <div className="central-container">
        <form method="post">
          <div className="central-container">
            <label className="form-para">email</label>
            <input type="mail" className="input-text" name="email"></input>
            <label className="form-para">mot de passe</label>
            <input type="password" className="input-text" name="password"></input>
            <input type="submit" className="button-form"></input>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Connection
