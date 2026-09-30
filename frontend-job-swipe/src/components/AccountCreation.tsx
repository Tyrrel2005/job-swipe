import {  useState } from "react"
import FormCreationPro from "./subComponents/FormCreationPro";
import   { FormCreationPartOne } from "./subComponents/FormCreationPart";
 "./subComponents/FormCreationPart";


function AccountCreation() {
  var [pro, setPro] = useState(false)
  var [particulier, setParticulier] = useState(false)
  function selectedPro() {
    setPro(true)
  }
  function selectedParticulier() {
    setParticulier(true)
  }
  return (
    <div className="">
      {!pro && !particulier && (
        <div className="central-container">
          <button className="button-common" onClick={selectedPro}>je suis un professionnel</button>
          <button className="button-common" onClick={selectedParticulier}>je suis un particulier</button>
        </div>
      )}
      {pro && (
        <FormCreationPro></FormCreationPro>
      )}
      {particulier && (
        <FormCreationPartOne></FormCreationPartOne>
      )}
    </div>
  )
}



export default AccountCreation
