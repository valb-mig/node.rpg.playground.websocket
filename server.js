const { createServer } = require("http");
const { Server } = require("socket.io");

const port = 3000;

const httpServer = createServer();

const io = new Server(httpServer);

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('rollDice', (maxNumber) => {
        let randomNumber = Math.floor(Math.random() * (maxNumber - 1 + 1)) + 1
        io.emit('diceRoll', randomNumber);
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

httpServer
    .once("error", (err) => {
        console.error(err);
        process.exit(1);
    })
    .listen(port, () => {
        console.log(`Server is listening on port ${port}`);
    });
