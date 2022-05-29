import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useUSElectionContract from "../hooks/useUSElectionContract";
import LoadingSpinner from "./LoadingSpinner"
import { formatEtherscanLink, shortenHex } from "../util";

type USContract = {
  contractAddress: string;
};

export enum Leader {
  UNKNOWN,
  BIDEN,
  TRUMP
}

const USLibrary = ({ contractAddress }: USContract) => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const usElectionContract = useUSElectionContract(contractAddress);
  const [currentLeader, setCurrentLeader] = useState<string>('Unknown');
  const [name, setName] = useState<string | undefined>('');
  const [votesBiden, setVotesBiden] = useState<number | undefined>(0);
  const [votesTrump, setVotesTrump] = useState<number | undefined>(0);
  const [stateSeats, setStateSeats] = useState<number | undefined>(0);
  const [wonSeatsBiden, setWonSeatsBiden] = useState<number>(0);
  const [wonSeatsTrump, setWonSeatsTrump] = useState<number>(0);
  const [electionEnded, setElectionEnded] = useState<boolean>(undefined);
  const [txError, setTxError] = useState(null);
  const [transactionInProgress, setTransactionInProgress] = useState(null);

  useEffect(() => {
    getCurrentLeader();
    getCurrentSeats();
  },[])

  useEffect(() => {
    getIsElectionEnded();
  },[])

  usElectionContract.on('LogStateResult', (winner, stateSeats, state, tx) => {
    console.log(winner); //find why does't work
  });

  const getCurrentLeader = async () => {
    const currentLeader = await usElectionContract.currentLeader();
    setCurrentLeader(currentLeader == Leader.UNKNOWN ? 'Unknown' : currentLeader == Leader.BIDEN ? 'Biden' : 'Trump')
  }

  const getCurrentSeats = async () => {
    const currentSeatsBiden = await usElectionContract.seats(Leader.BIDEN);
    setWonSeatsBiden(currentSeatsBiden);
    const currentSeatsTrump = await usElectionContract.seats(Leader.TRUMP);
    setWonSeatsTrump(currentSeatsTrump);
  }

  const getIsElectionEnded = async () => {
    const electionEnded = await usElectionContract.electionEnded();
    setElectionEnded(electionEnded);
  }

  const setElectionEnd = async () => {
    const tx = await usElectionContract.endElection()
      .catch((e)=>
        setTxError(e.error ? e.error.message : e.message)
      );

    if(tx) {
      setTransactionInProgress(tx);
      var txReceipt = await tx.wait();
      setTransactionInProgress(null);

      if(txReceipt.status === 1) { //success
        setTxError('');
        getIsElectionEnded();
      }
      else {
        setTxError('The transaction failed!');
      }
    }
  }

  const stateInput = (input) => {
    setName(input.target.value)
  }

  const bideVotesInput = (input) => {
    setVotesBiden(input.target.value)
  }

  const trumpVotesInput = (input) => {
    setVotesTrump(input.target.value)
  }

  const seatsInput = (input) => {
    setStateSeats(input.target.value)
  }

  const submitStateResults = async () => {
    const result:any = [name, votesBiden, votesTrump, stateSeats];

    const tx = await usElectionContract.submitStateResult(result)
      .catch((e)=>
        setTxError(e.error ? e.error.message : e.message)
      );

    if(tx) {
      setTransactionInProgress(tx);
      var txReceipt = await tx.wait();
      setTransactionInProgress(null);

      if(txReceipt.status === 1) { //success
        resetForm();
        setTxError('');
        getCurrentLeader();
        getCurrentSeats();
      }
      else {
        setTxError('The transaction failed!');
      }
    }
  }

  const resetForm = async () => {
    setName('');
    setVotesBiden(0);
    setVotesTrump(0);
    setStateSeats(0);
  }

  return (
    <div className="results-form">
    <div>
      <div><div className="info-line">Election Ended: {electionEnded ? "True" : "False"}</div></div>
      <div><div className="info-line">Current Leader is: {currentLeader}</div></div>
      <div><div className="info-line">WonSeats Trump {wonSeatsTrump} WonSeats Biden {wonSeatsBiden}</div></div>
    </div>
    <form>
      <label>
        State:
        <input onChange={stateInput} value={name} type="text" name="state" />
      </label>
      <label>
        BIDEN Votes:
        <input onChange={bideVotesInput} value={votesBiden} type="number" name="biden_votes" />
      </label>
      <label>
        TRUMP Votes:
        <input onChange={trumpVotesInput} value={votesTrump} type="number" name="trump_votes" />
      </label>
      <label>
        Seats:
        <input onChange={seatsInput} value={stateSeats} type="number" name="seats" />
      </label>
      {/* <input type="submit" value="Submit" /> */}
    </form>
    <div className="button-wrapper">
      <button onClick={submitStateResults}>Submit Results</button>
    </div>
    <div className="button-wrapper">
      <button onClick={setElectionEnd}>End Election</button>
    </div>
    {txError && (
        <div className="error"> {txError} </div>
    )}
    {
    transactionInProgress && (
      <>
        <div>Waiting for transaction</div>
        {console.log(transactionInProgress)}
        <a className="transactionLink"
          {...{
            href: formatEtherscanLink("Transaction", [chainId, transactionInProgress.hash]),
            target: "_blank",
            rel: "noopener noreferrer",
          }}>
          {transactionInProgress.hash}
        </a>
        <LoadingSpinner/>
      </>
    )}
    
    <style jsx>{`
        .results-form {
          display: flex;
          flex-direction: column;
          margin: 5px;
        }

        form {
          margin-top: 10px
        }

        .button-wrapper {
          margin: 20px;
        }
        
        .transactionLink {
          text-decoration: underline;
          color: blue;
        }

        .error {
          color: red;
        }

        .info-line {
          display: inline-block;
          border: 1px solid grey;
          border-radius: 5px;
          padding: 2px;
          margin: 2px;
        }
      `}</style>
    </div>
  );
};

export default USLibrary;
