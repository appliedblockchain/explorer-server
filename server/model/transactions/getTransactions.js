'use strict'
const { times, flatten, get, isNil, pick, isObject, isString } = require('lodash')
const validate = require('ow')
const abiDecoder = require('abi-decoder')
const createFixedStack = require('../../utils/createFixedStack')
const withRetry = require('../../utils/withRetry')
const { getNetworkConfig, getContractInfo } = require('../../standardTxHandler')
const debugWithScope = require('../../utils/debug')

const debug = debugWithScope('model.transactions')

/** Total number of blocks to search Transactions in parallel */
const BLOCKS_IN_PARALLEL = 100
const MAX_TXS = 100

/** Transactions Cache used for serving requests */
const store = Object.seal({
  lastBlock: null,
  isSynching: true,
  latestTxs: createFixedStack(MAX_TXS)
})


/**
 A helper function for getting transactions from multiple blocks at a time.
 @example
   fetchTxs(web3, 100, 5)
   - Gives all txs for block [100, 99, 98, 97, 96, 95]

 [1]. Block number is 0 index based so distance must be <= block number.
 [2]. Block can be null if block number given does not exist in the chain.
 */

/* :: (object, number, number) -> Promise<object> */
const fetchTxs = async (
  web3,
  blockNumber,
  distance,
  { log = false } = {}
) => {
  validate(blockNumber, validate.number.greaterThanOrEqual(0))
  validate(distance, validate.number.greaterThanOrEqual(0))

  if (log) {
    debug(`fetchTxs(blockNumber: ${blockNumber}, distance: ${distance})`)
  }

  const totalReqs = Math.min(blockNumber, distance) + 1 /* [1] */
  const promises = times(totalReqs)
    .map(i => web3.eth.getBlock(blockNumber - i, true))

  const blocks = await Promise.all(promises)
  const txs = blocks.map((block) => {
    const currBlockTxs = get(block, 'transactions', []) /* [2] */
    const timestamp = get(block, 'timestamp') /* [2] */

    return currBlockTxs
      .map(tx => pick(tx, 'hash', 'blockNumber', 'to', 'input'))
      .map(tx => ({ ...tx, timestamp }))
  })

  return flatten(txs)
}


/* :: (object, number) -> Promise<number[]> */
const getLatestTransactions = async (web3, limit) => {
  const txs = []

  const lastBlock = await web3.eth.getBlockNumber()
  let currBlock = lastBlock

  while (txs.length < limit && currBlock >= 0) {
    const args = [ web3, currBlock, BLOCKS_IN_PARALLEL - 1, { log: false } ]
    const $txs = await withRetry(fetchTxs, args)()

    txs.push(...$txs)
    currBlock -= BLOCKS_IN_PARALLEL
  }

  return {
    lastBlock,
    txs: txs.slice(0, limit)
  }
}


/* :: (object[], object) -> void */
const addContractInfo = async (txs, options) => {
  const { contracts } = await getNetworkConfig(options.networkConfigPath)

  txs.forEach((tx) => {
    const info = getContractInfo(contracts, tx.to || tx.creates)

    if (isNil(info)) {
      return
    }

    abiDecoder.addABI(info.abi)

    const decodedMethod = abiDecoder.decodeMethod(tx.input)
    const params = get(decodedMethod, 'params', [])
    const method = isString(tx.creates)
      ? info.name
      : get(decodedMethod, 'method')

    Object.assign(tx, {
      method,
      params,
      contract: info.name
    })
  })
}


/* :: () -> Promise<void> */
const updateLatestTxCache = (web3, options, store) => async () => {
  try {
    const lastBlockInCache = store.lastBlock
    const lastBlock = await web3.eth.getBlockNumber()

    /** Nothing to update */
    if (lastBlock === lastBlockInCache) {
      return
    }

    const distance = lastBlock - lastBlockInCache - 1

    debug(`Fetching transactions for blocks ${lastBlockInCache - 1}–${lastBlock} to update cache`)
    const txs = await fetchTxs(web3, lastBlock, distance)
    debug(`Found ${txs.length} transactions for blocks ${lastBlockInCache - 1}–${lastBlock} to update cache`)

    await addContractInfo(txs, options)

    txs.reverse().forEach((tx) => store.latestTxs.push(tx))
    store.lastBlock = lastBlock
  } catch (e) {
    console.error('Error trying to update latest Transactions cache.')
  }
}


/* :: () -> Promise<void> */
const setup = async (web3, options) => {
  const $getLatestTransactions = withRetry(
    getLatestTransactions,
    [ web3, MAX_TXS ],
    {
      onFail(err, attempts) {
        debug(`Error trying to fetch ${MAX_TXS} latest transactions after ${attempts} attempts. Ethereum client might be down`)
      }
    }
  )

  debug(`Fetching ${MAX_TXS} latest transaction for the first time`)
  const { txs, lastBlock } = await $getLatestTransactions()
  await addContractInfo(txs, options)
  debug(`Finished fetching ${txs.length} latest transactions for the first time (last block ${lastBlock})`)

  txs.reverse().forEach((tx) => store.latestTxs.push(tx))
  store.lastBlock = lastBlock
  store.isSynching = false

  setInterval(updateLatestTxCache(web3, options, store), 1500)
}


/* :: () -> object[] */
const getTransactions = (limit = 10) => {
  const transactions = store.latestTxs
    .retrieve(Math.min(limit, MAX_TXS))
    .filter(isObject)
  const { isSynching } = store

  return { transactions, isSynching }
}


module.exports = {
  fetchTxs,
  setup,
  getTransactions,
  addContractInfo
}
