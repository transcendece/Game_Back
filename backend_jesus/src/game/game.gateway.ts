import { Injectable, OnModuleInit } from "@nestjs/common";
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
    Body,
    Events,
    Vector
} from 'matter-js';

import { GameDependency, gameMaps, gameMods} from "../DTOs/game/game.dto";
import { GameService } from "./game.service";





const randomString = (length = 20) => {
    return Math.random().toString(36).substring(2, length + 2);
};

const gameHeight = 800;
const gameWidth = 600;
const playerWidth = 125;
const playerHeight = 20;

@WebSocketGateway(8888, {
    cors: {
        origin: ['http://localhost:3000']
    }
})

@Injectable()
export class GameGeteway implements  OnGatewayConnection, OnGatewayDisconnect {
    
    @WebSocketServer()
    server: Server;

    private clients: Record<string, Socket> = {};
    private Random: Record<string, GameService> = {};
    private friendGame: Record<string, GameService> = {};
    // private gamesProperties:  Record<string, GameDto > = {}
    private randomQueue: string[] = [];

    private gameDe: GameDependency = new GameDependency(0 , 0, 0.001 , 10, 8, '#000000', false, 1, 0, 0, Infinity, "red", 5, 5, 10, 'blue');

    constructor(){};
    async handleConnection(client: Socket, ...args: any[]) {
        console.log('client connected:', client.id);
        this.clients[client.id] = client;
        client.emit("connection", {"clientId":client.id })
    }
    
    handleDisconnect(client: Socket) {
        console.log('Client disconnected:', client.id);
        delete this.clients[client.id];
    };

    
    @SubscribeMessage("CREATE")
    createGame(@MessageBody() res: { clientId: string}){
        this.createNewGame(res.clientId);
    }
    
    @SubscribeMessage("RANDOM")
    randomGame(@MessageBody() res: { clientId: string}){
        this.createRandomGame(res.clientId);
    }
    
    @SubscribeMessage("JOIN")
    joinToGame(@MessageBody() res : {clientId: string, gameId: string}){
        console.log(`join to game id: ${res.gameId}`)
        const gameObj = this.Random[res.gameId];
        // if (game invalid or game full)
        //     sendMsgErr()
        gameObj.setPlayer2(this.clients[res.clientId], res.clientId);
        this.sendPlayDemand(gameObj.player1Id, gameObj.player2Id, res.gameId);
    }
    
    @SubscribeMessage("PLAY")
    beginningGame(@MessageBody() res : {clientId: string, gameId: string}){
        this.Random[res.gameId].startGame();
    }
    
    @SubscribeMessage("UPDATE")
    updatePaddle(@MessageBody() res: {clientId: string, gameId: string, vec: Vector }){
        if (this.Random[res.gameId].player1Id === res.clientId)
            Body.setPosition(this.Random[res.gameId].p1, res.vec)
        else if (this.Random[res.gameId].player2Id === res.clientId)
            Body.setPosition(this.Random[res.gameId].p2, res.vec)
    }
    


    ///        CREATE GAME FUNCTION             ///
    
    private createNewGame(player1: string, player2?: string){
        let state = player2 === undefined  ? false : true;
        console.log(`state: ${state} p2: ${player2}`);
        
        const gameId = randomString(20);
        console.log("game id : " + gameId);
        console.log("user : " + player1);
        this.Random[gameId] =  new GameService( this.clients[player1] , gameId , gameMaps.BEGINNER ,gameMods.DEFI)
        
        if (!state)
            this.clients[player1].emit("CREATE", { gameId : "gameId", });
        else{
            this.Random[gameId].setPlayer2(this.clients[player2], player2);
            this.sendPlayDemand(player1, player2, gameId);
        }
    }
    
    
    private sendPlayDemand(p1: string, p2: string, gameId: string){
        // this.games[gameId].state = true;
    
        this.clients[p1].emit("PLAY", {
            gameDependency: this.gameDe,
        })
        this.clients[p2].emit("PLAY", {
            gameDependency: this.gameDe,
        })
        this.Random[gameId].startGame();
    }
    
    
    private createRandomGame (player: string){
        this.randomQueue.push(player)
        if (this.randomQueue.length >= 2) {
            const player1 = this.randomQueue.shift();
            const player2 = this.randomQueue.shift();
            this.createNewGame(player1, player2);
        }
    }
}



