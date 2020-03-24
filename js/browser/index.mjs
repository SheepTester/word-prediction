import getCaretCoordinates from 'textarea-caret'
import { WordFrequencies } from '../core/word-frequencies.mjs'
import { NUMBER, COMMA, BOUND } from '../core/markers.mjs'
import { FrequencyRenderer } from './frequency-renderer.mjs'

let wordFrequencies, key, chain

const MAX_LIST_HEIGHT = 300
const autocompleteList = document.getElementById('autocomplete')
const input = document.getElementById('input')
const typeProgressRegex = /(?:(^|\.|!|\?)|(,)|([a-z']+)\s|([0-9\.]+)\s)\s*([a-z']*)$/i
let autocomplete
let prevWord
let prevWordSuggestions
function listPredictions () {
  autocomplete = []

  if (input.selectionStart !== input.selectionEnd) return
  if (!key && !chain) return

  const beforeCursor = input.value.slice(0, input.selectionStart)
  const match = beforeCursor.match(typeProgressRegex)
  if (!match) return

  const [, newSent, comma, word, number, progress] = match
  let prevWord
  if (newSent) prevWord = BOUND
  else if (comma) prevWord = COMMA
  else if (word) prevWord = word
  else if (number) prevWord = NUMBER
  else return

  if (prevPrevWord !== prevWord) {
    let prevWordRow
    if (word && wordFrequencies) {
      const actualPrevWord = wordFrequencies.words.find(properWord =>
        properWord.toLowerCase() === word.toLowerCase()) || null
      prevWordRow = key.get(actualPrevWord)
    } else {
      prevWordRow = key.get(prevWord)
    }
    if (prevWordRow) {
      prevPrevWord = prevWord
      prevWordSuggestions = []
      for (let col = 0; col < frequencies.matrix.cols; col++) {
        const freq = frequencies.matrix.get(prevWordRow, col)
        if (freq !== 0) {
          prevWordSuggestions.push([frequencies.words[row], freq])
        }
      }
      prevWordSuggestions.sort((a, b) => b[1] - a[1])
    }
  }

  autocomplete = prevWordSuggestions.filter(([word]) => word.toLowerCase().startsWith(progress))
}
async function moveAutocomplete (then = Promise.resolve()) {
  if (!autocompleteList.classList.contains('hidden')) {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const scrollY = input.scrollTop
    const { left: x, top: y } = input.getBoundingClientRect()
    const { width, height } = autocompleteList.getBoundingClientRect()
    const { top, left, height: cursorHeight } = getCaretCoordinates(input, input.selectionEnd)
    await then
    if (x + left + width > windowWidth) {
      autocompleteList.style.left = windowWidth - width + 'px'
    } else {
      autocompleteList.style.left = x + left + 'px'
    }
    if (y + top - scrollY + cursorHeight + MAX_LIST_HEIGHT > windowHeight) {
      if (y + top - MAX_LIST_HEIGHT < 0) {
        // There's no room either way, so might as well squish below instead
        autocompleteList.style.top = y + top - scrollY + cursorHeight + 'px'
        autocompleteList.style.maxHeight = windowHeight - (y + top + cursorHeight + MAX_LIST_HEIGHT) + 'px'
      } else {
        autocompleteList.style.top = y + top - scrollY - height + 'px'
        autocompleteList.style.maxHeight = null
      }
    } else {
      autocompleteList.style.top = y + top - scrollY + cursorHeight + 'px'
      autocompleteList.style.maxHeight = null
    }
  }
}
input.addEventListener('input', e => {
  listPredictions()
  if (autocomplete.length) {
    autocompleteList.classList.remove('hidden')
    autocompleteList = autocomplete.join('\n') // TODO
  } else {
    autocompleteList.classList.add('hidden')
  }
  // moveAutocomplete()
})
input.addEventListener('scroll', moveAutocomplete)
document.addEventListener('selectionchange', () => {
  if (document.activeElement === input) {
    if (input.selectionStart !== input.selectionEnd) {
      autocomplete = []
      autocompleteList.classList.add('hidden')
    }
    moveAutocomplete()
  }
})

const renderer = new FrequencyRenderer()
renderer.addTo(document.getElementById('markov-vis'))
renderer.resize()
fetch('./frequencies/bee-movie.txt')
  .then(r => r.text())
  .then(WordFrequencies.fromFile)
  .then(frequencies => {
    wordFrequencies = frequencies
    key = frequencies.makeKey()
    chain = frequencies.markovChain()
    renderer.setFrequencies(frequencies)
    renderer.render()
  })

window.addEventListener('resize', e => {
  let doneMeasuring
  const promise = new Promise(resolve => doneMeasuring = resolve)
  renderer.resize(promise)
  moveAutocomplete(promise)
  doneMeasuring()
})
