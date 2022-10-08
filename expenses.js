#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises'
import { program } from 'commander'
import { stringify } from 'csv-stringify/sync'
import { getRate } from './rates.js'

const { version } = JSON.parse(await readFile(new URL('./package.json', import.meta.url)))

program
  .name('expenses')
  .description('A CLI tool that takes receipts and invoices in the current folder and outputs a catalog in CSV also taking care of currency conversion where needed')
  .version(version)
  .option('-c, --target-currency <currency>', 'The currency to convert to', 'EUR')
  .option('--no-header', 'Do not output a header row')
  .action(async function (opts) {
    const fileRegex = /(\d{4})-(\d{2})-(\d{2})-([\w_]+)-([\w_]+)-(\d+.\d+)-(\w{3}).pdf/
    const files = await readdir('.')

    if (opts.header) {
      console.log(stringify([['Date', 'Provider', 'Description', 'Amount', 'Currency', 'Rate', 'Total']]).trim())
    }

    for (const file of files) {
      const matches = file.match(fileRegex)
      if (!matches) {
        console.error(`Ignoring '${file}' as it does not match the expected filename format`)
        continue
      }

      let [year, month, day, provider, description, amount, currency] = matches.slice(1)
      const date = `${year}-${month}-${day}`
      provider = provider.replace(/_/g, ' ')
      description = description.replace(/_/g, ' ')
      amount = parseFloat(amount)
      currency = currency.toLowerCase()
      const targetCurrency = opts.targetCurrency.toLowerCase()
      let rate = 1
      if (currency !== targetCurrency) {
        rate = await getRate(date, currency, targetCurrency)
      }
      const total = (amount * rate).toFixed(2)
      console.log(stringify([[date, provider, description, amount, currency, rate, total]]).trim())
    }
  })
  .parse()
