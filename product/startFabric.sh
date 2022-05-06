#!/bin/bash
set -ex

# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
# CC_SRC_LANGUAGE=${1:-"go"}

# sudo rm -rf ../first-network/crypto-config
# sudo rm -rf ../first-network/channel-artifacts

#  docker ps --filter name=dev-peer* --filter status=running -aq | xargs docker stop | xargs docker rm
#  docker ps --filter name=dev-peer*  -aq | xargs docker rmi



QUERY_CHAINCODE_NAME=query_get_api
QUERY_CHAINCODE_PATH=/opt/gopath/src/github.com/chaincode/query_chaincode
CC_SRC_LANGUAGE=${1:-"javascript"}
CC_SRC_LANGUAGE=`echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:]`
if [ "$CC_SRC_LANGUAGE" = "go" -o "$CC_SRC_LANGUAGE" = "golang"  ]; then
	CC_RUNTIME_LANGUAGE=golang
	CC_SRC_PATH=opt/gopath/src/github.com/chaincode/product/go
elif [ "$CC_SRC_LANGUAGE" = "javascript" ]; then
	CC_RUNTIME_LANGUAGE=node # chaincode runtime language is node.js
  CC_SRC_PATH=/opt/gopath/src/github.com/chaincode/product/javascript
  # CC_SRC_PATH=/opt/gopath/src/github.com/chaincode/product/javascript
	# CC_SRC_PATH=/opt/gopath/src/github.com/chaincode/product/query_get_api
    # CC_SRC_PATH=/usr/local/src
	#  npm install
	# npm run build
else
	echo The chaincode language ${CC_SRC_LANGUAGE} is not supported by this script
	echo Supported chaincode languages are: go, javascript 
	exit 1
fi


# clean the keystore
rm -rf ./hfc-key-store

# launch network; create channel and join peer to channel

pushd ../first-network
echo y | ./byfn.sh down
echo y | ./byfn.sh up -a -n -s couchdb
popd
 CONFIG_ROOT=/opt/gopath/src/github.com/hyperledger/fabric/peer
 ORG1_MSPCONFIGPATH=${CONFIG_ROOT}/crypto/peerOrganizations/org1.pdt.com/users/Admin@org1.pdt.com/msp
 ORG1_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/peerOrganizations/org1.pdt.com/peers/peer0.org1.pdt.com/tls/ca.crt
#  ORDERER_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/ordererOrganizations/pdt.com/msp/tlscacerts/tlsca.pdt.com-cert.pem
 ORDERER_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/ordererOrganizations/pdt.com/orderers/orderer.pdt.com/msp/tlscacerts/tlsca.pdt.com-cert.pem
 ORG1_TLS_ROOTCERT_FILE_PEER_TWO=${CONFIG_ROOT}/crypto/peerOrganizations/org1.pdt.com/peers/peer2.org1.pdt.com/tls/ca.crt
 ORG2_TLS_ROOTCERT_FILE=${CONFIG_ROOT}/crypto/peerOrganizations/org2.pdt.com/peers/peer0.org2.pdt.com/tls/ca.crt
 ORG2_MSPCONFIGPATH=${CONFIG_ROOT}/crypto/peerOrganizations/org2.pdt.com/users/Admin@org2.pdt.com/msp
 ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/pdt.com/orderers/orderer.pdt.com/msp/tlscacerts/tlsca.pdt.com-cert.pem

set -x

PEER0_ORG1="docker exec	
-e CORE_PEER_LOCALMSPID="Org1MSP"	
-e CORE_PEER_ADDRESS=peer0.org1.pdt.com:11051	
-e CORE_PEER_MSPCONFIGPATH=${ORG1_MSPCONFIGPATH}	
-e CORE_PEER_TLS_ROOTCERT_FILE=${ORG1_TLS_ROOTCERT_FILE}	
cli	
peer	
--tls
--cafile=${ORDERER_TLS_ROOTCERT_FILE}	
--orderer=orderer.pdt.com:7050"
	
PEER0_ORG2="docker exec	
-e CORE_PEER_LOCALMSPID=Org2MSP	
-e CORE_PEER_ADDRESS=peer0.org2.pdt.com:12051	
-e CORE_PEER_MSPCONFIGPATH=${ORG2_MSPCONFIGPATH}	
-e CORE_PEER_TLS_ROOTCERT_FILE=${ORG2_TLS_ROOTCERT_FILE}
cli	
peer	
--tls=true	
--cafile=${ORDERER_TLS_ROOTCERT_FILE}	
--orderer=orderer.pdt.com:7050"

echo "Packaging smart contract on peer0.org1.pdt.com"
echo "$CC_SRC_PATH"
${PEER0_ORG1} lifecycle chaincode package 	 product.tar.gz --path "$CC_SRC_PATH"  --lang "$CC_RUNTIME_LANGUAGE"  --label productv1 --peerAddresses peer0.org1.pdt.com:11051 --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE}
echo "Installing smart contract on peer0.org1.pdt.com"	
${PEER0_ORG1} lifecycle chaincode install product.tar.gz	--peerAddresses peer0.org1.pdt.com:11051 --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE}
echo "Installing smart contract on peer0.org2.pdt.com"	
${PEER0_ORG2} lifecycle chaincode install product.tar.gz	--peerAddresses peer0.org2.pdt.com:12051 --tlsRootCertFiles ${ORG2_TLS_ROOTCERT_FILE}
echo "Determining package ID for smart contract on peer0.org1.pdt.com"	
REGEX='Package ID: (.*), Label: productv1'	
if [[ `${PEER0_ORG1} lifecycle chaincode queryinstalled` =~ $REGEX ]]; then	
  PACKAGE_ID_ORG1=${BASH_REMATCH[1]}	
else	
  echo Could not find package ID for productv1 chaincode on peer0.org1.pdt.com	
  exit 1	
fi	
echo "Querying the installed chaincodes  on peer0.org1.pdt.com"	
${PEER0_ORG1} lifecycle chaincode queryinstalled 
echo "Get the installed packages on peer0.org1.pdt.com"
${PEER0_ORG1} lifecycle chaincode getinstalledpackage --package-id ${PACKAGE_ID_ORG1}  --peerAddresses peer0.org1.pdt.com:11051 --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE}
echo "Approving smart contract by peer0 org1"	
${PEER0_ORG1} lifecycle chaincode approveformyorg --package-id ${PACKAGE_ID_ORG1} --channelID mychannel --name product --version 1.0  --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')" --sequence 1 --waitForEvent  --peerAddresses peer0.org1.pdt.com:11051 --tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE}
echo "Approving smart contract by peer0 org2"
${PEER0_ORG2} lifecycle chaincode approveformyorg --package-id ${PACKAGE_ID_ORG1} --channelID mychannel --name product --version 1.0  --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')" --sequence 1 --waitForEvent  --peerAddresses peer0.org2.pdt.com:12051 --tlsRootCertFiles ${ORG2_TLS_ROOTCERT_FILE}
echo "Checking commit readiness of the smart contract"
${PEER0_ORG1} lifecycle chaincode checkcommitreadiness -o orderer.pdt.com:7050 --channelID mychannel  --name product --version 1.0  --sequence 1 --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')"
echo "Committing smart contract"	
${PEER0_ORG1} lifecycle chaincode commit  --channelID mychannel --name product --version 1.0 -o orderer.pdt.com:7050 --signature-policy "OR('Org1MSP.peer','Org2MSP.peer')" --sequence 1   --peerAddresses peer0.org2.pdt.com:12051  --tlsRootCertFiles ${ORG2_TLS_ROOTCERT_FILE} --peerAddresses peer0.org1.pdt.com:11051 	--tlsRootCertFiles ${ORG1_TLS_ROOTCERT_FILE}

sudo rm -rf wallet
node enrollAdmin.js
node registerUser.js

set +x
  
cat <<EOF



Total setup execution time : $(($(date +%s) - starttime)) secs ...

Next, use the product applications to interact with the deployed product contract.


JavaScript:

  Start by changing into the "javascript" directory:
    cd javascript

  Next, install all required packages:
    npm install

  Then run the following applications to enroll the admin user, and register a new user
  called user1 which will be used by the other applications to interact with the deployed
  product contract:
    node enrollAdmin
    node registerUser

  You can run the invoke application as follows. By default, the invoke application will
  create a new device, but you can update the application to submit other transactions:
    node invoke

  You can run the query application as follows. By default, the query application will
  return all devices, but you can update the application to evaluate other transactions:
    node query

EOF
