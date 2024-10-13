import io from "./config/socket";

import { 
  UserInfo, 
  RoomCharacters,
  gmRoomData,
  CharacterSocketInfo 
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
  * @param {CharacterSocketInfo} characterInfo
  **/ 

  socket.on("req_enter_room", ( room: string, characterInfo: CharacterSocketInfo ) => {
    
    console.log(`[Websocket] Enter room: ${room}, user: ${characterInfo.name}`);
    socket.join(room);

    socketInfoMap.set(socket.id, characterInfo);

    io.to(room).emit("res_hello", getUsersSocket(room));
  });

  /** 
  * Roll Dice
  * 
  * @param {UserInfo} userData
  * @param {number} max
  **/ 

  socket.on("req_roll_dice", ( characterInfo: CharacterSocketInfo, max: number ) => {
 
    console.log(`[Websocket] User: ${characterInfo.name}, Roll dice room: ${characterInfo.room}`);
    
    const randomNumber = Math.floor(Math.random() * (max - 1 + 1)) + 1;

    // Add dice to character info
    characterInfo.dice = randomNumber;

    socket.join(characterInfo.room);
    socketInfoMap.set(socket.id, characterInfo);

    const otherUsers = getUsersSocket(characterInfo.room);

    io.to(characterInfo.room).emit("res_hello", getUsersSocket(characterInfo.room));
    io.to(characterInfo.room).emit("res_roll_dice", 
      characterInfo,
      otherUsers
    );
  });

  /** 
  * Map Movement
  * 
  * @param {UserInfo} userData
  * @param {number} row
  * @param {number} col
  **/ 

  socket.on("req_map_movement", (charachterSocektInfo: CharacterSocketInfo, row: number, col: number) => {

    console.log(`[Websocket] Character: ${charachterSocektInfo.name} | Movement - Column: ${col} - Line: ${row}`);

    const socketUserData = socketInfoMap.get(socket.id);
    const otherUsers = getUsersSocket(charachterSocektInfo.room);

    if(socketUserData.uuid == charachterSocektInfo.uuid) {

      charachterSocektInfo = {
        ...charachterSocektInfo,
        position: { 
          row: row,
          col: col
        },
        role: socketUserData?.role,
        dice: socketUserData?.dice
      }
    }
    
    socket.join(charachterSocektInfo.room);
    socketInfoMap.set(socket.id, charachterSocektInfo);

    io.to(charachterSocektInfo.room).emit("res_map_movement", charachterSocektInfo, otherUsers);
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
    let disconnectedUser: CharacterSocketInfo = socketInfoMap.get(socket.id);

    if(disconnectedUser != undefined) {

      console.log(`[Websocket] user: ${disconnectedUser.name} disconnected`);

      const otherUsers = getUsersSocket(disconnectedUser.room);

      io.to(disconnectedUser.room).emit("res_hello", otherUsers);
      socketInfoMap.delete(socket.id);

      if(Object.keys(getUsersSocket(disconnectedUser.room)).length < 1) {
        console.log(`[Websocket] Goodbye: ${disconnectedUser.name}, room: ${disconnectedUser.room}`);
        socketRoomInfoMap.delete('room_data_'+disconnectedUser.room);
      }
    }
  });
});

const getUsersSocket = (room: string) => {
  
  const socketsInRoom = io.sockets.adapter.rooms.get(room);
  const socketIdsInRoom = socketsInRoom ? Array.from(socketsInRoom) : [];

  let returnObject: RoomCharacters = {};

  socketIdsInRoom.map((socketId: string) => {
    returnObject[socketId] = socketInfoMap.get(socketId);
  });

  return returnObject;
};