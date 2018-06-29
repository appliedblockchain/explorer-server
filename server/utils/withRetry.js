'use strict'
const { isFunction } = require('lodash')
const validate = require('ow')
const timeout = require('./timeout')

/* :: (Function, Array<any>, object) -> Function */
const withRetry = (
  funcThatMightThrow,
  args = [],
  {
    maxAttempts = Number.POSITIVE_INFINITY,
    wait = true,
    maxWaitTime = 3 * 60 * 1E3,
    onFail = null
  } = {}
) => {
  validate(funcThatMightThrow, validate.function)
  validate(args, validate.array)
  validate(maxAttempts, validate.number.positive)
  validate(wait, validate.boolean)
  validate(maxWaitTime, validate.number.greaterThanOrEqual(0))

  let attempts = 0
  let time = 2

  const funcWithRetry = async () => {
    while (attempts <= maxAttempts) {
      try {
        const result = await funcThatMightThrow(...args)

        return result
      } catch (e) {
        if (isFunction(onFail)) {
          await onFail(e)
        }

        if (wait) {
          await timeout(Math.min(time, maxWaitTime))
          time **= 1.25
        }

        attempts += 1
        continue
      }
    }
  }

  return funcWithRetry
}

module.exports = withRetry
