import { OnModuleInit } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { 
    MessageBody, 
    OnGatewayConnection, 
    OnGatewayDisconnect, 
    SubscribeMessage, 
    WebSocketGateway, 
    WebSocketServer 
} from "@nestjs/websockets";

import Matter ,{ 
    Engine, 
    Render, 
    Bodies, 
    Composite, 
    Runner, 
    Body
} from 'matter-js';






const randomString = (length = 20) => {
    return Math.random().toString(36).substring(2, length + 2);
};

const gameHeight = 800;
const gameWidth = 600;
const playerWidth = 125;
const playerHeight = 20;

interface Ball  {
    x: number,
    y: number,
    velocityX: number,
    velocityY: number
}

interface Player  {
    x: number,
    y: number,
    score: number
}




interface Game  {
    id :string;
    player1Id: string
    player2Id: string
    state: boolean
}

interface GameDependency  {
    ball: Ball,
    player1: Player,
    player2: Player,
    height: number,
    width: number,
    playerWidth: number,
    playerHeight: number,
}

@WebSocketGateway({
    cors: {
        origin: ['http://localhost:3000']
    }
})


export class GameGeteway implements  OnGatewayConnection, OnGatewayDisconnect {
    
    @WebSocketServer()
    server: Server;

    private clients: Record<string, Socket> = {};
    private games: Record<string, Game> = {};
    private gamesProperties:  Record<string, GameDependency > = {}
    private RandomGame: string[] = [];

    constructor(){};
    async handleConnection(client: Socket, ...args: any[]) {
        console.log('client connected:', client.id);
        this.clients[client.id] = client;
    }

    onModuleInit() {
        this.server.on('connection', (socket) => {
            this.clients[socket.id] = socket;
            console.log(`${socket.id}  Connected`);
            this.clients[socket.id].emit("connection", {
                "method": "connect",
                "clientId": socket.id,
            });

            socket.on('disconnect', () => {
                delete this.clients[socket.id];
            });
        });
    };
    
    handleDisconnect(client: Socket) {
        console.log('Client disconnected:', client.id);
        delete this.clients[client.id];
    };

    ///        CREATE GAME FUNCTION             ///
   
    private createNewGame(player1: string, player2?: string){
        let state = player2 === undefined  ? false : true;
        console.log(`state: ${state} p2: ${player2}`);
        
        const gameId = randomString(20);
        console.log("game id : " + gameId);
        console.log("user : " + player1);
        this.games[gameId] = {
            "id": gameId,
            "player1Id": player1,
            "player2Id": player2 || null,
            "state" : state, //the state of game, true is running
        };
        this.gamesProperties[gameId] = {
            height : gameHeight,
            width: gameWidth,
            ball: { x: gameWidth / 2 , y : gameHeight / 2 ,velocityX : 1,velocityY : 2 ,},
           player1 :{ x : playerWidth, y : gameHeight / 2 ,score : 0,},
            player2:{ x: gameWidth - playerWidth - 10, y: gameHeight / 2, score: 0,},
            playerHeight: playerHeight,
            playerWidth:playerWidth,
        };
        if (!state){
        this.clients[player1].emit("message", {
            "method": "create",
            "game" : this.games[gameId],
        });}
        else
            this.sendPlayDemand(player1, player2, gameId);
    }


    private sendPlayDemand(p1: string, p2: string, gameId: string){
        this.games[gameId].state = true;
        this.clients[p1].emit("message", {
            "method": "play",
            "game": this.games[gameId],
            // "gameDependency": this.gamesProperties[gameId],
        })
        this.clients[p2].emit("message", {
            "method": "play",
            "game": this.games[gameId],
            // "gameDependency": this.gamesProperties[gameId],
        })
    }

    private randomGame (player: string){
        this.RandomGame.push(player)
        if (this.RandomGame.length >= 2) {
            const player1 = this.RandomGame.shift();
            const player2 = this.RandomGame.shift();
            this.createNewGame(player1, player2);
        }
    }

    @SubscribeMessage('message')
    onNewMessage(@MessageBody() res: { method: string, clientId: string , gameId: string}) {
        console.log(res);
        console.log("----------")
        // New game
        if (res.method === "create")
            this.createNewGame(res.clientId);
        if (res.method === "random")
            this.randomGame(res.clientId);
    
        if (res.method === "join"){
            console.log(`join to game id: ${res.gameId}`)
            const player1 = this.games[res.gameId].player1Id;
            const player2 = res.clientId;
            if (player2 === player1 || this.games[res.gameId].state === true)
                return console.log("you are create this room");
            this.games[res.gameId].player2Id = player2;
            console.log("Game object")
            console.log(this.games)
            this.sendPlayDemand(player1, player2, res.gameId);
        }

        if (res.method === "play"){
            console.log("play request :");
            console.log("clientId :  "+ res.clientId);
            console.log("game :  "+ res.gameId);
            const gameId = res.gameId
            this.games
        }

        if (res.method === "update"){
            
        }
    };



    private engine = Engine.create({
        gravity: {x: 0, y: 0, scale: 0.001},
        positionIterations: 10,
        velocityIterations: 8,
    })

    private topground: Body = Bodies.rectangle(0, 0, 1200, 10, { isStatic: true });
    private downground: Body = Bodies.rectangle(0, 800, 1200, 10, { isStatic: true });
    private leftground: Body = Bodies.rectangle(0, 0, 10, 1600, { isStatic: true });
    private rightground: Body = Bodies.rectangle(600, 0, 10, 1600, { isStatic: true });
    private ball : Body = Bodies.circle(gameWidth / 2, gameHeight / 2, 10, { 
        restitution: 1,
        frictionAir: 0,
        friction:0,
        inertia: Infinity,
        render:{
            fillStyle: "red"
        },
        velocity:{x: 5, y:5}
    });
    // Matter.Body.setVelocity(ball, { x: 5, y: 5 });
    
    private player1 : Body = Bodies.rectangle(gameWidth / 2, 20, playerWidth, playerHeight, {
        isStatic: true,
        chamfer: { radius: 10},
        render:{
            fillStyle: "purple"
        },
    });
    
    private player2 : Body = Bodies.rectangle(gameWidth / 2, 780, playerWidth, playerHeight, { 
        isStatic: true,
        chamfer: { radius: 10},
        render:{
            fillStyle: "blue"
        }
    });

    private maxVelocity: number = 10;
    private generateCollision = () => {
        Matter.Events.on(this.engine, "collisionStart", (event) =>{
            event.pairs.forEach((pair)=>{
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;

                if (bodyA === this.ball || bodyB == this.ball){
                    const normal = pair.collision.normal;
                    const Threshold = 0.1;
                    if (Math.abs(normal.x) < Threshold){
                        const sign = Math.sign(this.ball.velocity.x);
                        const i = 0.5;
                        Body.setVelocity(this.ball, {
                            x: Math.min(this.ball.velocity.x + sign * i , this.maxVelocity),
                            y : this.ball.velocity.y
                        })
                        const restitution = 1; // Adjust this value for desired bounciness
                        const friction = 0; // Adjust this value for desired friction
                            
                        // Set restitution and friction for the this.ball
                        Body.set(this.ball, { restitution, friction });
                            
                        // Set restitution and friction for the other body (if it's not static)
                        const otherBody = bodyA === this.ball ? bodyB : bodyA;
                        if (!otherBody.isStatic) {
                            Body.set(otherBody, { restitution, friction });
                        }
                        if (otherBody === this.topground || otherBody === this.downground){
                            if (otherBody === this.topground)score1++;
                            else score2++;
                            Body.setPosition(this.ball, { x: gameWidth / 2, y: gameHeight });
                            Body.setVelocity(this.ball, { x: 5, y: -5 });
                        }
                            
                    }
                }
            });
        }); 
    }



}



