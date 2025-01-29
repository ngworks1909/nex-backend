import { GameType } from "../../zod/GameValidator";
import { User } from "../user/User";


export class Room{
    private _roomId: string;
    private _players: User[];
    private _isPending: boolean;
    private _maxPlayers: 2 | 4;
    private _gameType: GameType;
    constructor(roomId: string, player: User, isPending: boolean, gameType: GameType, maxPlayers: 2 | 4){
        this._roomId = roomId;
        this._players = [player];
        this._isPending = isPending;
        this._gameType = gameType;
        this._maxPlayers = maxPlayers
    }

    public get roomId(){
        return this._roomId
    }

    public get players(){
        return this._players
    }

    public get isPending(){
        return this._isPending
    }

    public get gameType(){
        return this._gameType
    }

    public set isPending(isPending: boolean){
        this._isPending = isPending
    }

    public get maxPlayers(){
        return this._maxPlayers
    }

    public get sockets(){
        return this._players.map(player => player.socket)
    }

    private get isFull (){
        return this.players.length === this.maxPlayers
    }

    addPlayer(player: User) {
        if (this.isFull) return false
        this.players.push(player);
        if (this.isFull) this.isPending = false
        return true;
    }
}