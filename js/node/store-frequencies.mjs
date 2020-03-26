import { promises as fs } from 'fs'
import fetch from 'node-fetch'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import { WordFrequencies } from '../core/word-frequencies.mjs'

// https://stackoverflow.com/a/50052194
const __dirname = dirname(fileURLToPath(import.meta.url))

const file = '../../frequencies/winston.txt'
const append = false

// const source = 'https://gist.github.com/The5heepDev/a15539b297a7862af4f12ce07fee6bb7/raw/7164813a9b8d0a3b2dcffd5b80005f1967887475/entire_bee_movie_script'
// const fromOnline = true

// const source = '../../../../test/gatm/gatm.txt'
// const fromOnline = false

// https://en.wikipedia.org/wiki/Peter_Piper#Lyrics
// const source = './peter-piper.txt'
// const fromOnline = false

const source = './winston.txt'
const fromOnline = false

const filePath = path.resolve(__dirname, file)

const sourcePromise = fromOnline
  ? fetch(source)
    .then(r => r.text())
  : fs.readFile(path.resolve(__dirname, source), 'utf8')

sourcePromise
  .then(text => {
    console.log('Text retrieved')
    const frequencies = WordFrequencies.fromWords(text)
    console.log('Frequencies calculated')
    if (append) {
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
    } else {
      return fs.access(filePath)
        .then(() => {
          console.log('[!] Given file already exists!')
          return 'bad'
        })
        .catch(() => fs.writeFile(filePath, frequencies.toFile()))
    }
  })
  .then(response => {
    if (response === 'bad') return
    console.log(`Text frequencies from ${source} saved to ${file}`)
  })
