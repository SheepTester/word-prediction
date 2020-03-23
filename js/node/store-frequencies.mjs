import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { WordFrequencies } from '../core/word-frequencies.mjs'

// https://stackoverflow.com/a/50052194
const __dirname = dirname(fileURLToPath(import.meta.url))

const file = '../../frequencies/bee-movie.txt'
const source = 'https://gist.github.com/The5heepDev/a15539b297a7862af4f12ce07fee6bb7/raw/7164813a9b8d0a3b2dcffd5b80005f1967887475/entire_bee_movie_script'

const filePath = path.resolve(__dirname, file)

fetch(source)
  .then(r => r.text())
  .then(text => {
    console.log('Text retrieved')
    const frequencies = WordFrequencies.fromWords(text)
    console.log('Frequencies calculated')
    return fs.readFile(filePath, 'utf8')
      .then(file => {
        console.log('Given file exists, so attempting to combine and store in file...')
        // Append to existing frequencies in file
        return WordFrequencies.fromFile(file).combineWith(frequencies).toFile()
      })
      .catch(err => {
        console.log('Problem loading existing file (probably just means the file doesn\'t exist, which is ok):', err)
        console.log('Storing in file...')
        return frequencies.toFile()
      })
      .then(fileData => fs.writeFile(filePath, fileData))
  })
  .then(() => {
    console.log(`Text frequencies from ${source} saved to ${file}`)
  })
