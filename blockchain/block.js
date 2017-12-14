const sjcl = require('sjcl/core.js')

class Block {
  /**
   * Create a new block
   * @param { number } index Incremental index of the block
   * @param { string } previousHash Hash value of previous block
   * @param { string } recipient Public key of transaction recipient
   * @param { string } sender Public key of transaction sender
   * @param { number } amount The amount being sent
   */
  constructor (index, previousHash, transaction) {
    this.index = index
    this.previousHash = previousHash
    this.timestamp = new Date().getTime()
    this.transaction = transaction
    this.nonce = 0
    this.hash = this.getHash()
  }

  /** Compute a sha256 hash string value for the block */
  getHash () {
    const hash = sjcl.hash.sha256.hash(this.index + this.previousHash + this.timestamp + this.transaction.hash + this.miner + this.nonce)
    return sjcl.codec.hex.fromBits(hash).toString()
  }

  /** Mine the block (by incrementing the nonce) to acheive a hash value with the required prefix */
  mine (difficulty, miner) {
    const solutionPrefix = new Array(difficulty).fill('0').join('')
    this.miner = miner
    do {
      this.nonce++
      this.hash = this.getHash(miner)
    } while (this.hash.slice(0, solutionPrefix.length) !== solutionPrefix)
    console.log(this.hash)
  }
}

module.exports = Block
