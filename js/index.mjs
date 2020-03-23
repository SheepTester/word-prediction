import getCaretCoordinates from 'textarea-caret'

const IDEAL_LIST_HEIGHT = 300
const autocompleteList = document.getElementById('autocomplete')
const input = document.getElementById('input')
function updateAutocomplete (e) {
  if (e.type === 'input') {
    if (input.selectionStart === input.selectionEnd) {
      autocompleteList.classList.remove('hidden')
    }
  }
  if (!autocompleteList.classList.contains('hidden')) {
    if (input.selectionStart !== input.selectionEnd) {
      autocompleteList.classList.add('hidden')
      return
    }
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight
    const scrollY = input.scrollTop
    const { width } = autocompleteList.getBoundingClientRect()
    const { top, left, height: cursorHeight } = getCaretCoordinates(input, input.selectionEnd)
    if (left + width > windowWidth) {
      autocompleteList.style.left = windowWidth - width + 'px'
    } else {
      autocompleteList.style.left = left + 'px'
    }
    if (top - scrollY + cursorHeight + IDEAL_LIST_HEIGHT > windowHeight) {
      if (top - IDEAL_LIST_HEIGHT < 0) {
        // There's no room either way, so might as well squish below instead
        autocompleteList.style.top = top - scrollY + cursorHeight + 'px'
        autocompleteList.style.height = windowHeight - (top + cursorHeight + IDEAL_LIST_HEIGHT) + 'px'
      } else {
        autocompleteList.style.top = top - scrollY - IDEAL_LIST_HEIGHT + 'px'
        autocompleteList.style.height = IDEAL_LIST_HEIGHT + 'px'
      }
    } else {
      autocompleteList.style.top = top - scrollY + cursorHeight + 'px'
      autocompleteList.style.height = IDEAL_LIST_HEIGHT + 'px'
    }
  }
}
input.addEventListener('input', updateAutocomplete)
input.addEventListener('scroll', updateAutocomplete)
document.addEventListener('selectionchange', updateAutocomplete)
