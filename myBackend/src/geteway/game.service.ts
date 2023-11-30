import { Injectable } from "@nestjs/common";
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
import { Socket } from "socket.io";

import { gameMods } from "../DTOs/game.dto";


const width             :number = 600;
const height            :number = 800;
const paddleWidth       :number = 125;
const paddleHeight      :number = 20;
const maxVelocity       :number = 10;
const maxScore          :number = 10;
const AdvObs            :Body[] = []
const IntObs            :Body[] = []


@Injectable()
export class GameService{
    id              :string             ;;;;;;;
    player1Id       :string;
    player2Id       :string;
    map             :string; // DEFI OR TIME
    mode            :gameMods; // BEGINNER INTEMIDIER ADVANCED
    serve           :boolean;
    client1         :Socket;
    client2         :Socket;

    // Engine Attribute
    engine          :Engine;
    runner          :Runner;
    ball            :Body;
    p1              :Body;
    p2              :Body;
    grounds         :Body[];
    obstacles       :Body[];
    isRunning       :boolean;

    score1          :number;
    score2          :number;

    constructor(client: Socket,gameId: string , mode: gameMods, map: string){
        this.id = gameId;
        this.player1Id = client.id;
        this.client1 = client;
        this.map = map;
        this.mode = mode;
        this.serve = true;
        this.isRunning = true;
        this.score1 = 0;
        this.score2 = 0;

        this.engine = Engine.create({
            gravity: {x: 0, y: 0, scale: 0.001},
            positionIterations: 10,
            velocityIterations: 8,
        });
        this.runner = Runner.create()

        this.ball = Bodies.circle(width / 2, height / 2, 10, { 
            restitution: 1,
            frictionAir: 0,
            friction:0,
            inertia: Infinity,
            label: "ball"
        });
        this.p1 = Bodies.rectangle(width / 2, 20, paddleWidth, paddleHeight, {
            isStatic: true,
            chamfer: { radius: 10},
        });
        this.p2 = Bodies.rectangle(width / 2, 780, paddleWidth, paddleHeight, { 
            isStatic: true,
            chamfer: { radius: 10},
        });
        
        this.grounds = [
            Bodies.rectangle(0, 0, 1200, 10, { isStatic: true , label: "TOP"}),
            Bodies.rectangle(0, 800, 1200, 10, { isStatic: true , label: "DOWN"}),
            Bodies.rectangle(0, 0, 10, 1600, { isStatic: true , label: "LEFT"}),
            Bodies.rectangle(600, 0, 10, 1600, { isStatic: true , label: "RIGHT"}),
        ];
        if ( mode === gameMods.ADVANCED )
            this.obstacles = AdvObs;
        else if ( mode === gameMods.INTEMIDIER )
            this.obstacles = IntObs;
    }

    public startGame(){
        Composite.add(this.engine.world, [this.p1, this.p2, ...this.grounds, ...this.obstacles]);
        this.run();
        Events.on(this.engine, "collisionStart", event =>{
            let     stop : boolean = false; 
            event.pairs.forEach((pair)=>{
                const bodyA :Body = pair.bodyA;
                const bodyB : Body = pair.bodyB;
                
                if (bodyA === this.ball || bodyB == this.ball){
                    const normal = pair.collision.normal;
                    const Threshold = 0.1;
                    if (Math.abs(normal.x) < Threshold){
                        const sign = Math.sign(this.ball.velocity.x);
                        const i = 0.5;
                        Body.setVelocity(this.ball, {
                            x: Math.min(this.ball.velocity.x + sign * i , maxVelocity),
                            y : this.ball.velocity.y
                        })
                        const restitution = 1; // Adjust this value for desired bounciness
                        const friction = 0; // Adjust this value for desired friction
                        
                        // Set restitution and friction for the ball
                        Body.set(this.ball, { restitution, friction });
                        
                        // Set restitution and friction for the other body (if it's not static)
                        const otherBody = bodyA === this.ball ? bodyB : bodyA;
                        if (!otherBody.isStatic) {
                            Body.set(otherBody, { restitution, friction });
                        }
                        if (otherBody.label === "TOP" || otherBody.label === "DOWN"){
                            Composite.remove(this.engine.world, this.ball);
                            stop = true;
                            this.stop();
                            if (otherBody.label === "TOP")          this.score1++;
                            else if (otherBody.label === "DOWN")    this.score2++;
                            Body.setPosition(this.ball, { x: 300, y: 400 });
                            Body.setVelocity(this.ball, { x: 5, y: -5 });
                        }
                    }
                }
            });
            if (this.score1 === maxScore){/**player1 win */}
            else if (this.score2 === maxScore){/**player2 win */}
            if (stop) {
                setTimeout(() => {
                    this.spownBall();
                }, 1000);
            }
        })
        Events.on(this.engine, "afterUpdate", ()=>{
            this.client1.emit('update', {
                "ball"  : this.ball.position,
                "p1"    : this.p1.position,
                "p2"    : this.p2.position,
                "score1": this.score1,
                "score2": this.score2,
                });
            
            this.client2.emit('update', {
                "ball"  : this.reverseVector(this.ball.position),
                "p1"    : this.reverseVector(this.p1.position),
                "p2"    : this.reverseVector(this.p2.position),
                "score1": this.score1,
                "score2": this.score2,
            });
        });

    }   
// public sendState(){
//     setInterval(() => {
//         /**
//          * send GAME STATE TO CLIENTS
//          * this.client1.emit('state', {
//          *  "ball"  : this.ball.position,
//          *  "p1"    : this.p1.position,
//          *  "p2"    : this.p2.position,
//          *  "score1": this.score1,
//          *  "score2": this.score2,
//          * });
//          * 
//          * this.client2.emit('state', {
//          *  "ball"  : reverseVector(this.ball.position),
//          *  "p1"    : reverseVector(this.p1.position),
//          *  "p2"    : reverseVector(this.p2.position),
//          *  "score1": this.score1,
//          *  "score2": this.score2,
//          * 
//          * });   
//          */
        
//         // 
//        }, 1000 / 60);
// }
    public setPlayer1(sock: Socket, id: string){
    this.player1Id = id;
    this.client1 = sock;
    }
    public setPlayer2(sock: Socket, id: string){
    this.player2Id = id;
    this.client2 = sock;
    }
    public getPlayer1(): Socket {
    return this.client1;
    }

    public getPlayer2(): Socket {
    return this.client2;
    }


    reverseVector(vector: Vector): Vector {
    return ({ x: width - vector.x, y: height - vector.y });
    }

    spownBall(): void{
    if (!this.isRunning){
        this.isRunning = !this.isRunning;
        Runner.run(this.runner,this.engine);
        return
    }
    let forceX : number = -1.3;
    let forceY : number = -1.2;
    if (this.serve){
        forceX = 1.3;
        forceY = 1.2;
    }
    this.serve = !this.serve
    this.ball = Bodies.circle(width / 2, height / 2, 10, { 
        restitution: 1,
        frictionAir: 0,
        friction:0,
        inertia: Infinity,
        force:{x: forceX, y:forceY},
        label: "ball"
    });
    }


    public stop(){
        Runner.stop(this.runner);
        this.isRunning = false;
    }

    public run(){
        Runner.run(this.runner, this.engine);
    }

    }