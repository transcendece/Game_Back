import { IsNumber, IsString } from "class-validator";



export class playerDto{
    
    constructor(id : string, paddleX: number, score: number){
        this.id = id;
        this.paddleX = paddleX;
        this.score = score;
    }
    
    public setPaddleX(newX: number){
        this.paddleX = newX;
    }
    public IncrementScore(){this.score++;}
    
    @IsString()
    id : string;
    
    @IsNumber()
    paddleX: number;
    
    @IsNumber()
    score: number;
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
    playerWidth: number;
    playerHeight: number;
    
    constructor(
        id: string,
        player1: playerDto,
        player2: playerDto,
        ball : ballDto, 
        height: number,
        width: number,
        playerWidth: number,
        playerHeight: number
        ){
            this.id = id;
            this.player1 = player1;
            this.player2 = player2;
            this.ball = ball;
            this.height = height;
            this.width = width;
            this.playerHeight = playerHeight;
            this.playerWidth = playerWidth;
        }
        
        public setDimention(height: number,width: number){
            this.height = height;
            this.width = width;
        }
        
    }

export class gameReq{
    method: string;
    game
}