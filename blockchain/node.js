const Wallet = require('./wallet')
const Transaction = require('./transaction')
const Blockchain = require('./blockchain')

class BlockChainNode {
  constructor (difficulty = 4, blocks = null) {
    this.id = Math.random() * 100000
    this.wallet = new Wallet()
    this.difficulty = difficulty
    this.blockchain = new Blockchain(blocks, difficulty)
  }

  sync (blocks) {
    if (this.getBlocks().size < blocks.size) {
      if (this.getBlocks().first().getHash() !== blocks.first().getHash()) {
        throw new Error('Genesis Block Does Not Match')
      }

      if (this.getBlocks().last().getHash() !== blocks.get(this.getBlocks().size - 1).getHash()) {
        throw new Error(`Chains Do Not Match Up To Index ${this.getBlocks().size}`)
      }

      this.blockchain = new Blockchain(blocks, this.difficulty)
    }
  }

  // To generate initial wallet balance, mine a bunch of zero-payment blocks
  mine (amount) {
    for (let i = 0; i < amount; i++) {
      this.pay(this.wallet.publicKey, 0)
    }
  }

  getBlocks () {
    return this.blockchain.blocks
  }

  pay (recipient, amount) {
    const transaction = new Transaction(this.wallet.publicKey, recipient, amount)
    const signature = this.wallet.generateSignature(transaction)
    transaction.sign(signature)
    this.blockchain.addBlock(transaction, this.wallet.publicKey)
  }

  getBalance () {
    return this.blockchain.getBalance(this.wallet.publicKey)
  }
}

module.exports = BlockChainNode
