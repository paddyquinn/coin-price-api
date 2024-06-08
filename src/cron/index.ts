import * as t from 'io-ts'
import { DateFromISOString } from 'io-ts-types'
import { failure } from 'io-ts/lib/PathReporter'
import * as E from 'fp-ts/Either'
import { pipe } from 'fp-ts/lib/function'
import db from '../db'

const Quote = t.type({
  id: t.Int,
  name: t.string,
  symbol: t.string,
  last_updated: DateFromISOString,
  quote: t.type({
    USD: t.type({
      price: t.number,
    }),
  }),
})

const QuotesResponse = t.type({
  data: t.record(t.string, Quote),
})

const btc = 1
const stx = 4847
const ordi = 25028
const grin = 3709
const xmr = 328
const usdt = 825
const usdc = 3408
const doge = 74
const shib = 5994
const ltc = 2
const eth = 1027
const bnb = 1839
const sol = 5426

// TODO: make coins to fetch configurable
const coinsToFetch = [
  btc,
  stx,
  ordi,
  grin,
  xmr,
  usdt,
  usdc,
  doge,
  shib,
  ltc,
  eth,
  bnb,
  sol,
]

const fetchCoinMarketCapData = async () => {
  const res = await fetch(
    `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${coinsToFetch.join(',')}`,
    {
      headers: {
        // TODO: regenerate key and remove from version control
        'X-CMC_PRO_API_KEY': 'd35cf5bb-8bb6-4ff0-b872-f78442c4cbc3',
      },
    },
  )

  const quotes = pipe(
    await res.json(),
    QuotesResponse.decode,
    E.match(
      (e) => {
        console.error(failure(e))
        return []
      },
      (rsp) => Object.values(rsp.data)
    ),
  )

  // An empty array will make our unsafe query fail.
  if (quotes.length < 1) {
    return
  }

  // Createa parameter string for parameterized query so all coins can be upserted in one query.
  const numFields = 5
  const valuePlaceholders = quotes.map((_, index) => {
    const startingIndex = index * numFields
    return `($${startingIndex + 1},$${startingIndex + 2},$${startingIndex + 3},$${startingIndex + 4},$${startingIndex + 5})`
  }).join(',')

  const values = quotes.flatMap((quote) => [
    quote.id,
    quote.name.toLowerCase(),
    quote.symbol.toLowerCase(),
    quote.last_updated,
    quote.quote.USD.price,
  ])

  const query = `
    INSERT INTO "Coin" (cmc_id, name, symbol, timestamp, price)
    VALUES ${valuePlaceholders}
    ON CONFLICT (cmc_id) DO UPDATE
    SET timestamp = EXCLUDED.timestamp, price = EXCLUDED.price;
  `
  await db.$executeRawUnsafe(query, ...values)
}

const tryCatch = (cron: () => Promise<void>) => async () => {
  try {
    await cron()
  } catch (e) {
    console.error(e)
  }
}

// TODO: make interval time configurable - 60 seconds for now as that is the update time for the
// base coinmarketcap plan
setInterval(tryCatch(fetchCoinMarketCapData), 60000)
