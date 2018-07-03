'use strict'
const { isFunction } = require('lodash')
const { prefixHex } = require('@appliedblockchain/bdash')
const { standardTxHandler } = require('../../standardTxHandler')

/* :: (Web3, string, object) -> Promise<object> */
const getTransaction = async (web3, txHash, opts) => {
  const { txHandler, networkConfigPath } = opts
  const prefixed = prefixHex(txHash)
  const [ transaction, receipt ] = await Promise.all([
    web3.eth.getTransaction(prefixed),
    web3.eth.getTransactionReceipt(prefixed)
  ])

  let tx = { ...transaction, ...receipt }

  /* @NOTE: Need to make an extra request to get the timestamp */
  const { timestamp } = await web3.eth.getBlock(tx.blockNumber)
  Object.assign(tx, { timestamp })

  if (opts.useStandardHandler) {
    tx = await standardTxHandler({ tx, web3, networkConfigPath })
  }

  if (isFunction(txHandler)) {
    tx = await txHandler({ tx, web3, networkConfigPath })
  }

  return tx
}

module.exports = { getTransaction }
