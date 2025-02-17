import { Router } from "express";
import { loginValidator, otpValidator, signupValidator } from "../zod/UserValidator";
import { prisma } from "../db/client";
import jwt from 'jsonwebtoken'
import { UserRequest, verifySession } from "../middleware/verifySession";

const router = Router();

export function generateOtp(): number {
    return Math.floor(100000 + Math.random() * 900000);
}


// signup route
router.post("/signup", async (req, res) => {
    try {
        const isValidSignup = signupValidator.safeParse(req.body);
        if(!isValidSignup.success) {
            return res.status(400).json({
                success: false,
                message: isValidSignup.error.errors[0].message
            })
        }
        const {username, mobile} = isValidSignup.data;
        const existingUser = await prisma.user.findUnique({
            where: {
                mobile
            }
        })
        if(existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists."
            })
        }
        const otp = generateOtp().toString();
        // await prisma.user.create({
        //     data: {
        //         username,
        //         mobile,
        //         otp
        //     }
        // })
        await prisma.$transaction(async(tx) => {
            const user = await tx.user.create({
                data: {
                    username,
                    mobile,
                    otp
                },
                select: {
                    userId: true
                }
            })
            await tx.wallet.create({
                data: {
                    userId: user.userId,
                }
            })
        })
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully.",
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }
})


//login route
router.post("/login", async (req, res) => {
    try {
        const isValidLogin = loginValidator.safeParse(req.body);
        if(!isValidLogin.success) {
            return res.status(400).json({
                success: false,
                message: isValidLogin.error.errors[0].message
            })
        }
        const {mobile} = isValidLogin.data;
        const existingUser = await prisma.user.findUnique({
            where: {
                mobile
            }
        })
        if(!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User does not exist."
            })
        }
        const otp = generateOtp().toString();
        await prisma.user.update({
            where: {
                mobile
            },
            data: {
                otp
            }
        });
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }
});


//verifyotp route
router.post("/verifyotp", async (req, res) => {
    try {
        const isValidOtp = otpValidator.safeParse(req.body);
        if(!isValidOtp.success) {
            return res.status(400).json({
                success: false,
                message: isValidOtp.error.errors[0].message
            })
        }
        const {mobile, otp} = isValidOtp.data;
        const user = await prisma.user.findUnique({
            where: {
                mobile
            },
            select: {
                otp: true,
                userId: true,
                username: true
            }
        });
        if(!user){
            return res.status(400).json({
                success: false,
                message: 'User does not exist.'
            })
        }
        if(user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP.'
            })
        }
        const data = {
            user: {
                userId: user.userId,
                username: user.username
            }
        }
        const authToken = jwt.sign(data, `${process.env.JWT_SECRET ?? 'secret'}`);
        return res.status(200).json({
            success: true,
            message: 'OTP verified.',
            authToken
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        })
    }
})


//resend otp route
router.post("/resendotp", async (req, res) => {
    try {
        const isValidLogin = loginValidator.safeParse(req.body);
        if(!isValidLogin.success) {
            return res.status(400).json({
                success: false,
                message: isValidLogin.error.errors[0].message
            })
        }
        const {mobile} = isValidLogin.data;
        const existingUser = await prisma.user.findUnique({
            where: {
                mobile
            }
        })
        if(!existingUser) {
            return res.status(400).json({
                success: false,
                message: "User does not exist."
            })
        }
        const otp = generateOtp().toString();
        await prisma.user.update({
            where: {
                mobile
            },
            data: {
                otp
            }
        });
        return res.status(200).json({
            success: true,
            message: "OTP sent successfully."
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        })
    }
});

export default router
