import { Request, Response } from 'express'
import * as t from 'io-ts'
import { failure } from 'io-ts/lib/PathReporter'
import { DateFromISOString, NumberFromString } from 'io-ts-types'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'
import db from '../../db'

const QueryParam = t.union([t.string, t.array(t.string)])
const ListCoinsQuery = t.partial({
  name: QueryParam,
  symbol: QueryParam,
  minTimestamp: DateFromISOString,
  maxTimestamp: DateFromISOString,
  minPrice: NumberFromString,
  maxPrice: NumberFromString,
  sort: t.string,
  sortOrder: t.string,
  limit: NumberFromString,
  offset: NumberFromString,
})

type In = {
  in: string[]
}

type Comparison<T> = {
  gte?: T,
  lte?: T,
}

type Where = {
  name?: string | In,
  symbol?: string | In,
  timestamp?: Comparison<Date>,
  price?: Comparison<number>,
}

type SortOrder = 'asc' | 'desc'

type OrderBy = {
  name?: SortOrder,
  symbol?: SortOrder,
  timestamp?: SortOrder,
  price?: SortOrder,
}

export const handleListCoins = async (req: Request, res: Response) => {
  const query = pipe(
    req.query,
    ListCoinsQuery.decode,
    E.getOrElseW((e) => {
      console.error(failure(e))
      return undefined
    })
  )
  if (!query) {
    res.status(400).json("malformed query params")
    return
  }

  const where: Where = {}
  if (query.name) {
    if (t.string.is(query.name)) {
      where.name = query.name
    } else {
      where.name = { in: query.name }
    }
  }
  if (query.symbol) {
    if (t.string.is(query.symbol)) {
      where.symbol = query.symbol
    } else {
      where.symbol = { in: query.symbol }
    }
  }
  if (query.minTimestamp) {
    where.timestamp = { ...where.timestamp, gte: query.minTimestamp }
  }
  if (query.maxTimestamp) {
    where.timestamp = { ...where.timestamp, lte: query.maxTimestamp }
  }
  if (query.minPrice) {
    where.price = { ...where.price, gte: query.minPrice }
  }
  if (query.maxPrice) {
    where.price = { ...where.price, lte: query.maxPrice }
  }

  const sortOrder = query.sortOrder
    ? query.sortOrder === 'asc' ? 'asc' : 'desc'
    : 'desc'

  const orderBy: OrderBy = {}
  switch (query.sort) {
    case 'name':
      orderBy.name = sortOrder
      break
    case 'symbol':
      orderBy.symbol = sortOrder
      break
    case 'timestamp':
      orderBy.timestamp = sortOrder
      break
    case 'price':
      orderBy.price = sortOrder
      break
  }
  const take = query.limit ?? 10
  const skip = query.offset ?? 0

  const coins = await db.coin.findMany({
    where,
    orderBy,
    take,
    skip,
  })
  res.status(200).json(coins)
}
