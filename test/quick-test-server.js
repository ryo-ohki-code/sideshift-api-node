// const SideshiftAPI = require('./../dist/index.cjs');
import { SideshiftAPI } from './../dist/index.js';

const SIDESHIFT_ID = "KHSffx5pb";
const SIDESHIFT_SECRET = "00443b224107297c9352d9948ec98443";
const COMMISSION_RATE = "0.5"; // Min 0 and max 2, set your commission rate from 0 to 2%. Default: 0.5
const RETRIES =  {
    maxRetries: 5,
    retryDelay: 2000,
    retryBackoff: 2,
    retryCappedDelay: 10000
}; // Optional


const sideshift = new SideshiftAPI({
    secret: SIDESHIFT_SECRET,
    id: SIDESHIFT_ID,
    commissionRate: COMMISSION_RATE, // Optional
    verbose: true, // Optional
    retries: RETRIES // Optional retries settings
});


async function test(){
  try {
      console.log(await sideshift.getCoins());
      console.log(await sideshift.getPermissions());
  } catch (error) {
      console.error('SideShift API Error:', error.message);
  }
}
test();