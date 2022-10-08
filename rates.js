import { readFile, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { request } from 'undici'
import envPaths from 'env-paths'
import mkdirp from 'mkdirp'

const paths = envPaths('expenses-cli')

async function fileExists (filePath) {
  try {
    const stats = await stat(filePath)
    return stats.isFile()
  } catch (error) {
    return false
  }
}

export async function getRate (date, from, to) {
  const cacheKey = `${date}-${from}-${to}.json`
  const cacheFilePath = join(paths.cache, cacheKey)
  if (await fileExists(cacheFilePath)) {
    const data = JSON.parse(await readFile(cacheFilePath, 'utf8'))
    return data[to]
  }

  const url = `https://raw.githubusercontent.com/fawazahmed0/currency-api/1/${date}/currencies/${from}/${to}.json`

  const response = await request(url)
  const responseBody = await response.body.json()
  await mkdirp(paths.cache)
  await writeFile(cacheFilePath, JSON.stringify(responseBody), 'utf8')

  return responseBody[to]
}
