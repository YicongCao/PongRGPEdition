const RGPModelServer = require('remote-gaming-package').RGPModelServer
const Protocol = require('remote-gaming-package').Protocol
const canvas = {
    width: 600,
    height: 400,
}
var renderData = new Protocol.BizDrawRectPacket()
var seq = 0
// Ball object
const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    velocityX: 5,
    velocityY: 5,
    speed: 7,
    color: "WHITE"
}

// User Paddle
const user = {
    x: 0, // left side of canvas
    y: (canvas.height - 100) / 2, // -100 the height of paddle
    width: 10,
    height: 100,
    score: 0,
    color: "WHITE"
}

// COM Paddle
const com = {
    x: canvas.width - 10, // - width of paddle
    y: (canvas.height - 100) / 2, // -100 the height of paddle
    width: 10,
    height: 100,
    score: 0,
    color: "WHITE"
}

// draw a rectangle, will be used to draw paddles
function drawRect(x, y, w, h, color, buffer = 1) {
    renderData.buffer = buffer
    renderData.x = x
    renderData.y = y
    renderData.width = w
    renderData.height = h
    renderData.score = 127
    renderChanns.forEach((rchann) => {
        rchann.send(renderData)
    })
}

// draw circle, will be used to draw the ball
function drawArc(x, y, r, color, buffer = 1) {
    renderData.buffer = buffer
    renderData.x = x
    renderData.y = y
    renderData.width = r
    renderData.height = r
    renderData.score = 127
    renderChanns.forEach(rchann => {
      rchann.send(renderData)
    })
}

// when COM or USER scores, we reset the ball
function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.velocityX = -ball.velocityX;
    ball.speed = 7;
}

function resetScore() {
    user.score = 0
    com.score = 0
}

function resetTimer() {
    clearInterval(timerID)
    timerID = -1
}

// draw text
function drawText(text, x, y, buffer = 1) {
    renderData.buffer = buffer
    renderData.x = x
    renderData.y = y
    renderData.width = 1
    renderData.height = 2
    renderData.score = text
    renderChanns.forEach(rchann => {
        rchann.send(renderData)
    })
}

// collision detection
function collision(b, p) {
    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    return p.left < b.right && p.top < b.bottom && p.right > b.left && p.bottom > b.top;
}

// update function, the function that does all calculations
function update() {

    // change the score of players, if the ball goes to the left "ball.x<0" computer win, else if "ball.x > canvas.width" the user win
    if (ball.x - ball.radius < 0) {
        com.score++;
        // comScore.play();
        resetBall();
    } else if (ball.x + ball.radius > canvas.width) {
        user.score++;
        // userScore.play();
        resetBall();
    }

    // the ball has a velocity
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;

    // computer plays for itself, and we must be able to beat it
    // simple AI
    // com.y += ((ball.y - (com.y + com.height / 2))) * 0.1;

    // when the ball collides with bottom and top walls we inverse the y velocity.
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.velocityY = -ball.velocityY;
        // wall.play();
    }

    // we check if the paddle hit the user or the com paddle
    let player = (ball.x + ball.radius < canvas.width / 2) ? user : com;

    // if the ball hits a paddle
    if (collision(ball, player)) {
        // play sound
        // hit.play();
        // we check where the ball hits the paddle
        let collidePoint = (ball.y - (player.y + player.height / 2));
        // normalize the value of collidePoint, we need to get numbers between -1 and 1.
        // -player.height/2 < collide Point < player.height/2
        collidePoint = collidePoint / (player.height / 2);

        // when the ball hits the top of a paddle we want the ball, to take a -45degees angle
        // when the ball hits the center of the paddle we want the ball to take a 0degrees angle
        // when the ball hits the bottom of the paddle we want the ball to take a 45degrees
        // Math.PI/4 = 45degrees
        let angleRad = (Math.PI / 4) * collidePoint;

        // change the X and Y velocity direction
        let direction = (ball.x + ball.radius < canvas.width / 2) ? 1 : -1;
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);

        // speed up the ball everytime a paddle hits it.
        ball.speed += 0.1;
    }
}

// render function, the function that does al the drawing
function render() {
    // draw the user score to the left
    drawText(user.score, canvas.width / 4, canvas.height / 5, 1);

    // draw the COM score to the right
    drawText(com.score, 3 * canvas.width / 4, canvas.height / 5, 1);

    // draw the user's paddle
    drawRect(user.x, user.y, user.width, user.height, user.color, 1);

    // draw the COM's paddle
    drawRect(com.x, com.y, com.width, com.height, com.color, 1);

    // draw the ball
    drawArc(ball.x, ball.y, ball.radius, ball.color, 0);
}

function game() {
    update()
    render()
    // console.log("rending frame", seq++)
}
let framePerSecond = 50;

var server = new RGPModelServer()
var connidIndex = 1
var activePlayers = []
var renderChanns = []
var eventChanns = []
var timerID = -1

server.onconfirm = (onConfirmEvent) => {
    console.log("[user] server on confirm")
    // 默认允许连接、并且自增客户端 ID
    onConfirmEvent.allow = true
    onConfirmEvent.connid = connidIndex
    if (activePlayers.length < 2) {
        activePlayers.push(connidIndex)
    }
    connidIndex++
}

server.onconnected = (onConnectedEvent) => {
    console.log("[user] server on connected:", onConnectedEvent.connid)
    // 注册一个虚拟通道
    renderChanns.push(server.createVirtualChannel(onConnectedEvent.connid, null, 1002, "draw"))
    eventChanns.push(server.createVirtualChannel(onConnectedEvent.connid, null, 1003, "cmd"))

    // 第二个玩家加入时开始游戏
    if (activePlayers.length == 2 && timerID == -1) {
        started = true
        timerID = setInterval(game, 1000 / framePerSecond)
        console.log("active players", activePlayers)
    }

    // 其他玩家通知围观
    eventChanns.forEach((chann) => {
        if (!activePlayers.includes(chann.baseconn.connid)) {
            chann.send(new Protocol.BizOneBytePacket(1))
        }
    })
}

server.onclose = (onCloseEvent) => {
    console.log("[user] client close conn:", onCloseEvent.connid, "errcode:", onCloseEvent.errorcode, "playerol:", activePlayers)
    if (activePlayers.includes(onCloseEvent.connid)) {
        console.log("active player exited game:", onCloseEvent.connid)
        activePlayers.length = 0
        renderChanns.length = 0
        resetTimer()
        resetBall()
        resetScore()
    }
}

server.onerror = (onErrorEvent) => {
    console.log("[user] error on conn:", onErrorEvent.connid, "errcode:", onErrorEvent.errorcode, "playerol:", activePlayers)
    if (activePlayers.includes(onCloseEvent.connid)) {
        console.log("active player exited game:", onErrorEvent.connid)
        activePlayers.length = 0
        renderChanns.length = 0
        resetTimer()
        resetBall()
        resetScore()
    }
}

server.onvchann = (onVChannAcquireEvent) => {
    onVChannAcquireEvent.allow = true
    onVChannAcquireEvent.callback = (vchannDataEvent) => {
        // console.log("[user] biz packet data, y:", vchannDataEvent.data.y)
        if (vchannDataEvent.connid == activePlayers[0]) {
            user.y = vchannDataEvent.data.y
        } else if (vchannDataEvent.connid == activePlayers[1]) {
            com.y = vchannDataEvent.data.y
        }
    }
}

server.serve(3001)
