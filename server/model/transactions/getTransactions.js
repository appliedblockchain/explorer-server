'use strict'
const { times, flatten, get, isNil } = require('lodash')
const validate = require('ow')
const abiDecoder = require('abi-decoder')
const createFixedStack = require('../../utils/createFixedStack')
const withRetry = require('../../utils/withRetry')
const { getNetworkConfig, getContractInfo } = require('../../standardTxHandler')

/** Total number of blocks to search Transactions in parallel */
const BLOCKS_IN_PARALLEL = 100
const MAX_TXS = 100

/** Transactions Cache used for serving requests */
const store = Object.seal({
  lastBlock: null,
  latestTxs: createFixedStack(MAX_TXS, { hash: '––', blockNumber: '––', empty: true })
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
const fetchTxs = async (web3, blockNumber, distance) => {
  validate(blockNumber, validate.number.greaterThanOrEqual(0))
  validate(distance, validate.number.greaterThanOrEqual(0))

  const totalReqs = Math.min(blockNumber, distance) + 1 /* [1] */
  const promises = times(totalReqs)
    .map(i => web3.eth.getBlock(blockNumber - i, true))

  const blocks = await Promise.all(promises)
  const txs = blocks.map((block) => get(block, 'transactions', [])) /* [2] */

  return flatten(txs)
}


/* :: (object, number) -> Promise<number[]> */
const getLatestTransactions = async (web3, limit) => {
  const txs = []

  const lastBlock = await web3.eth.getBlockNumber()
  let currBlock = lastBlock

  while (txs.length < limit && currBlock >= 0) {
    const args = [ web3, currBlock, BLOCKS_IN_PARALLEL - 1 ]
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
    const info = getContractInfo(contracts, tx.to)

    if (isNil(info)) {
      return
    }

    abiDecoder.addABI(info.abi)
    const { params, name: method } = abiDecoder.decodeMethod(tx.input)

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
    const txs = await fetchTxs(web3, lastBlock, distance)

    await addContractInfo(txs, options)

    txs.reverse().forEach((tx) => store.latestTxs.push(tx))
    store.lastBlock = lastBlock
  } catch (e) {
    console.error('Error trying to update latest Transactions cache.')
  }
}


/* :: () -> Promise<void> */
const setup = async (web3, options) => {
  const { txs, lastBlock } = await withRetry(
    getLatestTransactions,
    [ web3, MAX_TXS ]
  )()

  await addContractInfo(txs, options)

  txs.reverse().forEach((tx) => store.latestTxs.push(tx))
  store.lastBlock = lastBlock

  setInterval(updateLatestTxCache(web3, options, store), 1500)
}


/* :: () -> object[] */
const getTransactions = (limit = 10) =>
  store.latestTxs.retrieve(Math.min(limit, MAX_TXS))


module.exports = {
  fetchTxs,
  setup,
  getTransactions
}
