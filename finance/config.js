/* KNPL-7 Finance Desk – settings for this page.
 * API_URL: the Web App URL of the Finance Desk Apps Script (Deploy ▸ New deployment ▸ Web app).
 * Leave it empty to run the page in DEMO MODE with sample data (nothing is sent anywhere). */
window.FIN_CONFIG = {
  API_URL: 'https://knpl7-finance-api.sobhapremierleague2020.workers.dev',   // Cloudflare Worker (fast). Previous Apps Script backend: https://script.google.com/macros/s/AKfycbxeYeUaZ0fqjocz4x51eYIumMeqOWxdq5pQjb_pMRJsLL4r1kMMghS5TgvCqSNIxJo/exec
  TEAM_DESK_ADMIN: '../team/admin/',
  FOOD_API_URL: 'https://script.google.com/macros/s/AKfycbxZ2mM6CMTLb9rJN18I6EF77K_5usfJxjjt3lFlilAMqkNvwW6nlzq_W97rB--a8mDtDA/exec'   // /exec URL of the Food Arrangement Apps Script (FoodApi.gs); the Food tab works once this is filled
};
