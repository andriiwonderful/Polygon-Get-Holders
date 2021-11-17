import { useState, useEffect } from 'react';
import Web3 from 'web3';
import axios from "axios";
import './App.css';

const httpProvider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");

function App() {
  const MAIN_CONTRACT_ADDRESS = '0x1X...3d6E';
  const STAKE_CONTRACT_ADDRESS = '0x66...B1C6';
  const totalHoldersAddress = [];
  const holdersAddress = [];
  const [holdersChunk, setHoldersChunk] = useState([]);
  const [totalHolders, setTotalHolders] = useState(0);
  const [web3, setWeb3] = useState();
  useEffect(() => {
    setWeb3(new Web3(window.ethereum || httpProvider))
  }, [])

  async function fetchData1(address) {
    let index = 0;
    while(true) {
      const results = await axios.get('https://api.covalenthq.com/v1/137/tokens/'+address+'/token_holders/?key=ckey_91e5130e67274594a238d1145fb&page-number=' + index).then((re) => {
        const data = re.data.data.items;
        return data;
      });

      if(results.length == 0) {
        break;
      }

      results.map((result) => {
        totalHoldersAddress.push(result.address)
      });

      index ++;
    }
  }

  async function fetchData2(address) {
    let index = 0;
    while(true) {
      const results = await axios.get('https://api.covalenthq.com/v1/137/address/'+address+'/transactions_v2/?key=ckey_91e5130e67274594a238d1145fb&page-number=' + index).then((re) => {
        const data = re.data.data.items;
        return data;
      });

      if(results.length == 0) {
        break;
      }
      try {
        results.map((result) => {
          if(result.to_address && result.successful === true && result.to_address.toLowerCase() === address.toLowerCase()) {
            totalHoldersAddress.push(result.from_address);
          }
        });
      } catch (err) {
        console.log(err)
      }

      index ++;
    }
  }
  const finialAddress = [];
  const getHolders = async() => {
    await fetchData1(MAIN_CONTRACT_ADDRESS);
    console.log('step1')
    await fetchData2(STAKE_CONTRACT_ADDRESS);
    console.log('step2')

    const uniqueAddresses = Array.from(new Set(totalHoldersAddress));
    const results = [];
    for(let i=0; i<uniqueAddresses.length; i++) {
      await sleep(50);
      results.push(checkWalletAddress(uniqueAddresses[i]));
    }

    Promise.all(results).then((re) => {
      var i, j, tmp, chunk = 400;
      for (i = 0,j = holdersAddress.length; i < j; i += chunk) {
        tmp = holdersAddress.slice(i, i + chunk);
        finialAddress.push(tmp);
      }

      setHoldersChunk(finialAddress);
      setTotalHolders(holdersAddress.length)
    });
  }

  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const checkWalletAddress = async (address) => {
    try {
      const status = await web3.eth.getCode(address);
      if(status == '0x') {
        holdersAddress.push(address);
      }
    } catch(err) {

    }
  }

  return (
    <div className="App">
      <div className="d-flex mt-10">
        <div>
          <button onClick={getHolders}>
            Get Holders
          </button>
        </div>
        <div>{totalHolders}</div>
      </div>
      <div className="address-panel">
        {
          holdersChunk.map((addresses, index) => {
            return (
              <textarea rows="20" value={addresses} readOnly key={index}></textarea>
            )
          })
        }
      </div>
    </div>
  );
}

export default App;
