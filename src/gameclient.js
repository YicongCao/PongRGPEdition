const RGPModelClient = require('remote-gaming-package').RGPModelClient
const Protocol = require('remote-gaming-package').Protocol

// select canvas element
const canvas = document.getElementById("pong");

// getContext of canvas = methods and properties to draw and do a lot of thing to the canvas
const ctx = canvas.getContext('2d');

const net = {
    x: (canvas.width - 2) / 2,
    y: 0,
    height: 10,
    width: 2,
    color: "WHITE"
}

// User Paddle
const user = {
    x: -1,
    y: -1,
    width: 10,
    height: 100,
    score: 0,
    color: "WHITE"
}

var renderqueue = []

// draw a rectangle, will be used to draw paddles
function drawRect(x, y, w, h, color) {
    // console.log("draw rect, x:", x, "y:", y, "w:", w, "h:", h)
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

// draw circle, will be used to draw the ball
function drawArc(x, y, r, color) {
    // console.log("draw arc, x:", x, "y:", y, "r:", r)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
}

// draw the net
function drawNet() {
    for (let i = 0; i <= canvas.height; i += 15) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

// draw text
function drawText(text, x, y) {
    // console.log("draw text, x:", x, "y:", y, "text:", text)
    ctx.fillStyle = "#FFF";
    ctx.font = "75px fantasy";
    ctx.fillText(text, x, y);
}

// listening to the mouse
canvas.addEventListener("mousemove", getMousePos);

function getMousePos(evt) {
    let rect = canvas.getBoundingClientRect();

    // user.y = evt.clientY - rect.top - user.height / 2;

    var bizPacket = new Protocol.BizMousePosPacket(0, evt.clientY - rect.top - user.height / 2)
    if (iochann) {
        iochann.send(bizPacket)
    }
}

// render function, the function that does al the drawing
function render() {
    // draw background
    drawRect(0, 0, canvas.width, canvas.height, "#000");
    drawNet()
    for (var i = 0; i < renderqueue.length; i++) {
        // draw score
        if (renderqueue[i].score != undefined && renderqueue[i].score != 127) {
            drawText(String(renderqueue[i].score), renderqueue[i].x, renderqueue[i].y)
        }
        // draw arc
        else if (renderqueue[i].width == renderqueue[i].height) {
            drawArc(renderqueue[i].x, renderqueue[i].y, renderqueue[i].width, "WHITE")
        }
        // draw rect
        else {
            drawRect(renderqueue[i].x, renderqueue[i].y, renderqueue[i].width, renderqueue[i].height, "WHITE")
        }
    }
    renderqueue = []
}

// renderqueue.push({
//     x: 150,
//     y: 80,
//     score: 0
// })
// renderqueue.push({
//     x: 450,
//     y: 80,
//     score: 0
// })
// renderqueue.push({
//     x: 0,
//     y: 150,
//     width: 10,
//     height: 100,
// })
// renderqueue.push({
//     x: 590,
//     y: 150,
//     width: 10,
//     height: 100,
// })
// renderqueue.push({
//     x: 305,
//     y: 205,
//     width: 10,
//     height: 10,
// })

// render()

var client = new RGPModelClient()
var iochann = null
client.onconnected = (onConnectedEvent) => {
    console.log("[user] client on connected:", onConnectedEvent.connid)
    iochann = client.createVirtualChannel(null, 1001, "pos")
}

client.onclose = (onCloseEvent) => {
    console.error("[user] server close conn:", onCloseEvent.connid, "errcode:", onCloseEvent.errorcode)
}

client.onerror = (onErrorEvent) => {
    console.error("[user] error on conn:", onErrorEvent.connid, "errcode:", onErrorEvent.errorcode)
}

client.onvchann = (onVChannAcquireEvent) => {
    onVChannAcquireEvent.allow = true
    if (onVChannAcquireEvent.channid == 1002) {
        onVChannAcquireEvent.callback = (vchannDataEvent) => {
            console.log("[user] biz render data")
            renderqueue.push(vchannDataEvent.data)
            if (vchannDataEvent.data.buffer === 0) {
                render()
            }
        }
    } else if (onVChannAcquireEvent.channid == 1003) {
        onVChannAcquireEvent.callback = (vchannDataEvent) => {
            console.log("[user] biz render data")
            if (vchannDataEvent.data.data == 1) {
                alert("围观视角，不可操作哦😯")
            }
        }
    }
}

client.connect("ws://localhost:27854")