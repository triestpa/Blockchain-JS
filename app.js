const Blockchain = require('./blockchain')
const Wallet = require('./wallet')

const difficulty = 3
const allowDebt = 100

class BlockChainNode {
  constructor () {
    this.id = Math.random() * 100000
    this.blockchain = new Blockchain(null, difficulty, allowDebt)
    this.wallet = new Wallet()
  }

  sync (node) {
    if (this.blockchain.blocks.size < node.blockchain.blocks.size) {
      this.blockchain.replaceChain(node.blockchain)
    }
  }

  addBlock (recipient, amount) {
    const newBlock = this.blockchain.generateNextBlock(recipient, this.wallet.publicKey, amount)
    newBlock.mine(difficulty)
    newBlock.sign(this.wallet.generateSignature(newBlock))
    this.blockchain.addBlock(newBlock)
  }

  getBalance () {
    return this.blockchain.getBalance(this.wallet.publicKey)
  }
}

const node0 = new BlockChainNode()
const node1 = new BlockChainNode()
const node2 = new BlockChainNode()

node0.addBlock(node1.wallet.publicKey, 1)
node0.addBlock(node1.wallet.publicKey, 24)

node1.sync(node0)
console.log(node1.getBalance())

for (let block of node0.blockchain.blocks) {
  console.log(block)
}
