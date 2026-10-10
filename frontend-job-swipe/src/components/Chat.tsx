
function addChat() {
  let chat = document.getElementById("chat_sender")
  chat?.appendChild()
}

export function Chat() {
  let chat_exemple_contact = {
    name: "jean machin",
    messages: "salut moi c'est jean machin"
  }
  let chat_exemple_sender = {
    name: "bob",
    messages:"salut"
  }
  return (
    <div className="central-container">
      <div>
        <h3 className="contact-para">{chat_exemple_contact.name}</h3>
        <p className="contact-para">{chat_exemple_contact.messages}</p>
      </div>
      <div id="chat_sender">
        <h3 className="sender-para">{chat_exemple_sender.name}</h3>
        <p className="sender-para">{chat_exemple_sender.messages}</p>
      </div>
      <div>
        <form method="post" >
          <input type="text"></input>
          <input type="submit"></input>
        </form>
      </div>
    </div>
  )
}
