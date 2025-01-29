import { Router } from "express";
import { UserRequest, verifySession } from "../middleware/verifySession";
import { prisma } from "../db/client";

const router = Router();


router.get("/fetchdata", verifySession, async(req: UserRequest, res) => {
    try {
        const userId = req.userId!
        const wallet = await prisma.wallet.findUnique({
            where: {
                userId
            },
            select: {
                balance: true
            }
        });
        
        if(!wallet){
            return res.status(400).json({success: false, message: "Wallet not found"})
        }
        const banners = await prisma.banner.findMany({
            take: 4
        });


        return res.status(200).json({success: true, wallet, banners})

    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"})
    }
})

export default router;