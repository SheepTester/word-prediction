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
    .map(sentence => {
      const words = sentence.split(/\s+/)
      const processed = []
      for (let i = 0; i < words.length; i++) {
        const subwords = words[i].split(',')
        for (let j = 0; j < subwords.length; j++) {
          let word = subwords[j]
          if (word) {
            // Asssume the word isn't normally capitalized, so if it's the first word
            // of a sentence, lowercase it.
            if (i === 0 && j === 0 && isUpperCase(word[0])) {
              word = word.toLowerCase()
            }
            if (/^(?:\d+\.?\d*|\d*\.\d+)$/.test(word)) {
              processed.push('[number]')
              continue
            }
            word = word.replace(/[^a-z]/gi, '')
            if (word) {
              processed.push(word)
            }
          }
          if (j !== 0) {
            processed.push(',')
          }
        }
      }
      return processed
    })
    .filter(sentence => sentence.length)
}

/**
 * "Chyme or chymus is the semi-fluid mass of partly digested food that is
 * expelled by the stomach"
 *   - Wikipedia https://en.wikipedia.org/wiki/Chyme
 *
 * Makes the cases of each word the same based on which is used most often.
 * This is to allow weird words like "I" and "Albert" to be capitalized
 */
export function preferredCase (chyme) {
  const formSet = new Map()
  for (const word of [].concat(...chyme)) {
    const lowercase = word.toLowerCase()
    if (!formSet.has(lowercase)) formSet.set(lowercase, new Map())

    const forms = formSet.get(lowercase)
    forms.set(word, (forms.get(word) || 0) + 1)
  }
  for (const [lowercase, forms] of formSet) {
    let max = 0
    let maxForm = lowercase
    for (const [form, frequency] of forms) {
      if (frequency > max) {
        max = frequency
        maxForm = form
      }
    }
    formSet.set(lowercase, maxForm)
  }
  return chyme
    .map(sentence =>
      sentence
        .map(word => formSet.get(word.toLowerCase())))
}
