//Canister code

//Importing required modules
import {
    $query,
    $update,
    Record,
    StableBTreeMap,
    Vec,
    match,
    Result,
    nat64,
    ic,
    float32,
    int,
    Opt
} from 'azle';
// import { v4 as uuidv4 } from 'uuid';
import yahooFinance from 'yahoo-finance2';

// Defining data strcture type Stock
type Stock = Record<{
    symbol:string;
    historicalReturn:Promise<float32>;
    purchasePrice:Promise<float32>[];
    purchaseDate:string[];
    quantityPurchased:int;
}>;

// Defining Stock Payload
type StockPayload = Record<{
  symbol: string;
  quantityPurchased:int;
}>;

// Defining Portfolio
const Portfolio = new StableBTreeMap<string, Stock>(0, 1024, 1024);

// define a function to calculate the return on a given day
function calculateReturn(currentPrice: float32, previousPrice: float32): float32 {
    return ((currentPrice - previousPrice) / previousPrice) * 100;
  }
  
  // define a function to get the historical data of a stock for the past month
  async function getHistoricalData(symbol: string): Promise<float32[]> {
    const today = new Date();
    const historicalData: Array<any> = await yahooFinance.historical(symbol, {
      period1: `${today.getFullYear()}-${
        today.getMonth() - 1
      }-${today.getDate()}}`,
      period2: `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}}`,
    });
    // return an array of the closing prices
    return historicalData.map((data) => data.close);
  }
  
  // define a function to calculate the average of an array of numbers
  function average(array: float32[]): float32 {
    // get the sum of the array
    const sum = array.reduce((a, b) => a + b, 0);
    // get the length of the array
    const length = array.length;
    // return the sum divided by the length
    return sum / length;
  }
  
  // define a function to calculate the average return of a stock for the past month
  async function averageReturn(symbol: string): Promise<float32> {
    // get the historical data of the stock
    const prices = await getHistoricalData(symbol);
    // initialize an array to store the returns
    const returns: float32[] = [];
    // loop through the prices from the second day to the last day
    for (let i = 1; i < prices.length; i++) {
      // get the current price and the previous price
      const currentPrice = prices[i];
      const previousPrice = prices[i - 1];
      // calculate the return on that day
      const returnOnDay = calculateReturn(currentPrice, previousPrice);
      // push the return to the array
      returns.push(returnOnDay);
    }
    // calculate the average of the returns
    const averageReturn = average(returns);
    // return the average return
    return averageReturn;
  }

// define a function to get the current price of a stock 
  async function getCurrentPrice(symbol: string): Promise<float32> {
    const purchaseDate = new Date().getDate();
    const purchaseMonth = new Date().getMonth();
    const purchaseYear = new Date().getFullYear();
    const query = symbol;
    const queryOptions = {
      period1: `${purchaseYear}-${purchaseMonth}-${purchaseDate}` /* ... */,
    };
    const result = await yahooFinance.historical(query, queryOptions);
    return result[0].close;
  }  

  function getCurrentDate():string{
    const purchaseDate = new Date().getDate();
    const purchaseMonth = new Date().getMonth();
    const purchaseYear = new Date().getFullYear();
    return `${purchaseDate}-${purchaseMonth}-${purchaseYear}`;
  }

// Function to register new stock in the portfolio
$update;
export function register(payload: StockPayload): Result<Stock, string> {   
    const stock: Stock = {
      historicalReturn: averageReturn(payload.symbol),
      purchasePrice: [getCurrentPrice(payload.symbol)],
      purchaseDate: [getCurrentDate()],
      ...payload,
    };
    Portfolio.insert(stock.symbol, stock);
    return Result.Ok(stock);
  }

// Function to update portfolio on buying new stock(s)
$update;
export function buyStock(
  symbol: string,
  quantity: int,
  payload: StockPayload
): Result<Stock, string> {
  return match(Portfolio.get(symbol), {
    Some: (stock) => {
      const updatedStock: Stock = {
        ...stock,
        ...payload,
        purchasePrice: [...stock.purchasePrice, ...[getCurrentPrice(symbol)]],
        purchaseDate: [...stock.purchaseDate, ...[getCurrentDate()]],
        quantityPurchased: stock.quantityPurchased + quantity,
      };
      Portfolio.insert(symbol, updatedStock);
      return Result.Ok<Stock, string>(updatedStock);
    },
    None: () =>
      Result.Err<Stock, string>(
        `couldn't update stock ${symbol}.stock not found`
      ),
  });
}


// Function to update portfolio on selling new stock(s) and removing the stock if sold out


// Function to update portfolio on removing a stock iff sold out


// Function to query for profit on a stock (negative profit => loss)


// Function to query for total profit on portfolio


// Function to query for quantity of a stock


// Function to optimize portfolio using Black Scholes Formula


