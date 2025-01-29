import { Router } from "express";
import { verifySession } from "../middleware/verifySession";
import { fetchGameValidator } from "../zod/GameValidator";
import { prisma } from "../db/client";

const router = Router();

router.get("/fetchgames/:gameType", verifySession, async(req, res) => {
    try {
        const isValidGame = fetchGameValidator.safeParse({gameType: req.params.gameType});
        if(!isValidGame.success){
            return res.status(400).json({success: false, message: "Game not found"})
        }
        const {gameType} = isValidGame.data;
        if(gameType === "ALL"){
            const games = await prisma.game.findMany();
            return res.status(200).json({success: true, games})
        }
        const games = await prisma.game.findMany({
            where: {
                gameName: gameType
            }
        });

        return res.status(200).json({success: true, games})
    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"});
    }
})

export default router;