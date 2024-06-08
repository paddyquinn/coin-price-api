import { Request, Response } from 'express'
import db from '../db'

export const handleListCoins = async (_req: Request, res: Response) => {
  // TODO: handle query params
  const coins = await db.coin.findMany()
  res.status(200).json(coins)
}
