import { IsNumber, IsString } from "class-validator";



export class playerDto{
    
    id : string;
    paddleX: number;
    score: number;
    playerWidth: number;
    playerHeight: number;

    constructor(id : string, paddleX: number, score: number){
        this.id = id;
        this.paddleX = paddleX;
        this.score = score;
    }
    
    public setPaddleX(newX: number){
        this.paddleX = newX;
    }
    public IncrementScore(){this.score++;}
    
}

export class ballDto{
    constructor(x: number, y: number, velocityX: number, velocityY: number){
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
    
    public setPosition(x: number, y : number){
        this.x = x;
        this.y = y;
    }
    
    public setVelocity(x: number, y : number){
        this.velocityX = x;
        this.velocityY = y;
    }
    
    @IsNumber()
    x: number;
    
    @IsNumber()
    y: number;
    
    @IsNumber()
    velocityX: number
    
    @IsNumber()
    velocityY: number
}

export class GameDto{
    id: string;
    player1: playerDto;
    player2: playerDto;
    ball : ballDto
    height: number;
    width: number;
    
    
    constructor(
        id: string,
        player1: playerDto,
        player2: playerDto,
        ball : ballDto, 
        height: number,
        width: number,
        ){
            this.id = id;
            this.player1 = player1;
            this.player2 = player2;
            this.ball = ball;
            this.height = height;
            this.width = width;
        }
        
        public setDimention(height: number,width: number){
            this.height = height;
            this.width = width;
        }
        
}

/**
 * for Engine of fronte we need:
 *      gravity{x, y, sclae}numbers;
 *      positionIterations number;
 *      velocityIterations number
 * for Render :
 *      options{background: string, width, height, wireframe:bool}
 * 
 * for ball:
 *      options{restitution, frictionAir, friction, inertia, color, velocity{x, y}}
 * for players:
 *      options{isStatic, chamfer{raduis: 10}, color}
 */

export class engineOption{
    gravity: {x: number, y: number, scale: number};
    positionIterations : number;
    velocityIterations :number;

    constructor(x: number, y: number, scale:number, positionIterations : number, velocityIterations :number){
        this.gravity.x = x ;
        this.gravity.y = y;
        this.gravity.scale = scale;
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
    velocity: {x: number,y: number}

    constructor(restitution: number, frictionAir: number, friction: number, inertia: number ,color:string, velocityX: number, velocityY: number){
        this.restitution = restitution;
        this.frictionAir = frictionAir;   
        this.friction = friction;
        this.inertia = inertia;
        this.color = color;
        this.velocity.x = velocityX;
        this.velocity.y = velocityY;
    }
}

export class playersOption{

    chamfer:{reduis: number};
    color: string;;

    constructor(reduis: number, color: string){
        this.chamfer.reduis = reduis;
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



export class gameReq{
    method: string;
    gameDto: GameDto;
    gameDepandency: {}
}