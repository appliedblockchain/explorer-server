'use strict'
const { isEmpty } = require('lodash')

/* :: (web3, string) -> ?object */
const getBlockOrTx = async (web3, hash) => {
  const [ tx, block ] = await Promise.all([
    web3.eth.getTransaction(hash),
    web3.eth.getBlock(hash)
  ])

  if (!isEmpty(tx)) {
    return {
      type: 'tx',
      value: hash
    }
  }

  if (!isEmpty(block)) {
    return {
      type: 'block',
      value: block.number
    }
  }

  return null
}

module.exports = {
  getBlockOrTx
}
