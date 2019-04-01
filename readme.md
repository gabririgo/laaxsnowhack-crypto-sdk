<div align="center">  
  <a href="https://tangany.com">  
    <img src="https://raw.githubusercontent.com/Tangany/cloud-wallet/master/docs/tangany.gif"  alt="Tangany" width="50%" />  
  </a>  
  <h1>#laaxsnowhack crypto api SDK</h1>      
</div>  

A sample nodejs integration of the [Tangany Wallet as a Service API](https://tangany.com) created for the [#laaxsnowhack](https://twitter.com/search?q=%23laaxsnowhack) hackathon

[![NPM version](https://raw.githubusercontent.com/Tangany/laaxsnowhack-crypto-sdk/master/docs/package-badge.svg?sanitize=true)](https://www.npmjs.com/package/@tangany/laaxsnowhack-crypto-sdk)

## Get started
Install the package
```
npm install @tangany/laaxsnowhack-cryptio-sdk
```

Set the [auth](#authentication) environment headers & require the main module
```javascript
const { WaasApi } = require("@tangany/laaxsnowhack-crypto-sdk");

// set the environment variables from .env file
const dotenv = require("dotenv");
dotenv.config();

(async () => {
    const api = new WaasApi();
    let skiptoken = undefined;
    
    // https://tangany.docs.stoplight.io/api/wallet/list-wallets
    const listWallet = async _skiptoken => {
        const data = (await api.listWallets(_skiptoken)).data;
        skiptoken = data.skiptoken ? data.skiptoken : undefined;
        
        return data.list;
    };
    
    do {
        // fetch wallets until no skiptoken is returned in the response
        const list = await listWallet(skiptoken);
        console.log(list);
    }
    while (!!skiptoken);
})();


```

## Authentication
Add following environment variables to authorize the api requests

ENV|description
---|---
CLIENT_ID| service clientId
CLIENT_SECRET| service clientSecret 
SUBSCRIPTION| service subscription

## Debugging

To log the axios HTTP requests, add following environment variable
```
DEBUG=laaxsnowhack-crypto-sdk:*
```

## API documentation
https://tangany.docs.stoplight.io/
