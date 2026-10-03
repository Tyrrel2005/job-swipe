
export function ProfilePart() {
  let USER = {
    firstName: "test",
    lastName: "test2",
    title: "titre",
    location: "paris",
    experience: "2 ans",
    desiredContractTypes: "CDI",
    bio: "a test canditate",
    skills: ["nodejs", "python", "c#"],
    degree: "MASTER",
    diploma: "computer science",
    school: "PARIS SUD",
    profilePhotoUrl:"hero.png"
  }
  return (
    <div>
      <img src="https://fr.dreamstime.com/photos-images/guy.html"></img>
      <p>{USER.firstName} {USER.lastName}</p>
      <p>occupation: {USER.title}</p>
      <p>lieu de vie : {USER.location}</p>
      <p>expérience: {USER.experience}</p>
      <p>recherche: {USER.desiredContractTypes}</p>
      <p>{USER.bio}</p>
      <ul>
        {USER.skills.map((item) => {
          return (
            <li>{item}</li>
          )
        })}
      </ul>
      <p>{USER.degree} {USER.diploma}</p>
      <p>{USER.school}</p>
    </div>
  )
}
