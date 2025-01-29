import { WebSocket } from "ws";
import { User } from "./User";
import { actionValidaor } from "../../zod/GameValidator";
import { init_game } from "../../messages/message";

class UserManager {
    private static instance: UserManager
    private readonly onlineUsers: Map<string, User>
    constructor(){
        this.onlineUsers = new Map()
    }
    static getInstance(){
        if(UserManager.instance){
            return UserManager.instance;
        }
        UserManager.instance = new UserManager();
        return UserManager.instance;
    }

    addUser(user: User) {
        this.onlineUsers.set(user.userId, user);
        this.addLudoListener(user);
    }

    removeUser(userId: string) {
        this.onlineUsers.delete(userId)
    }

    getUser(userId: string) {
        return this.onlineUsers.get(userId)
    }

    private addLudoListener(user: User){
        const ws = user.socket
        ws.on('message', async(data) => {
            console.log(data)
            const isValidData = actionValidaor.safeParse(data);
            if(!isValidData.success){
                return
            }
            const {action, payload} = isValidData.data;
            if(action === init_game){
                const { gameId } = payload;
                console.log("This is game");
            }
        })
    }

}

export const userManager = UserManager.getInstance()