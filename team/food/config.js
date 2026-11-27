/* KNPL-7 Food Arrangement: connection to the Food Apps Script (see FoodApi.gs). Paste the deployed /exec URL below. */
window.FOOD_API_URL = 'https://script.google.com/macros/s/AKfycbxZ2mM6CMTLb9rJN18I6EF77K_5usfJxjjt3lFlilAMqkNvwW6nlzq_W97rB--a8mDtDA/exec';
window.FOOD_CLOSES = '2027-02-09T18:30:00+05:30';
async function foodApi(fn, args) {
  if (!window.FOOD_API_URL) throw new Error('Food Arrangement is not switched on yet.\nFood Arrangement ഇതുവരെ ആരംഭിച്ചിട്ടില്ല.');
  let r;
  try { r = await fetch(window.FOOD_API_URL, {method: 'POST', body: JSON.stringify({fn, args: args || {}}), redirect: 'follow'}); }
  catch (_) { throw new Error('Could not reach the server. Check your internet connection and try again.\nസെർവറുമായി ബന്ധിപ്പിക്കാനായില്ല. ഇന്റർനെറ്റ് പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.'); }
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Request failed.');
  return j.result;
}
