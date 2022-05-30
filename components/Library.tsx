import type { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { useEffect, useState } from "react";
import useLibraryContract from "../hooks/useLibraryContract";
import LoadingSpinner from "./LoadingSpinner"
import { formatEtherscanLink, shortenHex } from "../util";
import Books from './Books'

type LibraryContract = {
  contractAddress: string;
};

const Library = ({ contractAddress }: LibraryContract) => {
  const { account, library, chainId } = useWeb3React<Web3Provider>();
  const libraryContract = useLibraryContract(contractAddress);
  const [bookName, setBookName] = useState<string | undefined>('');
  const [bookIdToRent, setBookIdToRent] = useState(0);
  const [bookIdToReturn, setBookIdToReturn] = useState(0);
  const [numberOfCopies, setNumberOfCopies] = useState<number | undefined>(0);
  const [txError, setTxError] = useState(null);
  const [transactionInProgress, setTransactionInProgress] = useState(null);
  const [books, setBooks] = useState<[]>([]);

  useEffect(() => {
    getBooks();

    libraryContract.on('NewBookAdded', () => {
      getBooks();
    })
    
    libraryContract.on('BookBorrowed', () => {
      getBooks();
    })

    libraryContract.on('BookReturned', () => {
      getBooks();
    })
  },[])



  const getBooks = async () => {
    const libraryBooks = await libraryContract.getBooks();
    setBooks(libraryBooks);
  }

  const addBook = async () => {
    executeTransaction(
      () => libraryContract.addBook(bookName, numberOfCopies),
      () => {resetAddBook();})
  }

  const rentBook = async () => {
    executeTransaction(
      () => libraryContract.borrowBook(bookIdToRent), 
      () => {resetRentBook();})
  }

  const returnBook = async () => {
    executeTransaction(
      () => libraryContract.returnBook(bookIdToReturn), 
      () => {resetReturnBook();})
  }

  const executeTransaction = async (txFunc, successCallcack) => {
    const tx = await txFunc()
      .catch((e)=>
        setTxError(e.error ? e.error.message : e.message)
      );

    if(tx) {
      setTransactionInProgress(tx);
      var txReceipt = await tx.wait();
      setTransactionInProgress(null);

      if(txReceipt.status === 1) { //success
        setTxError('');
        if(successCallcack) {
          successCallcack();
        }
      }
      else {
        setTxError('The transaction failed!');
      }
    }
  }

  const bookNameInput = (input) => {
    setBookName(input.target.value)
  }

  const numberOfCopiesInput = (input) => {
    setNumberOfCopies(input.target.value)
  }

  const bookIdToRentInput= (input) => {
    setBookIdToRent(input.target.value)
  }

  const bookIdToReturnInput= (input) => {
    setBookIdToReturn(input.target.value)
  }

  const resetAddBook = async () => {
    setBookName('');
    setNumberOfCopies(0);
  }

  const resetRentBook = async () => {
    setBookIdToRent(0);
  }

  const resetReturnBook = async () => {
    setBookIdToReturn(0);
  }

  return (
    <div className="library">
      <div className="library-books">
        <h3>LibraryBooks</h3>
        <Books books={books}/>
      </div>
    <div className="library-form">
    <form>
      <label>
        BookName: 
        <input onChange={bookNameInput} value={bookName} type="text" name="bookName" />
      </label>
      <label>
        NumberOfCopies:
        <input onChange={numberOfCopiesInput} value={numberOfCopies} type="number" name="numberOfCopies" />
      </label>
      {/* <input type="submit" value="Submit" /> */}
    </form>
    <div className="button-wrapper">
      <button onClick={addBook}>AddBook</button>
    </div>
    <label>
        Rent Book ID:
        <input onChange={bookIdToRentInput} value={bookIdToRent} type="number" name="bookIdToRent" />
    </label>
    <div className="button-wrapper">
      <button onClick={rentBook}>Borrow Book</button>
    </div>
    <label>
        Return Book ID:
        <input onChange={bookIdToReturnInput} value={bookIdToReturn} type="number" name="bookIdToRent" />
    </label>
    <div className="button-wrapper">
      <button onClick={returnBook}>Return Book</button>
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
    
    </div>
    </div>
  );
};

export default Library;
