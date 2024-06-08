import { Request, Response } from 'express'

type RequestHandler = (req: Request, res: Response) => Promise<void>

export const tryCatch = (handler: RequestHandler) => async (req: Request, res: Response) => {
  try {
    await handler(req, res)
  } catch (e) {
    console.error(e)
    res.status(500).json("internal server error")
  }
}
