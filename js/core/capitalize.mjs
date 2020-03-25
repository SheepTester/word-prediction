export function capitalize (str) {
  return str.length
    ? str[0].toUpperCase() + str.slice(1)
    : str
}

// Use .toLowerCase() to decapitalize. This is so that USA doesn't become uSA, for example.
