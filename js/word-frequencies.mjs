import { Matrix } from './matrix.mjs'
import { digest, preferredCase } from './words-analyzer.mjs'

const bound = '[bound]'

export class WordFrequencies {
  constructor (matrix, words) {
    this.matrix = matrix
    this.words = words
  }

  markovChain () {
    const chain = this.matrix.clone()
    for (let row = 0; row < chain.rows; row++) {
      let sum = 0
      for (let col = 0; col < chain.cols; col++) {
        sum += chain.get(row, col)
      }
      for (let col = 0; col < chain.cols; col++) {
        chain.set(row, col, chain.get(row, col) / sum)
      }
    }
    return chain
  }

  combineWith (...sets) {
    return WordFrequencies.combine(this, ...sets)
  }

  toFile ({ matrix, words }) {
    return `${words.join('\n')}\n=\n${matrix.toFile()}`
  }

  static fromFile (file) {
    const [words, matrix] = file.split('=')
    return new WordFrequencies(
      Matrix.fromFile(matrix),
      words.split(/\r?\n/).filter(word => word)
    )
  }

  static fromWords (text, minUsage = 0) {
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
    const matrix = new Matrix(words.length, words.length)
    const boundIndex = words.indexOf(bound)
    for (const sentence of sentences) {
      let lastIndex = boundIndex
      for (const word of sentence) {
        const index = words.indexOf(word)
        if (index === -1) {
          // Word is not used enough, so skip
          continue
        }
        matrix.set(lastIndex, index, matrix.get(lastIndex, index) + 1)
        lastIndex = index
      }
      matrix.set(lastIndex, boundIndex, matrix.get(lastIndex, boundIndex) + 1)
    }
    return new WordFrequencies(matrix, words)
  }

  static combine (...sets) {
    const wordUnion = [...new Set([].concat(...sets.map(({ words }) => words)))]
    const bigger = new Matrix(wordUnion.length, wordUnion.length)
    const addMatrixDataFor = ({ matrix, words }) => {
      for (let row = 0; row < matrix.rows; row++) {
        for (let col = 0; col < matrix.cols; col++) {
          const position = wordUnion.indexOf(words[row]) * bigger.cols + wordUnion.indexOf(words[col])
          bigger.data[position] += matrix.data[row * matrix.cols + col]
        }
      }
    }
    sets.forEach(addMatrixDataFor)
    return new WordFrequencies(bigger, wordUnion)
  }
}
