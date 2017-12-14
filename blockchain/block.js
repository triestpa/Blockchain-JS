const sjcl = require('sjcl/core.js')

class Block {
  /** Create a new block */
  constructor (index, previousHash, transaction) {
    this.index = index
    this.previousHash = previousHash
    this.timestamp = new Date().getTime()
    this.transaction = transaction
    this.nonce = 0
    this.hash = this.getHash()
    this.difficulty = 0
    this.miner = null
  }

  /** Compute a sha256 hash string value for the block */
  getHash () {
    const hash = sjcl.hash.sha256.hash(this.index + this.previousHash + this.timestamp + this.transaction.hash + this.miner + this.nonce)
    return sjcl.codec.hex.fromBits(hash).toString()
  }

  /** Mine the block (by incrementing the nonce) to acheive a hash value with the required prefix */
  mine (difficulty, miner) {
    this.difficulty = difficulty
    this.miner = miner
    const solutionPrefix = new Array(this.difficulty).fill('0').join('')

    do {
      this.nonce++
      this.hash = this.getHash(miner)
    } while (this.hash.slice(0, solutionPrefix.length) !== solutionPrefix)
  }
}

module.exports = Block
