export declare class playerDto {
    id: string;
    paddleX: number;
    score: number;
    playerWidth: number;
    playerHeight: number;
    x: number;
    y: number;
    constructor(x: number, y: number, id: string, paddleX: number, score: number);
    setPaddleX(newX: number): void;
    IncrementScore(): void;
}
export declare class ballDto {
    constructor(x: number, y: number, velocityX: number, velocityY: number);
    setPosition(x: number, y: number): void;
    setVelocity(x: number, y: number): void;
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
}
export declare class GameDto {
    id: string;
    player1: playerDto;
    player2: playerDto;
    ball: ballDto;
    height: number;
    width: number;
    constructor(id: string, player1: playerDto, player2: playerDto, ball: ballDto, height: number, width: number);
    setDimention(height: number, width: number): void;
}
export declare class engineOption {
    gravityX: number;
    gravityY: number;
    gravityScale: number;
    positionIterations: number;
    velocityIterations: number;
    constructor(x: number, y: number, scale: number, positionIterations: number, velocityIterations: number);
}
export declare class renderOptions {
    background: string;
    wireframe: boolean;
    constructor(background: string, wireframe: boolean);
}
export declare class ballOptions {
    restitution: number;
    frictionAir: number;
    friction: number;
    inertia: number;
    color: string;
    velocityX: number;
    velocityY: number;
    constructor(restitution: number, frictionAir: number, friction: number, inertia: number, color: string, velocityX: number, velocityY: number);
}
export declare class playersOption {
    chamferReduis: number;
    color: string;
    constructor(reduis: number, color: string);
}
export declare class GameDependency {
    engineOption: engineOption;
    renderOptions: renderOptions;
    ballOptions: ballOptions;
    playersOption: playersOption;
    constructor(engineX: number, engineY: number, scale: number, positionIterations: number, velocityIterations: number, background: string, wireframe: boolean, restitution: number, frictionAir: number, friction: number, inertia: number, ballColor: string, velocityX: number, velocityY: number, reduis: number, playerColor: string);
}
export declare class gameReq {
    method: string;
    gameDto: GameDto;
    gameDepandency: {};
}
