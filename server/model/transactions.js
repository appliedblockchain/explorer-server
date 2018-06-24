'use strict'
const { get, isFunction } = require('lodash')
const { prefixHex } = require('@appliedblockchain/bdash')
const { standardTxHandler } = require('../standardTxHandler')

/**
 [1]. @NOTE: web3.eth.getBlock() is returning null sometimes. This is unexpected
 behaviour which is resolved using get().
 */

/* :: (Web3, object) -> Promise<object> */
const getTransactions = async (web3, { limit = 10 } = {}) => {
  const currBlockNumber = await web3.eth.getBlockNumber()
  const txs = []

  let blockNumber = currBlockNumber

  while (txs.length < limit) {
    const block = await web3.eth.getBlock(blockNumber, true) /* [1] */
    const transactions = get(block, 'transactions', []) /* [1] */

    if (transactions.length > 0) {
      txs.push(...transactions)
    }

    blockNumber -= 1

    if (blockNumber < 0) {
      break
    }
  }

  return txs.slice(0, limit)
}


/* :: (Web3, string, object) -> Promise<object> */
const getTransaction = async (web3, txHash, opts) => {
  const { txHandler, networkConfigPath } = opts
  const prefixed = prefixHex(txHash)
  const [ transaction, receipt ] = await Promise.all([
    web3.eth.getTransaction(prefixed),
    web3.eth.getTransactionReceipt(prefixed)
  ])

  let tx = { ...transaction, ...receipt }

  if (opts.useStandardHandler) {
    tx = await standardTxHandler({ tx, web3, networkConfigPath })
  }

  if (isFunction(txHandler)) {
    tx = await txHandler({ tx, web3, networkConfigPath })
  }

  return tx
}

module.exports = {
  getTransactions,
  getTransaction
}
