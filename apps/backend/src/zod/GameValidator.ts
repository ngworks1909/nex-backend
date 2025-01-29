import z from 'zod';

export const gameTypeSchema = z.enum(["LUDO", "CRICKET", "CHESS", "MINES", "DICE", "ALL"]);

export const fetchGameValidator = z.object({
    gameType: gameTypeSchema
})
