"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameReq = exports.GameDependency = exports.playersOption = exports.ballOptions = exports.renderOptions = exports.engineOption = exports.GameDto = exports.ballDto = exports.playerDto = void 0;
class playerDto {
    constructor(x, y, id, paddleX, score) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.paddleX = paddleX;
        this.score = score;
    }
    setPaddleX(newX) {
        this.paddleX = newX;
    }
    IncrementScore() { this.score++; }
}
exports.playerDto = playerDto;
class ballDto {
    constructor(x, y, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    setVelocity(x, y) {
        this.velocityX = x;
        this.velocityY = y;
    }
}
exports.ballDto = ballDto;
class GameDto {
    constructor(id, player1, player2, ball, height, width) {
        this.id = id;
        this.player1 = player1;
        this.player2 = player2;
        this.ball = ball;
        this.height = height;
        this.width = width;
    }
    setDimention(height, width) {
        this.height = height;
        this.width = width;
    }
}
exports.GameDto = GameDto;
class engineOption {
    constructor(x, y, scale, positionIterations, velocityIterations) {
        this.gravityX = x;
        this.gravityY = y;
        this.gravityScale = scale;
        this.positionIterations = positionIterations;
        this.velocityIterations = velocityIterations;
    }
}
exports.engineOption = engineOption;
class renderOptions {
    constructor(background, wireframe) {
        this.background = background;
        this.wireframe = wireframe;
    }
}
exports.renderOptions = renderOptions;
class ballOptions {
    constructor(restitution, frictionAir, friction, inertia, color, velocityX, velocityY) {
        this.restitution = restitution;
        this.frictionAir = frictionAir;
        this.friction = friction;
        this.inertia = inertia;
        this.color = color;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
    }
}
exports.ballOptions = ballOptions;
class playersOption {
    ;
    constructor(reduis, color) {
        this.chamferReduis = reduis;
        this.color = color;
    }
}
exports.playersOption = playersOption;
class GameDependency {
    constructor(engineX, engineY, scale, positionIterations, velocityIterations, background, wireframe, restitution, frictionAir, friction, inertia, ballColor, velocityX, velocityY, reduis, playerColor) {
        this.engineOption = new engineOption(engineX, engineY, scale, positionIterations, velocityIterations);
        this.renderOptions = new renderOptions(background, wireframe);
        this.ballOptions = new ballOptions(restitution, frictionAir, friction, inertia, ballColor, velocityX, velocityY);
        this.playersOption = new playersOption(reduis, playerColor);
    }
}
exports.GameDependency = GameDependency;
class gameReq {
}
exports.gameReq = gameReq;
//# sourceMappingURL=game.dto.js.map