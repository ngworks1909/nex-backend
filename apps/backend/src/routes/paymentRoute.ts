import { Router } from "express";
import dotenv from 'dotenv'
import razorpay from 'razorpay'
import { UserRequest, verifySession } from "../middleware/verifySession";
import { createPaymentSchema } from "../zod/PaymentValidator";
import { prisma } from "../db/client";

dotenv.config()


const router = Router();

const rz = new razorpay({
    key_id: process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_SECRET
})

const key = process.env.RAZORPAY_KEY
const secret = process.env.RAZORPAY_SECRET


router.post('/create', verifySession,async(req: UserRequest, res) => {
    try {
        const userId = req.userId!
        const isValidCreate = createPaymentSchema.safeParse(req.body);

        if(!isValidCreate.success){
            return res.status(400).json({success: false, message: isValidCreate.error.issues[0].message})
        }

        const amount = isValidCreate.data.amount

        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "receipt#1",
            payment_capture: 1
        }

        const order = await rz.orders.create(options);

        await prisma.payment.create({
            data: {
                paymentId: order.id,
                userId,
                amount
            }
        })
        res.status(200).json({success: true, message: "Order created", data: order})

    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"})
    }
})

export default router