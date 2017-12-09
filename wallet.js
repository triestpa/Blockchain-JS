const sjcl = require('sjcl/core.js')

class Wallet {
  /** Generate public/private keypair for new wallet */
  constructor () {
    this.keypair = sjcl.ecc.ecdsa.generateKeys(sjcl.ecc.curves.k256)
    this.publicKey = this.getPublicKey()
  }

  /** Retrieve the public key from wallet keypair */
  getPublicKey () {
    const publicKey = this.keypair.pub.get()

    // Serialize the public key to a string
    return sjcl.codec.base64.fromBits(publicKey.x.concat(publicKey.y))
  }

  /** Generate signature for provided block using private key */
  generateSignature (block) {
    // Generate a block signature using the block hash and the wallet's private key
    let signature = this.keypair.sec.sign(block.hash)

    // Serialize the signature to a string
    return sjcl.codec.hex.fromBits(signature)
  }

  /** Verify the validity of a block signature */
  static verifySignature (publicKey, signature, hash) {
    // De-serialize the public key
    publicKey = new sjcl.ecc.ecdsa.publicKey(
      sjcl.ecc.curves.k256,
      sjcl.codec.base64.toBits(publicKey)
    )

    // De-serialize the signature
    signature = sjcl.codec.hex.toBits(signature)

    // Verify that the block hash was signed with the specified keypair
    publicKey.verify(hash, signature)
  }
}

module.exports = Wallet
