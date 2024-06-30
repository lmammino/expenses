# expenses

A CLI tool that takes a folder with receipts and invoices and outputs a catalog in CSV also taking care of currency conversion where needed.

It uses [Open Exchange rates](https://openexchangerates.org) for currency conversion and it caches all the exchange rates locally in your file system. You'll need an API KEY from Open Exchange rates. If your base currency is only USD, you can use the free tier. If you need to convert from other currencies, you'll need a paid plan.


## API Key Authorization

- Get your API Key from [Open Exchange rates](https://openexchangerates.org)
- Export it in your environment as `OPEN_EXCHANGE_RATES_API_KEY` with the following command: 

```bash
export OPEN_EXCHANGE_RATES_API_KEY=<your_api_key>
```


## Rationale

Sometimes (like yearly returns time 😖) you just find yourself with a big lump of expense files in PDF and you need to compile a report.

Even worse if your receipts are in multiple currencies and you need to normalise all of them to a target currency... yeah expenses fun, tell me about that!

This tool can help you to automate some of this work.

The idea is to give all your expense files a consistent name so that you can extract all the information about every expense just by its file name.

This tool enforces the following convention:

```plain
{year}-{month}-{day}-{provider}-{description}-{amount}-{currency}.pdf
```

For example, these are valid file names:

```plain
2021-12-15-expressvpn-subscription-12.95-USD.pdf
2021-12-18-github-support-2.00-USD.pdf
2021-12-19-mailchimp-subscription-38.12-USD.pdf
2021-12-24-slides-subscription-7.00-USD.pdf
2021-12-24-streamyard-subscription-25.00-USD.pdf
2021-12-28-aws-hosting-14.76-USD.pdf
```

This tool can be executed in the folder with all these files:

```bash
expenses --target-currency eur
```

... and it will produce a CSV output that looks like the following:

```csv
Date,Provider,Description,Amount,Currency,Rate,Total
2021-12-15,expressvpn,subscription,12.95,usd,0.888295,11.50
2021-12-18,github,support,2,usd,0.88983,1.78
2021-12-19,mailchimp,subscription,38.12,usd,0.88983,33.92
2021-12-24,slides,subscription,7,usd,0.882885,6.18
2021-12-24,streamyard,subscription,25,usd,0.882885,22.07
2021-12-28,aws,hosting,14.76,usd,0.882665,13.03
```

Note how the tool fetched the exchange rate (based on the invoice date and target currency) and calculated the total amount for you.


> **Warning**: This tool adopts an opinionated workflow that might not be suitable for your reporting needs. Make sure to consult your tax advisor or accountant if you are in doubt. Of course the author of this tool is not goint to take any responsability about your taxes or other financial liabilities! After all, you are getting this for free... 😜


## Install

From npm with:

```bash
npm i -g expenses
```


## Usage

  1. Export your Open Exchange rates API key in your environment as `OPEN_EXCHANGE_RATES_API_KEY`
  2. Put all your expenses file in one folder
  3. Rename all your expense files to follow the expected convention (`{year}-{month}-{day}-{provider}-{description}-{amount}-{currency}.pdf`)
  4. Run `expenses` in the folder
  5. Get the CSV output and do whatever you want with it.

The CLI will also output ignored files to stderr so the easiest way to get a clean CSV file is to run:

```bash
export OPEN_EXCHANGE_RATES_API_KEY=<your_api_key>
expenses > report.CSV
```

If you want to find out more about the options supported by this CLI you can run:

```bash
expenses --help
```


## Currency conversion

The currency conversion part leverages the [Open Exchange rates](https://openexchangerates.org) API.

Note that the current implementation caches all the retrieved exchange rates locally in your file system, so you will never have to fetch the same exchange rate twice.

All the data is stored as JSON files in your operative system cache path. For instance on Mac OS this will be: `/Users/<your_user>/Library/Caches/expenses-cli-nodejs/`


## Contributing

In the spirit of Open Source, everyone is very welcome to contribute to this project.
You can contribute just by submitting bugs or suggesting improvements by
[opening an issue on GitHub](https://github.com/lmammino/expenses/issues) or by [submitting a PR](https://github.com/lmammino/expenses/pulls).


## License

Licensed under [MIT License](LICENSE). © Luciano Mammino.
