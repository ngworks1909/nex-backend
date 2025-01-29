import z from 'zod'
import { init_game } from '../messages/message'


export const gameInitialisationValidator = z.object({
    gameId: z.string()
})


export const gameTypeSchema = z.enum(["LUDO", "CRICKET", "CHESS", "MINES", "DICE", "ALL"]);

export type GameType = z.infer<typeof gameTypeSchema>

export const actionValidaor = z.discriminatedUnion('action', [
    z.object({
        action: z.literal(init_game),
        payload: gameInitialisationValidator
    }),
    z.object({
        action: z.literal("TEST"),
        payload: z.object({
            message: z.string()
        })
    })
])