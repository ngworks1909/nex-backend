import { Router } from "express";
import { loginValidator, otpValidator, signupValidator, updateValidator } from "../zod/UserValidator";
import { prisma } from "../db/client";
import jwt from 'jsonwebtoken'
import { UserRequest, verifySession } from "../middleware/verifySession";
import { randomInt } from 'crypto'

const router = Router();

export function generateOtp(): number {
    return randomInt(100000, 1000000);
}

function getRandomUppercaseLetter(): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[randomInt(0, alphabet.length)];
}

function getRandomDigit(): string {
    return randomInt(0, 10).toString();
}

function shuffleArray(array: string[]): string[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1);
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export function generateReferralCode(): string {
    const chars: string[] = [];

    // Add 3 random letters
    for (let i = 0; i < 3; i++) {
        chars.push(getRandomUppercaseLetter());
    }

    // Add 3 random digits
    for (let i = 0; i < 3; i++) {
        chars.push(getRandomDigit());
    }

    // Shuffle to randomize order
    return shuffleArray(chars).join('');
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
        const {username, mobile, referralCode} = isValidSignup.data;
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
        var referralId: string | null = null
        if(referralCode){
            const referrer = await prisma.user.findUnique({
                where: {
                    referralCode
                },
                select: {
                    userId: true,
                    verified: true
                }
            });
            if(!referrer){
                return res.status(400).json({
                    success: false,
                    message: "Invalid referral code."
                })
            }
            if(!referrer.verified){
                return res.status(400).json({
                    success: false,
                    message: "Referrer is not verified."
                })
            }
            referralId = referrer.userId
        }
        const otp = generateOtp().toString();
        await prisma.$transaction(async(tx) => {
            const user = await tx.user.create({
                data: {
                    username,
                    mobile,
                    otp,
                    referredBy: referralId
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
                username: true,
                mobile: true,
                createdAt: true,
                verified: true,
                referredBy: true,
                referralCode: true
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
        var referralCode: string | null = user.referralCode
        if(!user.verified){
            referralCode = generateReferralCode()
            await prisma.$transaction(async(tx) => {
                await tx.user.update({
                    where: {
                        mobile
                    },
                    data: {
                        verified: true,
                        referralCode 
                    }
                });

                if(user.referredBy){
                    const referrer = await tx.user.findUnique({
                        where: {
                            userId: user.referredBy
                        },
                        select: {
                            wallet: {
                                select: {
                                    walletId: true
                                }
                            }
                        }
                    });

                    if(referrer && referrer.wallet){
                        await tx.wallet.update({
                            where: {
                                walletId: referrer.wallet.walletId
                            },
                            data: {
                                balance: {
                                    increment: 100
                                }
                            }
                        })
                    }
                }
            })
        }
        const data = {
            user: {
                userId: user.userId,
                username: user.username,
                mobile: user.mobile,
                createdAt: user.createdAt,
                referralCode: referralCode
            }
        }
        const authToken = jwt.sign(data, `${process.env.JWT_SECRET ?? 'secret'}`, {expiresIn: '15d'});
        const refreshToken = jwt.sign(data, `${process.env.JWT_SECRET ?? 'secret'}`, {expiresIn: '20d'});
        return res.status(200).json({
            success: true,
            message: 'OTP verified.',
            authToken,
            refreshToken
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


router.put('/update', verifySession, async(req: UserRequest, res) => {
    try {
        const userId = req.userId!
        const user = await prisma.user.findUnique({
            where: {
                userId
            },select: {
                mobile: true,
                createdAt: true,
                referralCode: true
            }
        })
        if(!user){
            return res.status(400).json({success: false, message: "Invalid auth"})
        }
        const isValidUpdate = updateValidator.safeParse(req.body);
        if(!isValidUpdate.success) {
            return res.status(400).json({
                success: false,
                message: isValidUpdate.error.errors[0].message
            })
        }
        const {username} = isValidUpdate.data;
        await prisma.user.update({
            where: {
                userId
            },
            data: {
                username
            }
        })
        const data = {
            user: {
                userId: userId,
                username: username,
                mobile: user.mobile,
                createdAt: user.createdAt,
                referralCode: user.referralCode
            }
        }
        const authToken = jwt.sign(data, `${process.env.JWT_SECRET ?? 'secret'}`, {expiresIn: '15d'});
        const refreshToken = jwt.sign(data, `${process.env.JWT_SECRET ?? 'secret'}`, {expiresIn: '20d'});
        return res.status(200).json({
            success: true,
            message: "User updated",
            authToken,
            refreshToken
        })
    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"})
    }
    
})

router.get('/refresh', verifySession, async(req: UserRequest, res) => {
    try {
        const userId = req.userId!
        const user = await prisma.user.findUnique({
            where: {
                userId
            },
            select: {
                username: true,
                referralCode: true,
                mobile: true,
                createdAt: true,
            }
        });
        if(!user){
            return res.status(400).json({success: false, message: "Invalid auth"})
        }
        const data = {
            user: {
                userId: userId,
                username: user.username,
                mobile: user.mobile,
                createdAt: user.createdAt,
                referralCode: user.referralCode
            }
        }
        const authToken = jwt.sign(data, `${process.env.JWT_SECRET ?? 'secret'}`, {expiresIn: '15d'});
        const refreshToken = jwt.sign(data, `${process.env.JWT_SECRET ?? 'secret'}`, {expiresIn: '20d'});
        return res.status(200).json({
            success: true,
            message: "Token refreshed",
            authToken,
            refreshToken
        })

    } catch (error) {
        return res.status(500).json({success: false, message: "Internal server error"})
    }
})

export default router
