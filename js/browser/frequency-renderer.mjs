const CELL_SIZE = 20
const CELL_PADDING = 2
const LABEL_PADDING = 5
const LABEL_FONT = '10px "Merriweather", serif'
const FREQ_FONT = '10px "Merriweather", serif'

export class FrequencyRenderer {
  constructor () {
    this.canvas = document.createElement('canvas')
    this.canvas.className = 'frequency-renderer'
    this._context = this.canvas.getContext('2d')
    this.scrollX = 0
    this.scrollY = 0
    this._width = 0
    this._height = 0

    this.canvas.addEventListener('wheel', e => {
      this.scrollX += e.shiftKey ? e.deltaY : e.deltaX
      this.scrollY += e.shiftKey ? e.deltaX : e.deltaY
      this.render()
    }, { passive: false })

    let scrollPointer = null
    this.canvas.addEventListener('pointerdown', e => {
      if (scrollPointer === null) {
        scrollPointer = e.pointerId
        this.canvas.setPointerCapture(scrollPointer)
      }
    })
    this.canvas.addEventListener('pointermove', e => {
      if (scrollPointer === e.pointerId) {
        // NOTE: At least on Chrome, movementX/Y is affected by devicePixelRatio
        this.scrollX -= e.movementX
        this.scrollY -= e.movementY
        this.render()
      }
    })
    const pointerend = e => {
      if (scrollPointer === e.pointerId) {
        scrollPointer = null
      }
    }
    this.canvas.addEventListener('pointerup', pointerend)
    this.canvas.addEventListener('pointercancel', pointerend)
  }

  setFrequencies (frequencies) {
    this.frequencies = frequencies
    this._key = frequencies.makeKey()
    this._words = [...frequencies.wordsByFrequency(true, this._key).keys()]
    this._chain = frequencies.markovChain()

    this._context.font = LABEL_FONT
    let maxWidth = 0
    for (const word of this._words) {
      const { width } = this._context.measureText(word)
      if (width > maxWidth) maxWidth = width
    }
    this._maxWidth = maxWidth
  }

  addTo (elem) {
    elem.appendChild(this.canvas)
    this.wrapper = elem
  }

  async resize (then = Promise.resolve()) {
    if (this.wrapper) {
      const { width, height } = this.wrapper.getBoundingClientRect()
      const dpr = window.devicePixelRatio
      this._width = width
      this._height = height
      await then
      this.canvas.width = width * dpr
      this.canvas.height = height * dpr
      this._context.scale(dpr, dpr)
      this.render()
    }
  }

  _getFrequency (row, col) {
    return this._chain.get(this._key.get(this._words[row]), this._key.get(this._words[col]))
  }

  render () {
    if (!this.frequencies || !this.wrapper) return

    const c = this._context
    c.clearRect(0, 0, this._width, this._height)
    c.textBaseline = 'middle'

    const offset = this._maxWidth + 2 * LABEL_PADDING

    const maxScroll = offset + this._words.length * CELL_SIZE
    if (this.scrollX < 0) {
      this.scrollX = 0
    } else if (this.scrollX > maxScroll - this._width) {
      this.scrollX = maxScroll - this._width
    }
    if (this.scrollY < 0) {
      this.scrollY = 0
    } else if (this.scrollY > maxScroll - this._height) {
      this.scrollY = maxScroll - this._height
    }

    const minX = Math.max(Math.floor((this.scrollX - offset) / CELL_SIZE), 0)
    const maxX = Math.min(Math.ceil((this.scrollX + this._width - offset) / CELL_SIZE), this._words.length)
    const minY = Math.max(Math.floor((this.scrollY - offset) / CELL_SIZE), 0)
    const maxY = Math.min(Math.ceil((this.scrollY + this._height - offset) / CELL_SIZE), this._words.length)

    c.font = FREQ_FONT
    c.textAlign = 'center'
    for (let row = minY; row < maxY; row++) {
      for (let col = minX; col < maxX; col++) {
        const freq = this._getFrequency(row, col)
        c.fillStyle = `rgba(255, 0, 0, ${freq})`
        c.fillRect(
          col * CELL_SIZE + offset - this.scrollX,
          row * CELL_SIZE + offset - this.scrollY,
          CELL_SIZE,
          CELL_SIZE
        )
        c.fillStyle = `rgba(255, 255, 255, ${freq * 0.99 + 0.01})`
        c.fillText(
          freq.toFixed(3),
          (col + 0.5) * CELL_SIZE + offset - this.scrollX,
          (row + 0.5) * CELL_SIZE + offset - this.scrollY,
          CELL_SIZE - CELL_PADDING
        )
      }
    }

    c.font = LABEL_FONT
    c.textAlign = 'left'
    c.fillStyle = 'white'
    for (let row = minY; row < maxY; row++) {
      c.fillText(this._words[row], LABEL_PADDING, (row + 0.5) * CELL_SIZE + offset - this.scrollY)
    }
    c.save()
    c.rotate(Math.PI / 2)
    for (let col = minX; col < maxX; col++) {
      c.fillText(this._words[col], LABEL_PADDING, -((col + 0.5) * CELL_SIZE + offset - this.scrollX))
    }
    c.restore()
  }
}
