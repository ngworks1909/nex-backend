import z from 'zod';

export const gameTypeSchema = z.enum(["LUDO", "MINES", "MEMORY"]);

export const fetchGameValidator = z.object({
    gameType: gameTypeSchema
}, {message: "Invalid game type"})







