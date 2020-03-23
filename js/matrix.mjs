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
          product.data[position] += this.data[row * this.cols + i] * matrix.data[i * matrix.cols + col]
        }
      }
    }
    return product
  }

  transpose () {
    const transpose = new Matrix(this.cols, this.rows)
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        transpose.data[col * transpose.cols + row] = this.data[row * this.cols + col]
      }
    }
    return transpose
  }

  rowSums () {
    const sums = new Float32Array(this.rows)
    for (let row = 0; row < this.rows; row++) {
      let sum = 0
      for (let col = 0; col < this.cols; col++) {
        sum += this.data[row * this.cols + col]
      }
      sums[row] = sum
    }
    return sums
  }

  get (row, col) {
    return this.data[row * this.cols + col]
  }

  set (row, col, value) {
    this.data[row * this.cols + col] = value
    return this
  }

  clone () {
    return new Matrix(this.rows, this.cols, this.data)
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

  toFile () {
    let file = `${this.rows}x${this.cols}`
    let lastNum = null
    let instances = 0
    for (const num of this.data) {
      if (num === lastNum) {
        instances++
      } else {
        if (instances > 0) {
          file += instances === 1 ? `\n${lastNum}` : `\n${lastNum}x${instances}`
        }
        lastNum = num
        instances = 1
      }
    }
    if (instances > 0) {
      file += instances === 1 ? `\n${lastNum}` : `\n${lastNum}x${instances}`
    }
    return file
  }

  hasNaN () {
    for (const num of this.data) {
      if (Number.isNaN(num)) return true
    }
    return false
  }

  static identity (size) {
    const identity = new this(size, size)
    for (let i = 0; i < size; i++) {
      identity.data[i * size + i] = 1
    }
    return identity
  }

  static fromFile (file) {
    const [dimensions, ...data] = file.split(/\r?\n/).filter(line => line)
    const [, rows, cols] = dimensions.match(/(\d+)x(\d+)/)
    const matrix = new Matrix(+rows, +cols)
    let i = 0
    for (const line of data) {
      const [, num, instances] = line.match(/(\d+)(?:x(\d+))?/)
      const value = +num
      const repetitions = instances ? +instances : 1
      for (let j = 0; j < repetitions; i++, j++) {
        matrix.data[i] = value
      }
    }
    return matrix
  }
}
