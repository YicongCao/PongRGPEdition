const express = require('express');
const server = express();
const port = 3000;

server.get("/", (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

server.use("/static", express.static(__dirname + "/static"));

server.get("/json", (req, res) => {
    res.json({ message: "Hello world" });
});

server.listen(port, () => {
    console.log(`Server listening at ${port}`);
});