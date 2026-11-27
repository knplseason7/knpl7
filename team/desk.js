/* KNPL-7 Team Desk – franchise page logic (uses common.js and receipt.js). */
window.TX = {
 tabSpo:['Sponsorship','Sponsorship'],
 tgKick:['Your team\'s sponsorship target','നിങ്ങളുടെ ടീമിന്റെ Sponsorship ലക്ഷ്യം'],tgReceived:['Received so far (confirmed)','ഇതുവരെ ലഭിച്ചത് (ഉറപ്പായത്)'],tgTarget:['Target','ലക്ഷ്യം'],
 tgSplitT:['{c} confirmed · {w} under approval','{c} ഉറപ്പായി · {w} Approval-ന്'],
 cheer0:['Start today – one sponsor is all it takes to get going. Share your link below.','ഇന്നുതന്നെ തുടങ്ങൂ – ഒരു Sponsor മതി തുടക്കത്തിന്. താഴെയുള്ള Link അയയ്ക്കൂ.'],
 cheer1:['{a} more and your full ₹15,000 caution deposit comes back. Keep going!','ഇനി {a} കൂടി – ₹15,000 Caution Deposit മുഴുവൻ തിരികെ ലഭിക്കും. തുടരൂ!'],
 cheer2:['Deposit covered! {a} more to reach your team target. Every rupee above ₹15,000 also earns 20% for your team.','Deposit ഉറപ്പായി! ലക്ഷ്യത്തിലെത്താൻ ഇനി {a} കൂടി. ₹15,000-ന് മുകളിലുള്ള ഓരോ രൂപയ്ക്കും 20% ടീമിന് ലഭിക്കും.'],
 cheer3:['Target achieved – thank you! Team Building Allowance earned so far: {a}. Keep raising KNPL higher!','ലക്ഷ്യം നേടി – നന്ദി! ഇതുവരെ നേടിയ Team Building Allowance: {a}. KNPL-നെ ഇനിയും ഉയർത്തൂ!'],
 rankT:['Your team is #{r} of {n} · {a} teams have brought sponsors so far.','നിങ്ങളുടെ ടീം {n}-ൽ #{r} · ഇതുവരെ {a} ടീമുകൾ Sponsors-നെ കൊണ്ടുവന്നു.'],
 rank0:['{a} of {n} teams have brought sponsors so far – make yours the next!','{n}-ൽ {a} ടീമുകൾ ഇതുവരെ Sponsors-നെ കൊണ്ടുവന്നു – അടുത്തത് നിങ്ങളുടേതാകട്ടെ!'],
 shTitle:['Your team\'s sponsorship link','നിങ്ങളുടെ ടീമിന്റെ Sponsorship Link'],
 shNote:['Every sponsorship made through this link is credited to your team.','ഈ Link വഴി വരുന്ന എല്ലാ Sponsorship-ഉം നിങ്ങളുടെ ടീമിന്റെ പേരിൽ കണക്കാക്കും.'],
 shMsg:['Message to send (you can edit it)','അയയ്ക്കേണ്ട സന്ദേശം (മാറ്റം വരുത്താം)'],shWa:['Send on WhatsApp','WhatsApp-ൽ അയയ്ക്കുക'],shCopyMsg:['Copy message','സന്ദേശം Copy ചെയ്യുക'],
 avTitle:['Sponsorships available now','ഇപ്പോൾ ലഭ്യമായ Sponsorships'],avItem:['Sponsorship','Sponsorship'],avRate:['Amount','തുക'],avLeft:['Slots left','ബാക്കി Slots'],
 lbTitle:['All teams','എല്ലാ ടീമുകളും'],lbNote:['Sponsorship brought by each franchise (including under approval). Every team that brings sponsors makes KNPL stronger.','ഓരോ ഫ്രാഞ്ചൈസിയും കൊണ്ടുവന്ന Sponsorship (Approval-ന് ഉള്ളവ ഉൾപ്പെടെ). Sponsors-നെ കൊണ്ടുവരുന്ന ഓരോ ടീമും KNPL-നെ കൂടുതൽ ശക്തമാക്കുന്നു.'],
 shareOut:['credit shared with {t}','{t}-മായി Credit പങ്കിട്ടു'],shareIn:['credit shared by {t}','{t} പങ്കിട്ട Credit'],
 spoTitle:['Sponsorship','Sponsorship'],
 spoIntro:['Bring sponsors for KNPL-7. Share your team\'s own sponsorship link – every sponsorship that comes through it is credited to your team.','KNPL-7-ന് Sponsors-നെ കൊണ്ടുവരിക. നിങ്ങളുടെ ടീമിന്റെ സ്വന്തം Sponsorship Link അയയ്ക്കുക – അതിലൂടെ വരുന്ന എല്ലാ Sponsorship-ഉം നിങ്ങളുടെ ടീമിന്റെ പേരിൽ കണക്കാക്കും.'],
 catOpen:['Open now','ഇപ്പോൾ തുറന്നിരിക്കുന്നു'],catSoon:['Coming soon','ഉടൻ വരുന്നു'],
 catOpenBtn:['Open sponsorship page','Sponsorship പേജ് തുറക്കുക'],catShare:['Share with a sponsor','Sponsor-ന് അയയ്ക്കുക'],catStatus:['Live status','Live Status'],
 slotsOpen:['{n} slots open · worth {v}','{n} Slots ബാക്കി · {v} മൂല്യം'],
 spoMine:['Your team\'s sponsorships','നിങ്ങളുടെ ടീമിന്റെ Sponsorships'],
 kTotal:['Brought in','ആകെ കൊണ്ടുവന്നത്'],kConf:['Payment confirmed','Payment ഉറപ്പായത്'],kWait:['Under approval','Approval-ന് കാത്തിരിക്കുന്നു'],
 depProg:['Counted for your caution deposit refund: {a} of {b}','Caution Deposit തിരികെ ലഭിക്കാൻ കണക്കാക്കിയത്: {b}-ൽ {a}'],
 depFull:['Your full ₹15,000 caution deposit is covered. 20% of confirmed sponsorship above ₹15,000 comes back as Team Building Allowance: {a} so far.','₹15,000 Caution Deposit മുഴുവൻ തിരികെ ലഭിക്കും. ₹15,000-ന് മുകളിലുള്ള ഉറപ്പായ Sponsorship-ന്റെ 20% Team Building Allowance ആയി ലഭിക്കും: ഇതുവരെ {a}.'],
 spoNone:['No sponsorships yet. Share your team link with families, businesses and well-wishers.','ഇതുവരെ Sponsorships ഇല്ല. കുടുംബങ്ങൾ, സ്ഥാപനങ്ങൾ, അഭ്യുദയകാംക്ഷികൾ എന്നിവർക്ക് ടീം Link അയയ്ക്കുക.'],
 spoRule:['The caution deposit is refunded up to the confirmed sponsorship your team brings (max ₹15,000). A team jersey sponsorship counts as ₹2,600 (₹7,500 − 14 × ₹350).','ടീം കൊണ്ടുവരുന്ന ഉറപ്പായ Sponsorship വരെ (പരമാവധി ₹15,000) Caution Deposit തിരികെ ലഭിക്കും. Team Jersey Sponsorship ₹2,600 ആയി കണക്കാക്കും (₹7,500 − 14 × ₹350).'],
 spoFail:['Could not load the live sponsorship status. Try again later.','Live Sponsorship Status ലോഡ് ആയില്ല. പിന്നീട് ശ്രമിക്കുക.'],
 confirmed:['confirmed','ഉറപ്പായി'],underAppr:['under approval','Approval-ന്'],
 ocrHint:['Upload first – the date and transaction number are filled in for you.','ആദ്യം Upload ചെയ്യുക – തീയതിയും Transaction Number-ഉം സ്വയം പൂരിപ്പിക്കും.'],
 ocrReading:['🔍 Reading your receipt…','🔍 Receipt വായിക്കുന്നു…'],
 ocrFilled:['✔ Filled from the receipt – please check: {f}','✔ Receipt-ൽ നിന്ന് പൂരിപ്പിച്ചു – ദയവായി പരിശോധിക്കുക: {f}'],
 ocrNoTxn:['⚠ No transaction number found in this receipt. Please upload a screenshot or receipt that clearly shows the UPI Transaction ID / UTR number.','⚠ ഈ Receipt-ൽ Transaction Number കാണുന്നില്ല. UPI Transaction ID / UTR നമ്പർ വ്യക്തമായി കാണുന്ന Screenshot അല്ലെങ്കിൽ Receipt Upload ചെയ്യുക.'],
 fCovTitle:['This receipt also pays for (tick if you paid them together)','ഈ Receipt-ൽ ഒരുമിച്ച് അടച്ച മറ്റിനങ്ങൾ (ഉണ്ടെങ്കിൽ tick ചെയ്യുക)'],
 fCovHint:['Paid two or more items in one transaction? Tick them – the same receipt is submitted for each.','ഒരേ transaction-ൽ ഒന്നിലധികം ഇനങ്ങൾ അടച്ചെങ്കിൽ tick ചെയ്യുക – അതേ receipt ഓരോന്നിനും സമർപ്പിക്കും.'],
 fCovTot:['{n} items · {a} in all – check this matches the receipt.','{n} ഇനങ്ങൾ · ആകെ {a} – Receipt-ലെ തുകയുമായി ഒത്തുനോക്കുക.'],
 ocrCombined:['Receipt amount {a} = {l}. These items are ticked and will be submitted together.','Receipt-ലെ തുക {a} = {l}. ഈ ഇനങ്ങൾ tick ചെയ്തിട്ടുണ്ട്, ഒരുമിച്ച് സമർപ്പിക്കും.'],
 ocrAmt2:['If you paid more than one item together, tick them below.','ഒന്നിലധികം ഇനങ്ങൾ ഒരുമിച്ച് അടച്ചെങ്കിൽ താഴെ tick ചെയ്യുക.'],
 uploadingN:['Uploading {i} of {n}…','{n}-ൽ {i} upload ചെയ്യുന്നു…'],
 submittedN:['Submitted for {n} items. The committee will check and approve.','{n} ഇനങ്ങൾക്ക് സമർപ്പിച്ചു. കമ്മിറ്റി പരിശോധിച്ച് approve ചെയ്യും.'],
 ocrAmt:['Amount on the receipt is {a}, but {b} is due for this item. Please check you chose the right item.','Receipt-ലെ തുക {a} ആണ്, ഈ ഇനത്തിന് {b} ആണ് അടയ്ക്കേണ്ടത്. ശരിയായ ഇനമാണോ തിരഞ്ഞെടുത്തതെന്ന് പരിശോധിക്കുക.'],
 ocrFail:['The receipt could not be read automatically. Please type the details.','Receipt സ്വയം വായിക്കാനായില്ല. വിവരങ്ങൾ ടൈപ്പ് ചെയ്യുക.'],
 ocrWait:['Please wait – the receipt is still being read.','ദയവായി കാത്തിരിക്കുക – Receipt വായിക്കുന്നു.'],
 fTxn:['Transaction no.','Transaction No.'],fDt:['Date','തീയതി'],fMd:['Mode','രീതി'],
 tabHelp:['Help','സഹായം'],tabFix:['Fixture & Ladder','Fixture & Ladder'],helpTitle:['Help & contacts – topic-wise','സഹായം – ഓരോ വിഷയത്തിനും ബന്ധപ്പെടേണ്ടവർ'],
 helpIntro:['Each topic is handled by its KNPL Playbook presenter. For any query or clarification, contact the person for that topic directly.','ഓരോ വിഷയവും KNPL Playbook-ൽ അവതരിപ്പിച്ച ആളാണ് കൈകാര്യം ചെയ്യുന്നത്. സംശയങ്ങൾക്കും വിശദീകരണങ്ങൾക്കും ആ വിഷയത്തിന്റെ ആളെ നേരിട്ട് ബന്ധപ്പെടുക.'],
 call:['Call','വിളിക്കുക'],wa:['WhatsApp','WhatsApp'],
 footer2:['KNPL-7 Team Desk · For queries, see the Help tab · Team KNPL','KNPL-7 Team Desk · സംശയങ്ങൾക്ക് Help Tab കാണുക · Team KNPL'],
 dsTitle:['Your team jersey','നിങ്ങളുടെ ടീം Jersey'],dsApproved:['Approved design','അംഗീകരിച്ച Design'],dsFinal:['Final design (from the manufacturer)','Final Design (നിർമ്മാതാവിൽ നിന്ന്)'],
 dsWait:['The final design will appear here once the manufacturer makes it.','നിർമ്മാതാവ് തയ്യാറാക്കിയാൽ Final Design ഇവിടെ കാണാം.'],dsLoading:['Loading…','ലോഡ് ചെയ്യുന്നു…'],
 dsUpdated:['Updated {d}','{d}-ന് പുതുക്കി'],dsColours:['Colours: {c}','നിറങ്ങൾ: {c}'],
 rnTitle:['Please note','ശ്രദ്ധിക്കുക'],
 r6:['It is the team\'s responsibility to check that the season replacement player is available for the whole tournament before submitting the request.','അപേക്ഷ സമർപ്പിക്കുന്നതിന് മുമ്പ് Season Replacement കളിക്കാരൻ ടൂർണമെന്റ് മുഴുവൻ ലഭ്യമാണെന്ന് ഉറപ്പാക്കേണ്ടത് ടീമിന്റെ ഉത്തരവാദിത്തമാണ്.'],
 r7:['Replaced player: ₹500 of his registration fee is reimbursed. Season replacement player: his registration fee is reimbursed after deducting ₹500 as tournament fee (₹500 back).','മാറ്റുന്ന കളിക്കാരന്: Registration Fee-യിൽ നിന്ന് ₹500 തിരികെ നൽകും. Season Replacement കളിക്കാരന്: ₹500 Tournament Fee കുറച്ച് Registration Fee തിരികെ നൽകും (₹500 തിരികെ).'],
 r8:['Players still in the unsold list after the season replacements are finalised (if any): the registration fee paid will be reimbursed.','Season Replacements അന്തിമമാക്കിയ ശേഷവും Unsold List-ൽ ഉള്ള കളിക്കാർക്ക് (ഉണ്ടെങ്കിൽ): അടച്ച Registration Fee തിരികെ നൽകും.'],
 noPay:['No payment','പണമടയ്ക്കേണ്ടതില്ല'],refund2:['₹500 back to each player','ഓരോ കളിക്കാരനും ₹500 തിരികെ'],
 notYet:['Not due yet','ഇപ്പോൾ ബാധകമല്ല'],
 howTitle:['How to pay','പണമടയ്ക്കേണ്ട വിധം'],
 nextTitle:['Next payment','അടുത്ത പണമടയ്ക്കൽ'],pendTitle:['Pending payments – pay in this order','അടയ്ക്കാനുള്ളവ – ഈ ക്രമത്തിൽ അടയ്ക്കുക'],pendSum:['{n} to pay · {a} in all','അടയ്ക്കാനുള്ളത് {n} · ആകെ {a}'],pendWaitHead:['Uploaded – waiting for committee approval (nothing more to do)','Upload ചെയ്തു – Committee Approval കാത്തിരിക്കുന്നു (ഇനി ഒന്നും ചെയ്യേണ്ടതില്ല)'],pendLate:['{n} past the due date','{n} എണ്ണത്തിന്റെ തീയതി കഴിഞ്ഞു'],pastDue:['Due date {d} passed – pay / upload the receipt now','അവസാന തീയതി {d} കഴിഞ്ഞു – ഉടൻ അടച്ച് Receipt Upload ചെയ്യുക'],nextBtn:['Upload receipt','Receipt Upload ചെയ്യുക'],
 nextLate:['{n} item(s) are past the due date. Upload them first.','{n} ഇനങ്ങളുടെ തീയതി കഴിഞ്ഞു. ആദ്യം അവ Upload ചെയ്യുക.'],
 allDone:['All payments due so far are uploaded. Thank you!','ഇതുവരെയുള്ള എല്ലാ പണമടയ്ക്കലുകളും Upload ചെയ്തു. നന്ദി!'],
 progress:['{a} of {t} approved · {w} waiting for approval','{t}-ൽ {a} Approved · {w} Approval കാത്തിരിക്കുന്നു'],
 dueBy:['Due by {d}','അവസാന തീയതി {d}'],
 franchises:['Franchises only','ഫ്രാഞ്ചൈസികൾക്ക് മാത്രം'],
 tagline:['Fee receipts, jersey details and season replacements – log in with your Team Draft code.','Fee Receipts, Jersey Details, Season Replacement – Team Draft code ഉപയോഗിച്ച് Login ചെയ്യുക.'],
 login:['Log in','Login'],
 loginNote:['Use your <b>team code</b> – the same code you use for the Team Draft page.','Team Draft പേജിന് ഉപയോഗിക്കുന്ന അതേ <b>Team Code</b> ഉപയോഗിക്കുക.'],
 teamCode:['Team code','Team Code'],loginBtn:['Log in','Login'],checking:['Checking…','പരിശോധിക്കുന്നു…'],logout:['Log out','Logout'],
 enterCode:['Enter your team code.','Team Code നൽകുക.'],
 tabPay:['Payments & receipts','പണമടയ്ക്കൽ & Receipts'],tabJer:['Jersey details','Jersey Details'],tabRep:['Season replacement','Season Replacement'],
 payTitle:['Fees, due dates and receipts','Fees, അവസാന തീയതികൾ, Receipts'],
 ps1:['Pay the amount to the KNPL account shown below.','താഴെ കാണിച്ച KNPL അക്കൗണ്ടിലേക്ക് തുക അടയ്ക്കുക.'],
 ps2:['Press Upload next to that item and add the payment screenshot.','ആ ഇനത്തിന് നേരെയുള്ള Upload അമർത്തി Payment Screenshot ചേർക്കുക.'],
 ps3:['The KNPL committee checks and approves it. You get a WhatsApp message.','KNPL കമ്മിറ്റി പരിശോധിച്ച് Approve ചെയ്യും. WhatsApp സന്ദേശം ലഭിക്കും.'],
 ps4:['Open this page again – your KNPL receipt downloads automatically.','ഈ പേജ് വീണ്ടും തുറക്കുക – KNPL Receipt സ്വയം Download ആകും.'],
 payTo:['Pay to:','പണമടയ്ക്കേണ്ടത്:'],
 utrTitle:['The transaction number must be visible','Transaction Number വ്യക്തമായി കാണണം'],
 utr1:['Upload the payment confirmation screen or bank receipt that shows the UPI Transaction ID / UTR number, the amount, the date and who it was paid to.','UPI Transaction ID / UTR നമ്പർ, തുക, തീയതി, ആർക്കാണ് അടച്ചത് എന്നിവ കാണുന്ന Payment Confirmation Screen അല്ലെങ്കിൽ Bank Receipt Upload ചെയ്യുക.'],
 utr2:['The page reads the transaction number and date from your receipt and fills them in. A receipt without a transaction number cannot be uploaded.','പേജ് നിങ്ങളുടെ Receipt-ൽ നിന്ന് Transaction Number-ഉം തീയതിയും വായിച്ച് സ്വയം പൂരിപ്പിക്കും. Transaction Number ഇല്ലാത്ത Receipt Upload ചെയ്യാനാകില്ല.'],
 utr3:['Photos are compressed automatically before upload and saved securely in KNPL\'s Drive.','ചിത്രങ്ങൾ Upload ചെയ്യുന്നതിന് മുമ്പ് സ്വയം Compress ചെയ്ത് KNPL Drive-ൽ സുരക്ഷിതമായി സൂക്ഷിക്കും.'],
 seeSample:['See a sample receipt','Sample Receipt കാണുക'],
 uploadAny:['Upload a receipt','Receipt Upload ചെയ്യുക'],
 formTitle:['Upload a payment receipt','Payment Receipt Upload ചെയ്യുക'],fItem:['Payment for','ഏതിനുള്ള പണമടയ്ക്കൽ'],
 fAmt:['Amount: {a} · Due by {d}','തുക: {a} · അവസാന തീയതി {d}'],
 fDate:['Date of payment','പണമടച്ച തീയതി'],fMode:['Payment mode','പണമടച്ച രീതി'],
 fUtr:['Transaction number (UTR / UPI ref.)','Transaction Number (UTR / UPI Ref.)'],fUtrPh:['e.g. 6123 4567 8901','ഉദാ: 6123 4567 8901'],
 fPayer:['Paid by (name)','പണമടച്ചയാളുടെ പേര്'],fFile:['Payment screenshot or receipt','Payment Screenshot / Receipt'],
 fFileNote:['JPG, PNG, WEBP or PDF – photos are compressed automatically','JPG, PNG, WEBP അല്ലെങ്കിൽ PDF – ചിത്രങ്ങൾ സ്വയം Compress ചെയ്യും'],
 fNote:['Note (optional)','കുറിപ്പ് (ആവശ്യമെങ്കിൽ)'],
 fAck:['I confirm this amount was paid to KNPL and the transaction number is visible in the uploaded receipt.','ഈ തുക KNPL-ന് അടച്ചതാണെന്നും Upload ചെയ്യുന്ന Receipt-ൽ Transaction Number കാണാമെന്നും ഞാൻ ഉറപ്പുനൽകുന്നു.'],
 submit:['Submit for approval','Approval-ന് സമർപ്പിക്കുക'],cancel:['Cancel','റദ്ദാക്കുക'],uploading:['Compressing and uploading…','Compress ചെയ്ത് Upload ചെയ്യുന്നു…'],
 submitted:['Submitted. The committee will verify it; your receipt will be ready here once approved.','സമർപ്പിച്ചു. കമ്മിറ്റി പരിശോധിച്ച് Approve ചെയ്താൽ Receipt ഇവിടെ ലഭിക്കും.'],
 vDate:['Enter the date of payment.','പണമടച്ച തീയതി നൽകുക.'],vUtr:['Enter the transaction number.','Transaction Number നൽകുക.'],vPayer:['Enter the name of the person who paid.','പണമടച്ച ആളുടെ പേര് നൽകുക.'],
 vFile:['Attach the payment screenshot or receipt.','Payment Screenshot / Receipt ചേർക്കുക.'],vAck:['Please tick the confirmation.','ഉറപ്പുനൽകൽ Tick ചെയ്യുക.'],vItem:['Choose what the payment is for.','ഏതിനുള്ള പണമടയ്ക്കലാണെന്ന് തിരഞ്ഞെടുക്കുക.'],
 nothingDue:['All receipts that can be uploaded now are uploaded.','ഇപ്പോൾ Upload ചെയ്യാവുന്ന എല്ലാ Receipts-ഉം Upload ചെയ്തിട്ടുണ്ട്.'],
 schedTitle:['Payment schedule','പണമടയ്ക്കൽ ഷെഡ്യൂൾ'],thItem:['Item','ഇനം'],thAmt:['Amount','തുക'],thDue:['Due by','അവസാന തീയതി'],thSt:['Status','നില'],
 stNone:['Not uploaded','Upload ചെയ്തിട്ടില്ല'],stLate:['Due date passed – upload now','തീയതി കഴിഞ്ഞു – ഉടൻ Upload ചെയ്യുക'],stPENDING:['Waiting for approval','Approval കാത്തിരിക്കുന്നു'],stAPPROVED:['Approved','Approved'],stREJECTED:['Rejected','Reject ചെയ്തു'],
 upload:['Upload','Upload'],uploadAgain:['Upload again','വീണ്ടും Upload'],receipt:['Receipt','Receipt'],reason:['Reason: ','കാരണം: '],
 drWait:['Fixed after your draft is submitted (draft closes 28 Nov, 6:30 PM)','Draft സമർപ്പിച്ച ശേഷം ഉറപ്പാകും (Draft 28 നവംബർ വൈകിട്ട് 6:30-ന് അവസാനിക്കും)'],
 jerWait:['Only for teams without a jersey sponsor – amount updated by 25 Jan 2027','Jersey Sponsor ഇല്ലാത്ത ടീമുകൾക്ക് മാത്രം – തുക 25 ജനുവരി 2027-നകം ചേർക്കും'],
 draftBreak:['How your draft fee is worked out','Draft Fee കണക്കാക്കുന്ന വിധം'],
 drTotal:['Year-1 draft fee {a} = instalment 1 ({b}, by 10 Dec 2026) + instalment 2 ({c}, by 10 Feb 2027)','Year-1 Draft Fee {a} = ഗഡു 1 ({b}, 10 ഡിസംബർ 2026-നകം) + ഗഡു 2 ({c}, 10 ഫെബ്രുവരി 2027-നകം)'],
 histTitle:['Submission history','സമർപ്പിച്ചവ'],noHist:['No receipts uploaded yet.','ഇതുവരെ Receipts Upload ചെയ്തിട്ടില്ല.'],
 paidOn:['paid','അടച്ചത്'],ref:['Ref','Ref'],
 newRcpt:['{n} new receipt(s) downloaded: {l}.','{n} പുതിയ Receipt Download ചെയ്തു: {l}.'],
 rcptFail:['The receipt tool did not load. Check your connection and reload the page.','Receipt tool ലോഡ് ആയില്ല. ഇന്റർനെറ്റ് പരിശോധിച്ച് പേജ് Reload ചെയ്യുക.'],
 jerTitle:['Jersey details','Jersey Details'],
 jerIntro:['Each player enters his own jersey details using your team link. You can also enter or correct them here until each player\'s last date. The committee supplies the jersey only.','ഓരോ കളിക്കാരനും ടീം Link ഉപയോഗിച്ച് സ്വന്തം Jersey Details നൽകാം. ഓരോരുത്തരുടെയും അവസാന തീയതി വരെ നിങ്ങൾക്ക് ഇവിടെയും നൽകാം / തിരുത്താം. കമ്മിറ്റി Jersey മാത്രമാണ് നൽകുന്നത്.'],
 shareTitle:['Your team\'s jersey link','നിങ്ങളുടെ ടീമിന്റെ Jersey Link'],
 shareNote:['Share this link in your team group or personally. The player picks his name and confirms with the last 4 digits of the WhatsApp number he registered for KNPL-7.','ഈ Link ടീം ഗ്രൂപ്പിലോ വ്യക്തിപരമായോ അയയ്ക്കുക. കളിക്കാരൻ സ്വന്തം പേര് തിരഞ്ഞെടുത്ത്, KNPL-7-ന് നൽകിയ WhatsApp നമ്പറിന്റെ അവസാന 4 അക്കം നൽകി ഉറപ്പാക്കണം.'],
 copy:['Copy','Copy'],copied:['Copied','Copy ചെയ്തു'],shareWa:['Share on WhatsApp','WhatsApp-ൽ അയയ്ക്കുക'],
 jd1:['Owner and drafted players: on or before 30 Nov 2026.','Owner, Drafted കളിക്കാർ: 30 നവംബർ 2026-നകം.'],
 jd2:['Players bought at the Mega Auction (12 Dec 2026) are added to this list after the auction: on or before 25 Dec 2026.','Mega Auction-ൽ (12 ഡിസംബർ 2026) എടുത്ത കളിക്കാരെ ലേലത്തിന് ശേഷം ഈ ലിസ്റ്റിൽ ചേർക്കും: 25 ഡിസംബർ 2026-നകം.'],
 jd3:['Season replacement players are added after approval: on or before 10 Feb 2027.','Season Replacement കളിക്കാരെ Approval-ന് ശേഷം ചേർക്കും: 10 ഫെബ്രുവരി 2027-നകം.'],
 jd4:['Name: capitals, up to 12 characters · Number: 0–99, unique in the team · Size: XS–4XL · Sleeve: half or full.','പേര്: ഇംഗ്ലീഷ് വലിയ അക്ഷരം, പരമാവധി 12 · നമ്പർ: 0–99, ടീമിൽ ആവർത്തിക്കരുത് · Size: XS–4XL · Sleeve: Half / Full.'],
 jerList:['Team list','ടീം ലിസ്റ്റ്'],jerListNote:['Rows after the last date are locked. Contact the committee for any change after that.','അവസാന തീയതി കഴിഞ്ഞ വരികൾ Lock ആകും. അതിനുശേഷം മാറ്റത്തിന് കമ്മിറ്റിയെ ബന്ധപ്പെടുക.'],
 thPlayer:['Player','കളിക്കാരൻ'],thSize:['Size','Size'],thSleeve:['Sleeve','Sleeve'],thName:['Name to print','പ്രിന്റ് ചെയ്യേണ്ട പേര്'],thNo:['No.','നമ്പർ'],thBack:['Back','പിൻവശം'],
 roleOwner:['Owner','Owner'],roleDrafted:['Drafted','Drafted'],roleSquad:['Auction','Auction'],roleReplacement:['Season replacement','Season Replacement'],
 by:['by {d}','{d}-നകം'],locked:['locked','Lock ആയി'],done:['done','നൽകി'],pending:['pending','ബാക്കി'],replacedBy:['replaced for KNPL-7','KNPL-7-ന് മാറ്റി'],
 half:['Half','Half'],full:['Full','Full'],size:['Size','Size'],sleeve:['Sleeve','Sleeve'],
 jSave:['Save jersey details','Jersey Details സേവ് ചെയ്യുക'],saving:['Saving…','സേവ് ചെയ്യുന്നു…'],saved:['Saved for {n} player(s).','{n} കളിക്കാരുടെ വിവരം സേവ് ചെയ്തു.'],
 vRow:['Complete all four details for {p} (or leave the row empty).','{p}-ന്റെ നാല് വിവരങ്ങളും നൽകുക (അല്ലെങ്കിൽ വരി ഒഴിച്ചിടുക).'],
 vDupNum:['Number {n} is given to two players. Each number must be unique.','{n} എന്ന നമ്പർ രണ്ട് പേർക്ക് നൽകി. ഓരോ നമ്പറും ഒരാൾക്ക് മാത്രം.'],
 vNone:['Nothing new to save.','സേവ് ചെയ്യാൻ പുതിയതായി ഒന്നുമില്ല.'],
 repTitle:['Season replacement request','Season Replacement അപേക്ഷ'],
 r1:['Opens on 25 Jan 2027. Only for a player who cannot play the whole of KNPL-7.','25 ജനുവരി 2027-ന് തുറക്കും. KNPL-7 മുഴുവൻ കളിക്കാൻ കഴിയാത്ത കളിക്കാരന് മാത്രം.'],
 r2:['Choose the player being replaced from your squad and the replacement from the unsold list.','മാറ്റുന്ന കളിക്കാരനെ നിങ്ങളുടെ Squad-ൽ നിന്നും, പകരക്കാരനെ Unsold List-ൽ നിന്നും തിരഞ്ഞെടുക്കുക.'],
 r3:['The replacement\'s Skill Rating must be equal to or lower than the player replaced.','പകരക്കാരന്റെ Skill Rating, മാറ്റുന്ന കളിക്കാരന്റേതിന് തുല്യമോ കുറവോ ആകണം.'],
 r4:['No payment is needed. Both players have already paid the ₹1,000 registration fee; when the replacement is approved, the replaced player and the replacement player each get ₹500 back.','പ്രത്യേകം പണമടയ്ക്കേണ്ടതില്ല. രണ്ട് കളിക്കാരും ₹1,000 Registration Fee ഇതിനകം അടച്ചിട്ടുണ്ട്; Replacement Approve ആയാൽ മാറ്റുന്ന കളിക്കാരനും പകരക്കാരനും ₹500 വീതം തിരികെ ലഭിക്കും.'],
 r5:['Once the committee approves, the replacement joins your squad for KNPL-7 only.','കമ്മിറ്റി Approve ചെയ്താൽ, പകരക്കാരൻ KNPL-7-ന് മാത്രം നിങ്ങളുടെ Squad-ൽ ചേരും.'],
 repOpens:['Season replacement requests open on {d}.','Season Replacement അപേക്ഷ {d}-ന് തുറക്കും.'],
 rOut:['Player being replaced','മാറ്റുന്ന കളിക്കാരൻ'],rIn:['Replacement (unsold list)','പകരക്കാരൻ (Unsold List)'],choose:['Choose','തിരഞ്ഞെടുക്കുക'],chooseOutFirst:['Choose the player being replaced first','ആദ്യം മാറ്റുന്ന കളിക്കാരനെ തിരഞ്ഞെടുക്കുക'],
 rInfo:['{n} unsold player(s) with Skill Rating {s} or lower.','Skill Rating {s} അല്ലെങ്കിൽ കുറവുള്ള {n} Unsold കളിക്കാർ.'],
 rAgree:['I have checked that the replacement player is available for the whole tournament. I understand the replacement is for the whole of KNPL-7 only, and that the replaced player and the replacement player each get ₹500 of their registration fee back.','പകരക്കാരൻ ടൂർണമെന്റ് മുഴുവൻ ലഭ്യമാണെന്ന് ഞാൻ ഉറപ്പാക്കിയിട്ടുണ്ട്. Replacement KNPL-7 മുഴുവനായി മാത്രമാണെന്നും, മാറ്റുന്ന കളിക്കാരനും പകരക്കാരനും Registration Fee-യിൽ നിന്ന് ₹500 വീതം തിരികെ ലഭിക്കുമെന്നും ഞാൻ മനസ്സിലാക്കുന്നു.'],
 rPayer:['Paid by (replacement player)','പണമടച്ചയാൾ (പകരക്കാരൻ)'],rSubmit:['Submit replacement request','Replacement അപേക്ഷ സമർപ്പിക്കുക'],
 vRepl:['Choose both players.','രണ്ട് കളിക്കാരെയും തിരഞ്ഞെടുക്കുക.'],vAgree:['Please agree to the replacement fee terms.','Replacement Fee നിബന്ധനകൾ അംഗീകരിക്കുക.'],
 rSent:['Request submitted. The committee will review it.','അപേക്ഷ സമർപ്പിച്ചു. കമ്മിറ്റി പരിശോധിക്കും.'],
 rList:['Your replacement requests','നിങ്ങളുടെ Replacement അപേക്ഷകൾ'],noRep:['No replacement requests.','Replacement അപേക്ഷകൾ ഇല്ല.'],
 footer:['KNPL-7 Team Desk · Queries: Krishnadas – 99862 18725 · Team KNPL','KNPL-7 Team Desk · സംശയങ്ങൾക്ക്: കൃഷ്ണദാസ് – 99862 18725 · Team KNPL'],
 opensOn:['The Team Desk opens on {d}.','Team Desk {d}-ന് തുറക്കും.'],
 CD1:['Sponsorship Caution Deposit – instalment 1 of 5','Sponsorship Caution Deposit – ഗഡു 1 / 5'],CD2:['Sponsorship Caution Deposit – instalment 2 of 5','Sponsorship Caution Deposit – ഗഡു 2 / 5'],
 CD3:['Sponsorship Caution Deposit – instalment 3 of 5','Sponsorship Caution Deposit – ഗഡു 3 / 5'],CD4:['Sponsorship Caution Deposit – instalment 4 of 5','Sponsorship Caution Deposit – ഗഡു 4 / 5'],
 CD5:['Sponsorship Caution Deposit – instalment 5 of 5','Sponsorship Caution Deposit – ഗഡു 5 / 5'],OWN1:['Ownership Fee – instalment 1 of 3 (KNPL-7)','Ownership Fee – ഗഡു 1 / 3 (KNPL-7)'],
 DR1:['Draft Fee KNPL-7 – instalment 1 of 2','Draft Fee KNPL-7 – ഗഡു 1 / 2'],DR2:['Draft Fee KNPL-7 – instalment 2 of 2','Draft Fee KNPL-7 – ഗഡു 2 / 2'],
 JER:['Team Jersey Fee (at actuals)','Team Jersey Fee (യഥാർത്ഥ ചെലവ്)'],REPL:['Season replacement request','Season Replacement അപേക്ഷ']
};
const WA_MSG = (team, link) => '🏏 *KNPL-7 | ' + team + ' – Jersey Details*\n\n' +
  'Please open the link, select your name and enter your jersey size, sleeve, name and number.\n' +
  'ലിങ്ക് തുറന്ന് നിങ്ങളുടെ പേര് തിരഞ്ഞെടുത്ത് Jersey Size, Sleeve, പേര്, നമ്പർ എന്നിവ നൽകുക.\n\n' +
  'Confirm with the last 4 digits of the WhatsApp number you registered for KNPL-7.\n' +
  'KNPL-7-ന് നൽകിയ WhatsApp നമ്പറിന്റെ അവസാന 4 അക്കം നൽകി ഉറപ്പാക്കുക.\n\n' +
  '👉 ' + link + '\n\n' +
  '⏰ Owner & drafted players: by 30 Nov 2026 · Auction players: by 25 Dec 2026\n' +
  '⏰ Owner, Drafted കളിക്കാർ: 30 നവംബർ 2026-നകം · Auction കളിക്കാർ: 25 ഡിസംബർ 2026-നകം';
let CODE = '', S = null;
const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
function latest(code) { const l = S.payments.filter(p => p.type === code); return l[l.length - 1] || null; }
async function login() {
  const c = $('code').value.trim(); $('gmsg').className = 'msg err'; $('gmsg').textContent = '';
  if (!c) { $('gmsg').textContent = t('enterCode'); return; }
  $('go').disabled = true; $('go').textContent = t('checking');
  try { S = await api('teamDeskLogin', c); CODE = c; try { sessionStorage.setItem('knpl_td', c); } catch (e) {} show(); }
  catch (e) { $('gmsg').textContent = msgOf(e); }
  finally { $('go').disabled = false; $('go').textContent = t('loginBtn'); }
}
function show() {
  $('gate').hidden = true; $('app').hidden = false;
  const im = el('img', 'tlogo'); im.alt = ''; im.src = '../draft/logos/' + slug(title(S.team)) + '.png'; im.onerror = () => im.remove(); $('tlogo').replaceChildren(im);
  render(); autoReceipts();
}
function render() {
  if (!S) return;
  $('tname').textContent = title(S.team); $('towner').textContent = 'Owner: ' + (S.owner.name || '') + ' · KNPL7-' + S.owner.id;
  $('payto').textContent = S.payTo;
  [$('fmode')].forEach(s => { const v = s.value; s.replaceChildren(...S.modes.map(m => { const o = el('option', null, m); o.value = m; return o; })); if (v) s.value = v; });
  renderNext(); renderSched(); renderHist(); renderJersey(); renderRepl(); renderContacts(); if (!$('pg-jer').hidden) renderDesigns(); if (!$('pg-spo').hidden) renderSpo();
  if (!$('formcard').hidden) itemInfo();
}
function renderNext() {
  const box = $('nextcard'); box.replaceChildren();
  const t0 = today(), byDue = (x, y) => x.due.localeCompare(y.due) || 0;
  const rank = s => { const p = latest(s.code); return p && p.status === 'PENDING' ? 2 : s.amount == null ? 1 : 0; };
  const open = S.schedule.filter(s => { const p = latest(s.code); return !p || p.status !== 'APPROVED'; }).slice().sort((x, y) => rank(x) - rank(y) || byDue(x, y));
  const toPay = open.filter(s => { const p = latest(s.code); return s.amount != null && (!p || p.status === 'REJECTED'); });
  const late = toPay.filter(s => s.due < t0), sum = toPay.reduce((n, s) => n + Number(s.amount || 0), 0);
  const ap = S.payments.filter(p => p.type !== 'REPL' && p.status === 'APPROVED').length, wt = S.payments.filter(p => p.type !== 'REPL' && p.status === 'PENDING').length;
  box.append(el('div', 'kick2', t('pendTitle')));
  if (!open.length) { box.append(el('b', null, t('allDone'))); }
  else {
    const sm = el('div', 'pqsum'); sm.append(el('span', null, t('pendSum', {n: toPay.length, a: inr(sum)})));
    if (late.length) sm.append(el('span', 'late', ' · ' + t('pendLate', {n: late.length})));
    box.append(sm);
    const ol = el('ol', 'pq'); let first = true, num = 0, wHead = false;
    open.forEach(s => {
      const p = latest(s.code), li = el('li'), info = el('div', 'pqi'), act = el('div', 'pqa');
      const can = s.amount != null && (!p || p.status === 'REJECTED'), isLate = can && s.due < t0;
      if (can && first) { li.className = 'now'; first = false; }
      if (isLate) li.classList.add('lt');
      info.append(el('b', null, t(s.code)));
      const meta = el('div', 'small ' + (isLate ? 'late' : 'muted'), (isLate ? t('pastDue', {d: dmy(s.due)}) : t('dueBy', {d: dmy(s.due)})));
      info.append(meta);
      if (s.amount == null) info.append(el('div', 'small muted', s.code === 'JER' ? t('jerWait') : t('drWait')));
      if (p && p.status === 'REJECTED' && p.remarks) info.append(el('div', 'rej', t('reason') + p.remarks));
      act.append(el('div', 'pqamt', s.amount != null ? inr(s.amount) : '–'));
      if (can) { const bt = el('button', 'btn or sm', p ? t('uploadAgain') : t('upload')); bt.onclick = () => openForm(s.code); act.append(bt); }
      else if (p && p.status === 'PENDING') act.append(el('span', 'pill PENDING', t('stPENDING')));
      else act.append(el('span', 'pill none', t('notYet')));
      const wait = p && p.status === 'PENDING';
      if (wait && !wHead) { wHead = true; ol.append(el('li', 'pqh', t('pendWaitHead'))); }
      if (wait) li.classList.add('wt');
      li.append(el('span', 'pqn', wait ? '✓' : String(++num)), info, act); ol.append(li);
    });
    box.append(ol);
  }
  box.append(el('div', 'small muted', t('progress', {a: ap, t: S.schedule.filter(x => x.amount != null).length, w: wt})));
}
function renderSched() {
  const box = $('sched'); box.replaceChildren();
  const head = el('div', 'srow sh'); [t('thItem'), t('thAmt'), t('thDue'), t('thSt'), ''].forEach(x => head.append(el('span', null, x))); box.append(head);
  S.schedule.slice().sort((x, y) => x.due.localeCompare(y.due)).forEach(s => {
    const p = latest(s.code), r = el('div', 'srow');
    const st = p ? p.status : (s.amount != null && s.due < today() ? 'late' : 'none');
    const nm = el('span', 'sn'); nm.append(el('b', null, t(s.code)));
    if (s.amount == null) nm.append(el('div', 'small muted', s.code === 'JER' ? t('jerWait') : t('drWait')));
    if (p && p.status === 'REJECTED' && p.remarks) nm.append(el('div', 'rej', t('reason') + p.remarks));
    const pill = el('span', 'pill ' + st, st === 'late' ? t('stLate') : st === 'none' ? (s.amount == null ? t('notYet') : t('stNone')) : t('st' + st) + (st === 'APPROVED' ? ' · ' + p.receiptNo : ''));
    const act = el('span', 'sa');
    if (s.amount != null && (!p || p.status === 'REJECTED')) { const b = el('button', 'btn or sm', p ? t('uploadAgain') : t('upload')); b.onclick = () => openForm(s.code); act.append(b); }
    if (p && p.status === 'APPROVED') { const b = el('button', 'btn ok sm', t('receipt')); b.onclick = () => receipt(p); act.append(b); }
    const pc = el('span'); pc.append(pill);
    r.append(nm, el('span', 'amt', s.amount != null ? inr(s.amount) : '–'), el('span', 'due', dmy(s.due)), pc, act);
    box.append(r);
  });
  const d = S.draft, tb = $('dbrk'); tb.replaceChildren();
  d.lines.forEach(l => { const tr = el('tr'); tr.append(el('td', null, (l.owner ? 'Owner · ' : '') + l.name + ' (KNPL7-' + l.id + ', ' + l.cat + ', SR ' + l.sr + ') · ' + Math.round(l.share * 100) + '% × ' + inr(l.price)), el('td', null, inr(l.pay))); tb.append(tr); });
  const tr = el('tr'), td = el('td', null, t('drTotal', {a: inr(d.total), b: inr(d.i1), c: inr(d.i2)})); td.colSpan = 2; td.style.fontWeight = '700'; tr.append(td); tb.append(tr);
}
function histItem(p) {
  const li = el('li'), a = el('div'), b = el('div', 'r');
  a.append(el('b', null, t(p.type)));
  if (p.type === 'REPL') a.append(el('div', 'small muted', t('noPay') + ' · ' + t('refund2') + ' · ' + p.at + ' · ' + p.id));
  else a.append(el('div', 'small muted', inr(p.amount) + ' · ' + p.mode + (p.utr ? ' · ' + t('ref') + ' ' + p.utr : '') + ' · ' + t('paidOn') + ' ' + dmy(p.paidOn) + ' · ' + p.id));
  if (p.type === 'REPL') a.append(el('div', 'small muted', (p.replOut ? p.replOut.name + ' → ' : '') + (p.replIn ? p.replIn.name + ' (KNPL7-' + p.replIn.id + ')' : '')));
  if (p.status === 'REJECTED' && p.remarks) a.append(el('div', 'rej', t('reason') + p.remarks));
  b.append(el('span', 'pill ' + p.status, p.status === 'APPROVED' && p.receiptNo ? p.receiptNo : t('st' + p.status)));
  if (p.status === 'APPROVED' && p.type !== 'REPL') { const d = el('button', 'btn ok sm', t('receipt')); d.style.cssText = 'margin-top:6px;display:block;margin-left:auto'; d.onclick = () => receipt(p); b.append(d); }
  li.append(a, b); return li;
}
function renderHist() {
  const ul = $('hist'); ul.replaceChildren();
  const list = S.payments.filter(p => p.type !== 'REPL');
  if (!list.length) { ul.append(el('li', 'muted', t('noHist'))); return; }
  list.slice().reverse().forEach(p => ul.append(histItem(p)));
}
function uploadable() { return S.schedule.filter(s => { const p = latest(s.code); return s.amount != null && (!p || p.status === 'REJECTED'); }); }
function openForm(code) {
  const list = uploadable();
  if (!list.length) { $('pmsg').className = 'msg'; $('pmsg').textContent = t('nothingDue'); return; }
  $('fitem').replaceChildren(...list.map(s => { const o = el('option', null, t(s.code) + ' – ' + inr(s.amount)); o.value = s.code; return o; }));
  if (code) $('fitem').value = code;
  $('formcard').hidden = false; $('fmsg').textContent = ''; OCR.f = null; $('focr').hidden = true; $('fack').checked = false; $('ffile').value = ''; $('futr').value = ''; $('fnote').value = '';
  $('fdate').max = today(); $('fdate').value = today(); $('fpayer').value = S.owner.name || '';
  $('fcov').replaceChildren(); renderCover(); itemInfo(); document.body.classList.add('noscroll'); setTimeout(() => $('fitem').focus(), 50);
}
function closeForm() { $('formcard').hidden = true; document.body.classList.remove('noscroll'); }
function itemInfo() { const s = S.schedule.find(x => x.code === $('fitem').value); $('famt').textContent = s ? t('fAmt', {a: inr(s.amount), d: dmy(s.due)}) : ''; }
async function sendForm() {
  const m = $('fmsg'); m.className = 'msg err'; m.textContent = '';
  const f = $('ffile').files[0];
  if (!$('fitem').value) return m.textContent = t('vItem');
  if (!$('fdate').value) return m.textContent = t('vDate');
  if ($('fmode').value !== S.modes[2] && $('futr').value.replace(/\s/g, '').length < 6) return m.textContent = t('vUtr');
  if ($('fpayer').value.trim().length < 3) return m.textContent = t('vPayer');
  if (!f) return m.textContent = t('vFile');
  if (!$('fack').checked) return m.textContent = t('vAck');
  const g1 = ocrGate('f'); if (g1) return m.textContent = g1;
  $('fsend').disabled = true; m.className = 'msg'; m.textContent = t('uploading');
  try {
    const file = await compressFile(f, S.maxMb);
    const codes = [$('fitem').value].concat(coverCodes()), tot = codes.reduce((n, c) => n + Number((S.schedule.find(x => x.code === c) || {}).amount || 0), 0);
    const note = (codes.length > 1 ? 'Combined payment ' + inr(tot) + ': ' + codes.map(c => t(c)).join(' + ') + '. ' : '') + $('fnote').value;
    const fails = [];
    for (let i = 0; i < codes.length; i++) {
      if (codes.length > 1) m.textContent = t('uploadingN', {i: i + 1, n: codes.length});
      try { S = await api('teamDeskPay', CODE, {type: codes[i], paidOn: $('fdate').value, mode: $('fmode').value, utr: $('futr').value, payer: $('fpayer').value, note: note.slice(0, 300), file}); }
      catch (e) { if (i === 0) throw e; fails.push(t(codes[i]) + ': ' + msgOf(e)); }
    }
    closeForm(); render();
    $('pmsg').className = fails.length ? 'msg err' : 'msg ok'; $('pmsg').textContent = (codes.length > 1 ? t('submittedN', {n: codes.length - fails.length}) : t('submitted')) + (fails.length ? '\n' + fails.join('\n') : ''); $('pmsg').scrollIntoView({behavior: 'smooth', block: 'center'});
  } catch (e) { m.className = 'msg err'; m.textContent = msgOf(e); }
  finally { $('fsend').disabled = false; }
}
async function receipt(p) {
  if (!window.jspdf || !window.KNPLReceipt) { alert(t('rcptFail')); return; }
  const doc = await KNPLReceipt.makeReceipt({p, team: S.team, owner: S.owner, draft: S.draft, base: '../'});
  doc.save(KNPLReceipt.fileName(p, S.team));
  try { localStorage.setItem('knpl_rct_' + p.receiptNo, '1'); } catch (e) {}
}
async function autoReceipts() {
  const seen = n => { try { return localStorage.getItem('knpl_rct_' + n); } catch (e) { return '1'; } };
  const todo = S.payments.filter(p => p.status === 'APPROVED' && p.receiptNo && !seen(p.receiptNo));
  if (!todo.length) return;
  for (let i = 0; i < 60 && !(window.jspdf && window.KNPLReceipt); i++) await new Promise(r => setTimeout(r, 100));
  for (const p of todo) { await receipt(p); await new Promise(r => setTimeout(r, 700)); }
  $('pmsg').className = 'msg ok'; $('pmsg').textContent = t('newRcpt', {n: todo.length, l: todo.map(p => p.receiptNo).join(', ')});
}
/* ---------- jersey ---------- */
function renderJersey() {
  $('jlink').value = S.jersey.link;
  $('jwa').href = 'https://wa.me/?text=' + encodeURIComponent(WA_MSG(title(S.team), S.jersey.link));
  const tb = $('jrows'), old = {};
  tb.querySelectorAll('tr[data-id]').forEach(tr => { old[tr.dataset.id] = {}; tr.querySelectorAll('[data-k]').forEach(x => old[tr.dataset.id][x.dataset.k] = x.value); });
  tb.replaceChildren();
  S.players.forEach(p => {
    const j = p.j || {}, o = old[p.id] || {}, tr = el('tr'); tr.dataset.id = p.id;
    const pn = el('td', 'pn'); pn.append(el('b', null, p.name || ('KNPL7-' + p.id)));
    pn.append(el('span', 'small muted', 'KNPL7-' + p.id + ' · ' + t('role' + p.role) + ' · ' + (p.locked ? t('locked') : t('by', {d: dmy(p.due)})) + (p.replacedBy ? ' · ' + t('replacedBy') : '')));
    pn.append(el('span', 'pill ' + (j.size ? 'APPROVED' : 'none'), j.size ? t('done') : t('pending')));
    const sz = el('select'); sz.append(el('option', null, t('size'))); sz.options[0].value = ''; S.jersey.sizes.forEach(s => { const op = el('option', null, s); op.value = s; sz.append(op); }); sz.value = o.size ?? j.size ?? ''; sz.dataset.k = 'size';
    const sl = el('select'); [['', t('sleeve')], ['Half', t('half')], ['Full', t('full')]].forEach(([v, x]) => { const op = el('option', null, x); op.value = v; sl.append(op); }); sl.value = o.sleeve ?? j.sleeve ?? ''; sl.dataset.k = 'sleeve';
    const nm = el('input', 'nm'); nm.type = 'text'; nm.maxLength = 12; nm.value = o.name ?? j.name ?? ''; nm.placeholder = 'NAME'; nm.dataset.k = 'name';
    const nu = el('input', 'num'); nu.type = 'text'; nu.inputMode = 'numeric'; nu.maxLength = 2; nu.value = o.num ?? j.num ?? ''; nu.placeholder = 'No.'; nu.dataset.k = 'num';
    const bk = el('span', 'back'), bi = el('i'), bb = el('b'); bk.append(bi, bb);
    const upd = () => { nm.value = nm.value.toUpperCase().replace(/[^A-Z .\-']/g, ''); nu.value = nu.value.replace(/\D/g, ''); bi.textContent = nm.value || 'NAME'; bb.textContent = nu.value || '00'; };
    nm.oninput = upd; nu.oninput = upd; upd();
    [sz, sl, nm, nu].forEach(x => { x.disabled = p.locked; x.setAttribute('aria-label', x.dataset.k + ' – ' + p.name); });
    const td = x => { const c = el('td'); c.append(x); return c; }; const pv = td(bk); pv.className = 'pv';
    tr.append(pn, td(sz), td(sl), td(nm), td(nu), pv); tb.append(tr);
  });
}
async function saveJersey() {
  const m = $('jmsg'); m.className = 'msg err'; m.textContent = ''; const rows = [], nums = {};
  for (const tr of $('jrows').querySelectorAll('tr[data-id]')) {
    const p = S.players.find(x => x.id === tr.dataset.id); if (p.locked) continue;
    const g = k => tr.querySelector('[data-k=' + k + ']').value.trim(), r = {id: p.id, size: g('size'), sleeve: g('sleeve'), name: g('name'), num: g('num')};
    const j = p.j || {}; if (!(r.size || r.sleeve || r.name || r.num)) continue;
    if (!r.size || !r.sleeve || !r.name || r.num === '') return m.textContent = t('vRow', {p: p.name});
    if (j.size === r.size && j.sleeve === r.sleeve && j.name === r.name && j.num === r.num) continue;
    rows.push(r);
  }
  for (const tr of $('jrows').querySelectorAll('tr[data-id]')) { const n = tr.querySelector('[data-k=num]').value; if (n === '' || !tr.querySelector('[data-k=name]').value) continue; const k = String(Number(n)); if (nums[k]) return m.textContent = t('vDupNum', {n: k}); nums[k] = 1; }
  if (!rows.length) return m.textContent = t('vNone');
  $('jsave').disabled = true; m.className = 'msg'; m.textContent = t('saving');
  try { S = await api('teamDeskJersey', CODE, rows); $('jrows').replaceChildren(); render(); m.className = 'msg ok'; m.textContent = t('saved', {n: rows.length}); }
  catch (e) { m.className = 'msg err'; m.textContent = msgOf(e); }
  finally { $('jsave').disabled = false; }
}
/* ---------- season replacement ---------- */
function renderRepl() {
  const R = S.repl; $('repclosed').hidden = R.open; $('repform').hidden = !R.open; $('repclosed').textContent = t('repOpens', {d: R.opens});
  if (R.open) {
    const busy = S.payments.filter(p => p.type === 'REPL' && p.status !== 'REJECTED').map(p => p.replOut && p.replOut.id);
    const outs = S.players.filter(p => p.role !== 'Replacement' && !p.replacedBy && busy.indexOf(p.id) < 0);
    const v = $('rout').value;
    $('rout').replaceChildren(el('option', null, t('choose')), ...outs.map(p => { const o = el('option', null, p.name + ' (KNPL7-' + p.id + ' · SR ' + p.sr + ')'); o.value = p.id; return o; }));
    $('rout').options[0].value = ''; if (v) $('rout').value = v;
    fillIn();
  }
  const ul = $('rhist'); ul.replaceChildren(); const l = S.payments.filter(p => p.type === 'REPL');
  if (!l.length) ul.append(el('li', 'muted', t('noRep'))); else l.slice().reverse().forEach(p => ul.append(histItem(p)));
}
function fillIn() {
  const out = S.players.find(p => p.id === $('rout').value);
  if (!out) { $('rin').replaceChildren(el('option', null, t('chooseOutFirst'))); $('rin').options[0].value = ''; $('rinfo').textContent = ''; return; }
  const list = S.repl.unsold.filter(u => u.sr <= out.sr), v = $('rin').value;
  $('rin').replaceChildren(el('option', null, t('choose')), ...list.map(u => { const o = el('option', null, u.name + ' (KNPL7-' + u.id + ' · ' + u.cat + ' · SR ' + u.sr + ')'); o.value = u.id; return o; }));
  $('rin').options[0].value = ''; if (v && list.some(u => u.id === v)) $('rin').value = v;
  $('rinfo').textContent = t('rInfo', {n: list.length, s: out.sr});
}
async function sendRepl() {
  const m = $('rmsg'); m.className = 'msg err'; m.textContent = '';
  if (!$('rout').value || !$('rin').value) return m.textContent = t('vRepl');
  if (!$('ragree').checked) return m.textContent = t('vAgree');
  $('rsend').disabled = true; m.className = 'msg'; m.textContent = t('saving');
  try {
    S = await api('teamDeskReplRequest', CODE, {replOut: $('rout').value, replIn: $('rin').value, agree: true});
    $('ragree').checked = false; $('rout').value = ''; render();
    m.className = 'msg ok'; m.textContent = t('rSent');
  } catch (e) { m.className = 'msg err'; m.textContent = msgOf(e); }
  finally { $('rsend').disabled = false; }
}
/* ---------- sponsorship (categories open one by one) ---------- */
const SPONSOR_CATS = [
  {key: 'cover', name: 'Cover Drive', url: 'https://knplseason7.github.io/knpl7-cover-drive/', api: 'https://script.google.com/macros/s/AKfycbzhb0N02RyK_lLfsMxQCooY_BRN1MtGhnVCVc7Wn4w6RtdVdPc30k3QaJs4gzgSkEOF/exec',
   desc: ['Trophies, awards, team jerseys and match-day sponsorships.', 'Trophies, Awards, Team Jersey, Match-day Sponsorships.']},
  {key: 'flick', name: 'Flick', url: '', api: '', desc: ['Opens soon.', 'ഉടൻ തുറക്കും.']},
  {key: 'straight', name: 'Straight Drive', url: '', api: '', desc: ['Opens soon.', 'ഉടൻ തുറക്കും.']}
];
const PORTAL_TEAMS = ['Devils Of Chitrakoot', 'Ayodhya Warriors', 'Spartans Of Nalanda', 'Mighty Mithilas', 'Kalinga United', 'Kurukshetra Yodhas', 'Jaguars Of Jhansi', 'Knights Of Kanchi',
  'Kombans Of Pataleeputhra', 'Kaaliyanz Of Dwaraka', 'Madhura Mavericks', 'Panchaala Panthers', 'Gandhara Giants', 'Vamos Vrindavan', 'Guardians Of Kamboja', 'Varahas Of Vijayanagara'];
const sNorm = x => String(x || '').toUpperCase().replace(/[^A-Z]/g, '').replace(/H/g, '').replace(/D/g, 'T');
let SPO = null;
function SPO_TEAM() { return PORTAL_TEAMS.find(n => sNorm(n) === sNorm(S.team)) || title(S.team); }
function keyOf(name) { return (S.sponsor.teams || []).find(k => sNorm(k) === sNorm(name)) || ''; }
function openCat() { return SPONSOR_CATS.find(c => c.url); }
function spoLink() { const c = openCat(); return c ? c.url + '?team=' + encodeURIComponent(SPO_TEAM()) : ''; }
function spoMsg() {
  const open = SPONSOR_CATS.filter(c => c.url).map(c => c.name).join(', ');
  return '🏏 *KNPL Season 7 – Sponsorship*\n\n' +
    'Kerala Namboodiris Premier League, Season 7 – 16 teams, 248 players, 11–14 Feb 2027 at FISAT & Boundary Grounds, Angamaly, live on YouTube.\n' +
    'കേരള നമ്പൂതിരീസ് പ്രീമിയർ ലീഗ് സീസൺ 7 – 16 ടീമുകൾ, 248 കളിക്കാർ, 11–14 ഫെബ്രുവരി 2027, FISAT & Boundary Grounds, അങ്കമാലി, YouTube-ൽ തത്സമയം.\n\n' +
    'Please support us as a sponsor through ' + title(S.team) + '. ' + open + ' sponsorships are open now – pick a slot and sponsor in a few taps.\n' +
    title(S.team) + ' വഴി Sponsor ആയി ഞങ്ങളെ പിന്തുണയ്ക്കൂ. ' + open + ' Sponsorships ഇപ്പോൾ തുറന്നിരിക്കുന്നു – Slot തിരഞ്ഞെടുത്ത് എളുപ്പത്തിൽ Sponsor ചെയ്യാം.\n\n' +
    '👉 ' + spoLink() + '\n\n' +
    'Your brand reaches every Namboodiri household that follows KNPL. Thank you!\n' +
    'KNPL പിന്തുടരുന്ന എല്ലാ നമ്പൂതിരി കുടുംബങ്ങളിലേക്കും നിങ്ങളുടെ പേര് എത്തും. നന്ദി!\n\n– ' + title(S.team) + ' · KNPL-7';
}
async function loadSpo() {
  if (!S.sponsor) renderSpo();
  const all = [], av = [];
  let ok = false;
  for (const c of SPONSOR_CATS.filter(x => x.api)) {
    try {
      const d = await (await fetch(c.api + '?action=status&t=' + Date.now())).json();
      if (!d.ok) throw new Error(d.error);
      d.items.forEach(i => {
        const left = Math.max(0, i.slots - i.taken);
        if (left) av.push({cat: c.name, name: i.name, rate: i.rate, left: left});
        i.sponsors.forEach(s => all.push({cat: c.name, item: i.name, jersey: /jersey/i.test(i.name), sponsor: s.name, jerseyTeam: s.jerseyTeam, team: keyOf(s.team), value: (s.qty || 1) * i.rate, confirmed: s.confirmed}));
      });
      ok = true;
      $('spolive').textContent = 'Live · ' + new Date(d.updated).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'});
    } catch (e) { $('spolive').textContent = t('spoFail'); }
  }
  SPO = {all: all, av: av, ok: ok}; renderSpo();
}
function teamTotals() {
  const T = {}; (S.sponsor.teams || []).forEach(k => T[k] = {got: 0, conf: 0, counted: 0});
  (SPO ? SPO.all : []).forEach(x => { const r = T[x.team]; if (!r) return; r.got += x.value; if (x.confirmed) { r.conf += x.value; r.counted += x.jersey ? 2600 : x.value; } });
  (S.sponsor.splits || []).forEach(sp => { [[sp.from, -1], [sp.to, 1]].forEach(([k, f]) => { const r = T[k]; if (r) { r.got += f * sp.amount; r.conf += f * sp.amount; r.counted += f * sp.amount; } }); });
  return T;
}
function renderSpo() {
  if (!S) return;
  if (!S.sponsor) S.sponsor = {target: 50000, splits: [], teams: PORTAL_TEAMS.map(n => sNorm(n) === sNorm(S.team) ? S.team : n.toUpperCase())};
  const link = spoLink();
  $('spLink').value = link;
  if (!$('spMsg').dataset.edited) $('spMsg').value = spoMsg();
  $('spWa').href = 'https://wa.me/?text=' + encodeURIComponent($('spMsg').value);
  $('spOpen').href = link;
  // categories + available slots
  const cats = $('cats'); cats.replaceChildren();
  SPONSOR_CATS.forEach(c => {
    const d = el('div', 'cat' + (c.url ? ' open' : '')), h = el('div', 'cathead');
    h.append(el('h3', null, c.name), el('span', 'pill ' + (c.url ? 'APPROVED' : 'none'), c.url ? t('catOpen') : t('catSoon'))); d.append(h, el('p', 'small muted', c.desc[LANG === 'ml' ? 1 : 0]));
    if (c.url && SPO) { const L = SPO.av.filter(a => a.cat === c.name); d.append(el('p', 'small', t('slotsOpen', {n: L.reduce((a, x) => a + x.left, 0), v: inr(L.reduce((a, x) => a + x.left * x.rate, 0))}))); }
    cats.append(d);
  });
  const av = $('avail'); av.replaceChildren();
  if (SPO && SPO.av.length) {
    const tb = el('table', 'avt'), hr = el('tr'); [t('avItem'), t('avRate'), t('avLeft')].forEach(x => hr.append(el('th', null, x))); tb.append(hr);
    SPO.av.slice().sort((a, b) => b.rate - a.rate).forEach(a => { const tr = el('tr'); tr.append(el('td', null, a.name.replace(/^KNPL-7\s+/, '')), el('td', null, inr(a.rate)), el('td', null, String(a.left))); tb.append(tr); });
    av.append(tb);
  }
  // target + rank
  const T = teamTotals(), me = T[S.team] || {got: 0, conf: 0, counted: 0}, target = 50000;
  const wait = me.got - me.conf;
  $('tgGot').textContent = inr(me.conf); $('tgTarget').textContent = inr(target);
  $('tgBar').style.width = Math.min(100, me.conf / target * 100) + '%';
  $('tgWait').style.width = Math.max(0, Math.min(100 - Math.min(100, me.conf / target * 100), wait / target * 100)) + '%';
  $('mk15').style.left = Math.min(100, 15000 / target * 100) + '%';
  $('tgSplit').textContent = t('tgSplitT', {c: inr(me.conf), w: inr(wait)});
  const left15 = 15000 - me.counted, leftT = target - me.conf;
  $('tgCheer').textContent = me.got <= 0 ? t('cheer0') : left15 > 0 ? t('cheer1', {a: inr(left15)}) : leftT > 0 ? t('cheer2', {a: inr(leftT)}) : t('cheer3', {a: inr(Math.round((me.counted - 15000) * 0.2))});
  const ranked = Object.keys(T).map(k => ({k: k, v: T[k].got})).sort((a, b) => b.v - a.v || a.k.localeCompare(b.k));
  const pos = ranked.findIndex(r => r.k === S.team) + 1, active = ranked.filter(r => r.v > 0).length;
  $('tgRank').textContent = me.got > 0 ? t('rankT', {r: pos, n: ranked.length, a: active}) : t('rank0', {a: active, n: ranked.length});
  // leaderboard
  const lb = $('lb'); lb.replaceChildren(); const max = Math.max(target, ...ranked.map(r => r.v));
  ranked.forEach((r, i) => { const li = el('li', r.k === S.team ? 'me' : ''), bar = el('span', 'lbbar'), fill = el('i'); fill.style.width = (r.v / max * 100) + '%'; bar.append(fill);
    const im = el('img'); im.alt = ''; im.src = '../draft/logos/' + slug(title(r.k)) + '.png'; im.onerror = () => im.style.visibility = 'hidden';
    li.append(el('span', 'lbn', String(i + 1)), im, el('span', 'lbt', title(r.k)), bar, el('span', 'lbv', r.v ? inr(r.v) : '–')); lb.append(li); });
  // my list
  const ul = $('spolist'); ul.replaceChildren();
  const mine = (SPO ? SPO.all : []).filter(x => x.team === S.team);
  const sp = (S.sponsor.splits || []).filter(x => x.from === S.team || x.to === S.team);
  if (!mine.length && !sp.length) ul.append(el('li', 'muted', t('spoNone')));
  mine.forEach(x => { const li = el('li'), a = el('div'), b = el('div', 'r');
    a.append(el('b', null, x.sponsor), el('div', 'small muted', x.cat + ' · ' + x.item.replace(/^KNPL-7\s+/, '') + (x.jerseyTeam ? ' · ' + x.jerseyTeam : '')));
    b.append(el('div', 'amt', inr(x.value)), el('span', 'pill ' + (x.confirmed ? 'APPROVED' : 'PENDING'), x.confirmed ? t('confirmed') : t('underAppr'))); li.append(a, b); ul.append(li); });
  sp.forEach(x => { const li = el('li'), a = el('div'), b = el('div', 'r'), out = x.from === S.team;
    a.append(el('b', null, x.sponsor), el('div', 'small muted', out ? t('shareOut', {t: title(x.to)}) : t('shareIn', {t: title(x.from)})));
    b.append(el('div', 'amt', (out ? '− ' : '+ ') + inr(x.amount))); li.append(a, b); ul.append(li); });
}

/* ---------- read the uploaded receipt and fill the form ---------- */
const OCR = {};
function ocrBox(k) { return $(k === 'f' ? 'focr' : 'rocr'); }
function ocrShow(k, cls, html) { const b = ocrBox(k); b.hidden = false; b.className = 'ocr ' + cls; b.textContent = html; }
function subsetFor(target, items) {   // smallest set of items whose amounts add up to target
  let best = null; const n = Math.min(items.length, 12);
  for (let m = 1; m < (1 << n); m++) { let s = 0, pick = []; for (let i = 0; i < n; i++) if (m & (1 << i)) { s += Number(items[i].amount); pick.push(items[i]); }
    if (Math.abs(s - target) < 1 && (!best || pick.length < best.length)) best = pick; }
  return best;
}
function fixAmount(a, items) {   // the ₹ sign is often read as 3, 2, 7 or 4: "₹8,000" -> "38,000"
  if (!a) return a; const ok = x => subsetFor(x, items);
  if (ok(a)) return a;
  const s = String(Math.round(a)); if (s.length >= 4 && /^[2347]/.test(s) && s[1] !== '0') { const b = Number(s.slice(1)); if (ok(b)) return b; }
  return a;
}
function renderCover(autoAmt) {   // other items this one receipt also pays for
  const box = $('fcov'), sel = $('fitem').value, list = uploadable().filter(s => s.code !== sel);
  const keep = {}; box.querySelectorAll('input[data-c]').forEach(x => keep[x.dataset.c] = x.checked);
  box.replaceChildren(); if (!list.length) { box.hidden = true; return; }
  box.hidden = false; box.append(el('div', 'fl', t('fCovTitle')), el('p', 'small muted', t('fCovHint')));
  let auto = null;
  if (autoAmt) { const me = S.schedule.find(x => x.code === sel); const rest = autoAmt - Number(me ? me.amount : 0); if (rest > 0) auto = subsetFor(rest, list); }
  list.forEach(s => { const l = el('label', 'chk'), c = el('input'); c.type = 'checkbox'; c.dataset.c = s.code;
    c.checked = auto ? auto.some(x => x.code === s.code) : !!keep[s.code]; c.onchange = coverTotal;
    l.append(c, el('span', null, t(s.code) + ' – ' + inr(s.amount) + ' · ' + t('dueBy', {d: dmy(s.due)}))); box.append(l); });
  box.append(el('div', 'small', '')); coverTotal();
}
function coverCodes() { return [...$('fcov').querySelectorAll('input[data-c]:checked')].map(x => x.dataset.c); }
function coverTotal() {
  const codes = [$('fitem').value].concat(coverCodes()), tot = codes.reduce((n, c) => n + Number((S.schedule.find(x => x.code === c) || {}).amount || 0), 0);
  const last = $('fcov').lastChild; if (last) { last.className = 'small covtot'; last.textContent = codes.length > 1 ? t('fCovTot', {n: codes.length, a: inr(tot)}) : ''; }
}
async function readReceipt(k) {
  const input = $(k === 'f' ? 'ffile' : 'rfile'), f = input.files[0];
  const ids = k === 'f' ? {utr: 'futr', date: 'fdate', mode: 'fmode'} : {utr: 'rutr', date: 'rdate', mode: 'rmode'};
  if (!f) { OCR[k] = null; ocrBox(k).hidden = true; return; }
  if (!window.KNPLOCR) { OCR[k] = {state: 'fail'}; return; }
  const tok = Symbol(); OCR[k] = {state: 'reading', tok: tok};
  ocrShow(k, 'busy', t('ocrReading'));
  const r = await KNPLOCR.read(f);
  if (!OCR[k] || OCR[k].tok !== tok) return;                     // another file was chosen meanwhile
  if (!r.ok) { OCR[k] = {state: 'fail'}; ocrShow(k, 'muted', t('ocrFail')); return; }
  OCR[k] = {state: 'done', res: r};
  if (!r.utr) { ocrShow(k, 'bad', t('ocrNoTxn')); return; }
  const filled = [];
  $(ids.utr).value = r.utr; filled.push(t('fTxn') + ' ' + r.utr);
  if (r.date && r.date <= today()) { $(ids.date).value = r.date; filled.push(t('fDt') + ' ' + dmy(r.date)); }
  if (r.mode && S.modes.indexOf(r.mode) >= 0) { $(ids.mode).value = r.mode; filled.push(t('fMd') + ' ' + r.mode); }
  let msg = t('ocrFilled', {f: filled.join(' · ')});
  const due = k === 'f' ? (S.schedule.find(x => x.code === $('fitem').value) || {}).amount : S.replFee;
  if (k === 'f' && r.amount) r.amount = fixAmount(r.amount, uploadable());
  let warn = r.amount && due && Math.abs(r.amount - due) >= 1;
  if (warn && k === 'f') {
    renderCover(r.amount);
    const codes = [$('fitem').value].concat(coverCodes()), tot = codes.reduce((n, c) => n + Number((S.schedule.find(x => x.code === c) || {}).amount || 0), 0);
    if (Math.abs(tot - r.amount) < 1) { warn = false; msg += '\n' + t('ocrCombined', {a: inr(r.amount), l: codes.map(c => t(c)).join(' + ')}); }
  }
  if (warn) msg += '\n' + t('ocrAmt', {a: inr(r.amount), b: inr(due)}) + (k === 'f' ? ' ' + t('ocrAmt2') : '');
  ocrShow(k, warn ? 'warn' : 'good', msg);
}
function ocrGate(k) {   // returns a message if the upload must not go ahead yet
  const o = OCR[k];
  if (o && o.state === 'reading') return t('ocrWait');
  if (o && o.state === 'done' && !o.res.utr) return t('ocrNoTxn');
  return '';
}

/* ---------- contacts (Help tab and per-section lines) ---------- */
const CONTACTS = [
  {k: 'vision', head: ['Welcome & KNPL vision', 'KNPL Vision'], name: 'Prasanth Puliyannoor', ph: '+91 94471 77430'},
  {k: 'glance', head: ['KNPL-7 at a glance', 'KNPL-7 at a Glance'], name: 'Krishnadas M N', ph: '+91 99862 18725'},
  {k: 'auction', head: ['Mega Auction rules', 'Mega Auction നിയമങ്ങൾ'], name: 'Krishnadas M N', ph: '+91 99862 18725'},
  {k: 'aucday', head: ['Auction day conduct & platform', 'Auction ദിവസം & Auction Platform'], name: 'Ajaya Ghosh C I', ph: '+91 80899 70271'},
  {k: 'logi', head: ['Mega Auction event logistics', 'Mega Auction ക്രമീകരണങ്ങൾ'], name: 'Anish Kumar M V', ph: '+91 99951 17684'},
  {k: 'format', head: ['Dynamic Ladder fixture format', 'Dynamic Ladder Fixture Format'], name: 'Sooraj Mullanezhi', ph: '+91 95398 00685'},
  {k: 'rules', head: ['Playing rules', 'കളി നിയമങ്ങൾ (Playing Rules)'], name: 'Vineeth K V', ph: '+91 85475 62249'},
  {k: 'grounds', head: ['Grounds & match day preparations', 'Grounds & Match Day ഒരുക്കങ്ങൾ'], name: 'Sandeep M N', ph: '+91 94460 13178'},
  {k: 'officials', head: ['Officials, live streaming & production', 'Officials, Live Streaming & Production'], name: 'Praveen Muttas', ph: '+91 97452 64636'},
  {k: 'food', head: ['Food & hospitality', 'ഭക്ഷണം & ആതിഥ്യം'], name: 'Vishal A N', ph: '+91 82814 43840'},
  {k: 'jersey', head: ['Jerseys – design & jersey details', 'Jersey – Design & Jersey Details'], name: 'Ivish Kumar M V', ph: '+91 98466 54562'},
  {k: 'awards', head: ['Awards, trophies & prizes', 'Awards, Trophies & Prizes'], name: 'Rahul E R', ph: '+91 96569 97486'},
  {k: 'budget', head: ['KNPL-7 budget', 'KNPL-7 Budget'], name: 'Ivish Kumar M V', ph: '+91 98466 54562'},
  {k: 'fund', head: ['Fund raising & sponsorship', 'Fund Raising & Sponsorship'], name: 'Krishnadas M N', ph: '+91 99862 18725'},
  {k: 'fees', head: ['Finance – team fees, payments & receipts', 'Finance – Team Fees, Payments & Receipts'], name: 'Unnikrishnan S', ph: '+91 99612 55542'},
  {k: 'media', head: ['Media & marketing', 'Media & Marketing'], name: 'Umesh Krishna', ph: '+91 99952 03514'},
  {k: 'social', head: ['Social commitment & wellness', 'സാമൂഹിക പ്രതിബദ്ധത & Wellness'], name: 'Sunil Narayanan', ph: '+91 82813 80942'}
];
const CT_LINE = {jersey: ['Jersey queries: {n} – {p}', 'Jersey സംശയങ്ങൾക്ക്: {n} – {p}'], fees: ['Fee & payment queries: {n} – {p}', 'Fee / Payment സംശയങ്ങൾക്ക്: {n} – {p}'], fund: ['Fund raising queries: {n} – {p}', 'Fund Raising സംശയങ്ങൾക്ക്: {n} – {p}']};
const telOf = p => p.replace(/[^\d+]/g, ''), waOf = p => p.replace(/\D/g, '');
function renderContacts() {
  document.querySelectorAll('[data-ct]').forEach(n => { const c = CONTACTS.find(x => x.k === n.dataset.ct), L = CT_LINE[n.dataset.ct]; n.replaceChildren(); const a = el('a', null, c.ph); a.href = 'tel:' + telOf(c.ph); n.append((LANG === 'ml' ? L[1] : L[0]).replace('{n}', c.name).replace(' – {p}', '') + ' – ', a); });
  const box = $('contacts'); if (!box) return; box.replaceChildren();
  CONTACTS.forEach(c => { const d = el('div', 'ct');
    d.append(el('span', 'cth', c.head[LANG === 'ml' ? 1 : 0]), el('b', null, c.name), el('span', 'ctp', c.ph));
    const r = el('div', 'row'), a = el('a', 'btn sm', t('call')), w = el('a', 'btn ok sm', t('wa'));
    a.href = 'tel:' + telOf(c.ph); w.href = 'https://wa.me/' + waOf(c.ph); w.target = '_blank'; w.rel = 'noopener'; r.append(a, w); d.append(r); box.append(d); });
}
/* ---------- jersey designs ---------- */
let TEAMS_INFO = null, DESIGN_IMG = undefined;
async function renderDesigns() {
  if (!S) return;
  if (!TEAMS_INFO) { try { TEAMS_INFO = await (await fetch('a/teams.json?v=1')).json(); } catch (e) { TEAMS_INFO = {}; } }
  const n = x => String(x).toUpperCase().replace(/[^A-Z]/g, '').replace(/H/g, '').replace(/D/g, 'T');
  const key = Object.keys(TEAMS_INFO).find(k => n(k) === n(S.team)), info = key ? TEAMS_INFO[key] : null;
  if (info) { const u = '../jersey/a/' + info.no + '-c1.jpg'; $('dsAimg').src = u; $('dsA').href = u; $('dsAcol').textContent = info.line ? t('dsColours', {c: info.line.replace(/\s*\(#[0-9A-F]{6}\)/gi, '')}) : ''; }
  const box = $('dsF'); box.replaceChildren();
  if (!S.design) { box.append(el('div', 'dswait', t('dsWait'))); $('dsFnote').textContent = ''; return; }
  $('dsFnote').textContent = (S.design.note ? S.design.note + ' · ' : '') + t('dsUpdated', {d: S.design.at});
  if (DESIGN_IMG === undefined) { box.append(el('div', 'dswait', t('dsLoading'))); try { const r = await api('teamDeskDesign', CODE); DESIGN_IMG = r ? 'data:' + r.mime + ';base64,' + r.data : null; } catch (e) { DESIGN_IMG = null; } box.replaceChildren(); }
  if (DESIGN_IMG) { const a = el('a'), im = el('img'); im.src = DESIGN_IMG; im.alt = 'Final design'; a.href = DESIGN_IMG; a.download = 'KNPL-7 final jersey design.jpg'; a.append(im); box.append(a); }
}
const FIX_BASE = 'https://knplseason7.github.io/knpl7-fixture/?v=5';
function renderFix() { const f = $('fixfr'), src = FIX_BASE + '#/embed?team=' + encodeURIComponent(S.team) + '&lang=' + LANG; if (f.dataset.src !== src) { f.dataset.src = src; f.src = src; } }
function tab(k) { ['pay', 'fix', 'jer', 'rep', 'spo', 'help'].forEach(x => { $('tb-' + x).setAttribute('aria-selected', x === k); $('pg-' + x).hidden = x !== k; }); if (k === 'spo') { renderSpo(); if (!SPO) loadSpo(); } if (k === 'jer') renderDesigns(); if (k === 'fix') renderFix(); }
document.querySelectorAll('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.l, () => { render(); if (!$('pg-fix').hidden) renderFix(); }));
$('go').onclick = login; $('code').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
$('upAny').onclick = () => openForm(''); $('fitem').onchange = () => { itemInfo(); renderCover(OCR.f && OCR.f.res ? fixAmount(OCR.f.res.amount, uploadable()) : null); }; $('fsend').onclick = sendForm; $('fcancel').onclick = closeForm; $('fx').onclick = closeForm; $('formcard').addEventListener('click', e => { if (e.target.id === 'formcard') closeForm(); }); document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('formcard').hidden) closeForm(); });
$('jsave').onclick = saveJersey;
$('jcopy').onclick = async () => { try { await navigator.clipboard.writeText($('jlink').value); } catch (e) { $('jlink').select(); document.execCommand('copy'); } $('jcopy').textContent = t('copied'); setTimeout(() => $('jcopy').textContent = t('copy'), 1500); };
$('rout').onchange = fillIn; $('ffile').onchange = () => readReceipt('f'); $('rsend').onclick = sendRepl;
$('tb-pay').onclick = () => tab('pay'); $('tb-fix').onclick = () => tab('fix'); $('tb-jer').onclick = () => tab('jer'); $('tb-rep').onclick = () => tab('rep'); $('tb-spo').onclick = () => tab('spo'); $('tb-help').onclick = () => tab('help');
$('spCopy').onclick = async () => { try { await navigator.clipboard.writeText($('spLink').value); } catch (e) { $('spLink').select(); document.execCommand('copy'); } $('spCopy').textContent = t('copied'); setTimeout(() => $('spCopy').textContent = t('copy'), 1500); };
$('spMsgCopy').onclick = async () => { try { await navigator.clipboard.writeText($('spMsg').value); } catch (e) { $('spMsg').select(); document.execCommand('copy'); } $('spMsgCopy').textContent = t('copied'); setTimeout(() => $('spMsgCopy').textContent = t('shCopyMsg'), 1500); };
$('spMsg').oninput = () => { $('spMsg').dataset.edited = '1'; $('spWa').href = 'https://wa.me/?text=' + encodeURIComponent($('spMsg').value); };
$('out').onclick = () => { try { sessionStorage.removeItem('knpl_td'); } catch (e) {} location.reload(); };
applyStatic(); renderContacts();
(async () => {
  try { const s = await api('teamDeskStatus'); if (!s.open) { $('gmsg').className = 'msg'; $('gmsg').textContent = t('opensOn', {d: s.opens}); } } catch (e) {}
  try { const c = sessionStorage.getItem('knpl_td'); if (c) { $('code').value = c; login(); } } catch (e) {}
})();
