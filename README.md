PROCESS FLOW 
1) Created a fabric blockchain network with two organizations of one peer each. 
2) Implemented chaincode functions - Adding a product , removing a product, Viewing a product, removing all Products , Viewing all Products (can be found in pdt.js)
3) Written APIs to execute the chaincode functions by securing API with a API key.
4) Chaincode functions can be tested through curl command or postman.

Steps to Execute the process.
1) To run entire process flow, run startFabric.sh which internally calls byfn.sh up which ideally brings up the entire fabric network based on the configurations provided in yaml files.
cmd: ./startFabric.sh (FabricUsecase/product/)
2) Run apiConnect.js to test the APIs.
cmd: node apiConnect.js (FabricUsecase/apiConnect/)
--> APIs are exposed through nginx for dev environment
--> Only admin can add a product and remove the products from ledger where ACLs are set that the writer access is given to only Org Admins in configtx.yaml and also only admin is connected through gateway to execute these specific chaincode functionalities.
3) Run test.sh to test chaincode execution. In the same script required chaincode functions can be added to test .
cmd: ./test.sh (FabricUsecase/apiConnect)
