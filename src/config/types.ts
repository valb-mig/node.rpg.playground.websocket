export type RoomData = {
    location?: string,
    showcase?: string
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

export interface RoomUsersObject {
    [index: string]: UserInfo;
}