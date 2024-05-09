const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const socketInfoMap = new Map();

io.on("connection", (socket) => {
  console.log("[Websocket] User connected");

  // Hello

  socket.on("req_hello", (userInfo) => {

    let user = JSON.parse(userInfo.user_data);

    console.log("Hello Character: ", user.character_name);
    socket.join(user.room);

    const otherUsers = getUsersSocket(user.room);

    io.to(user.room).emit("res_hello", otherUsers);
  });

  // Enter Room

  socket.on("req_enter_room", (userInfo) => {
    console.log(
      `[Websocket] Enter room: ${userInfo.room}, user: ${userInfo.user_data}`,
    );
    socket.join(userInfo.room);
    socketInfoMap.set(socket.id, userInfo);
    io.to(userInfo.room).emit("res_enter_room", userInfo.user_data);
  });

  // Roll Dice

  socket.on("req_roll_dice", (roomData) => {
    console.log(`[Websocket] Roll dice room: ${roomData.room}`);
    let randomNumber = Math.floor(Math.random() * (roomData.max - 1 + 1)) + 1;
    io.to(roomData.room).emit("res_roll_dice", randomNumber);
  });

  // Map

  socket.on("req_map_movement", (userObject) => {

    console.log(`[Websocket] Movement - Column: ${userObject.col} - Line: ${userObject.row}`);
    io.to(userObject.room).emit("res_map_movement", userObject.user_data);
  });

  socket.on("disconnect", () => {
    console.log("[Websocket] user disconnected");
  });
});

const getUsersSocket = (room) => {
  const socketsInRoom = io.sockets.adapter.rooms.get(room);
  const socketIdsInRoom = socketsInRoom ? Array.from(socketsInRoom) : [];

  console.log(socketIdsInRoom);

  let returnObject = {}; // Usar um objeto em vez de um array

  socketIdsInRoom.forEach((socketId) => {
    returnObject[socketId] = socketInfoMap.get(socketId);
  });

  return returnObject;
};

const port = 4000;

httpServer
  .once("error", (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`[Websocket] Server started ${port}`);
  });
