"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGeteway = exports.GameDependency = void 0;
const socket_io_1 = require("socket.io");
const websockets_1 = require("@nestjs/websockets");
const matter_js_1 = require("matter-js");
const game_dto_1 = require("../DTOs/game.dto");
const randomString = (length = 20) => {
    return Math.random().toString(36).substring(2, length + 2);
};
const gameHeight = 800;
const gameWidth = 600;
const playerWidth = 125;
const playerHeight = 20;
class GameDependency {
    constructor(engineX, engineY, scale, positionIterations, velocityIterations, background, wireframe, restitution, frictionAir, friction, inertia, ballColor, velocityX, velocityY, reduis, playerColor) {
        this.engineOption = new game_dto_1.engineOption(engineX, engineY, scale, positionIterations, velocityIterations);
        this.renderOptions = new game_dto_1.renderOptions(background, wireframe);
        this.ballOptions = new game_dto_1.ballOptions(restitution, frictionAir, friction, inertia, ballColor, velocityX, velocityY);
        this.playersOption = new game_dto_1.playersOption(reduis, playerColor);
    }
}
exports.GameDependency = GameDependency;
let GameGeteway = class GameGeteway {
    constructor() {
        this.clients = {};
        this.games = {};
        this.gamesProperties = {};
        this.RandomGame = [];
        this.gameDe = new GameDependency(0, 0, 0.001, 10, 8, '#000000', false, 1, 0, 0, Infinity, "red", 5, 5, 10, 'blue');
        this.engine = matter_js_1.Engine.create({
            gravity: { x: 0, y: 0, scale: 0.001 },
            positionIterations: 10,
            velocityIterations: 8,
        });
        this.render = matter_js_1.Render.create({
            engine: this.engine,
            options: {
                width: gameWidth,
                height: gameHeight,
                wireframes: this.gameDe.renderOptions.wireframe,
            }
        });
        this.topground = matter_js_1.Bodies.rectangle(0, 0, 1200, 10, { isStatic: true });
        this.downground = matter_js_1.Bodies.rectangle(0, 800, 1200, 10, { isStatic: true });
        this.leftground = matter_js_1.Bodies.rectangle(0, 0, 10, 1600, { isStatic: true });
        this.rightground = matter_js_1.Bodies.rectangle(600, 0, 10, 1600, { isStatic: true });
        this.ball = matter_js_1.Bodies.circle(gameWidth / 2, gameHeight / 2, 10, {
            restitution: 1,
            frictionAir: 0,
            friction: 0,
            inertia: Infinity,
            render: {
                fillStyle: "red"
            },
            velocity: { x: 5, y: 5 }
        });
        this.player1 = matter_js_1.Bodies.rectangle(gameWidth / 2, 20, playerWidth, playerHeight, {
            isStatic: true,
            chamfer: { radius: 10 },
            render: {
                fillStyle: "purple"
            },
        });
        this.player2 = matter_js_1.Bodies.rectangle(gameWidth / 2, 780, playerWidth, playerHeight, {
            isStatic: true,
            chamfer: { radius: 10 },
            render: {
                fillStyle: "blue"
            }
        });
    }
    ;
    async handleConnection(client, ...args) {
        console.log('client connected:', client.id);
        this.clients[client.id] = client;
        client.emit("connection", { "clientId": client.id });
    }
    handleDisconnect(client) {
        console.log('Client disconnected:', client.id);
        delete this.clients[client.id];
    }
    ;
    createNewGame(player1, player2) {
        let state = player2 === undefined ? false : true;
        console.log(`state: ${state} p2: ${player2}`);
        const gameId = randomString(20);
        console.log("game id : " + gameId);
        console.log("user : " + player1);
        this.games[gameId] = {
            "id": gameId,
            "player1Id": player1,
            "player2Id": player2 || null,
            "state": state,
        };
        this.gamesProperties[gameId] = new game_dto_1.GameDto(gameId, new game_dto_1.playerDto(gameWidth / 2, 20, player1, playerWidth, 0), new game_dto_1.playerDto(gameWidth / 2, gameHeight - 20, player2, gameWidth - playerWidth, 0), new game_dto_1.ballDto(gameWidth / 2, gameHeight / 2, 1, 2), gameHeight, gameWidth);
        if (!state) {
            this.clients[player1].emit("message", {
                "method": "create",
                "gameDTO": this.gamesProperties[gameId],
            });
        }
        else
            this.sendPlayDemand(player1, player2, gameId);
    }
    sendPlayDemand(p1, p2, gameId) {
        this.games[gameId].state = true;
        this.clients[p1].emit("message", {
            "method": "play",
            "gameProperties": this.gamesProperties[gameId],
            "gameDependency": this.gameDe,
        });
        this.clients[p2].emit("message", {
            "method": "play",
            "gameProperties": this.gamesProperties[gameId],
            "gameDependency": this.gameDe,
        });
    }
    randomGame(player) {
        this.RandomGame.push(player);
        if (this.RandomGame.length >= 2) {
            const player1 = this.RandomGame.shift();
            const player2 = this.RandomGame.shift();
            this.createNewGame(player1, player2);
        }
    }
    onNewMessage(res) {
        console.log(res);
        console.log("----------");
        if (res.method === "create")
            this.createNewGame(res.clientId);
        if (res.method === "random")
            this.randomGame(res.clientId);
        if (res.method === "join") {
            console.log(`join to game id: ${res.gameId}`);
            const player1 = this.games[res.gameId].player1Id;
            const player2 = res.clientId;
            if (player2 === player1 || this.games[res.gameId].state === true)
                return console.log("you are create this room");
            this.games[res.gameId].player2Id = player2;
            console.log("Game object");
            console.log(this.games);
            this.sendPlayDemand(player1, player2, res.gameId);
        }
        if (res.method === "play") {
            console.log("play request :");
            console.log("clientId :  " + res.clientId);
            console.log("game :  " + res.gameId);
            const gameId = res.gameId;
            this.games;
        }
        if (res.method === "update") {
        }
    }
    ;
    addElementsToEngine() {
        matter_js_1.Composite.add(this.engine.world, [this.ball, this.player1, this.player2, this.topground, this.downground, this.leftground, this.rightground]);
        matter_js_1.Render.run(this.render);
        matter_js_1.Runner.run(matter_js_1.Runner.create(), this.engine);
    }
    updateElements(velocityX, velocityY, ballX, ballY, player1X, player1Y, player2X, player2Y) {
        matter_js_1.Body.setPosition(this.player1, { x: player1X, y: player1Y });
        matter_js_1.Body.setPosition(this.player1, { x: player2X, y: player2Y });
        matter_js_1.Body.setPosition(this.ball, { x: ballX, y: ballY });
        matter_js_1.Body.setVelocity(this.ball, { x: velocityX, y: velocityY });
    }
};
exports.GameGeteway = GameGeteway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGeteway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GameGeteway.prototype, "onNewMessage", null);
exports.GameGeteway = GameGeteway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3000']
        }
    }),
    __metadata("design:paramtypes", [])
], GameGeteway);
//# sourceMappingURL=geteway.js.map