const sjcl = require('sjcl/core.js')

class Block {
  /**
   * Create a new block
   * @param { number } index Incremental index of the block
   * @param { string } previousHash Hash value of previous block
   * @param { number } timestamp Current unix timestamp
   * @param { string } recipient Public key of transaction recipient
   * @param { string } sender Public key of transaction sender
   * @param { number } amount The amount being sent
   */
  constructor (index, previousHash, timestamp, recipient, sender, amount) {
    this.index = index
    this.previousHash = previousHash
    this.timestamp = timestamp
    this.recipient = recipient
    this.sender = sender
    this.amount = amount
    this.nonce = 0
    this.hash = this.getHash()
  }

  /** Compute a sha256 hash string value for the block */
  getHash () {
    const hash = sjcl.hash.sha256.hash(this.index + this.previousHash + this.timestamp + this.recipient + this.sender + this.amount + this.nonce)
    return sjcl.codec.hex.fromBits(hash).toString()
  }

  /** Attach signature - must be signed using the private key of the sender */
  sign (signature, sender) {
    this.signature = signature
  }

  /** Mine the block (by incrementing the nonce) to acheive a hash value with the required prefix */
  mine (difficulty) {
    const solutionPrefix = new Array(difficulty).fill('0').join('')
    do {
      this.nonce++
      this.hash = this.getHash()
    } while (this.hash.slice(0, solutionPrefix.length) !== solutionPrefix)
    console.log(this.hash)
  }
}

module.exports = Block
