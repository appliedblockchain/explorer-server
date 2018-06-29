'use strict'
const { isObject } = require('lodash')
const createFixedStack = require('./createFixedStack')

describe('createFixedStack()', () => {
  it('returns a object', () => {
    const expected = true
    const actual = isObject(createFixedStack(10))

    expect(actual).toEqual(expected)
  })

  it('has the correct api', () => {
    const expected = {
      push: expect.any(Function),
      retrieve: expect.any(Function),
      size: expect.any(Function)
    }
    const actual = createFixedStack(10)

    expect(actual).toEqual(expected)
  })

  describe('Type of size argument != number', () => {
    it('throws', () => {
      const actual = () => createFixedStack('10')
      expect(actual).toThrow()
    })
  })

  describe('size argument is a float number', () => {
    it('throws', () => {
      const actual = () => createFixedStack(10.5)
      expect(actual).toThrow()
    })
  })

  describe('size argument is a negative integer', () => {
    it('throws', () => {
      const actual = () => createFixedStack(-10)
      expect(actual).toThrow()
    })
  })

  describe('api.size()', () => {
    const size = 100
    const items = createFixedStack(size)

    it('returns the size', () => {
      const expected = size
      const actual = items.size()

      expect(actual).toEqual(expected)
    })
  })

  describe('api.push()', () => {
    describe('Pushing nothing', () => {
      it('returns the existing stack', () => {
        const items = createFixedStack(3, 'foo')
        const expected = [ 'foo', 'foo', 'foo' ]
        const actual = items.push()

        expect(actual).toEqual(expected)
      })
    })

    it('allows pushing a single item', () => {
      const items = createFixedStack(3, 'foo')
      const expected = [ 'bar', 'foo', 'foo' ]
      const actual = items.push('bar')

      expect(actual).toEqual(expected)
    })

    it('allows pushing multiple items at once', () => {
      const items = createFixedStack(3, 'foo')
      const expected = [ 'baz', 'bar', 'foo' ]
      const actual = items.push('bar', 'baz')

      expect(actual).toEqual(expected)
    })

    it('allows pushing items > size and handles overflow', () => {
      const items = createFixedStack(3, 'foo')
      const expected = [ 6, 5, 4 ]
      const actual = items.push(1, 2, 3, 4, 5, 6)

      expect(actual).toEqual(expected)
    })
  })

  describe('api.retrieve()', () => {
    const items = createFixedStack(3)

    items.push('foo')
    items.push('bar')
    items.push('baz')

    it('gets the newest item', () => {
      const expected = [ 'baz' ]
      const actual = items.retrieve()

      expect(actual).toEqual(expected)
    })

    it('gets newest X items', () => {
      const expected = [ 'baz', 'bar' ]
      const actual = items.retrieve(2)

      expect(actual).toEqual(expected)
    })

    describe('X > total size', () => {
      it('thows', () => {
        const actual = () => items.retrieve(100)
        expect(actual).toThrow()
      })
    })
  })
})
