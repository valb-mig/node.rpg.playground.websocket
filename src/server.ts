import io from "./config/socket";

import { 
  RoomData, 
  UserInfo, 
  RoomUsersObject 
} from "./config/types";

const socketInfoMap = new Map();
const socketRoomInfoMap = new Map();

io.on("connection", (socket) => {
  console.log("[Websocket] Socket connected");

  // Hello current users

  socket.on("req_hello", (userInfo) => {

    let user = JSON.parse(userInfo.user_data);

    console.log("\n### Hello Character: "+user.character_name+" room: "+userInfo.room+" ###\n");

    const roomData = socketRoomInfoMap.get('room_data_'+userInfo.room);

    socket.join(userInfo.room);
    io.to(userInfo.room).emit("res_hello", getUsersSocket(userInfo.room), roomData);
  });

  // Enter Room

  socket.on("req_enter_room", (userInfo) => {
    
    console.log(`[Websocket] Enter room: ${userInfo.room}, user: ${userInfo.user_data}`);

    socket.join(userInfo.room);

    let userObject = JSON.parse(userInfo.user_data);

    if(Object.keys(getUsersSocket(userInfo.room)).length <= 1) {
      userObject.role = "gm";
    } else {
      userObject.role = "player";
    }

    socketInfoMap.set(socket.id, userObject);
    io.to(userInfo.room).emit("res_enter_room", socket.id);
  });

  // Roll Dice

  socket.on("req_roll_dice", (requestObject) => {

    console.log(`[Websocket] Roll dice room: ${requestObject.room}`);
    
    const otherUsers   = getUsersSocket(requestObject.room);
    const randomNumber = Math.floor(Math.random() * (requestObject.max - 1 + 1)) + 1;

    const userData = socketInfoMap.get(socket.id);

    userData.dice = randomNumber;

    socket.join(requestObject.room);

    socketInfoMap.set(socket.id, userData);

    io.to(requestObject.room).emit("res_roll_dice", otherUsers, userData);
  });

  // Map

  socket.on("req_map_movement", (requestObject) => {
    console.log(`[Websocket] Movement - Column: ${requestObject.col} - Line: ${requestObject.row}`);

    const userData = socketInfoMap.get(socket.id);
    const otherUsers = getUsersSocket(userData.room_code);

    userData.position = {
      row: requestObject.row,
      col: requestObject.col
    };
  
    socket.join(userData.room_code);

    socketInfoMap.set(socket.id, userData);

    io.to(userData.room_code).emit("res_map_movement", userData, otherUsers);
  });

  socket.on("req_gm_room_data", (requestObject) => {
    console.log(`[Websocket] GM Room Data - Room: ${requestObject.room}`);
    
    console.log(requestObject);

    socket.join(requestObject.room);

    const roomData = socketRoomInfoMap.get('room_data_'+requestObject.room);

    socketRoomInfoMap.set('room_data_'+requestObject.room, {
      ...roomData,
      room: requestObject.room,
      [requestObject.key]: requestObject.value
    });

    io.to(requestObject.room).emit("res_gm_room_data", {
      key: requestObject.key, 
      value: requestObject.value
    });
  })

  socket.on("disconnect", () => {
    let disconnectedUser = socketInfoMap.get(socket.id);

    if(disconnectedUser != undefined) {

      console.log(`[Websocket] user: ${disconnectedUser.character_name} disconnected`);

      const otherUsers = getUsersSocket(disconnectedUser.room_code);

      io.to(disconnectedUser.room_code).emit("res_hello", otherUsers);
      socketInfoMap.delete(socket.id);

      if(Object.keys(getUsersSocket(disconnectedUser.room_code)).length < 1) {
        console.log(`[Websocket] Goodbye: ${disconnectedUser.room_code}`);
        socketRoomInfoMap.delete('room_data_'+disconnectedUser.room_code);
      }

    }
  });
});

const getUsersSocket = (room: any) => {
  
  const socketsInRoom = io.sockets.adapter.rooms.get(room);
  const socketIdsInRoom = socketsInRoom ? Array.from(socketsInRoom) : [];

  let returnObject = {};

  socketIdsInRoom.map((socketId) => {
    // returnObject[socketId] = socketInfoMap.get(socketId);
  });

  return returnObject;
};