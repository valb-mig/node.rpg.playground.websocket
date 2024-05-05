const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 5000
});

wss.on('connection', (socket) => {
    console.log('user connected');

    socket.on('message', (message) => {
        try {
            const { type, payload } = JSON.parse(message);
            if (type === 'rollDice') {
                let randomNumber = Math.floor(Math.random() * (payload - 1 + 1)) + 1
                socket.send(JSON.stringify({ type: 'diceRoll', payload: randomNumber }));
            }
        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });

    socket.on('close', () => {
        console.log('user disconnected');
    });
});

console.log(new Date() + ": Hello :), on port - " + 5000);
