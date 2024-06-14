import io from "./config/socket";

import { 
  UserInfo, 
  RoomUsersObject,
  gmRoomData 
} from "./config/types";

const socketInfoMap = new Map();
const socketRoomInfoMap = new Map();

io.on("connection", (socket) => {
  
  console.log("[Websocket] Socket connected");

  /** 
  * Emit users in room
  * 
  * @param {UserInfo} userData
  **/ 

  socket.on("req_hello", (userData: UserInfo) => {

    console.log("[Websocket] Hello Character: "+userData.character_name+" room: "+userData.room_code+" ###\n");

    const roomData = socketRoomInfoMap.get('room_data_'+userData.room_code);

    socket.join(userData.room_code);

    io.to(userData.room_code).emit("res_hello", getUsersSocket(userData.room_code), roomData);
  });

  /** 
  * Enter Room
  * 
  * @param {UserInfo} userData
  **/ 

  socket.on("req_enter_room", (userData: UserInfo) => {
    
    console.log(`[Websocket] Enter room: ${userData.room_code}, user: ${userData.character_name}`);

    socket.join(userData.room_code);

    if(Object.keys(getUsersSocket(userData.room_code)).length <= 1) {
      userData.role = "gm";
    } else {
      userData.role = "player";
    }

    socketInfoMap.set(socket.id, userData);
    io.to(userData.room_code).emit("res_enter_room", userData);
  });

  /** 
  * Roll Dice
  * 
  * @param {UserInfo} userData
  * @param {number} max
  **/ 

  socket.on("req_roll_dice", (userData: UserInfo, max: number) => {

    console.log(`[Websocket] User: ${userData.character_name} Roll dice room: ${userData.room_code}`);
    
    const otherUsers = getUsersSocket(userData.room_code);
    const randomNumber = Math.floor(Math.random() * (max - 1 + 1)) + 1;

    const socketUserData: UserInfo = socketInfoMap.get(socket.id);

    if(socketUserData.uuid == userData.uuid) {

      userData = {
        ...userData,
        position: socketUserData?.position,
        role: socketUserData?.role,
        dice: randomNumber
      }
    }

    socket.join(userData.room_code);

    socketInfoMap.set(socket.id, userData);

    io.to(userData.room_code).emit("res_roll_dice", userData, otherUsers);
  });

  /** 
  * Map Movement
  * 
  * @param {UserInfo} userData
  * @param {number} row
  * @param {number} col
  **/ 

  socket.on("req_map_movement", (userData: UserInfo, row: number, col: number) => {

    console.log(`[Websocket] User: ${userData.character_name} | Movement - Column: ${col} - Line: ${row}`);

    const socketUserData = socketInfoMap.get(socket.id);
    const otherUsers = getUsersSocket(userData.room_code);

    if(socketUserData.uuid == userData.uuid) {

      userData = {
        ...userData,
        position: {
          row: row,
          col: col
        },
        role: socketUserData?.role,
        dice: socketUserData?.dice
      }
    }
   
    socket.join(userData.room_code);

    socketInfoMap.set(socket.id, userData);

    io.to(userData.room_code).emit("res_map_movement", userData, otherUsers);
  });

  /** 
  * (GM) Update room data
  * 
  * @param {gmRoomData} roomData
  **/ 

  socket.on("req_gm_room_data", (roomData: gmRoomData) => {
    
    console.log(`[Websocket] GM Room Data - Room: ${roomData.room}`);
    
    socket.join(roomData.room);

    socketRoomInfoMap.set('room_data_'+roomData.room, {
      ...roomData,
      room: roomData.room,
      [roomData.key]: roomData.value
    });

    io.to(roomData.room).emit("res_gm_room_data", {
      key: roomData.key, 
      value: roomData.value
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

const getUsersSocket = (room_code: string) => {
  
  const socketsInRoom = io.sockets.adapter.rooms.get(room_code);
  const socketIdsInRoom = socketsInRoom ? Array.from(socketsInRoom) : [];

  let returnObject: RoomUsersObject = {};

  socketIdsInRoom.map((socketId: string) => {
    returnObject[socketId] = socketInfoMap.get(socketId);
  });

  return returnObject;
};