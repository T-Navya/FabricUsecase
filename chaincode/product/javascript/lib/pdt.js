'use strict';
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
const { Contract, Context } = require('fabric-contract-api');

class Product extends Contract {

// Adding new product into chaincode state
    async addPdt(ctx, args) {
      let parameters = args
      console.log("params: "+parameters)

        if (args.length != 4) {
          throw new Error('Incorrect number of arguments. Expecting 4');
        }
        // ==== Input sanitation ====
        console.info('--- start init pdt ---')
        if (args[0].length <= 0) {
          throw new Error('1st argument must be a non-empty string');
        }
        if (args[1].length <= 0) {
          throw new Error('2nd argument must be a non-empty string');
        }
        if (args[2].length <= 0) {
          throw new Error('3rd argument must be a non-empty string');
        }
        if (args[3].length <= 0) {
          throw new Error('4th argument must be a non-empty string');
        }
        let pdtId =  parseInt(args[0]);
        let pdtName = args[1];
        let manufacturer = args[3].toLowerCase();
        let type = args[2].toLowerCase();
        
        if (typeof pdtId == 'number') {
          throw new Error('1st argument must be a numeric string');
        }

    
        // ==== Check if product already exists ====
        let pdtState = await stub.getState(pdtName);
        if (pdtState.toString()) {
          throw new Error('This pdt already exists: ' + pdtName);
        }
    
        // ==== Create product object and marshal to JSON ====
        let pdt = {};
        pdt.docType = 'pdt';
        pdt.id = pdtId;
        pdt.name = pdtName;
        pdt.type = type;
        pdt.manufacturer = manufacturer;
        
    
        // === Save product to state ===
        await stub.putState(pdtName, Buffer.from(JSON.stringify(pdt)));

      
    }
 // To Send random transaction to ledger
    async endorseTran(ctx, _key, _payload) {
        console.info('============= START : Endorse Transaction proposal===========');
        await ctx.stub.putState(_key, JSON.stringify(_payload));
        console.info('============= END : Endorse Transaction proposal ===========');
    }
    // Retrieving the record for specific key from state level db
    async queryTran(ctx, _key) {
        const pdtAsbytes = await ctx.stub.getstate(_key);

        if (!pdtAsbytes || pdtAsbytes .length === 0) {
            throw new Error(`Transaction does not exist`);
        }
        console.log(pdtAsbytes .toString());
        let res = JSON.parse(Buffer.from(pdtAsbytes).toString('utf8'));
        return JSON.stringify(res);
        
    }

// Retrieving all records from ledger
    async viewAllProducts(ctx, args) {
        let startKey = args[0];
        let endKey = args[1];
    
        const allResults = [];
        for await (const { key, value } of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }    
    
  // ==================================================
  // delete - remove a product key/value pair from state
  // ==================================================
  async delete(ctx, args) {
    if (args.length != 1) {
      throw new Error('Incorrect number of arguments. Expecting name of the product to delete');
    }
    let pdtId = args[0];
    if (!pdtId) {
      throw new Error('product name must not be empty');
    }
    // to maintain the type~product index, we need to read the product first and get its color
    let valAsbytes = await stub.getState(pdtId); //get the product from chaincode state
    let jsonResp = {};
    if (!valAsbytes) {
      jsonResp.error = 'product does not exist: ' + pdtId;
      throw new Error(jsonResp);
    }
    let pdtJSON = {};
    try {
      pdtJSON = JSON.parse(valAsbytes.toString());
    } catch (err) {
      jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + pdtId;
      throw new Error(jsonResp);
    }

    
    await stub.deleteState(pdtId); //remove the pdt from chaincode state

  }


}

module.exports = Product;



