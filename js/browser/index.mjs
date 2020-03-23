import getCaretCoordinates from 'textarea-caret'
import { WordFrequencies } from '../core/word-frequencies.mjs'

const MAX_LIST_HEIGHT = 300
const autocompleteList = document.getElementById('autocomplete')
const input = document.getElementById('input')
function moveAutocomplete () {
  if (!autocompleteList.classList.contains('hidden')) {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const scrollY = input.scrollTop
    const { top: x, left: y } = input.getBoundingClientRect()
    const { width, height } = autocompleteList.getBoundingClientRect()
    const { top, left, height: cursorHeight } = getCaretCoordinates(input, input.selectionEnd)
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
  if (input.selectionStart === input.selectionEnd) {
    autocompleteList.classList.remove('hidden')
  } else {
    autocompleteList.classList.add('hidden')
  }
  moveAutocomplete()
})
input.addEventListener('scroll', moveAutocomplete)
document.addEventListener('selectionchange', () => {
  if (document.activeElement === input) {
    if (input.selectionStart !== input.selectionEnd) {
      autocompleteList.classList.add('hidden')
    }
    moveAutocomplete()
  }
})

fetch('./frequencies/bee-movie.txt')
  .then(r => r.text())
  .then(WordFrequencies.fromFile)
  .then(frequencies => {
    const key = frequencies.makeKey()
    const words = frequencies.wordsByFrequency(true, key)
    const chain = frequencies.markovChain()
    // console.log(chain)
  })
