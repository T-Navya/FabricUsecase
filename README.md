#--------------------PROCESS FLOW-------------------------------------------------
#Note: Used Sample network
1) To run entire process flow, run startFabric.sh which internally calls byfn.sh up which ideally brings up the entire fabric network based on the configurations provided in yaml files.
cmd: ./startFabric.sh (FabricUsecase/product/)
--> Configured two orgs with peer each for this usecase.
(a) crypto-config.yaml - Used to give the count of required peers and users for the network. Cryptogen is used to generate certificates based on the count given in this yaml file.
(b) configtx.yaml - Complete configuration of channel, organizations i.e peer & orderer, respective policies, ACLs and so on. Configtxlator is used to create the genesis block and channel artifacts using this yaml file.
(c) ccp-generate.sh - Used to create connection profiles which are used to connect to the backend Blockchain APIs.
(d) docker-compose-cli.yaml- main container which is used as a parent container to bring up peer , orderer nodes using script.sh (which creates channel, join peers to the channel and so on)
(e) Bring up ca and couchdb containers using docker-compose-ca.yaml & docker-compose-couch.yaml files
(f) Lifecycle of chaincode gets executed i.e packaging, installation, getting approval from required orgs, committing the chaincode to channel.
(g) Enrolling Admin using enrollAdmin.js file
(h) Generating identity for user by admin using registerUser.js

2) Run apiConnect.js to test the APIs.
cmd: node apiConnect.js (FabricUsecase/apiConnect/)

3) Run test.sh to test chaincode execution. In the same script required chaincode functions can be added to test .
cmd: ./test.sh (FabricUsecase/apiConnect)




