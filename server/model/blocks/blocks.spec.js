'use strict'
const { getBlocks } = require('.')

const TOTAL_BLOCKS = 100

const web3 = {
  eth: {
    getBlockNumber: jest.fn(async () => TOTAL_BLOCKS),
    getBlock: jest.fn(async number => ({
      number,
      transactions: []
    }))
  }
}

describe('blocks.getBlocks()', () => {
  it('returns an array', () => {
    const result = getBlocks(web3)
    const expected = true
    const actual = Array.isArray(result)

    expect(actual).toEqual(expected)
  })

  xit('returns 10 blocks by default', () => {
    const result = getBlocks(web3)
    const expected = 10
    const actual = result.length

    expect(actual).toEqual(expected)
  })

  describe('limit = 25', () => {
    const limit = 25

    xit('returns 25 blocks', () => {
      const result = getBlocks(web3, limit)
      const expected = limit
      const actual = result.length

      expect(actual).toEqual(expected)
    })
  })
})
