export type gmRoomData = {
    room: string,
    key: 'location' | 'showcase',
    value: string
}

export type MapPosition = {
    row: number,
    col: number
}

export interface UserInfo {
    uuid: string,
    character_name: string,
    room_code: string,
    position?: MapPosition,
    dice?: number,
    role?: string
}

export interface RoomCharacters {
    [index: string]: CharacterInfo;
}

/* Characters */

interface CharacterInfo {
    name: string;
    role: string;
    room: string;
    xp:   number;
    life: number;
    notes: string;
    age: number;
    gold: number;
    character_id: number;
    inventory: CharacterInventory[];
    stats: CharacterStats[];
}

interface CharacterStats {
    stat: string;
    value: string;
}

interface CharacterInventory {
    item: string;
    quant: number;
    icon?: string;
}

export interface CharacterSocketInfo extends CharacterInfo {
    uuid: string;
    dice?: number;
    position?: {
        row: number;
        col: number;
    };
}
  