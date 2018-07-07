'use strict'
const validate = require('ow')

/** FIFO (First in first out) Data structure with fixed size */

/* :: (number, any) -> object */
const createFixedStack = (size, defaultVal) => {
  validate(size, validate.number.positive.integer)

  let newestIdx = 0
  const stack = Array(size).fill(defaultVal)

  const retrieve = (total = 1) => {
    validate(total, validate.number.positive.integer.lessThanOrEqual(size))

    const items = []
    for (let i = newestIdx; items.length < total; i = (i + 1) % size) {
      const curr = stack[i]
      items.push(curr)
    }

    return items
  }

  const push = (...items) => {
    const startIdx = Math.max(items.length - size, 0)

    for (let i = startIdx; i < items.length; i += 1) {
      const currItem = items[i]
      const oldestIdx = (newestIdx + size - 1) % size

      stack[oldestIdx] = currItem
      newestIdx = oldestIdx
    }

    return retrieve(size)
  }

  const api = {
    retrieve,
    push,
    size() {
      return size
    }
  }

  return Object.freeze(api)
}

module.exports = createFixedStack
