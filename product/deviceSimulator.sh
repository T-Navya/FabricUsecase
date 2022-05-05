while true; do
    docker exec cli peer chaincode invoke --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/pdt.com/orderers/orderer.pdt.com/msp/tlscacerts/tlsca.pdt.com-cert.pem --channelID mychannel --name product --orderer orderer.pdt.com:7050 --peerAddresses peer0.org1.pdt.com:11051  --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.pdt.com/peers/peer0.org1.pdt.com/tls/ca.crt -c '{"function":"addPdt","Args":[]}' --waitForEvent
    sleep $1 
done
