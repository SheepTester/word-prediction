import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { WordMarkovChain } from '../core/word-markov-chain.mjs'
import readline from 'readline'

// https://stackoverflow.com/a/50052194
const __dirname = dirname(fileURLToPath(import.meta.url))

async function storeIn (source, fromOnline, outputFile, order) {
  const filePath = path.resolve(__dirname, outputFile)
  // 'wx' - Open file for (w)riting; fails if file e(x)ists
  let outputFileHandle = await fs.open(filePath, 'wx')
    .catch(() => null)
  let target = order
  if (!outputFileHandle) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    const answer = await new Promise(resolve => {
      rl.question(`Output file (${outputFile}) already exists. Append? `, resolve)
    })
    rl.close()
    if (answer[0].toLowerCase() !== 'y') {
      throw new Error(`Output file (${outputFile}) already exists.`)
    } else {
      // 'w+' - Open file for (w)riting (+) reading
      outputFileHandle = await fs.open(filePath, 'w+')
      target = WordMarkovChain.fromFile(await outputFileHandle.readFile({ encoding: 'utf8' }))
    }
  }
  let text
  if (fromOnline) {
    text = await fetch(source)
      .then(r => r.text())
  } else {
    text = await fs.readFile(path.resolve(__dirname, source), 'utf8')
  }
  const chain = WordMarkovChain.fromWords(text, target)
  await outputFileHandle.writeFile(chain.toFile())
  await outputFileHandle.close()
}

storeIn(
  'https://gist.github.com/The5heepDev/a15539b297a7862af4f12ce07fee6bb7/raw/7164813a9b8d0a3b2dcffd5b80005f1967887475/entire_bee_movie_script',
  true,
  '../../markov-chains/bee-movie.txt',
  2
)
  .then(() => {
    console.log('Done!')
  })
