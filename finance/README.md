# KNPL-7 Finance Desk

Restricted finance dashboard for KNPL-7: income approvals from every source, expense orders with budget control,
payments, bank reconciliation, receipts / vouchers and the season's finance statement.

Live address after upload: `https://knplseason7.github.io/knpl7/finance/`
(also linked as **Finance Ledger ↗** on the Team Desk committee page).

## Files

| File | What it is |
|---|---|
| `index.html`, `fin.css`, `fin-app.js` | The page |
| `fin-core.js` | All business rules (approvals, budget check, explanation check, reconciliation, statement). The same file runs on the server |
| `fin-docs.js` | Receipt, payment voucher, finance statement, ledger CSV |
| `fin-demo.js` | Demo mode – sample data in the browser only |
| `config.js` | `API_URL` of the backend. Empty = demo mode |
| `apps-script/Code.gs` + `apps-script/FinanceCore.gs` | Google Apps Script backend (FinanceCore.gs is a copy of fin-core.js) |

The page also uses `../team/ocr.js` (bill / receipt reader) and `../team/a/knpl.png` (logo) from the Team Desk.

## Going live (about 15 minutes)

1. **Upload** the `finance` folder to the `knpl7` repository (and the updated `team/admin/index.html`).
   With `API_URL` empty the page opens in demo mode, so this is safe to do first.
2. In the KNPL Google account (knplone@gmail.com), **create a new Google Sheet** named `KNPL-7 Finance Ledger`.
3. **Extensions ▸ Apps Script**. Replace `Code.gs` with `apps-script/Code.gs`; add a script file `FinanceCore` and paste `apps-script/FinanceCore.gs`.
4. **Project Settings ▸ Script properties** – add `TEAMDESK_PIN` = the Team Desk **Finance** PIN (lets the Finance Desk read franchise payments).
5. Run **`setup`** once (allow the permissions). The execution log shows the **access codes of the 5 profiles**.
   The sheet now has the tabs Users, Heads, Income, Expenses, Ledger, Bank, Payees, Audit and Settings.
6. **Deploy ▸ New deployment ▸ Web app** – Execute as: *Me* · Who has access: *Anyone*. Copy the web app URL.
7. Put the URL in `finance/config.js` → `API_URL: 'https://script.google.com/macros/s/…/exec'` and upload it.
8. Open the page, sign in with the Admin code and your name, then:
   - **Budget** – check every head (amounts were pre-filled from the KNPL-7 budget plan; heads at ₹0 need a budget).
   - **Settings ▸ Access profiles** – share each profile's code with the people who do that job (WhatsApp button); "New code" replaces a code.
   - **Settings ▸ Income sources** – enable the Cover Drive sheet (paste its Sheet ID) and the Phase 2 registration sheet
     (use *Show the sheet columns* to copy the exact column names; registration uses a fixed ₹1,000).
   - **Settings ▸ Organisation** – bank name / account for the statement, signatories, opening balance.

When `fin-core.js` changes, paste it again into `FinanceCore.gs` and **Deploy ▸ Manage deployments ▸ Edit ▸ New version**.

## How it works

**Access profiles** – one access code per duty (KNPL-7):
Admin – Krishnadas M N (everything: settings, budget, codes, second approval, reversals) ·
Franchise fees – Unnikrishnan S (Team Desk income) ·
Finance – Vineeth Kannath (other income approval, expense approval incl. explanations, payments, bank reconciliation) ·
Expense creation – any committee member with the code (raise orders with bills, outbound income) ·
Viewer / Auditor – anyone with the code (read-only). Separate Other income / Expense approval / Payments & bank profiles can be
added in Settings if the work is split later.
At sign-in each person enters the code **and their name**, so approvals and the audit trail read "Name · Profile".
Codes are stored only as a hash; "New code" replaces a code and ends every session that used the old one; 30 wrong codes in
15 minutes pause sign-in; sessions end after 6 hours. Nothing is approved with the same code that created it.
If the Admin code is lost, run `newAdminCode()` in the Apps Script editor; `issueProfileCodes()` re-creates any missing profile.

**Income** – *Fetch from sources* reads the Team Desk payments (caution deposit, ownership, draft, jersey fee), the Cover Drive
sponsorship sheet and the registration sheet. Team Desk payments already approved by Finance on the Team Desk are posted directly
(the switch "Source approval counts" controls this per source); everything else waits in *Awaiting approval*. Outbound income
(not from any source) is added by hand with proof and a note. Approval posts the entry to the ledger and issues a receipt number.

**Expenses** – an order needs the head, payee, bill number/date, amount, the bill (photo/PDF) and payment details.
The bill is read automatically for account number, IFSC, UPI ID / GPay number, bill number, date and total; the IFSC is
looked up for bank and branch; payees paid before are remembered. Typed account numbers must be entered twice.
The live **budget check** shows budget, spent, committed and available. If the order goes over budget, or the head has no
budget (*outbound*), an **explanation note** is compulsory; random letters, keyboard runs, filler words, repeated words or a copy
of the title are rejected with advice to give a clear reason. Finance must tick that the explanation was read and accepted
before approving. Orders of ₹25,000+ and all outbound orders also need an Admin approval (Settings). Finance then pays
(UPI app button on phones) and records mode, date and reference → voucher number + ledger entry. Budget is re-checked at
approval time; earlier orders have priority over later ones.

**Bank & Reconcile** – import the bank statement (CSV, Excel or pasted rows; columns are detected, duplicates skipped).
Lines are auto-matched when the amount is equal and the reference appears in the narration. Others are matched by hand
(suggestions by amount, date, name; several entries can make up one bank line), turned into outbound income, or marked
"not in ledger" with a reason. Cash entries are marked as having no bank line. The bank reconciliation shows book balance,
bank balance and the difference.

**Ledger & Statements** – the ledger is never edited; mistakes are corrected by a reversal (Admin, with reason).
The finance statement contains: Income & Expenditure, Receipts & Payments, Statement of Balances (deposits as a liability),
Budget vs Actual, all over-budget / outbound payments with explanations and who acknowledged them, the Bank Reconciliation
Statement and a certification block. It is stamped DRAFT until everything is approved and reconciled, then FINAL.
Print or "Save as PDF" from the preview; the ledger downloads as CSV for Excel.

Every action is in the **Audit trail**.

## Demo

Open the page with `?demo=1` (or an empty `API_URL`). Demo codes: Admin ADMN-DEMO · Franchise fees FEES-DEMO · Finance FNCE-DEMO ·
Expense creation CRTE-DEMO · Viewer VWER-DEMO. *Reset demo data* in the yellow bar restores the sample set.
