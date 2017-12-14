const sjcl = require('sjcl/core.js')

class Transaction {
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
    const hash = sjcl.hash.sha256.hash(this.timestamp + this.recipient + this.sender + this.amount)
    return sjcl.codec.hex.fromBits(hash).toString()
  }

  sign (signature) {
    this.signature = signature
  }
}

module.exports = Transaction
