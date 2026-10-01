

export function JobPosting() {
  return (
    <div className="central-container">
      <form className="central-container" method="post">
        <label className="form-para">titre de l'annonce</label>
        <input type="text" name="title" className="input-text"></input>
        <label className="form-para">description de l'emploi</label>
        <textarea name="description" className="input-text"></textarea>
        <input type="submit" className="button-form"></input>
      </form>
    </div>
  )
}
