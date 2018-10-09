import HDWalletProvider from 'truffle-hdwallet-provider';
import Web3 from 'web3';

require('dotenv').config();

const pk = process.env.private_key;
const postInterface = require('../../ethwrapper/build/contracts/Post.json').abi;

const web3 = new Web3(new HDWalletProvider(process.env.mnemonic,
  'https://ropsten.infura.io/v3/fb6b85d94a9c4923b24e1bb11472c253'));
web3.eth.accounts.privateKeyToAccount(pk);

class PostContract {
  constructor() {
    this.defaultAccount = '0x9b073D121AAF5e18BfbD8f17ed79728BBB30fc7e';
    this.PostContractAddress = '0x5055abf277fc21e97e1482c997a8032cf263d178';

    this.Post = new web3.eth.Contract(postInterface, this.PostContractAddress, {
      from: this.defaultAccount, // default from address
      gasPrice: '100000000000' // default gas price in wei, 20 gwei in this case
    });
  }

  createPostToken(toAddress, ipfsUri, hash, cb) {
    this.Post.methods.createPost(ipfsUri, hash)
      .send({ from: this.defaultAccount, gas: '50000' }, (error) => {
        if (error) {
          console.log('\n\nThere was an error calling createPost', error);
        }
      }).on('transactionHash', (txHash) => {
        console.log('\n 🎉  Sent transactions 🎉');
        console.log('Created tx ', txHash);
        cb(null, txHash);
      }).on('receipt', (receipt) => {
        this._transferOwnership(toAddress, receipt.events.NewPost.returnValues.tokenId);
      });
  }

  _transferOwnership(to, tokenId) {
    this.Post.methods.transfer(to, tokenId)
      .send({ from: this.defaultAccount, gas: '50000' })
      .then((receipt) => {
        console.log(`\n 🎊  Transferred ownership from ${this.defaultAccount} to ${to} 🎉 \n`);
        console.log(receipt.events.Transfer.returnValues);
      });
  }

}

const postContract = new PostContract();
module.exports = postContract;
