import { WebSocket } from "ws";

export class User {
    private _userId: string; // Renamed to _userId
    private _socket: WebSocket; // Renamed to _socket

    constructor(userId: string, socket: WebSocket) {
        this._userId = userId;
        this._socket = socket;
    }

    public get userId(): string {
        return this._userId;
    }

    public get socket(): WebSocket {
        return this._socket;
    }
}
