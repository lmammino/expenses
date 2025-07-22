import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import envPaths from 'env-paths'
import type { ExchangeRateResponse } from './types.js'

const paths = envPaths('expenses-cli')
// biome-ignore lint/complexity/useLiteralKeys: Conflicts with ts(4111)
const FREECURRENCY_API_KEY = process.env['FREECURRENCY_API_KEY']

const CACHE_VERSION = 'v3'

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
  if (FREECURRENCY_API_KEY === undefined) {
    console.error('Please set the FREECURRENCY_API_KEY environment variable')
    process.exit(1)
  }

  const cacheKey = `${date}-${from}-${to}-${CACHE_VERSION}.json`
  const cacheFilePath = join(paths.cache, cacheKey)

  if (await fileExists(cacheFilePath)) {
    const responseBody = JSON.parse(
      await readFile(cacheFilePath, 'utf8'),
    ) as ExchangeRateResponse<typeof date, typeof to>
    const rate = responseBody.data?.[date]?.[to.toUpperCase()]
    if (rate === undefined) {
      throw new Error(`Rate for ${to.toUpperCase()} not found in cached data`)
    }
    return rate
  }

  const url = `https://api.freecurrencyapi.com/v1/historical?date=${date}&base_currency=${from.toUpperCase()}&currencies=${to.toUpperCase()}`

  const response = await fetchWithRateLimitControl(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'expenses-cli',
      apikey: FREECURRENCY_API_KEY,
    },
  })

  if (response.status !== 200) {
    const responseBody = await response.text()
    throw new Error(
      `Failed to fetch exchange rate: ${response.status} ${response.statusText}\nResponse: ${responseBody}`,
    )
  }

  const responseBody = (await response.json()) as ExchangeRateResponse

  await mkdir(paths.cache, { recursive: true })
  await writeFile(cacheFilePath, JSON.stringify(responseBody), 'utf8')

  const rate = responseBody.data?.[date]?.[to.toUpperCase()]
  if (rate === undefined) {
    throw new Error(`Rate for ${to.toUpperCase()} not found in API response`)
  }

  return rate
}

// Makes a fetch request with an exponential backoff strategy for rate limiting
async function fetchWithRateLimitControl(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  let response: Response
  let attempts = 0
  const maxAttempts = 5
  const backoffFactor = 2
  const initialDelay = 5000 // 5 seconds
  let delay = initialDelay
  while (attempts < maxAttempts) {
    try {
      response = await fetch(url, options)
      if (response.status !== 429) {
        return response
      }
      // Too many requests, apply exponential backoff
      console.warn(
        `Rate limit exceeded. Retrying in ${delay}ms... (Attempt ${attempts + 1})`,
      )
      await setTimeout(delay)
      delay *= backoffFactor
    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      throw error
    }
    attempts++
  }
  throw new Error(
    `Failed to fetch ${url} after ${maxAttempts} attempts due to rate limiting.`,
  )
}
