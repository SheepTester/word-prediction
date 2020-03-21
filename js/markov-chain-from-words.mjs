import { Matrix } from './matrix.mjs'
import { digest, preferredCase } from './words-analyzer.mjs'

const bound = '[bound]'

export function markovChainFromWords (text, minUsage = 0) {
  const sentences = preferredCase(digest(text))
  const wordTypes = new Map()
  wordTypes.set(bound, Infinity)
  for (const sentence of sentences) {
    for (const word of sentence) {
      wordTypes.set(word, (wordTypes.get(word) || 0) + 1)
    }
  }
  const words = [...wordTypes.keys()]
    .filter(word => wordTypes.get(word) >= minUsage)
  const chain = new Matrix(words.length, words.length)
  const boundIndex = words.indexOf(bound)
  for (const sentence of sentences) {
    let lastIndex = boundIndex
    for (const word of sentence) {
      const index = words.indexOf(word)
      chain.set(lastIndex, index, chain.get(lastIndex, index) + 1)
      lastIndex = index
    }
    chain.set(lastIndex, boundIndex, chain.get(lastIndex, boundIndex) + 1)
  }
  const matrix = new Matrix(chain.rows, chain.cols)
  for (let row = 0; row < chain.rows; row++) {
    let sum = 0
    for (let col = 0; col < chain.cols; col++) {
      sum += chain.get(row, col)
    }
    matrix.set(row, row, 1 / sum)
  }
  // console.log(chain.toString(), matrix.toString())
  return {
    chain: matrix.multiply(chain),
    words
  }
}
