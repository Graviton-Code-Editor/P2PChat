const crypto = require('crypto')
const Swarm = require('discovery-swarm')
const defaults = require('dat-swarm-defaults')
const getPort = require('get-port')
const encrypt = require("strong-cryptor").encrypt
const decrypt = require("strong-cryptor").decrypt

const myDropMenu = new dropMenu({
	id:"my_dropmenu"
});

myDropMenu.setList({
  "button": "P2PChat",
  "list":{
    Chat: {
        click:function(){
            openChat();
        }
    },
  	Connect:function(){
      new Dialog({
        id:"p2p_dialog",
        title:"Room:",
        content:`
          <input id=room_name></input>
          <input minlength=6 maxlength=32 id=room_password type=password></input>
        `,
        buttons:{
          "Connect":{
            click:function(){
              const input = document.getElementById("room_name").value;
              const password = document.getElementById("room_password").value;
              config.room = input;
              config.password = password.repeat(32).substring(0,32)   
              connect(config)
              openChat();
              
          } 
        }
      }
      })
    }
  }
})

function openChat(){
    if(config.name == "" || config.password == undefined){
        return;
    }
    const chat_win = new Window({
        id:'my:chat_win',
        content:`
        <div style="display:flex; flex-direction:column;">
        <h2>Room: ${config.room}</h2>
        <div id=chat style="position:relative;max-height:60%; overflow:auto;">
        
        
        
        </div>
        <input style=" min-height:70px; min-width:100%; " id=message>
        
        
        </input>
      
        <button id="sender">Send</button>
        </div>
        
        `
      })
      
      chat_win.launch(); //Open the window
    
      document.getElementById("sender").onclick = function(){
        send(document.getElementById("message").value)
      }
}


function send(message){
  console.log(message)
  console.log(config.password.length)
  const data = {
    sender: "me",
    content:encrypt(message, config.password)
  }
  
  console.log(data)
  for (let id in peers) {
    peers[id].conn.write(JSON.stringify(data)) 
  }
  createMessage(data)
}
function createMessage(data){
  const chat = document.getElementById("chat");
  if(chat==undefined) return; //Window is closed
  const message = document.createElement("div")
  message.classList = "section-1"
  message.innerHTML =`
  <p style="font-weight:bold">${data.sender} says:</p>
  <p>${decrypt(data.content,config.password)}</p>
  <span class=line_space_menus></span>
  `
  chat.appendChild(message)
}

const peers = {}
let connSeq = 0

const myId = crypto.randomBytes(32)
console.log('Your identity: ' + myId.toString('hex'))

const askUser = async () => {
  return;

  for (let id in peers) {
    peers[id].conn.write(JSON.stringify(data)) //SENDS tabs
  }
  
}

let config = defaults({
  // peer-id
  id: myId,
  room: "",
  password : undefined
})

function connect(config){
  const sw = Swarm(config)


  ;(async (config) => {

    const port = await getPort()
  
    sw.listen(port)
    console.log('Listening to port: ' + port)

    console.log(config)
    sw.join(config.room)
  
    sw.on('connection', (conn, info) => {
     
      const seq = connSeq
  
      const peerId = info.id.toString('hex')
      console.log(`Connected #${seq} to peer: ${peerId}`)

      if (info.initiator) {
        try {
          conn.setKeepAlive(true, 600)
        } catch (exception) {
          console.log('exception', exception)
        }
      }
  
      conn.on('data', data => {
          console.log(JSON.parse(`${data}`))
        const data2 = {
          sender: peerId,
          content:JSON.parse(`${data}`).content
        }
        createMessage(data2)

      })
  
      conn.on('close', () => {

        console.log(`Connection ${seq} closed, peer id: ${peerId}`)

        if (peers[peerId].seq === seq) {
          delete peers[peerId]
        }
      })

      if (!peers[peerId]) {
        peers[peerId] = {}
      }
      peers[peerId].conn = conn
      peers[peerId].seq = seq
      connSeq++
  
    })

  })(config)
  
}