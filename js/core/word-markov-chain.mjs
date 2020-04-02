import { digest, preferredCase } from './words-analyzer.mjs'
import { BOUND, SEP } from './markers.mjs'

/**
 * A more efficient Markov chain that doesn't use matrices and supports higher
 * orders
 */
export class WordMarkovChain {
  constructor (order = 1, data = new Map()) {
    this.order = order
    this._data = data
  }

  // Use spread operator to clone array lol
  _getTuple (...words) {
    while (words.length < order) {
      words.unshift(BOUND)
    }
    return words.join(SEP)
  }

  getFrequencies (words, normalize = true) {
    const tuple = this._getTuple(words)
    const freqMap = this._data.get(tuple)
    if (freqMap) {
      const frequencies = [...freqMap]
      if (normalize) {
        const total = frequencies.reduce((acc, curr) => acc + curr[1], 0)
        for (const pair of frequencies) {
          pair[1] /= total
        }
      }
      return frequencies
    } else {
      return []
    }
  }

  pickRandom (words) {
    const frequencies = this.getFrequencies(words, false)
    if (frequencies.length === 0) return null
    const total = frequencies.reduce((acc, curr) => acc + curr[1], 0)
    let random = Math.floor(Math.random() * total)
    for (const [word, frequency] of frequencies) {
      random -= frequency
      if (random < 0) return word
    }
    return null
  }

  toFile () {
    return JSON.stringify({
      order: this.order,
      data: Object.fromEntries(Array.from(this._data, ([tuple, frequencies]) =>
        [tuple, Object.fromEntries(frequencies)]))
    }, null, 2)
  }

  static fromFile (file) {
    const { order, data } = JSON.parse(file)
    return new WordMarkovChain(order, new Map(Object.entries(data)
      .map(([tuple, frequencies]) => [tuple, new Map(Object.entries(frequencies))])))
  }

  static fromWords (text, target) {
    if (typeof target === 'number') {
      target = new WordMarkovChain(target)
    } else if (!target) {
      target = new WordMarkovChain()
    }
    // Private access ok within class I believe
    const { _data: chain, order } = target
    const words = [BOUND]
      .concat(...preferredCase(digest(text))
        .map(arr => [...arr, BOUND]))
    // Pad array with BOUND for beginning and end
    // eg (BOUND, BOUND, "first") -> "second"
    for (let i = 1; i < order; i++) {
      words.unshift(BOUND)
      words.push(BOUND)
    }
    for (let i = 0; i < words.length - order; i++) {
      const tuple = words.slice(i, i + order).join(SEP)
      const word = words[i + order]
      let freqMap = chain.get(tuple)
      if (!freqMap) {
        freqMap = new Map()
        chain.set(tuple, freqMap)
      }
      freqMap.set(word, (freqMap.get(word) || 0) + 1)
    }
    return target
  }
}
