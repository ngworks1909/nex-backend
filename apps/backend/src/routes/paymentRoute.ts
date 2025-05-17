import { Router } from "express";
import dotenv from 'dotenv'
import razorpay from 'razorpay'
import { UserRequest, verifySession } from "../middleware/verifySession";
import { createPaymentSchema, verifyPaymentSchema } from "../zod/PaymentValidator";
import { prisma } from "../db/client";
import crypto from 'crypto'
import { verifySignature } from "../actions/verifySignature";

dotenv.config()


const router = Router();

const razr_key = process.env.RAZORPAY_KEY!
const razr_secret = process.env.RAZORPAY_SECRET!

const rz = new razorpay({
    key_id: razr_key,
    key_secret: razr_secret
})





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

        const data = {orderId: order.id, amount: order.amount, currency: order.currency}
        res.status(200).json({success: true, message: "Order created", data})

    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"})
    }
})


  router.post('/verify', async (req, res) => {

    try {
        const isValidUpdate = verifyPaymentSchema.safeParse(req.body);
        if (!isValidUpdate.success) {
            return res.status(400).json({ message: isValidUpdate.error.message });
        }
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, status } = isValidUpdate.data;
        if (status === 'failed') {
            await prisma.payment.update({
                where: { paymentId: razorpay_order_id },
                data: {
                  paymentStatus: "Failed", // Mark transaction as failed
                },
            });
            return res.status(200).json({ message: 'Transaction failed' });
        }

        const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
        if (!isValid) {
          return res.status(400).json({ message: 'Invalid signature. Payment verification failed' });
        }

        const response = await prisma.$transaction(async(tx) => {
            const transaction = await tx.payment.update({
              where: { paymentId: razorpay_order_id },
              data: {
                paymentStatus: "Success",
              },
            });
            
            const user = await tx.user.findUnique({
              where: { userId: transaction.userId },
              select: {wallet: {select: {walletId: true}}}
            });
            
            if(!user){
              return res.status(400).json({ message: 'User not found' });
            }
    
            if(!user.wallet){
              return res.status(400).json({ message: 'Wallet not found' });
            }
    
            const updatedTransaction = await tx.wallet.update({
                    where: {
                      walletId: user.wallet.walletId
                    },
                    data: {
                      balance: {
                        increment: transaction.amount
                      }
                    }
                })
            return res.status(200).json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
        })
  
        return response

    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error", error})
    }
    
  
    

});

export default router