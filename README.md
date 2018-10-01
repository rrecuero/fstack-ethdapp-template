Javascript Fatigue + Cloud Fatigue + Web3 Fatigue?

Here is the magic pill to solve all your symptoms.

Starter kit to develop universal dapps with upgradeable smart contracts
and powerful user interfaces.

## Inspirations

- [React-/Drizzle Tutorial](https://truffleframework.com/tutorials/getting-started-with-drizzle-and-react)
- [Open Zeppelin](https://github.com/OpenZeppelin/openzeppelin-solidity)
- [Create React App](https://github.com/facebookincubator/create-react-app)

## Technologies used

- React/Redux + Drizzle
- Smart Contracts: Truffle, Ganache, OpenZeppelin, Aragon
- Backend: Node JS, Express

## Requirements

- Install latest Node (8+) & npm
- Install Truffle

`npm install -g truffle`

- Install Ganache

`npm install -g ganache-cli`

- Install create-react-app

`npm install -g create-react-app`

## Folder Organization

- `ethwrapper/`: Contains standard truffle set up. See below for more
- `client/`: React/Redux frontend app. Node package.
- `backend/`: Node API backend. Node package.

## How the project was created (FYI)

1. Ran `truffle init` inside the ethwrapper folder. The default Truffle directory structure contains the following:

- `contracts/`: Contains the Solidity source files for our smart contracts. There is an important contract in here called Migrations.sol, which we'll talk about later.
- `migrations/`: Truffle uses a migration system to handle smart contract deployments. A migration is an additional special smart contract that keeps track of changes.
- `test/`: Contains both JavaScript and Solidity tests for our smart contracts
- `truffle-config.js`: Truffle configuration file
- `truffle.js`: Another Truffle configuration file (soon to be deprecated)

2. Initialized the client with `create-react-app` by running:

`npx create-react-app client`

3. Linked the compiled contracts from truffle to be consumed by the frontend:

```
// For MacOS and Linux
cd src
ln -s ../../ethwrapper/build/contracts contracts
```

4. Installed Drizzle in the client

```
npm install drizzle --save
```

5. Added initial contracts and test to ethwrapper and set config in `truffle.js`.

6. Created packages for backend and ethwrapper folders
7. Installed openzeppelin

```
npm install --save-exact openzeppelin-solidity
```

## TODO
- No address error
- Refactor old oly backend
  - Upgrade dependencies & clean
  - Use mongo via mlab or compose
  - Use heroku
- Frontend React App config
  - Setup heroku for frontend
  - Add CSS preprocessor to react app
  - Add react Router
  - Enable HTTPS
  - Set config file .env
- Try unique heroku app for both (see)
