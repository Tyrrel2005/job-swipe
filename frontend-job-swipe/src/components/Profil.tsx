import { ProfilePart } from "./subComponents/ProfilePart";
import { ProfilePro } from "./subComponents/ProfilePro";


export function Profile() {
  let USER = {
    role: 'canditate'
  }
  return (
    <div>
      {USER.role == 'canditate' && (
          <ProfilePart></ProfilePart>
      )}
      {USER.role == 'recruiter' && (
          <ProfilePro></ProfilePro>
      )}
    </div>
  )
}
