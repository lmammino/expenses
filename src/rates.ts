import { readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import envPaths from 'env-paths'
import mkdirp from 'mkdirp'
import { request } from 'undici'
import type { ExchangeRateResponse } from './types.js'

const paths = envPaths('expenses-cli')
const OPEN_EXCHANGE_RATES_API_KEY = process.env.OPEN_EXCHANGE_RATES_API_KEY

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stats = await stat(filePath)
    return stats.isFile()
  } catch (_error) {
    return false
  }
}

export async function getRate(
  date: string,
  from: string,
  to: string,
): Promise<number> {
  if (OPEN_EXCHANGE_RATES_API_KEY === undefined) {
    console.error(
      'Please set the OPEN_EXCHANGE_RATES_API_KEY environment variable',
    )
    process.exit(1)
  }

  const cacheKey = `${date}-${from}-${to}-v2.json`
  const cacheFilePath = join(paths.cache, cacheKey)

  if (await fileExists(cacheFilePath)) {
    const data = JSON.parse(
      await readFile(cacheFilePath, 'utf8'),
    ) as ExchangeRateResponse
    const rate = data.rates[to.toUpperCase()]
    if (rate === undefined) {
      throw new Error(`Rate for ${to.toUpperCase()} not found in cached data`)
    }
    return rate
  }

  const url = `https://openexchangerates.org/api/historical/${date}.json?base=${from}&symbols=${to}&show_alternative=true&prettyprint=true`

  const response = await request(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'expenses-cli',
      Authorization: `Token ${OPEN_EXCHANGE_RATES_API_KEY}`,
    },
  })

  const responseBody = (await response.body.json()) as ExchangeRateResponse

  await mkdirp(paths.cache)
  await writeFile(cacheFilePath, JSON.stringify(responseBody), 'utf8')

  const rate = responseBody.rates[to.toUpperCase()]
  if (rate === undefined) {
    throw new Error(`Rate for ${to.toUpperCase()} not found in API response`)
  }

  return rate
}
