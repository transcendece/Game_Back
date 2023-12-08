import { Injectable, OnModuleInit } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import {
    ConnectedSocket,
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
import { JwtService } from "@nestjs/jwt";
import { UsersRepository } from "src/modules/users/users.repository";





const randomString = (length = 20) => {
    return Math.random().toString(36).substring(2, length + 2);
};

@WebSocketGateway(8080, {
    cors: {
        origin: ['http://localhost:3000'],
        credentials: true,
    }
})

@Injectable()
export class GameGeteway implements  OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;


    private clients:Map<string, Socket> = new Map<string, Socket>();
    private Random: Map<string, GameService> = new Map<string, GameService>();
    private friendGame: Record<string, GameService> = {};
    // private gamesProperties:  Record<string, GameDto > = {}
    private randomQueue: string[] = [];

    private gameDe: GameDependency = new GameDependency(0 , 0, 0.001 , 10, 8, '#000000', false, 1, 0, 0, Infinity, "red", 5, 5, 10, 'blue');

    constructor(private jwtService: JwtService, private user: UsersRepository){};
    async handleConnection(client: Socket, ...args: any[]) {
        try{

            console.log('CClient connected:', client.id);
            let cookie : string = client.client.request.headers.cookie;
            if (cookie){
                console.log("cookie: ", cookie.substring(cookie.indexOf("=") + 1));
                let user = this.jwtService.verify(cookie.substring(cookie.indexOf("=") + 1));
                console.log("USER: ", user);
                if (user){
                    let test = await this.user.getUserById(user.sub);
                    if (test){

                        if (this.clients.has(test.id)) //CLIENT ALREDY CONNECTED
                        {
                            client.emit('ERROR', "YOU ARE ALREDY CONNECTED...")
                            client.disconnect()
                        }
                        else{
                            this.clients.set(test.id, client);
                            client.emit("connection", {"clientId":test.id })
                            await this.user.updateUserOnlineStatus(true, user.sub);
                        }
                    }
                }
            }
            else{
                console.log("User dosen't exist in database");

                client.emit('ERROR', "rh KAN3REF BAK, IHCHEM")
                client.disconnect();
            }
        }


        catch(error){
            console.log("user dosen't exist in database");
            client.emit('ERROR', "RAH KAN3REF BAK, IHCHEM")
            client.disconnect()
            console.log("invalid data : check JWT or DATABASE QUERIES")
        }
    }

    async handleDisconnect(client: Socket) {
        try{
            let cookie : string = client.client.request.headers.cookie;
            console.log('Client disconnectedd:', client.id);
            console.log("cookie ==== ", cookie);

            if (cookie){
                const user = this.jwtService.verify(cookie.substring(cookie.indexOf("=") + 1));
                if (user){ //verify cookie
                    const test = await this.user.getUserById(user.sub)
                    if (test){
                        await this.user.updateUserOnlineStatus(false, test.id);
                        this.clients.delete(test.id);
                        console.log("CLIENTSIZE: ", this.clients.size);
                        
                        this.Random.forEach((value, key) => {
                            // console.log("STOP THE GAME, length of Random MAP : ", this.Random.size);
                            if (value.ifPlayerInGame(test.id)){

                                value.stop();
                                value.client1.emit("GAMEOVER")
                                value.client2.emit("GAMEOVER")
                                this.Random.delete(key);
                            }

                        })
                    }
                }
            }
        }catch(error){
            console.log("ERROR", this.clients.size);

        }
    };


    @SubscribeMessage("CREATE")
    async createGame(@MessageBody() req: { clientId: string , map: string, mod: string}){
        this.createNewGame(req.clientId, req.map, req.mod);
    }

    @SubscribeMessage("RANDOM")
    async randomGame(@MessageBody() req: { clientId: string , map: string, mod: string}){
        console.log("request: ", req);

        this.createRandomGame(req.clientId , req.map, req.mod);
    }

    @SubscribeMessage("JOIN")
    async joinToGame(@MessageBody() req : {clientId: string, gameId: string}){
        // console.log(`join to game id: ${req.gameId}`)
        const gameObj = this.Random.get(req.gameId);
        // if (game invalid or game full)
        //     sendMsgErr()
        gameObj.setPlayer2(this.clients.get(req.clientId), req.clientId);
        this.sendPlayDemand(gameObj.player1Id, gameObj.player2Id, req.gameId);
    }

    @SubscribeMessage("PLAY")
    async beginningGame(@MessageBody() req : {clientId: string, gameId: string}){
        this.Random.get(req.gameId).startGame();
    }

    @SubscribeMessage("UPDATE")
    async updatePaddle(@MessageBody() req: {clientId: string, gameId: string, vec: Vector }){
        // console.log("reqPONSE : ", req);
        // console.log("req UPDATE: ", req);

        if (req.clientId === this.Random.get(req.gameId).player1Id){
            let vec: Vector = {x: req.vec.x ,y:780}
            // console.log("PLAYER1: BEFORE: ", this.Random.get(req.gameId).p1.position)
            Body.setPosition(this.Random.get(req.gameId).p1, vec);
            // console.log("PLAYER1: ", this.Random.get(req.gameId).p1.position);
        }
        else if (req.clientId === this.Random.get(req.gameId).player2Id){
            let vec: Vector = {x : req.vec.x ,y : 20}
            // console.log("PLAYER2: BEFORE: ", this.Random.get(req.gameId).p2.position);
            Body.setPosition(this.Random.get(req.gameId).p2, vec);
            // console.log("PLAYER2: ", this.Random.get(req.gameId).p2.position);
        }

        this.Random.get(req.gameId).client1.emit('UPDATE', {
            "ball"  : this.Random.get(req.gameId).ball.position,
            "p1"    : this.Random.get(req.gameId).p1.position,
            "p2"    : this.Random.get(req.gameId).p2.position,
            "score1": this.Random.get(req.gameId).score1,
            "score2": this.Random.get(req.gameId).score2,
        });

        this.Random.get(req.gameId).client2.emit('UPDATE', {
            "ball"  : this.Random.get(req.gameId).reverseVector(this.Random.get(req.gameId).ball.position),
            "p1"    : this.Random.get(req.gameId).reverseVector(this.Random.get(req.gameId).p1.position),
            "p2"    : this.Random.get(req.gameId).reverseVector(this.Random.get(req.gameId).p2.position),
            "score1": this.Random.get(req.gameId).score1,
            "score2": this.Random.get(req.gameId).score2,
        });
    }



    ///        CREATE GAME FUNCTION             ///

    private createNewGame(player1: string, map: string, mod: string, player2?: string){
        let state = player2 === undefined  ? false : true;
        // console.log(`state: ${state} p2: ${player2}`);

        const gameId = randomString(20);
        // console.log("game id : " + gameId);
        // console.log("user : " + player1);
        // if (!player1) {
        //     console.log("hhhhh");
        //     return;

        // }
        this.Random.set(gameId, new GameService(this.clients.get(player1), gameId, gameMaps.BEGINNER, gameMods.DEFI));
        // console.log("RANDOM SIZE: ", this.Random.size);

        if (!state)
            this.clients.get(player1).emit("CREATE", { gameId : "gameId", });
        else{
            this.Random.get(gameId).setPlayer2(this.clients.get(player2), player2);
            this.sendPlayDemand(player1, player2, gameId);
        }
    }


    private sendPlayDemand(p1: string, p2: string, gameId: string){
        // this.games[gameId].state = true;

        this.clients.get(p1).emit("PLAY", {
            gameDependency: this.gameDe,
            gameId: gameId,
        })
        this.clients.get(p2).emit("PLAY", {
            gameDependency: this.gameDe,
            gameId: gameId,
        })
        // console.log("just a check : ", this.Random[gameId].ball);
        this.Random.get(gameId).startGame();
    }


    private createRandomGame (player: string, map: string, mod: string){

        this.randomQueue.push(player)
        if (this.randomQueue.length >= 2) {
            const player1 = this.randomQueue.shift();
            const player2 = this.randomQueue.shift();
            this.createNewGame(player1,map, mod, player2);
        }
    }
}




