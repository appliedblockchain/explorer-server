'use strict'
const { times, reject, isNull, pick } = require('lodash')
const createFixedStack = require('../../utils/createFixedStack')
const { withRetry } = require('../../utils')
const debugWithScope = require('../../utils/debug')

const debug = debugWithScope('model.getBlocks')
const MAX_BLOCKS = 100

/** Transactions Cache used for serving requests */
const store = Object.seal({
  lastBlock: null,
  latestBlocks: createFixedStack(MAX_BLOCKS, {
    number: '––',
    miner: '––',
    transactions: [],
    empty: true
  })
})

/**
 Get Blocks with a inclusive range

 [1]. Handles begin < 0. Blocks are zero based indexed.
 [2]. Sometimes currBlock is incorrect and .getBlock() returns null. This fixes
 that.
 */

/* :: (Web3, number, number) -> object[] */
const fetchBlocks = async (web3, begin, end) => {
  const start = Math.max(0, begin) /* [1] */

  const blocksPromise = times(end - start + 1)
    .map(idx => web3.eth.getBlock(end - idx))
  const blocks = await Promise.all(blocksPromise)

  return reject(blocks, isNull)
    .map(b => pick(b, 'number', 'miner', 'transactions')) /* [2] */
}


/* :: (Web3, object) -> () -> void */
const updateLatestBlocksCache = (web3, store) => async () => {
  try {
    const lastBlock = await web3.eth.getBlockNumber()
    const lastBlockInCache = store.lastBlock

    /** Nothing to update */
    if (lastBlock === lastBlockInCache) {
      return
    }

    const blocks = await fetchBlocks(web3, lastBlockInCache + 1, lastBlock)

    store.lastBlock = lastBlock
    blocks.reverse().forEach(b => store.latestBlocks.push(b))
  } catch (e) {
    debug('Error trying to update latest Blocks cache.')
  }
}


/* :: Web3 -> void */
const setup = async (web3) => {
  debug(`Setting up initial cache of latest ${MAX_BLOCKS} blocks`)

  const lastBlock = await withRetry(web3.eth.getBlockNumber.bind(web3.eth))()
  const blocks = await withRetry(
    fetchBlocks,
    [ web3, lastBlock - MAX_BLOCKS - 1, lastBlock ]
  )()

  /** Update cache */
  store.lastBlock = lastBlock
  blocks.reverse().forEach(b => store.latestBlocks.push(b))

  debug(`Initial cache of latest ${MAX_BLOCKS} blocks is set`)

  setInterval(updateLatestBlocksCache(web3, store), 1500)
}


/* :: (Web3, number) -> object[] */
const getBlocks = (web3, limit = 10) =>
  store.latestBlocks.retrieve(Math.min(MAX_BLOCKS, limit))


module.exports = {
  setup,
  getBlocks
}
