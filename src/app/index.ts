import express from 'express'
import { tryCatch } from './api'
import { handleListCoins } from './coins/api'

const app = express()

app.get('/api/coins', tryCatch(handleListCoins))

// TODO: make this configurable
app.listen(3000)
