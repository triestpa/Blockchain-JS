const sjcl = require('sjcl/core.js')

class Wallet {
  /** Generate public/private keypair for new wallet */
  constructor () {
    this.keypair = sjcl.ecc.ecdsa.generateKeys(sjcl.ecc.curves.k256)
    this.publicKey = this.getPublicKey()
  }

  /** Serialize the public key to a string */
  getPublicKey () {
    const publicKey = this.keypair.pub.get()
    return sjcl.codec.base64.fromBits(publicKey.x.concat(publicKey.y))
  }

  /** Generate signature for provided transaction using private key */
  generateSignature (transaction) {
    // Generate a transaction signature using the transaction hash and the wallet's private key
    let signature = this.keypair.sec.sign(transaction.hash)

    // Serialize the signature to a string
    return sjcl.codec.hex.fromBits(signature)
  }
}

module.exports = Wallet
