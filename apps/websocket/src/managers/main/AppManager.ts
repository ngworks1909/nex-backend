
import { WebSocket } from "ws"
import { Room } from "../room/Room"

export class AppManager{
    private static instance: AppManager
    private _rooms: Map<string, Room>
    private _userToRoomMapping: Map<string, string>
    private _pendingRoomMappings: Map<string, string | null>

    constructor(){
        this._rooms = new Map()
        this._userToRoomMapping = new Map()
        this._pendingRoomMappings = new Map()
    }
    static getInstance(){
        if(AppManager.instance){
            return AppManager.instance;
        }
        AppManager.instance = new AppManager();
        return AppManager.instance;
    }

    public get rooms(){
        return this._rooms
    }

    public get userToRoomMapping(){
        return this._userToRoomMapping
    }

    public get pendingRoomMappings(){
        return this._pendingRoomMappings
    }

    public getPlayerSockets(roomId: string){
        const room = this.rooms.get(roomId);
        if(room){
            return room.sockets
        }
        return null
    }
}

export const appManager = AppManager.getInstance()