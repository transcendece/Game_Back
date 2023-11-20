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
exports.MyGeteway = void 0;
const socket_io_1 = require("socket.io");
const websockets_1 = require("@nestjs/websockets");
const matter_js_1 = require("matter-js");
const randomString = (length = 20) => {
    return Math.random().toString(36).substring(2, length + 2);
};
const gameHeight = 800;
const gameWidth = 600;
const playerWidth = 125;
const playerHeight = 20;
let MyGeteway = class MyGeteway {
    constructor() {
        this.clients = {};
        this.games = {};
        this.gamesProperties = {};
        this.RandomGame = [];
        this.engine = matter_js_1.Engine.create({
            gravity: { x: 0, y: 0, scale: 0.001 },
            positionIterations: 10,
            velocityIterations: 8,
        });
        this.render = matter_js_1.Render.create({
            element: document.body,
            engine: this.engine,
            options: {
                background: '#000000',
                width: gameWidth,
                height: gameHeight,
                wireframes: false,
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
            }
        });
    }
    ;
    async handleConnection(client, ...args) {
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
    }
    ;
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
        this.gamesProperties[gameId] = {
            height: gameHeight,
            width: gameWidth,
            ball: { x: gameWidth / 2, y: gameHeight / 2, velocityX: 1, velocityY: 2, },
            player1: { x: playerWidth, y: gameHeight / 2, score: 0, },
            player2: { x: gameWidth - playerWidth - 10, y: gameHeight / 2, score: 0, },
            playerHeight: playerHeight,
            playerWidth: playerWidth,
        };
        if (!state) {
            this.clients[player1].emit("message", {
                "method": "create",
                "game": this.games[gameId],
            });
        }
        else
            this.sendPlayDemand(player1, player2, gameId);
    }
    sendPlayDemand(p1, p2, gameId) {
        this.games[gameId].state = true;
        this.clients[p1].emit("message", {
            "method": "play",
            "game": this.games[gameId],
        });
        this.clients[p2].emit("message", {
            "method": "play",
            "game": this.games[gameId],
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
    ;
};
exports.MyGeteway = MyGeteway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], MyGeteway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MyGeteway.prototype, "onNewMessage", null);
exports.MyGeteway = MyGeteway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3000']
        }
    }),
    __metadata("design:paramtypes", [])
], MyGeteway);
//# sourceMappingURL=geteway.js.map