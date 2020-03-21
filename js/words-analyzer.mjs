function isUpperCase (letter) {
  // Ignores accents oof
  return letter.toUpperCase() === letter && /[A-Z]/.test(letter)
}

export function digest (text) {
  // Far from perfect:
  // - The U.S. scientists said, "We found that rulers in states like
  //          ^ false positive
  //   California, Utah, etc. measure 300. mm in length. This supports our
  //                        ^            ^             ^
  //   hypothesis."
  //             ^ false negative
  return text
    .split(/\. |\?|!|\r?\n/)
    .map(sentence =>
      sentence
        .split(/\s+/)
        .map((word, i) => {
          if (!word) return null
          // Asssume the word isn't normally capitalized, so if it's the first word
          // of a sentence, lowercase it.
          if (i === 0 && isUpperCase(word[0])) {
            word = word.toLowerCase()
          }
          if (/^\d*\.\d*$/.test(word)) return '[number]'
          word = word.replace(/[^a-z]/i, '')
          if (word) return word
          return null
        })
        .filter(word => word))
    .filter(sentence => sentence.length)
}
