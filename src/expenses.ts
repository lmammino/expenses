#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises'
import { program } from 'commander'
import { stringify } from 'csv-stringify/sync'
import { getRate } from './rates.js'
import type { CommandOptions, ExpenseRecord } from './types.js'

const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string }

program
  .name('expenses')
  .description(
    'A CLI tool that takes receipts and invoices in the current folder and outputs a catalog in CSV also taking care of currency conversion where needed',
  )
  .version(packageJson.version)
  .option(
    '-c, --target-currency <currency>',
    'The currency to convert to',
    'EUR',
  )
  .option('--no-header', 'Do not output a header row')
  .action(async (opts: CommandOptions): Promise<void> => {
    const fileRegex =
      /(\d{4})-(\d{2})-(\d{2})-([\w_]+)-([\w_]+)-(\d+.\d+)-(\w{3}).pdf/
    const files = await readdir('.')

    if (opts.header) {
      console.log(
        stringify([
          [
            'Date',
            'Provider',
            'Description',
            'Amount',
            'Currency',
            'Rate',
            'Total',
          ],
        ]).trim(),
      )
    }

    for (const file of files) {
      const matches = file.match(fileRegex)
      if (matches === null) {
        console.error(
          `Ignoring '${file}' as it does not match the expected filename format`,
        )
        continue
      }

      const [, year, month, day, provider, description, amount, currency] =
        matches as [
          string,
          string,
          string,
          string,
          string,
          string,
          string,
          string,
        ]
      const date = `${year}-${month}-${day}`
      const cleanProvider = provider.replace(/_/g, ' ')
      const cleanDescription = description.replace(/_/g, ' ')
      const numericAmount = parseFloat(amount)
      const lowerCurrency = currency.toLowerCase()
      const targetCurrency = opts.targetCurrency.toLowerCase()

      let rate = 1
      if (lowerCurrency !== targetCurrency) {
        rate = await getRate(date, lowerCurrency, targetCurrency)
      }

      const total = (numericAmount * rate).toFixed(2)

      const record: ExpenseRecord = {
        date,
        provider: cleanProvider,
        description: cleanDescription,
        amount: numericAmount,
        currency: lowerCurrency,
        rate,
        total,
      }

      console.log(
        stringify([
          [
            record.date,
            record.provider,
            record.description,
            record.amount,
            record.currency,
            record.rate,
            record.total,
          ],
        ]).trim(),
      )
    }
  })
  .parse()
