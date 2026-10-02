import { OffreComponent } from "./subComponents/OffreComponent";

export function Matching() {

  return (
    <div className="background-swipe">
      <OffreComponent OFFRE={{
        title: "OFFRE",
        remoteMode: "remotely",
        city: "Paris",
        description: "an example of offre that can be found here",
        salaryMin: "2300",
        salaryMax: "4500",
        minimumDegree:"MASTER"
      }}></OffreComponent>
      <div className="container-row">
        <button className="button-no">refuser</button>
        <button className="button-yes">accepter</button>
      </div>
    </div>
  )
}
