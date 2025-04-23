"use strict";
const blindSignatures = require('blind-signatures');
const { Coin, COIN_RIS_LENGTH, IDENT_STR, BANK_STR } = require('./coin.js');
const utils = require('./utils.js');

const BANK_KEY = blindSignatures.keyGeneration({ b: 2048 });
const N = BANK_KEY.keyPair.n.toString();
const E = BANK_KEY.keyPair.e.toString();

if (!BANK_KEY || !BANK_KEY.keyPair || !BANK_KEY.keyPair.n || !BANK_KEY.keyPair.e) {
  throw new Error('Invalid BANK_KEY or missing keyPair values.');
}

function signCoin(blindedCoinHash) {
  if (!blindedCoinHash) {
    throw new Error('Blinded coin hash is required');
  }

  return blindSignatures.sign({
    blinded: blindedCoinHash,
    key: BANK_KEY,
  });
}

function parseCoin(s) {
  let [cnst, amt, guid, leftHashes, rightHashes] = s.split('-');
  if (cnst !== BANK_STR) {
    throw new Error(`Invalid identity string: ${cnst} received, but ${BANK_STR} expected`);
  }
  let lh = leftHashes.split(',');
  let rh = rightHashes.split(',');
  return [lh, rh];
}

function acceptCoin(coin) {
  if (!coin || !coin.blinded || !coin.signature) {
    throw new Error('Invalid coin or coin signature.');
  }

  const isValidSignature = blindSignatures.verify({
    blinded: coin.blinded,
    signature: coin.signature,
    key: BANK_KEY,
  });

  if (!isValidSignature) {
    throw new Error('Invalid coin signature.');
  }

  let [leftHashes, rightHashes] = parseCoin(coin.toString());
  return Math.random() < 0.5 ? leftHashes : rightHashes;
}

function determineCheater(guid, ris1, ris2) {
  for (let i = 0; i < ris1.length; i++) {
    const pair1 = ris1[i];
    const pair2 = ris2[i];

    if ((parseInt(pair1, 16) ^ parseInt(pair2, 16)) === IDENT_STR) {
      console.log(`Cheater detected: Coin creator ID is ${guid}`);
      return;
    }
  }

  console.log(`Cheater detected: Merchant with GUID ${guid} is double-spending.`);
}

// ---------- MAIN EXECUTION ----------

let coin = new Coin('alice', 20, N, E);

// تأكد من أن `blinded` موجود
console.log("Blinded coin:", coin.blinded);

// توقيع العملة
coin.signature = signCoin(coin.blinded);

// عملية unblinding
coin.unblind();
console.log("Unblinded coin:", coin.blinded);

// التحقق من القبول مرتين
let ris1 = acceptCoin(coin);
let ris2 = acceptCoin(coin);

// تحديد الغشاش
determineCheater(coin.guid, ris1, ris2);
console.log();
determineCheater(coin.guid, ris1, ris1);
