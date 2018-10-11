# Seamless Full Stack Dapp Template

Javascript Fatigue + Cloud Fatigue + Web3 Fatigue?

Here is the magic pill to solve all your symptoms.

Starter kit to develop universal Dapps with upgradeable smart contracts
and powerful user interfaces.

## Requirements

- Install latest Node (8+) & npm
- Install babel
`npm install --global babel-cli`

- Install eslint
`npm install -g eslint`

- Install Truffle

`npm install -g truffle`

- Install Ganache

`npm install -g ganache-cli`

- Install create-react-app

`npm install -g create-react-app`

- Install heroku (on MacOs) and create the app

```
brew install heroku/brew/heroku
heroku create -b heroku/nodejs -a <name>
```

Add mongodb to your heroku.

- Set env variables for the backend and frontend. Override them in heroku.

## Quick Start

Run npm install in every folder:
`cd client && npm install`
`cd ethwrapper && npm install`
`cd backend && npm install`

Run garnache, backend and frontend in different terminals:
`ganache-cli -b 3`
`cd backend && npm run dev`
`cd client && npm run start`

The dApp should be running here `http://localhost:3000`.

## Deploying to heroku

`git push heroku master`

## Inspirations

- [React-/Drizzle Tutorial](https://truffleframework.com/tutorials/getting-started-with-drizzle-and-react)
- [Open Zeppelin](https://github.com/OpenZeppelin/openzeppelin-solidity)
- [Create React App](https://github.com/facebookincubator/create-react-app)

## Technologies used

- React/Redux + Drizzle
- Smart Contracts: Truffle, Ganache, OpenZeppelin, Aragon
- Backend: Node JS, Express

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
npm install drizzle-react --save
npm install drizzle-react-components --save
```

5. Added initial contracts and test to ethwrapper and set config in `truffle.js`.
6. Created packages for backend and ethwrapper folders
7. Installed openzeppelin

```
npm install --save-exact openzeppelin-solidity
```

8. Installed `SASS`

```
npm install node-sass --save
```

9. Install `font-awesome`

```
npm install --save font-awesome

// In index.js
import 'font-awesome/css/font-awesome.min.css';
```

10. Installs `bulma`

```
npm install --save bulma

// In index.js
import 'bulma/css/bulma.css';
```

11. Install `react-router` and `react-router-dom`

```
npm install react-router
npm install react-router-dom

// Modify app.js and create the router
```

12. Install backend packages. See `package.json` for reference.

13. Used single [heroku app setup for both apps](https://github.com/mars/heroku-cra-node)

## TODO
- No address error
