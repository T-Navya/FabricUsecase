var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var HeaderAPIKeyStrategy = require('passport-headerapikey').HeaderAPIKeyStrategy;
var helmet = require('helmet');


var app = express();
app.use(helmet.hidePoweredBy());

app.set('etag', false);
app.set('extensions', false);
app.set('setHeaders', false);
app.disable("x-powered-by");
app.use(bodyParser.json());
const apiKeygen = "f5ff8a325f781018";

// Setting for Hyperledger Fabric
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const ccpPath = path.resolve(__dirname, '..', 'first-network', 'connection-org2.json');
let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));




passport.use(new HeaderAPIKeyStrategy(
    { header: 'Authorization', prefix: 'Api-Key ' },
    false,
    function (apikey, done) {
        findByApiKey(apikey, function (err, api) {
            if (err) {
                console.log("err msg in passport use")
                return done(err);
            }
            if (!apiKeygen) {
                console.log("err msg in ! api key gen  use")
                return done(null, false);
            }
            return done(null, api);
        });
    }

));

function findByApiKey(apikey, fn) {

    if (apiKeygen === apikey) {

        return fn(null, apiKeygen);
    }
    return fn(null, null);
}


app.get('/api/queryalltransactions', passport.authenticate('headerapikey', { session: false, failureRedirect: '/api/unauthorized' }), async function (req, res) {

    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(__dirname, '..', 'product', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.get('user');
        if (!userExists) {
            console.log('An identity for the user "user" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        //user permitted by admin can view the products by using this api
        await gateway.connect(ccp, { wallet, identity: 'user', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('product');

        // Evaluate the specified transaction.
        const result = await contract.evaluateTransaction('viewAllProducts',0,999);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({ response: result.toString() });

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(500).json({ error: error });

    }
});



app.get('/api/query/:transaction', passport.authenticate('headerapikey', { session: false, failureRedirect: '/api/unauthorized' }), async function (req, res) {
    try {

        // Create a new file system based wallet for managing identities.

        const walletPath = path.join(__dirname, '..', 'product', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.get('user');
        if (!userExists) {
            console.log('An identity for the user "user" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('product');

        // Evaluate the specified transaction.
        let result = await contract.evaluateTransaction('queryTran', req.params.transaction);
     
        let response =result.toString()
        response =response.replace(/\\/gi,'');
        response=response.substring(1,response.length-1);
        
        console.log(`Transaction has been evaluated, result is: ${result}`);
        res.status(200).json({ response: JSON.parse(response)});

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(412).json( {error :'Transaction verification failed'});

    }
});

app.post('/api/endorseTran/', passport.authenticate('headerapikey', { session: false, failureRedirect: '/api/unauthorized' }), async function (req, res) {
    try {
        if (req.body.id == undefined) {
            res.status(400).send('parameters missing')
            return;
        }
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(__dirname, '..', 'product', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        //only admin can use this api
        await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('product');
        // Submit the specified transaction.
       let result = undefined;
        try {
           result = await contract.evaluateTransaction('queryTran', req.body.id);
            console.log("got the result")
 
       }
       catch (error) {
           console.log("error: " + error)
       }
       if (result == undefined) {
       var json_data = JSON.stringify(req.body)
       var result = [];

       for(var i in json_data)
           result.push([i, json_data [i]]);
       console.log("result " +result)
         await contract.submitTransaction('addPdt',result);
         console.log('Transaction has been submitted');
        //  Disconnect from the gateway.
            await gateway.disconnect();
       }
        else
           res.status(428).send('Transaction already exists')
        res.send('Transaction has been submitted');
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(428).send('Transaction already exists')
    }

})
app.get('/api/removeTran', passport.authenticate('headerapikey', { session: false, failureRedirect: '/api/unauthorized' }), async function (req, res) {
    try {

        // Create a new file system based wallet for managing identities.

        const walletPath = path.join(__dirname, '..', 'product', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.get('user');
        if (!userExists) {
            console.log('An identity for the user "user" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        //user permitted by admin can remove the transaction
        await gateway.connect(ccp, { wallet, identity: 'user', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('product');

        // Evaluate the specified transaction.
        const result = await contract.evaluateTransaction('delete', req.body.id);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        res.status(200).json({ response: result.toString() });

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        res.status(412).json({ error: 'Transaction could not get  deleted' });

    }
});






app.listen(8080, () => console.log("Server started at 8080"));