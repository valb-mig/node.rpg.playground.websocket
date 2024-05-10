const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

const socketInfoMap = new Map();

io.on("connection", (socket) => {
  console.log("[Websocket] Socket connected");

  // Hello

  socket.on("req_hello", (userInfo) => {

    let user = JSON.parse(userInfo.user_data);

    console.log("\n### Hello Character: "+user.character_name+" ###\n");
    socket.join(user.room);

    const otherUsers = getUsersSocket(user.room);

    io.to(user.room).emit("res_hello", otherUsers);
  });

  // Enter Room

  socket.on("req_enter_room", (userInfo) => {
    
    console.log(`[Websocket] Enter room: ${userInfo.room}, user: ${userInfo.user_data}`);

    socket.join(userInfo.room);

    const userSocketId = socket.id;
    
    let userObject = JSON.parse(userInfo.user_data);
    userObject.socket_id = userSocketId;

    socketInfoMap.set(userSocketId, userObject);

    io.to(userInfo.room).emit("res_enter_room", userSocketId);
  });

  // Roll Dice

  socket.on("req_roll_dice", (roomData) => {
    console.log(`[Websocket] Roll dice room: ${roomData.room}`);
    let randomNumber = Math.floor(Math.random() * (roomData.max - 1 + 1)) + 1;
    io.to(roomData.room).emit("res_roll_dice", randomNumber);
  });

  // Map

  socket.on("req_map_movement", (requestObject) => {
    console.log(`[Websocket] Movement - Column: ${requestObject.col} - Line: ${requestObject.row}`);

    const otherUsers = getUsersSocket(requestObject.room);
    const userObject = JSON.parse(requestObject.user_data);

    userObject.position = {
      row: requestObject.row,
      col: requestObject.col
    };

    socketInfoMap.set(userObject.socket_id, userObject);

    io.to(requestObject.room).emit("res_map_movement", userObject, otherUsers);
  });

  socket.on("disconnect", () => {
    console.log("[Websocket] user disconnected");
  });
});

const getUsersSocket = (room) => {

  const socketsInRoom = io.sockets.adapter.rooms.get(room);
  const socketIdsInRoom = socketsInRoom ? Array.from(socketsInRoom) : [];

  let returnObject = {}; // Usar um objeto em vez de um array

  socketIdsInRoom.map((socketId) => {
    returnObject[socketId] = socketInfoMap.get(socketId);
  });

  console.log(returnObject);

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
