import z from 'zod'


export const gameTypeSchema = z.enum(["LUDO", "CRICKET", "CHESS", "MINES", "DICE"]);

export type GameType = z.infer<typeof gameTypeSchema>

export const initGameValidator = z.string()
