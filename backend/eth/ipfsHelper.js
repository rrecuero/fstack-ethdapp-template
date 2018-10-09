import request from 'superagent';
import fs from 'fs';
import md5 from 'md5';

const IPFS_URL = 'https://ipfs.infura.io:5001/api/v0';

function removeTempFile(fileName) {
  fs.unlink(`${__dirname}/${fileName}`, (err) => {
    if (err) throw err;
  });
}

function getFromIPFS(ipfsHash) {
  const options = {
    uri: `${IPFS_URL}?arg=${ipfsHash}&archive=true`,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    resolveWithFullResponse: true,
  };

  request(options)
    .then((res) => {
      console.log('RESPONSE', res);
    })
    .catch((err) => {
      console.log('API Request Failed: ', err);
    });
}

function createFileIPFS(object, cb) {
  const fileName = md5(JSON.stringify(object));
  const content = JSON.stringify(object);

  const wstreamp = fs.createWriteStream(`${__dirname}/${fileName}.json`);
  wstreamp.write(content);
  wstreamp.end();

  const options = {
    method: 'POST',
    uri: `${IPFS_URL}/add?pin=true`,
    formData: {
      file: {
        value: fs.createReadStream(`${__dirname}/${fileName}.json`),
        options: {
          contentType: 'application/json'
        }
      }
    },
    json: true,
  };
  request(options)
    .then((response) => {
      console.log('\n 🎉  Sucessfully saved post to IPFS 🎉\n\n', response);
      removeTempFile(fileName + '.json');
      cb(null, response.Hash);
    })
    .catch((err) => {
      console.log('API call failed: ', err);
    });
}

module.exports = {
  createFileIPFS,
  getFromIPFS
};
