import { Matrix } from './matrix.mjs'
import { digest, preferredCase } from './words-analyzer.mjs'
import { BOUND } from './markers.mjs'

export class WordFrequencies {
  constructor (matrix, words) {
    if (matrix.hasNaN()) throw new Error('NaN detected in matrix! >:(')
    this.matrix = matrix
    this.words = words
  }

  markovChain () {
    const chain = this.matrix.clone()
    const sums = chain.rowSums()
    for (let row = 0; row < chain.rows; row++) {
      for (let col = 0; col < chain.cols; col++) {
        chain.set(row, col, chain.get(row, col) / sums[row])
      }
    }
    return chain
  }

  combineWith (...sets) {
    return WordFrequencies.combine(this, ...sets)
  }

  makeKey () {
    return new Map(this.words.map((word, i) => [word, i]))
  }

  wordsByFrequency (sorted = false, key = this.makeKey()) {
    const sums = this.matrix.rowSums()
    const words = this.words.map((word, i) => [word, sums[i]])
    if (sorted) {
      words.sort((a, b) => b[1] - a[1])
    }
    const map = new Map(words)
    map.delete(BOUND)
    return map
  }

  toFile () {
    return `${this.words.join('\n')}\n=\n${this.matrix.toFile()}`
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
    wordTypes.set(BOUND, Infinity)
    for (const sentence of sentences) {
      for (const word of sentence) {
        wordTypes.set(word, (wordTypes.get(word) || 0) + 1)
      }
    }
    const words = [...wordTypes.keys()]
      .filter(word => wordTypes.get(word) >= minUsage)
    const matrix = new Matrix(words.length, words.length)
    const boundIndex = words.indexOf(BOUND)
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
      const newIndices = new Map(words.map(word => [word, wordUnion.indexOf(word)]))
      for (let row = 0; row < matrix.rows; row++) {
        for (let col = 0; col < matrix.cols; col++) {
          bigger.data[newIndices.get(words[row]) * bigger.cols + newIndices.get(words[col])] +=
            matrix.data[row * matrix.cols + col]
        }
      }
    }
    sets.forEach(addMatrixDataFor)
    return new WordFrequencies(bigger, wordUnion)
  }
}
