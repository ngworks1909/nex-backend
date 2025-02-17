import { User } from "./User";
import { game_not_found, init_game, insufficient_balance, load_loader, wallet_not_found } from "../../messages/message";
import { initGameValidator } from "../../zod/GameValidator";
import { roomManager } from "../room/RoomManager";
import { prisma } from "../../db/client";
import { appManager } from "../main/AppManager";

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
        const roomId = appManager.userToRoomMapping.get(userId);
        if(roomId){
            roomManager.leaveRoom(roomId, userId)
        }
        this.onlineUsers.delete(userId)
    }

    getUser(userId: string) {
        return this.onlineUsers.get(userId)
    }

    private addLudoListener(user: User){
        const ws = user.socket
        ws.on(init_game, async(data: string) => {
            if(!data) return;
            const isValidInit = initGameValidator.safeParse(data);
            console.log(isValidInit.success)
            if(!isValidInit.success) return;
            const gameId = isValidInit.data;
            //fetch user wallet
            const wallet = await prisma.wallet.findUnique({
                where: {
                    userId: user.userId
                },
                select: {
                    balance: true,
                    walletId: true
                }
            })
            if(!wallet){
                ws.emit(wallet_not_found)
                return
            }
            //fetch game entry fee
            const game = await prisma.game.findUnique({
                where:{
                    gameId
                }
            });
            if(!game){
                ws.emit(game_not_found)
                return
            }
            if(wallet.balance < game.entryFee){
                ws.emit(insufficient_balance)
                return
            }

            await prisma.wallet.update({
                where: {
                    walletId: wallet.walletId
                },
                data: {
                    balance: {
                        decrement: game.entryFee
                    }
                }
            })
            ws.emit(load_loader, game.gameName);
            roomManager.createOrJoinRoom(user, gameId, game.gameName, game.maxPlayers, game.entryFee)
        })
    }

}

export const userManager = UserManager.getInstance()