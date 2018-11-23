# int-wallet

[![Github All Releases](https://img.shields.io/github/downloads/intfoundation/int-wallet/total.svg)](http://www.somsubhra.com/github-release-stats/?username=intfoundation&repository=int-wallet)

INT wallet build on electron and vue

## Installation

You can download the app on the [release page](https://github.com/intfoundation/int-wallet/releases), and install it.
For updating, simply download the new version and install it.

### Dependencies

To run int-wallet you need:
- [Node.js](https://nodejs.org) the version must be  `v8.x.x`
- [int-cli](https://www.npmjs.com/package/int-cli) install by npm global

Install int-cli
```bash
$ npm install int-cli --global
```

_Note: If you start int-cli in the terminal, please do not change the rpc port(default: 8555).

### Config folder

The data folder for int-wallet depends on your operation system:

- Windows `%APPDATA%\int-wallet`
- macOs `~/Library/Application \Support/int-wallet`

## Development

If you have install the dependencies, you're ready to initialize int-wallet for development.

### Initialization

For development, you can clone this repository.

```bash
$ git clone https://github.com/intfoundation/int-wallet
$ cd int-wallet
$ npm install
```

### Run int-wallet

```bash
# serve with hot reload at localhost:9080
$ npm run dev
```

### Build int-wallet yourself


``` bash
# build int-wallet application for production
$ npm run build --mac
```

## Testing

```bash
# run unit & end-to-end tests
$ npm test

# lint all JS/Vue component files in `src/`
$ npm run lint
```

