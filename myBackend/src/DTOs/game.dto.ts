export class engineOption{
    gravityX: number;gravityY: number;gravityScale: number
    positionIterations : number;
    velocityIterations :number;

    constructor(x: number, y: number, scale:number, positionIterations : number, velocityIterations :number){
        this.gravityX = x ;
        this.gravityY = y;
        this.gravityScale = scale;
        this.positionIterations =positionIterations;
        this.velocityIterations = velocityIterations;
    }

}

export class renderOptions{
    background: string;
    wireframe: boolean;
    constructor(background: string, wireframe: boolean){
        this.background = background;
        this.wireframe = wireframe;
    }
}

export class ballOptions{
    restitution: number
    frictionAir: number
    friction: number
    inertia: number
    color:string
    velocityX: number
    velocityY: number

    constructor(restitution: number, frictionAir: number, friction: number, inertia: number ,color:string, velocityX: number, velocityY: number){
        this.restitution = restitution;
        this.frictionAir = frictionAir;   
        this.friction = friction;
        this.inertia = inertia;
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
}

export class playersOption{
    chamferReduis: number;
    color: string;;

    constructor(reduis: number, color: string){
        this.chamferReduis = reduis;
        this.color = color;
    }
}

export class GameDependency{
    engineOption: engineOption;
    renderOptions : renderOptions;
    ballOptions : ballOptions;
    playersOption: playersOption
    
    constructor(
            engineX: number, engineY: number, scale: number,
            positionIterations : number,
            velocityIterations :number,
            background: string, wireframe: boolean,
            restitution: number,
            frictionAir: number,
            friction: number,
            inertia: number,
            ballColor:string,
            velocityX: number,velocityY: number,
            reduis: number,
            playerColor: string

    ){
        this.engineOption =new engineOption(engineX, engineY, scale, positionIterations, velocityIterations);
        this.renderOptions = new renderOptions(background, wireframe);
        this.ballOptions = new ballOptions(restitution, frictionAir, friction, inertia, ballColor, velocityX, velocityY);
        this.playersOption = new playersOption(reduis, playerColor);
    }
}


export enum gameMods{
    BEGINNER,
    INTEMIDIER,
    ADVANCED,
}

export enum gameTypes{
    TIME,
    DEFI,
}