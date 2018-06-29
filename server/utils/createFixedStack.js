'use strict'
const { times, isFunction } = require('lodash')
const validate = require('ow')

/** FIFO (First in first out) Data structure with fixed size */

/* :: (number, any) -> object */
const createFixedStack = (size, defaultVal) => {
  validate(size, validate.number.positive.integer)

  /* @NOTE: [newestItem...oldestItem] */
  const stack = times(size).map(
    isFunction(defaultVal) ? defaultVal : () => defaultVal
  )

  const api = {
    push(...items) {
      const toAdd = items.length <= size
        ? items
        : items.slice(items.length - size)

      times(toAdd.length, stack.pop.bind(stack))
      toAdd.forEach(item => stack.unshift(item))

      return stack
    },

    retrieve(total = 1) {
      validate(total, validate.number.positive.integer.lessThanOrEqual(size))

      return stack.slice(0, total)
    },

    size() {
      return size
    }
  }

  return Object.freeze(api)
}

module.exports = createFixedStack
