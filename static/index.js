
const btnCreate = document.getElementById("btnCreate")
const btnJoin = document.getElementById("btnJoin")
const txtGameId = document.getElementById("txtGameId")


let clientId =null;
let gameId = null;
let context;
let socket = new io("ws://localhost:8080");

btnJoin.addEventListener("click", e => {
  if (gameId === null)
    gameId = txtGameId.value;
  
  socket.emit("message", {
    "method": "join",
    "gameId": gameId,
    "clientId" : clientId,
  })
  txtGameId.value = "";
})

btnCreate.addEventListener("click", e=>{
	console.log(`id of creator : ${clientId}`)
	socket.emit("message", {
    "method": "create",
    "clientId" : clientId,
  })

})

socket.on("connection" , response => {

  if  (response.method === "connect"){
    console.log(response);
    clientId = response.clientId;
    // console.log(response)
    // console.log(`client if set sucs   ${clientId}`);
  }
});

socket.on('message', response => {

  console.log(response);
  //connect method
  if (response.method === "create"){
    gameId = response.game.id;
    console.log(`game successfully created with id   ${response.game.id}`);

  }
  if (response.method === "join"){
    const game = response.game;
    
    console.log("game");
    console.log(game.id);
    socket.emit("message", {
    	"method" : "play",
		"gameId": game.id,
    	"clientId": clientId,
    })
    const gameTable = document.getElementById("board");
    context = board.getContext("2d");
    context.fillStyle = "skyblue"
	}
	// if (response.method === "play"){
	// 	//get gamedepandecies
	// 	console.log("----- play --------")
	// 	console.log(response);
	// 	const gameTable = document.getElementsByClassName("board")[0];          
	// 	const gamedepandecies = response.gameDependency;
	// 	console.log(gameTable);
	// 	gameTable.height = gamedepandecies.height;
	// 	gameTable.width = gamedepandecies.width;
	// 	let context = gameTable.getContext('2d');
	// 	context.fillStyle = "skyblue"
	// 	context.fillRect(gamedepandecies.player1.x, gamedepandecies.player1.y, gamedepandecies.playerWidth, gamedepandecies.playerHeight);
	// 	context.fillRect(gamedepandecies.player2.x, gamedepandecies.player2.y, gamedepandecies.playerWidth, gamedepandecies.playerHeight);


  //   context.font = "45px sans-serif";
  //   context.fillText(gamedepandecies.player1.score, gamedepandecies.width / 5, 45);
  //   context.fillText(gamedepandecies.player2.score, gamedepandecies.width * 4 / 5, 45);
  // }
});
