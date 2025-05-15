import { z } from "zod";

export const createPaymentSchema = z.object({
    amount: z.number().min(10, {message: "Amount must be greater than 10"}),
})