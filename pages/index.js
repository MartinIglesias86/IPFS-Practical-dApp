import { Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  //walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  //loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  //tokenIdsMinted keeps track of the number of tokenIds that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  /* create a reference to the Web3 Modal (used for connecting to Metamask) 
  which persists as long as the page is open */
  const web3ModalRef = useRef();

  //publicMint mints an NFT
  const publicMint = async () => {
    try {
      console.log("Minteo publico");
      //we need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      //create a new instance of the Contract with a Signer, which allows update methods
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      //call the mint from the contract to mint the LW3Punks
      const tx = await nftContract.mint({
        /* value signifies the cost of one LW3Punk, which is "0.01" eth.
        We are parsing '0.01' string to ether using the utils library from ethers.js */
        value: utils.parseEther("0.01"),
      });
      //set loading to true while we wait for the transaction to get mined
      setLoading(true);
      //wait for the transaction to get mined
      await tx.wait();
      //set loading to false when the transaction has been mined
      setLoading(false);
      window.alert("LW3Punk minteado!");
    }catch (err) {
      console.error(err);
    }
  };

  //connectWallet connects the user's wallet to the app
  const connectWallet = async () => {
    try {
      /* Get the provider from web3Modal, which in our case is Metamask.
      When used for the first time, it prompts the user to connect their wallet */
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  //getTokenIdsMinted gets the number of tokenIds that have been minted
  const getTokenIdsMinted = async () => {
    try {
      /* get the provider from web3Modal, which in our case is Metamask.
      No need for the Signer here, as we are only reading state from the blockchain */
      const provider = await getProviderOrSigner();
      /* we connect to the Contract using a Provider, so we will only have read-only
      access to the Contract */
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      //call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      console.log("tokenIds: ", _tokenIds);
      //_tokenIds is a 'BigNumber'. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  /* getProviderOrSigner returns a Provider or Signer object representing the Ethereum RPC with 
  or without the signing capabilities of Metamask attached.
  A 'Provider' is needed to interact with the blockchain - reading transactions, reading balances, etc.
  A 'Signer' is a special type of Provider used in case a 'write' transaction needs to be made to 
  the blockchain, which involves the connected account needing to make a digital signature to authorize
  the transaction being sent. Metamask exposes a Signer API to allow your website to request signatures from 
  the user using Signer functions. 
  @param {*} needSigner - True if you need the signer, default False otherwise*/
  const getProviderOrSigner = async (needSigner = false) => {
    /* Connect to Metamask.
    Since we store 'web3Modal' as a reference, we need to access the 'current' value to get access to the
    underlying object */
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    //if the user is not connected to the Mumbai network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 80001) {
      window.alert("Por favor conéctate a la red Mumbai");
      throw new Error("Por favor conéctate a la red Mumbai");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /* useEffects are used to react to changes in the state of the website.
  The array at the end of function call represents what state changes will trigger this effect. In this
  case, whenever the value of 'walletConnected' changes this effect will be called */
  useEffect(() => {
    //if the user's wallet is not connected, create a new instance of Web3Modal and connect the Metamask wallet
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "mumbai",
        providerOptions: {},
        disableInjectedProvider: false
    });
    connectWallet();
    getTokenIdsMinted();
    //set an interval to get the number of token Ids minted every 5 seconds
    setInterval(async function () {
      await  getTokenIdsMinted();
    }, 5 * 1000);
    }
  }, [walletConnected]);

  //renderButton returns a button based  on the state of the dApp
  const renderButton = () => {
    //if the user's wallet is not connected, return a button which allows them to connect their wallet
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}>Conecta tu wallet</button>
      );
    }
    //if we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Cargando...</button>
    }

    return (
      <button className={styles.button} onClick={publicMint}>Minteo Público 🚀</button>
    );
  };

  return (
    <div>
      <Head>
        <title>LW3Punks</title>
        <meta name="description" content="LW3Punks dApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Bienvenide a LW3Punks!</h1>
          <div className={styles.description}>Es una colección NFT para quienes quieren aprender a desarrollar en web3!</div>
          <div className={styles.description}>{tokenIdsMinted}/10 ya fueron minteados!</div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./LW3punks/1.png" />
        </div>
      </div>
      <footer className={styles.footer}>Made with &#10084; by Martin Iglesias</footer>
    </div>
  );
}