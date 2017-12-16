const sjcl = require('sjcl/core.js')

class Transaction {
  /** Generate a new transaction.  Transaction must be signed before submitting to blockchain. */
  constructor (sender, recipient, amount) {
    this.sender = sender
    this.recipient = recipient
    this.amount = amount
    this.timestamp = new Date().getTime()
    this.hash = this.getHash()
    this.signature = null
  }

  /** Compute a sha256 hash string value for the transaction */
  getHash () {
    const hash = sjcl.hash.sha256.hash(this.timestamp + this.sender + this.recipient + this.amount)
    return sjcl.codec.hex.fromBits(hash).toString()
  }

  /** Assign ECDSA signature to transaction.  Must be signed with private key of sender. */
  sign (wallet) {
    this.signature = wallet.generateSignature(this.hash)
  }
}

module.exports = Transaction
