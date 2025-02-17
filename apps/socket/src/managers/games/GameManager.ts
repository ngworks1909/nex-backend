import { GameType } from "../../zod/GameValidator";
import { Room } from "../room/Room";
import { ChessGame } from "./game/chess/ChessGame";
import { CricketGame } from "./game/cricket/CricketGame";
import { DiceGame } from "./game/dice/DiceGame";
import { LudoGame } from "./game/ludo/LudoGame";
import { MineGame } from "./game/mines/MineGame";

type Game = ChessGame | CricketGame | DiceGame | LudoGame | MineGame

class GameManager {
    private static instance: GameManager;
    //map roomId to game
    private games: Map<string, Game> = new Map<string, Game>()

    static getInstance(){
        if(GameManager.instance){
            return GameManager.instance;
        }
        GameManager.instance = new GameManager();
        return GameManager.instance;
    }
    public createGame(roomId: string, gameType: GameType){
        switch(gameType){
            case "CHESS":
                this.games.set(roomId, new ChessGame(roomId))
                break;
            case "CRICKET":
                this.games.set(roomId, new CricketGame(roomId))
                break;
            case "DICE":
                this.games.set(roomId, new DiceGame(roomId))
                break;
            case "LUDO":
                this.games.set(roomId, new LudoGame(roomId))
                break;
            case "MINES":
                this.games.set(roomId, new MineGame(roomId))
                break;
            default:
                break;
        }
    }

    





}

export const gameManager = GameManager.getInstance();