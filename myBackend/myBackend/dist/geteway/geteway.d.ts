import { Server, Socket } from "socket.io";
import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { ballOptions, engineOption, playersOption, renderOptions } from "src/DTOs/game.dto";
export declare class GameDependency {
    engineOption: engineOption;
    renderOptions: renderOptions;
    ballOptions: ballOptions;
    playersOption: playersOption;
    constructor(engineX: number, engineY: number, scale: number, positionIterations: number, velocityIterations: number, background: string, wireframe: boolean, restitution: number, frictionAir: number, friction: number, inertia: number, ballColor: string, velocityX: number, velocityY: number, reduis: number, playerColor: string);
}
export declare class GameGeteway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private clients;
    private games;
    private gamesProperties;
    private RandomGame;
    private gameDe;
    constructor();
    handleConnection(client: Socket, ...args: any[]): Promise<void>;
    handleDisconnect(client: Socket): void;
    private createNewGame;
    private sendPlayDemand;
    private randomGame;
    onNewMessage(res: {
        method: string;
        clientId: string;
        gameId: string;
    }): void;
    private engine;
    private render;
    private topground;
    private downground;
    private leftground;
    private rightground;
    private ball;
    private player1;
    private player2;
    private addElementsToEngine;
    private updateElements;
}
