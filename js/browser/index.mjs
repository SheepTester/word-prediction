import getCaretCoordinates from 'textarea-caret'
import { WordFrequencies } from '../core/word-frequencies.mjs'
import { NUMBER, COMMA, BOUND } from '../core/markers.mjs'
import { capitalize } from '../core/capitalize.mjs'
import { FrequencyRenderer } from './frequency-renderer.mjs'
import './focus-visible.mjs'

let wordFrequencies, key, chain

const MAX_LIST_HEIGHT = 300
const MAX_SUGGESTIONS = 10
const autocompleteList = document.getElementById('autocomplete')
const input = document.getElementById('input')
const typeProgressRegex = /(?:(^|\.|!|\?|\n)|(,)|([a-z']+)[ \t]|([0-9\.]+)[ \t])[ \t]*([a-z']*)$/i
const getProgressRegex = /[a-z']*$/i
const getProgressWithSpacesRegex = /[ \t]*[a-z']*$/i
let autocomplete = []
let prevWord = null
let prevWordSuggestions = []
function listPredictions () {
  autocomplete = []

  if (input.selectionStart !== input.selectionEnd) return
  if (!key && !chain) return

  const beforeCursor = input.value.slice(0, input.selectionStart)
  const match = beforeCursor.match(typeProgressRegex)
  if (!match) return

  const [, newSent, comma, word, number, progress] = match
  let currentPrevWord
  if (newSent !== undefined) currentPrevWord = BOUND
  else if (comma !== undefined) currentPrevWord = COMMA
  else if (word !== undefined) currentPrevWord = word.toLowerCase()
  else if (number !== undefined) currentPrevWord = NUMBER
  else return

  if (currentPrevWord !== prevWord) {
    let prevWordRow
    if (word && wordFrequencies) {
      const actualPrevWord = wordFrequencies.words.find(properWord =>
        properWord.toLowerCase() === currentPrevWord)
      prevWordRow = key.get(actualPrevWord)
    } else {
      prevWordRow = key.get(currentPrevWord)
    }
    prevWordSuggestions = []
    if (prevWordRow !== undefined) {
      prevWord = currentPrevWord
      let numberFound = false
      for (let col = 0; col < chain.cols; col++) {
        const word = wordFrequencies.words[col]
        const freq = chain.get(prevWordRow, col)
        if (freq !== 0) {
          if (word === NUMBER) {
            numberFound = [NUMBER, freq]
          } else {
            prevWordSuggestions.push([
              prevWord === BOUND
                // Capitalize sentences
                ? capitalize(word)
                : word,
              freq
            ])
          }
        }
      }
      if (prevWordSuggestions.length === 0 && numberFound) {
        // Prevent case where the only transition from a word is to a number
        // which stopped random sentence generation.
        prevWordSuggestions._number = numberFound
      } else {
        prevWordSuggestions.sort((a, b) => b[1] - a[1])
      }
    }
  }

  autocomplete = prevWordSuggestions.filter(([word]) => word.toLowerCase().startsWith(progress.toLowerCase()))
  if (prevWordSuggestions._number) {
    autocomplete._number = prevWordSuggestions._number
  }
}
let lastEntries
let selected = null
function renderAutocomplete () {
  if (autocomplete.length) {
    autocompleteList.classList.remove('hidden')

    const entries = autocomplete.slice(0, MAX_SUGGESTIONS)
    const entriesString = JSON.stringify(entries)
    if (lastEntries === entriesString) return
    lastEntries = entriesString
    selected = null

    autocompleteList.innerHTML = ''
    for (let i = 0; i < entries.length; i++) {
      const [word, freq] = entries[i]
      if (word === NUMBER) continue

      const elem = document.createElement('div')
      elem.className = 'autocomplete-item'
      elem.dataset.i = i
      autocompleteList.appendChild(elem)

      const wordElem = document.createElement('span')
      wordElem.className = 'autocomplete-word'
      switch (word) {
        case COMMA:
          wordElem.textContent = ','
          break
        case BOUND:
          wordElem.textContent = '.'
          break
        default:
          wordElem.textContent = word
      }
      elem.appendChild(wordElem)

      elem.appendChild(document.createTextNode(' '))

      const freqElem = document.createElement('span')
      freqElem.className = 'autocomplete-frequency'
      freqElem.textContent = (freq * 100).toFixed(2) + '%'
      elem.appendChild(freqElem)
    }
  } else {
    autocompleteList.classList.add('hidden')
    selected = null
  }
}
function setSelected (newSelected) {
  if (!autocompleteList.children.length) return
  if (selected !== null) {
    const oldSelected = autocompleteList.children[selected]
    oldSelected.classList.remove('selected')
  }
  newSelected = (newSelected + autocompleteList.children.length) % autocompleteList.children.length
  selected = newSelected
  const entry = autocompleteList.children[selected]
  entry.classList.add('selected')
  if (entry.scrollIntoViewIfNeeded) {
    entry.scrollIntoViewIfNeeded()
  } else {
    entry.scrollIntoView()
  }
}
function autocompleteSelected () {
  if (selected !== null) {
    const beforeCursor = input.value.slice(0, input.selectionStart)
    const [option] = autocomplete[selected]
    const selection = option === COMMA || option === BOUND
      ? beforeCursor.match(getProgressWithSpacesRegex)
      : beforeCursor.match(getProgressRegex)
    if (!selection) {
      return false
    }
    input.selectionStart = selection.index
    let insert
    switch (option) {
      case NUMBER:
        insert = Math.floor(Math.random() * 10000) + ' '
        break
      case COMMA:
        insert = ', '
        break
      case BOUND:
        insert = '. '
        break
      default:
        insert = option + ' '
    }
    document.execCommand('insertText', false, insert)
    return true
  } else {
    return false
  }
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
function updateAutocomplete () {
  listPredictions()
  renderAutocomplete()
  moveAutocomplete()
}
input.addEventListener('input', updateAutocomplete)
input.addEventListener('scroll', moveAutocomplete)
document.addEventListener('scroll', moveAutocomplete)
document.addEventListener('selectionchange', e => {
  if (document.activeElement === input) {
    updateAutocomplete()
  }
})
document.addEventListener('keydown', e => {
  if (autocomplete.length && document.activeElement === input) {
    if (e.key === 'ArrowDown') {
      if (selected === null) {
        setSelected(0)
      } else {
        setSelected(selected + 1)
      }
    } else if (e.key === 'ArrowUp') {
      if (selected === null) {
        setSelected(-1)
      } else {
        setSelected(selected - 1)
      }
    } else if (e.key === 'Tab') {
      if (!autocompleteSelected()) return
      document.body.classList.remove('focus-visible')
    } else {
      return
    }
    e.preventDefault()
  }
})
autocompleteList.addEventListener('click', e => {
  const item = e.target.closest('.autocomplete-item')
  if (item) {
    input.focus()
    setSelected(+item.dataset.i)
    autocompleteSelected()
    e.preventDefault()
  }
})

const autoGenBtn = document.getElementById('random')
let generating = false
let generateID = null
function generate () {
  if (autocomplete && document.activeElement === input) {
    const max = autocomplete.reduce((acc, curr) => acc + curr[1], 0)
    let random = Math.random() * max
    for (let i = 0; i < autocomplete.length; i++) {
      random -= autocomplete[i][1]
      // If `random` < freq
      if (random < 0) {
        setSelected(i)
        break
      }
    }
    if (autocomplete.length === 0 && autocomplete._number) {
      // This is really hacky but it works, I think
      autocomplete.unshift(autocomplete._number)
      setSelected(0)
      autocompleteSelected()
      autocomplete.shift()
    } else {
      autocompleteSelected()
    }
  }

  if (generating) {
    generateID = setTimeout(generate, 50)
  }
}
autoGenBtn.addEventListener('click', e => {
  input.focus()
  if (generating) {
    generating = false
    if (generateID !== null) {
      clearTimeout(generateID)
      generateID = null
    }
    autoGenBtn.textContent = 'Generate randomly'
  } else {
    generating = true
    generate()
    autoGenBtn.textContent = 'Stop generating'
  }
})

const renderer = new FrequencyRenderer()
renderer.addTo(document.getElementById('markov-vis'))
renderer.resize()

function useFrequencies (frequencies) {
  wordFrequencies = frequencies
  key = frequencies.makeKey()
  chain = frequencies.markovChain()

  renderer.setFrequencies(frequencies)
  renderer.render()

  prevWord = null
  prevWordSuggestions = []
  updateAutocomplete()
}

function loadFrequencies (url) {
  return fetch(url)
    .then(r => r.text())
    .then(WordFrequencies.fromFile)
    .then(useFrequencies)
}

const customSource = '[CUSTOM]'
const sources = [
  { url: './frequencies/peter-piper.txt', name: 'Peter Piper' },
  { url: './frequencies/winston.txt', name: 'Down with Big Brother' },
  { url: './frequencies/bee-movie.txt', name: 'Bee Movie' },
  { url: './frequencies/gatm.txt', name: 'A Geometric Approach to Matrices' },
  { url: customSource, name: 'Custom' }
]
const defaultSource = './frequencies/bee-movie.txt'
const customSourceWrapper = document.getElementById('source-wrapper')
const customSourceText = document.getElementById('source-text')
const customSourceBtn = document.getElementById('use-source')
const sourceSelect = document.getElementById('source')
for (const { url, name } of sources) {
  const option = document.createElement('option')
  option.value = url
  option.textContent = name
  sourceSelect.appendChild(option)
}
sourceSelect.addEventListener('change', e => {
  if (sourceSelect.value === customSource) {
    customSourceWrapper.classList.remove('hidden')
  } else {
    loadFrequencies(sourceSelect.value)
    customSourceWrapper.classList.add('hidden')
  }
})
customSourceBtn.addEventListener('click', e => {
  useFrequencies(WordFrequencies.fromWords(customSourceText.value))
})
sourceSelect.value = defaultSource
loadFrequencies(defaultSource)

window.addEventListener('resize', e => {
  let doneMeasuring
  const promise = new Promise(resolve => doneMeasuring = resolve)
  renderer.resize(promise)
  moveAutocomplete(promise)
  doneMeasuring()
})
