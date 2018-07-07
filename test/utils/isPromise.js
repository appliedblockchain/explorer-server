'use strict'

const isPromise = val => Object.prototype.toString.call(val).includes('promise')

module.exports = { isPromise }
