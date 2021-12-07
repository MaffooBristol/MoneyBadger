'use strict';

// I think this is a really bad idea.

import Statements from './statements';

import Transactions from './transactions';

// import Cache from './cache';

const _Statements = new Statements();
export { _Statements as Statements };
const _Transactions = new Transactions();
export { _Transactions as Transactions };
// const _Cache = new Cache();
// export { _Cache as Cache };
