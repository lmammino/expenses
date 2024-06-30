import { readFile, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { request } from 'undici'
import envPaths from 'env-paths'
import mkdirp from 'mkdirp'

const paths = envPaths('expenses-cli')
const OPEN_EXCHANGE_RATES_API_KEY = process.env.OPEN_EXCHANGE_RATES_API_KEY

async function fileExists (filePath) {
  try {
    const stats = await stat(filePath)
    return stats.isFile()
  } catch (error) {
    return false
  }
}

export async function getRate (date, from, to) {
  if (!OPEN_EXCHANGE_RATES_API_KEY) {
    console.error('Please set the OPEN_EXCHANGE_RATES_API_KEY environment variable')
    process.exit(1)
  }

  const cacheKey = `${date}-${from}-${to}-v2.json`
  const cacheFilePath = join(paths.cache, cacheKey)
  if (await fileExists(cacheFilePath)) {
    const data = JSON.parse(await readFile(cacheFilePath, 'utf8'))
    return data.rates[to.toUpperCase()]
  }

  const url = `https://openexchangerates.org/api/historical/${date}.json?base=${from}&symbols=${to}&show_alternative=true&prettyprint=true`

  const response = await request(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'expenses-cli',
      Authorization: `Token ${OPEN_EXCHANGE_RATES_API_KEY}`
    }
  })
  const responseBody = await response.body.json()

  await mkdirp(paths.cache)
  await writeFile(cacheFilePath, JSON.stringify(responseBody), 'utf8')

  return responseBody.rates[to.toUpperCase()]
}
