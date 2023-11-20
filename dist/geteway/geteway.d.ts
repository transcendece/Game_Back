import { Server, Socket } from "socket.io";
import { OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets";
import { Engine, Render } from 'matter-js';
export declare class MyGeteway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private clients;
    private games;
    private gamesProperties;
    private RandomGame;
    constructor();
    handleConnection(client: Socket, ...args: any[]): Promise<void>;
    onModuleInit(): void;
    handleDisconnect(client: Socket): void;
    private createNewGame;
    private sendPlayDemand;
    private randomGame;
    onNewMessage(res: {
        method: string;
        clientId: string;
        gameId: string;
    }): void;
    engine: Engine;
    render: Render;
    private topground;
    private downground;
    private leftground;
    private rightground;
    private ball;
}
