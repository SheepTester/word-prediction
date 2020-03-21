// https://en.wikipedia.org/wiki/Bracket#Encoding_in_digital_media
const brackets = {
  open: '[',
  openTop: '\u23A1',
  openMiddle: '\u23A2',
  openBottom: '\u23A3',
  close: ']',
  closeTop: '\u23A4',
  closeMiddle: '\u23A5',
  closeBottom: '\u23A6'
}

export class Matrix {
  constructor (rows, cols, data) {
    this.rows = rows
    this.cols = cols
    this._length = rows * cols
    if (data && data.length !== this._length) {
      throw new Error('Given matrix does not match the given dimensions.')
    }
    // To get an item, row * this.cols + col
    this.data = new Float32Array(data || this._length)
  }

  scale (n) {
    for (let i = 0; i < this._length; i++) {
      this.data[i] *= n
    }
    return this
  }

  multiply (matrix) {
    if (this.cols !== matrix.rows) {
      throw new Error(`Cannot multiply matrices of dimensions ${this.rows} x ${this.cols} and ${matrix.rows} x ${matrix.cols}`)
    }
    const pairs = this.cols
    const product = new Matrix(this.rows, matrix.cols)
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < matrix.cols; col++) {
        const position = row * product.cols + col
        for (let i = 0; i < pairs; i++) {
          product.data[position] += this.data[i * this.cols + col] * matrix.data[row * matrix.cols + i]
        }
      }
    }
    return product
  }

  toString () {
    let string = '\n'
    for (let row = 0; row < this.rows; row++) {
      string += row === 0 ? (this.rows === 1 ? brackets.open : brackets.openTop)
        : row === this.rows - 1 ? brackets.openBottom
        : brackets.openMiddle
      string += ' ' + this.data.slice(row * this.cols, (row + 1) * this.cols).join('\t') + ' '
      string += row === 0 ? (this.rows === 1 ? brackets.close : brackets.closeTop)
        : row === this.rows - 1 ? brackets.closeBottom
        : brackets.closeMiddle
      string += '\n'
    }
    return string
  }
}
