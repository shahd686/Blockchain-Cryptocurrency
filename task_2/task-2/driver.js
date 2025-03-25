"use strict";

const blindSignatures = require('blind-signatures');
let SpyAgency = require('./spyAgency.js').SpyAgency;

function makeDocument(coverName) {
  return `The bearer of this signed document, ${coverName}, has full diplomatic immunity.`;
}

function blind(msg, n, e) {
  return blindSignatures.blind({
    message: msg,
    N: n,
    E: e,
  });
}

function unblind(blindingFactor, sig, n) {
  return blindSignatures.unblind({
    signed: sig,
    N: n,
    r: blindingFactor,
  });
}

let agency = new SpyAgency();

const coverNames = [
  "Agent X", "Agent Y", "Agent Z", "John Doe", "Jane Doe",
  "Mr. Smith", "Ms. Johnson", "Dr. Brown", "Captain Rogers", "Black Widow"
];

let documents = coverNames.map(makeDocument);

// ✅ Verifying values
console.log("📄 Documents before signing:", documents);

// ✅ Creating `blindDocs` and `blindingFactors` correctly
let blindResults = documents.map(doc => blind(doc, agency.n, agency.e));
let blindDocs = blindResults.map(result => result.blinded);
let blindingFactors = blindResults.map(result => result.r);

console.log("🔢 Blinding factors before signing:", blindingFactors);
console.log("📝 Blinded documents:", blindDocs);

agency.signDocument(blindDocs, (selected, verifyAndSign) => {
  if (selected < 0 || selected >= documents.length) {
    console.error("❌ Error: Selected document is invalid!");
    return;
  }

  console.log("📌 Selected document for signing:", selected, "-", coverNames[selected]);

  let filteredFactors = [...blindingFactors];
  let filteredDocs = [...documents];

  filteredFactors.splice(selected, 1);
  filteredDocs.splice(selected, 1);

  console.log("✅ Documents after filtering (before signing):", filteredDocs);
  console.log("✅ Blinding factors after filtering (before signing):", filteredFactors);

  if (filteredDocs.includes(undefined) || filteredFactors.includes(undefined)) {
    console.error("❌ Error: There are invalid documents or blinding factors after filtering!");
    return;
  }

  let blindedSignature = verifyAndSign(filteredFactors, filteredDocs);

  if (!blindedSignature) {
    console.error("❌ Error: No signature was generated for the document!");
    return;
  }

  // ✅ Verifying values after signing
  console.log("🔍 Original blinded document:", blindDocs[selected]);
  console.log("🔍 Signed blinded document:", blindedSignature);

  let unblindedSignature = unblind(blindingFactors[selected], blindedSignature, agency.n);
  console.log("🔑 blindingFactors[selected]:", blindingFactors[selected]);
  console.log("✔️ Original signature for document \"" + coverNames[selected] + "\":", unblindedSignature);
});
