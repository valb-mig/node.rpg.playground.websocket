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

  // Hello current users

  socket.on("req_hello", (userInfo) => {

    let user = JSON.parse(userInfo.user_data);

    console.log("\n### Hello Character: "+user.character_name+" ###\n");

    socket.join(user.room);
    io.to(user.room).emit("res_hello", getUsersSocket(user.room));
  });

  // Enter Room

  socket.on("req_enter_room", (userInfo) => {
    
    console.log(`[Websocket] Enter room: ${userInfo.room}, user: ${userInfo.user_data}`);

    socket.join(userInfo.room);
    socketInfoMap.set(socket.id, JSON.parse(userInfo.user_data));
    io.to(userInfo.room).emit("res_enter_room", socket.id);
  });

  // Roll Dice

  socket.on("req_roll_dice", (requestObject) => {

    console.log(`[Websocket] Roll dice room: ${requestObject.room}`);
    
    const otherUsers   = getUsersSocket(requestObject.room);
    const randomNumber = Math.floor(Math.random() * (requestObject.max - 1 + 1)) + 1;

    const userData = socketInfoMap.get(socket.id);

    userData.dice = randomNumber;

    socketInfoMap.set(socket.id, userData);

    io.to(requestObject.room).emit("res_roll_dice", otherUsers, userData);
  });

  // Map

  socket.on("req_map_movement", (requestObject) => {
    console.log(`[Websocket] Movement - Column: ${requestObject.col} - Line: ${requestObject.row}`);

    const otherUsers = getUsersSocket(requestObject.room);
    const userData = socketInfoMap.get(socket.id);

    userData.position = {
      row: requestObject.row,
      col: requestObject.col
    };

    socketInfoMap.set(socket.id, userData);

    io.to(requestObject.room).emit("res_map_movement", userData, otherUsers);
  });

  socket.on("disconnect", () => {
    let disconnectedUser = socketInfoMap.get(socket.id);

    if(disconnectedUser != undefined) {

      console.log(`[Websocket] user:   ${disconnectedUser.character_name} disconnected`);

      const otherUsers = getUsersSocket(disconnectedUser.room_code);

      io.to(disconnectedUser.room_code).emit("res_hello", otherUsers);
      socketInfoMap.delete(socket.id);
    }
  });
});

const getUsersSocket = (room) => {
  const socketsInRoom = io.sockets.adapter.rooms.get(room);
  const socketIdsInRoom = socketsInRoom ? Array.from(socketsInRoom) : [];

  let returnObject = {};

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
