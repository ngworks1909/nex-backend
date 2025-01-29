export class RoomManager {
    private static instance : RoomManager
    static getInstance(): RoomManager{
        if(RoomManager.instance){
            return RoomManager.instance;
        }
        RoomManager.instance = new RoomManager();
        return RoomManager.instance;
    }
}

export const roomManager = RoomManager.getInstance()