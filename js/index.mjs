import getCaretCoordinates from 'textarea-caret'

const MAX_LIST_HEIGHT = 300
const autocompleteList = document.getElementById('autocomplete')
const input = document.getElementById('input')
function moveAutocomplete () {
  if (!autocompleteList.classList.contains('hidden')) {
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const scrollY = input.scrollTop
    const { width, height } = autocompleteList.getBoundingClientRect()
    const { top, left, height: cursorHeight } = getCaretCoordinates(input, input.selectionEnd)
    if (left + width > windowWidth) {
      autocompleteList.style.left = windowWidth - width + 'px'
    } else {
      autocompleteList.style.left = left + 'px'
    }
    if (top - scrollY + cursorHeight + MAX_LIST_HEIGHT > windowHeight) {
      if (top - MAX_LIST_HEIGHT < 0) {
        // There's no room either way, so might as well squish below instead
        autocompleteList.style.top = top - scrollY + cursorHeight + 'px'
        autocompleteList.style.maxHeight = windowHeight - (top + cursorHeight + MAX_LIST_HEIGHT) + 'px'
      } else {
        autocompleteList.style.top = top - scrollY - height + 'px'
        autocompleteList.style.maxHeight = null
      }
    } else {
      autocompleteList.style.top = top - scrollY + cursorHeight + 'px'
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
