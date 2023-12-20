import { Injectable, OnModuleInit, UseFilters } from "@nestjs/common";
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

import { Body , Vector } from 'matter-js';

import { GameDependency, gameMods} from "../DTOs/game/game.dto";
import { GameService } from "./game.service";
import { JwtService } from "@nestjs/jwt";
import { UsersRepository } from "src/modules/users/users.repository";
import { UserDto } from "src/DTOs/User/user.dto";
import { AllExceptionsSocketFilter } from "./socketExceptionHandler";
import { PrismaService } from "src/modules/database/prisma.service";





const randomString = (length = 20) => {
    return Math.random().toString(36).substring(2, length + 2);
};

@WebSocketGateway(8080, {
    cors: {
        origin: ['http://localhost:3000'],
        credentials: true,
    }
})

@UseFilters(new AllExceptionsSocketFilter())
export class GameGeteway implements  OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer()
    server: Server;


    private clients:Map<string, [Socket, UserDto]> ;
    private Random: Map<string, GameService>;
    private friendGame: Record<string, GameService> = {};
    private randomBeg: string[] = [];
    private randomInt: string[] = [];
    private randomAdv: string[] = [];

    constructor(private jwtService: JwtService, private user: UsersRepository, private prisma : PrismaService){
        this.clients = new Map<string, [Socket, UserDto]>();
        this.Random = new Map<string, GameService>();
    };
    async handleConnection(client: Socket, ...args: any[]) {
        console.log("connect ...")
        try{
            let userdto: UserDto | null = await this.getUser(client)
            console.log('CClient connected:', userdto.id, " : ", client.id);
            if (userdto){
                if (this.clients.has(userdto.id)) { //CLIENT ALREDY CONNECTED
                    console.log("alrady connected-------------");
                    client.emit('ERROR', "YOU ARE ALREDY CONNECTED...")
                    client.disconnect()
                }
                else{
                    this.clients.set(client.id, [client, userdto]);
                    // client.emit("connect", { "clientId" : userdto.id })
                    console.log("connected: ", client.connected);
                    
                    // console.log("client obj: ", this.clients.get(client.id));
                    await this.user.updateUserOnlineStatus(true, userdto.id);
                }
            }
            else{
                console.log("User dosen't exist in database");
                client.emit('ERROR', "YOU ARE NOT EXIST IN DATABASE")
                client.disconnect();
            }   
        }
        catch(error){
            console.log("user dosen't exist in database");
            client.emit('ERROR', "RAH KAN3REF BAK, IHCHEM")
            client.disconnect()
        }
        console.log("end connect ....");
    }
    
    async handleDisconnect(client: Socket) {
        console.log("disconnect ...")
        try{
            let userdto: UserDto  = this.clients.get(client.id)[1]
            if (userdto){
                this.Random.forEach((value, key) => {
                    if (value.ifPlayerInGame(client.id)){ 
                        console.log("FIND THE GAME");
                        
                        value.stop();
                        //
                        value.client1.emit("GAMEOVER")
                        value.client2.emit("GAMEOVER")
                        
                        this.Random.delete(key);
                    }                
                })
                this.clients.delete(userdto.id);
                client.disconnect();
                console.log("connected: ", client.connected);
                await this.user.updateUserOnlineStatus(false, userdto.id);
            }
        }catch(error){
            console.log("ERROR", this.clients.size);
            client.disconnect();
        }
        console.log("end disconnect ...")
    };


    @SubscribeMessage("CREATE")
    async createGame(@MessageBody() req: {map: string, mod: string}, @ConnectedSocket() client : Socket){
        let userdto: UserDto = this.clients.get(client.id)[1]
        console.log("CREATE : ", userdto.id);
        if (!userdto)
            console.log("CREATE : userdto NOT VALID");
        this.createNewGame(client.id, req.map, req.mod);
    }

    @SubscribeMessage("RANDOM")
    async randomGame(@MessageBody() req: {  map: string, mod: string} , @ConnectedSocket() client : Socket){
        try{

            let userdto: UserDto = this.clients.get(client.id)[1]
            this.clients.get(client.id)[0].emit("WAIT")
            console.log("RANDOM..... : ", userdto.id);
            if (!userdto)
                console.log("RANDOM : userdto NOT VALID");
        
            this.createRandomGame(client.id , req.map, req.mod);
        console.log("end RANDOM.....");
        }catch(error){
            console.log("ERROR IN RANDOM: ", error);
            
        }
    }

    @SubscribeMessage("JOIN")
    async joinToGame(@MessageBody() req : {gameId: string}, @ConnectedSocket() client : Socket){
        // console.log(`join to game id: ${req.gameId}`)
        let userdto: UserDto = this.clients.get(client.id)[1]
        if (!userdto)
            console.log("JOIN : userdto NOT VALID");
        const gameObj = this.Random.get(req.gameId);
        // if (game invalid or game full)
        //     sendMsgErr()
        gameObj.setPlayer2(this.clients.get(client.id)/* SOCKET */, userdto.id);
        this.sendPlayDemand(gameObj.player1Id, gameObj.player2Id, req.gameId);
    }

    @SubscribeMessage("PLAY")
    async beginningGame(@MessageBody() req : {gameId: string}, @ConnectedSocket() client : Socket){
        this.Random.get(req.gameId).startGame();
    }

    @SubscribeMessage("UPDATE")
    async updatePaddle(@MessageBody() req: {gameId: string, vec: Vector }, @ConnectedSocket() client : Socket){
        // console.log("UPDATE ....");
        try{
            // console.log("cliend sending the request : ", req);
            
            let userdto: UserDto = this.clients.get(client.id)[1]
            let game: GameService = this.Random.get(req.gameId);
          // console.log("req UPDATE: ", req, " ", userdto.id);
            if (!userdto)
                {console.log("UPDATE : userdto NOT VALID");throw "invalid user"}
            // console.log("GAMEEEES:",game);
            
            // console.log("ID:-------------------------------- ", userdto.id, "|||ID2:  ", game.player2Id , "ID1:  ", game.player1Id);            
            if (client.id === game.player1Id){ 
              let vec: Vector = {x: req.vec.x ,y:780}
              Body.setPosition(game.p1, vec);
            }
            else if (client.id === game.player2Id){
                let vec : Vector = {x: req.vec.x ,y:20}
                Body.setPosition(game.p2, vec);
            }
        }catch(err){
            console.log(err);
        }
    }
    //GET USER FROM DATABASE

    private async getUser(client: Socket): Promise<UserDto> | null{
        let cookie : string = client.client.request.headers.cookie;
        
        if (cookie){
            const user = this.jwtService.verify(cookie.substring(cookie.indexOf("=") + 1));
            if (user){
                const userdto: UserDto = await this.user.getUserById(user.sub);
                console.log("cookie: ", cookie);
                if (userdto)
                    return userdto;
            }
        }
        return null;
    }

    ///        CREATE GAME FUNCTION             ///

    private createNewGame(player1: string, map: string, mod: string, player2?: string){
        let state = player2 === undefined  ? false : true;
        console.log(`state: ${state} p1: ${player1} p2: ${player2}`);

        const gameId = randomString(20);
        // console.log("game id : " + gameId);
        // console.log("user : " + player1);
        // if (!player1) {
        //     console.log("hhhhh");
        //     return;

        // }
        // console.log("ID: ",this.clients.get(player1));
        
        this.Random.set(gameId, new GameService(this.prisma, this.clients.get(player1),player1, gameId, map, gameMods.DEFI));
        // console.log("RANDOM SIZE: ", this.Random.size);

        if (!state)
            this.clients.get(player1)[0].emit("CREATE", { gameId : "gameId", });
        else{
            console.log("CREATE NEW GAME:: ", player2);
            
            this.Random.get(gameId).setPlayer2(this.clients.get(player2), player2);
            console.log("QUEUE::::::: ", this.randomBeg);
            
            this.sendPlayDemand(player1, player2, gameId);
        }
    }


    private sendPlayDemand(p1: string, p2: string, gameId: string){
        // this.games[gameId].state = true;
        
        // this.clients.get(p1)[0].emit("PLAY", {
        //     // gameDependency: this.gameDe,
        //     gameId: gameId,
        //     "ID"    :1,
        //     "ball"  : 50,
        //     "p1"    : 50,
        //     "p2"    : 50,
        //     "score1": 1,
        //     "score2": 0,
        // })
        // console.log(p2);
        
        // this.clients.get(p2)[0].emit("PLAY", {
        //     // gameDependency: this.gameDe,
        //     gameId: gameId,
        //     "ID"    :1,
        //     "ball"  : 50,
        //     "p1"    : 50,
        //     "p2"    : 50,
        //     "score1": 1,
        //     "score2": 0,
        // })
        // console.log("just a check : ", this.Random[gameId].ball);
        this.Random.get(gameId).startGame();
    }


    private createRandomGame (player: string, map: string, mod: string){
        // const
        if (map === "BEGINNER")this.randomBeg.push(player)
        else if (map === "INTEMIDIER")this.randomInt.push(player)
        else if (map === "ADVANCED")this.randomAdv.push(player)
        console.log("RANDOMBeg:  ", this.randomBeg);
        console.log("RANDOMInt:  ", this.randomInt);
        console.log("RANDOMAdv:  ", this.randomAdv);
        let player1: string;
        let player2: string;
        if (map === "BEGINNER" && this.randomBeg.length >= 2) {
            player1 = this.randomBeg.shift();
            player2 = this.randomBeg.shift();
            this.createNewGame(player1 , map, mod, player2);
        }
        else if (map === "INTEMIDIER" && this.randomInt.length >= 2) {
            player1 = this.randomInt.shift();
            player2 = this.randomInt.shift();
            this.createNewGame(player1 , map, mod, player2);
        }
        else if (map === "ADVANCED" && this.randomAdv.length >= 2) {
            player1 = this.randomAdv.shift();
            player2 = this.randomAdv.shift();
            console.log("map: ", map, "p1 : ", player1," p2 :", player2);
            this.createNewGame(player1 , map, mod, player2);
        }
    }

}
