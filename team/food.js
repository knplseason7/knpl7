/* Team Desk: Food Arrangement tab. Needs desk.js (CODE, tab, TX), common.js and food/config.js. */
(function () {
  const RULES = [
    ['This system is only to make sure that food is served properly and fairly to everyone.', 'എല്ലാവർക്കും ഭക്ഷണം ശരിയായും നീതിപൂർവ്വമായും ലഭിക്കുന്നു എന്ന് ഉറപ്പാക്കാൻ മാത്രമാണ് ഈ സംവിധാനം.'],
    ['From 5 Feb 2027, the Food Arrangement tab will be open in Team Desk. Every franchise owner must read these rules and accept them there.', '2027 ഫെബ്രുവരി 5 മുതൽ Team Desk-ൽ Food Arrangement ടാബ് തുറക്കും. ഓരോ ഫ്രാഞ്ചൈസി ഉടമയും ഈ നിയമങ്ങൾ വായിച്ച് അവിടെ അംഗീകരിക്കണം.'],
    ['Each team gets one 5-digit Food Team Code in Team Desk. Share it only with your own players and never with any other team.', 'ഓരോ ടീമിനും Team Desk-ൽ ഒരു 5 അക്ക Food Team Code ലഭിക്കും. ഇത് നിങ്ങളുടെ സ്വന്തം കളിക്കാരോട് മാത്രം പങ്കുവെക്കുക, മറ്റ് ടീമുകളുമായി ഒരിക്കലും പങ്കുവെക്കരുത്.'],
    ['Your players must mark Yes or No for every day and every meal (Breakfast, Lunch, Tea) through the link in Team Desk. The link closes on 9 Feb 2027 at 6:30 PM.', 'Team Desk-ലെ ലിങ്ക് വഴി നിങ്ങളുടെ കളിക്കാർ ഓരോ ദിവസത്തെയും ഓരോ നേരത്തെയും (Breakfast, Lunch, Tea) ഭക്ഷണത്തിന് Yes അല്ലെങ്കിൽ No രേഖപ്പെടുത്തണം. ഈ ലിങ്ക് 2027 ഫെബ്രുവരി 9 വൈകുന്നേരം 6:30-ന് അവസാനിക്കും.'],
    ['Food will be prepared on the basis of this Yes count, so please mark it carefully. After the closing time, any change can be made only by the Core Committee.', 'ഈ Yes എണ്ണത്തിന്റെ അടിസ്ഥാനത്തിലാണ് ഭക്ഷണം തയ്യാറാക്കുന്നത്, അതിനാൽ ശ്രദ്ധയോടെ രേഖപ്പെടുത്തുക. അവസാന സമയത്തിന് ശേഷമുള്ള മാറ്റങ്ങൾ Core Committee-ക്ക് മാത്രമേ വരുത്താൻ കഴിയൂ.'],
    ['Meal times are Breakfast 7:30–9:00 AM, Lunch 12:00–1:30 PM and Tea 3:00–4:30 PM.', 'ഭക്ഷണ സമയം: Breakfast രാവിലെ 7:30–9:00, Lunch ഉച്ചയ്ക്ക് 12:00–1:30, Tea വൈകുന്നേരം 3:00–4:30.'],
    ['Your food counter for a meal is the ground where your team has a match in that time. For example, if your team plays at Boundary Grounds at 12:00, your Lunch counter is at Boundary Grounds.', 'ഒരു നേരത്തെ ഭക്ഷണത്തിന് നിങ്ങളുടെ കൗണ്ടർ, ആ സമയത്ത് നിങ്ങളുടെ ടീമിന് മത്സരമുള്ള ഗ്രൗണ്ടിലായിരിക്കും. ഉദാഹരണത്തിന്, 12:00-ന് Boundary Grounds-ൽ മത്സരമുണ്ടെങ്കിൽ, Lunch കൗണ്ടർ Boundary Grounds-ൽ ആയിരിക്കും.'],
    ['If your team has no match in that meal time, your counter will be the ground of your nearest match in time. If two matches are equally near, the later match is taken.', 'ആ നേരത്ത് മത്സരമില്ലെങ്കിൽ, സമയത്തിൽ ഏറ്റവും അടുത്തുള്ള മത്സരത്തിന്റെ ഗ്രൗണ്ടാണ് കൗണ്ടർ. രണ്ട് മത്സരങ്ങൾ ഒരുപോലെ അടുത്താണെങ്കിൽ, പിന്നീടുള്ള മത്സരം എടുക്കും.'],
    ['If your team has no match at all on a day, the Core Committee will decide your counter after the count closes on 9 Feb, so that both counters get a fair share of people. It will be shown in Team Desk.', 'ഒരു ദിവസം ടീമിന് മത്സരമേ ഇല്ലെങ്കിൽ, 9 ഫെബ്രുവരിക്ക് എണ്ണം അവസാനിച്ച ശേഷം, രണ്ട് കൗണ്ടറുകളിലും ആളുകൾ ന്യായമായി വരുന്ന രീതിയിൽ Core Committee കൗണ്ടർ തീരുമാനിക്കും. ഇത് Team Desk-ൽ കാണിക്കും.'],
    ['Your allotted counter appears in Team Desk automatically at 7:30 AM for Breakfast, 12:00 noon for Lunch and 3:00 PM for Tea. The owner must check Team Desk and inform the players.', 'നിങ്ങൾക്ക് അനുവദിച്ച കൗണ്ടർ Team Desk-ൽ Breakfast-ന് രാവിലെ 7:30-നും Lunch-ന് ഉച്ചയ്ക്ക് 12:00-നും Tea-ക്ക് 3:00-നും സ്വയം പ്രത്യക്ഷപ്പെടും. ഉടമ Team Desk നോക്കി കളിക്കാരെ അറിയിക്കണം.'],
    ['Once the counter is shown, it will not change unless the Core Committee informs you.', 'കൗണ്ടർ കാണിച്ചു കഴിഞ്ഞാൽ, Core Committee അറിയിക്കുന്നില്ലെങ്കിൽ അത് മാറില്ല.'],
    ['At the counter, every person must tell the Food Team Code. The staff will record each person separately, and each person is served once per meal.', 'കൗണ്ടറിൽ ഓരോ വ്യക്തിയും Food Team Code പറയണം. ജീവനക്കാർ ഓരോരുത്തരെയും പ്രത്യേകം രേഖപ്പെടുത്തും, ഒരു നേരത്തേക്ക് ഒരാൾക്ക് ഒരു തവണ മാത്രം വിളമ്പും.'],
    ['Your team is served up to its Yes count for that meal. Anyone beyond that, or anyone at a counter other than the allotted one, is served as Buffer Serving only while BUFFER stock lasts.', 'ആ നേരത്തെ Yes എണ്ണം വരെ ടീമിന് വിളമ്പും. അതിന് പുറത്തുള്ളവർക്കും, അനുവദിച്ച കൗണ്ടർ അല്ലാത്തിടത്ത് വരുന്നവർക്കും, BUFFER സ്റ്റോക്ക് ഉള്ളിടത്തോളം മാത്രം Buffer Serving ആയി നൽകും.'],
    ['When the BUFFER stock is finished, players will be politely requested to go to the other counter. Please cooperate.', 'BUFFER സ്റ്റോക്ക് തീർന്നാൽ, കളിക്കാരോട് മര്യാദപൂർവ്വം മറ്റേ കൗണ്ടറിലേക്ക് പോകാൻ അഭ്യർത്ഥിക്കും. ദയവായി സഹകരിക്കുക.'],
    ['At the end of every day, the used and served counts of each team will be shared with the owners. This record will be the final proof in case of any doubt.', 'ഓരോ ദിവസത്തിന്റെയും അവസാനം, ഓരോ ടീമിന്റെയും ഉപയോഗിച്ച എണ്ണവും വിളമ്പിയ എണ്ണവും ഉടമകളുമായി പങ്കുവെക്കും. സംശയമുണ്ടായാൽ ഈ രേഖയായിരിക്കും അന്തിമ തെളിവ്.'],
    ['Please ask your players to be patient and courteous with the counter staff and volunteers.', 'കൗണ്ടർ ജീവനക്കാരോടും വോളന്റിയർമാരോടും ക്ഷമയോടെയും മര്യാദയോടെയും പെരുമാറാൻ നിങ്ങളുടെ കളിക്കാരോട് പറയുക.'],
    ['In case of any changes, the Core Committee will inform you as and when required.', 'എന്തെങ്കിലും മാറ്റങ്ങൾ ഉണ്ടായാൽ, ആവശ്യാനുസരണം Core Committee നിങ്ങളെ അറിയിക്കും.']
  ];
  Object.assign(window.TX, {
    tabFood: ['Food', 'ഭക്ഷണം'], fdTitle: ['Food Arrangement', 'Food Arrangement (ഭക്ഷണ ക്രമീകരണം)'],
    fdNotOn: ['Food Arrangement is not switched on yet. Please read the rules below.', 'Food Arrangement ഇതുവരെ ആരംഭിച്ചിട്ടില്ല. താഴെയുള്ള നിയമങ്ങൾ വായിക്കുക.'],
    fdNotOpen: ['Opens on {d}. Please read the rules below.', '{d}-ന് തുറക്കും. താഴെയുള്ള നിയമങ്ങൾ വായിക്കുക.'], fdLoading: ['Loading…', 'ലോഡ് ചെയ്യുന്നു…'],
    fdConsentH: ['Accept the rules', 'നിയമങ്ങൾ അംഗീകരിക്കുക'], fdConsentP: ['Your Food Team Code is shown after the franchise owner accepts the rules below.', 'ഫ്രാഞ്ചൈസി ഉടമ താഴെയുള്ള നിയമങ്ങൾ അംഗീകരിച്ച ശേഷം Food Team Code കാണിക്കും.'],
    fdOwnerName: ['Owner name', 'ഉടമയുടെ പേര്'], fdAgree: ['I have read the rules and accept them on behalf of my franchise.', 'നിയമങ്ങൾ വായിച്ചു, എന്റെ ഫ്രാഞ്ചൈസിക്ക് വേണ്ടി അംഗീകരിക്കുന്നു.'], fdAccept: ['Accept and show my code', 'അംഗീകരിച്ച് കോഡ് കാണിക്കുക'],
    fdCodeH: ['Your Food Team Code', 'നിങ്ങളുടെ Food Team Code'], fdCodeNote: ['Share it only with your own players. Never share it with another team.', 'സ്വന്തം കളിക്കാരോട് മാത്രം പങ്കുവെക്കുക. മറ്റ് ടീമുകളുമായി പങ്കുവെക്കരുത്.'],
    fdLink: ['Yes/No link for your players', 'കളിക്കാർക്കുള്ള Yes/No ലിങ്ക്'], fdOpenLink: ['Open', 'തുറക്കുക'], fdClosesNote: ['The Yes/No window closes on {d}.', 'Yes/No {d}-ന് അവസാനിക്കും.'],
    fdClosed: ['The Yes/No window has closed. Any change is made only by the Core Committee.', 'Yes/No അവസാനിച്ചു. മാറ്റങ്ങൾ Core Committee വഴി മാത്രം.'],
    fdMsg: ['Message for your players (you can edit it)', 'കളിക്കാർക്കുള്ള സന്ദേശം (മാറ്റാം)'], fdWa: ['Send on WhatsApp', 'WhatsApp-ൽ അയക്കുക'],
    fdAnswered: ['{n} players have answered', '{n} കളിക്കാർ ഉത്തരം നൽകി'], fdPlayers: ['Players who answered', 'ഉത്തരം നൽകിയവർ'],
    fdPlanH: ['Your counters and food record', 'നിങ്ങളുടെ കൗണ്ടറുകളും ഭക്ഷണ കണക്കും'], fdPlanNote: ['Your counter appears here automatically at 7:30 AM, 12:00 noon and 3:00 PM. Please inform your players.', 'നിങ്ങളുടെ കൗണ്ടർ രാവിലെ 7:30-നും ഉച്ചയ്ക്ക് 12:00-നും വൈകുന്നേരം 3:00-നും ഇവിടെ സ്വയം തെളിയും. കളിക്കാരെ അറിയിക്കുക.'],
    fdThMeal: ['Meal', 'നേരം'], fdThCounter: ['Counter', 'കൗണ്ടർ'], fdThYes: ['Yes', 'Yes'], fdThServed: ['Served', 'വിളമ്പി'], fdThBuf: ['Buffer', 'Buffer'],
    fdAtTime: ['Shown at {t}', '{t}-ന് കാണിക്കും'], fdNowH: ['Right now', 'ഇപ്പോൾ'], fdNowTxt: ['Your {m} counter is', 'നിങ്ങളുടെ {m} കൗണ്ടർ'],
    fdBmatch: ['Match here', 'ഇവിടെ മത്സരം'], fdBnearest: ['Nearest match', 'അടുത്ത മത്സരം'], fdBbalance: ['Committee split', 'Committee വിഭജനം'], fdBadmin: ['Set by Committee', 'Committee നിശ്ചയിച്ചത്'],
    fdCopyMsg: ['Copy message', 'സന്ദേശം copy ചെയ്യുക'], fdRulesH: ['Rules', 'നിയമങ്ങൾ'], fdRefresh: ['Refresh', 'പുതുക്കുക'], fdRetry: ['Try again', 'വീണ്ടും ശ്രമിക്കുക'],
    fdDay: ['Day {n}', 'ദിവസം {n}'], fdBuf: ['Buffer', 'Buffer']
  });
  const MEAL = {B: ['Breakfast', '7:30', '9:00 AM', '7:30 AM'], L: ['Lunch', '12:00', '1:30 PM', '12:00 noon'], T: ['Tea', '3:00', '4:30 PM', '3:00 PM']};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  let FS = null, FTOKEN = '', FERR = '', FLOAD = false, FMSG = null, FTIMER = null;
  const win = m => MEAL[m][1] + '–' + MEAL[m][2];
  const rsvpLink = c => new URL('food/rsvp.html?c=' + c, location.href).href;
  const fmtClose = () => new Date(window.FOOD_CLOSES).toLocaleString('en-GB', {day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata'});
  const bothLang = (e, m) => e + '\n' + m;
  function codeMessage() {
    const link = rsvpLink(FS.code), c = FS.code, tn = title(FS.team), cl = fmtClose();
    return [
      '*KNPL-7 Food Arrangement · ' + tn + '*', '',
      'Our Food Team Code is *' + c + '*. Do not share it outside the team.', 'നമ്മുടെ ടീമിന്റെ Food Team Code *' + c + '* ആണ്. ടീമിന് പുറത്ത് പങ്കുവെക്കരുത്.', '',
      'Please mark Yes or No for every meal before ' + cl + ':', cl + '-ന് മുൻപ് ഓരോ നേരത്തിനും Yes അല്ലെങ്കിൽ No രേഖപ്പെടുത്തുക:', '👉 ' + link, '',
      'At the food counter, every person must tell this code.', 'ഭക്ഷണ കൗണ്ടറിൽ ഓരോ വ്യക്തിയും ഈ കോഡ് പറയണം.', '',
      'Your counter for each meal will be shared on the day (7:30 AM, 12:00 noon, 3:00 PM).', 'ഓരോ നേരത്തെയും കൗണ്ടർ അന്നേ ദിവസം (രാവിലെ 7:30, ഉച്ചയ്ക്ക് 12:00, വൈകുന്നേരം 3:00) അറിയിക്കും.'
    ].join('\n');
  }
  function mealMessage(p) {
    const m = MEAL[p.meal][0];
    return ['*KNPL-7 · ' + m + ' counter*', '', m + ' counter today: *' + p.ground + '* (' + win(p.meal) + ').', 'ഇന്നത്തെ ' + m + ' കൗണ്ടർ: *' + p.ground + '* (' + win(p.meal) + ').', '', 'Tell the Food Team Code *' + FS.code + '* at the counter.', 'കൗണ്ടറിൽ Food Team Code *' + FS.code + '* പറയണം.'].join('\n');
  }
  async function copy(text, btn) { try { await navigator.clipboard.writeText(text); } catch (e) { const ta = document.createElement('textarea'); ta.value = text; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove(); } const o = btn.textContent; btn.textContent = t('copied'); setTimeout(() => btn.textContent = o, 1500); }
  function nowRow() {
    if (!FS.plan) return null; const nowMs = Date.now(), today = FS.plan.filter(p => p.startsAt && p.locked && p.ground && nowMs >= Date.parse(p.startsAt) - 60000 && nowMs < Date.parse(p.startsAt) + 90 * 60000 + 60000);
    return today[today.length - 1] || null;
  }
  /* What the franchise owner has to do - shown above the rules, open until the rules are accepted */
  const GUIDE = {
    title: ['What you need to do · Food Arrangement (opens 5 Feb 2027)', 'നിങ്ങൾ ചെയ്യേണ്ടത് · Food Arrangement (2027 ഫെബ്രുവരി 5-ന് തുറക്കും)'],
    why: ['Why this is needed: so that every player gets food at the right counter, the caterer prepares only the quantity that is needed (no shortage, no wastage), and there is a clear record if any doubt comes up later.',
      'എന്തിന്: എല്ലാ കളിക്കാർക്കും ശരിയായ കൗണ്ടറിൽ ഭക്ഷണം ലഭിക്കാനും, ആവശ്യത്തിനു മാത്രം ഭക്ഷണം തയ്യാറാക്കി കുറവും പാഴാക്കലും ഒഴിവാക്കാനും, പിന്നീട് എന്തെങ്കിലും സംശയം വന്നാൽ വ്യക്തമായ കണക്ക് ഉണ്ടാകാനും.'],
    stepsH: ['Your steps, one by one', 'നിങ്ങളുടെ ഘട്ടങ്ങൾ, ഓരോന്നായി'],
    steps: () => [
      [['On 5 Feb 2027, open this Food tab.', '2027 ഫെബ്രുവരി 5-ന് ഈ Food ടാബ് തുറക്കുക.'], ['You can read the rules below right now. The code and the Yes/No link switch on from 5 Feb.', 'താഴെയുള്ള നിയമങ്ങൾ ഇപ്പോൾത്തന്നെ വായിക്കാം. കോഡും Yes/No ലിങ്കും ഫെബ്രുവരി 5 മുതലാണ് ലഭിക്കുക.']],
      [['Accept the rules.', 'നിയമങ്ങൾ അംഗീകരിക്കുക.'], ['The franchise owner enters their name and ticks the acceptance box. Your 5-digit Food Team Code and the Yes/No link for your players then appear here.', 'ഫ്രാഞ്ചൈസി ഉടമ പേര് നൽകി അംഗീകാര ബോക്സ് ടിക്ക് ചെയ്യണം. തുടർന്ന് നിങ്ങളുടെ 5 അക്ക Food Team Code-ഉം കളിക്കാർക്കുള്ള Yes/No ലിങ്കും ഇവിടെ കാണിക്കും.']],
      [['Send the code and link to your players.', 'കോഡും ലിങ്കും കളിക്കാർക്ക് അയക്കുക.'], ['Use the WhatsApp button. The message is ready and you can edit it. Share it only with your own team, never with another team.', 'WhatsApp ബട്ടൺ ഉപയോഗിക്കുക. സന്ദേശം തയ്യാറാണ്, മാറ്റം വരുത്താം. സ്വന്തം ടീമിന് മാത്രം പങ്കുവെക്കുക, മറ്റൊരു ടീമിന് ഒരിക്കലും നൽകരുത്.']],
      [['Get every player to answer Yes or No before ' + fmtClose() + '.', fmtClose() + '-ന് മുൻപ് എല്ലാ കളിക്കാരും Yes അല്ലെങ്കിൽ No രേഖപ്പെടുത്തണം.'], ['Each player answers for every day and every meal (Breakfast, Lunch, Tea). Watch the "players answered" count here and remind those who have not answered. Food is prepared from this Yes count, and after the closing time only the Core Committee can change it.', 'ഓരോ കളിക്കാരനും ഓരോ ദിവസത്തെയും ഓരോ നേരത്തെയും (Breakfast, Lunch, Tea) ഉത്തരം നൽകണം. "ഉത്തരം നൽകിയ കളിക്കാർ" എണ്ണം ഇവിടെ നോക്കി, ഉത്തരം നൽകാത്തവരെ ഓർമ്മിപ്പിക്കുക. ഈ Yes എണ്ണം നോക്കിയാണ് ഭക്ഷണം തയ്യാറാക്കുന്നത്; സമയം കഴിഞ്ഞാൽ Core Committee-ക്ക് മാത്രമേ മാറ്റം വരുത്താനാകൂ.']],
      [['On match days (11–14 Feb), check this tab each morning.', 'മത്സര ദിവസങ്ങളിൽ (ഫെബ്രുവരി 11–14) എല്ലാ ദിവസവും രാവിലെ ഈ ടാബ് നോക്കുക.'], ['Your counter for each meal appears here by itself: Breakfast at 7:30 AM, Lunch at 12:00 noon and Tea at 3:00 PM. Tell your players which ground to go to.', 'ഓരോ നേരത്തെയും കൗണ്ടർ ഇവിടെ തനിയെ കാണിക്കും: Breakfast രാവിലെ 7:30, Lunch ഉച്ചയ്ക്ക് 12:00, Tea വൈകുന്നേരം 3:00. ഏത് ഗ്രൗണ്ടിലേക്ക് പോകണമെന്ന് കളിക്കാരെ അറിയിക്കുക.']],
      [['At the counter, every player says the Food Team Code.', 'കൗണ്ടറിൽ ഓരോ കളിക്കാരനും Food Team Code പറയണം.'], ['The staff records each person, and each person is served once per meal.', 'ജീവനക്കാർ ഓരോരുത്തരെയും രേഖപ്പെടുത്തും; ഓരോ നേരത്തും ഒരാൾക്ക് ഒരിക്കൽ മാത്രം വിളമ്പും.']],
      [['Check the daily record.', 'ദിവസേനയുള്ള കണക്ക് പരിശോധിക്കുക.'], ['At the end of each day you can see here how many were served against your Yes count.', 'ഓരോ ദിവസത്തിന്റെയും അവസാനം നിങ്ങളുടെ Yes എണ്ണത്തിനെതിരെ എത്ര പേർക്ക് വിളമ്പി എന്ന് ഇവിടെ കാണാം.']]
    ],
    outcome: ['What you can expect: your players are served without confusion at the right counter, the food prepared matches your Yes count, and you have a day-by-day record to settle any doubt.',
      'പ്രതീക്ഷിക്കുന്ന ഫലം: നിങ്ങളുടെ കളിക്കാർക്ക് ആശയക്കുഴപ്പമില്ലാതെ ശരിയായ കൗണ്ടറിൽ ഭക്ഷണം ലഭിക്കും; നിങ്ങളുടെ Yes എണ്ണത്തിന് അനുസരിച്ച് ഭക്ഷണം തയ്യാറാകും; ഏത് സംശയവും തീർക്കാൻ ദിവസംതോറുമുള്ള കണക്ക് ഉണ്ടാകും.']
  };
  function guideHtml() {
    const i = LANG === 'ml' ? 1 : 0, done = FS && FS.open && FS.consent;
    return '<details class="card"' + (done ? '' : ' open') + '><summary style="cursor:pointer;font-weight:800;font-size:17px">' + esc(GUIDE.title[i]) + '</summary>' +
      '<p style="margin:10px 0">' + esc(GUIDE.why[i]) + '</p><h3 style="margin:12px 0 6px">' + esc(GUIDE.stepsH[i]) + '</h3>' +
      '<ol class="rules">' + GUIDE.steps().map(st => '<li><b>' + esc(st[0][i]) + '</b><br>' + esc(st[1][i]) + '</li>').join('') + '</ol>' +
      '<div class="note">' + esc(GUIDE.outcome[i]) + '</div></details>';
  }
  function rulesHtml() { return '<div class="card"><h3>' + esc(t('fdRulesH')) + '</h3><ol class="rules">' + RULES.map(r => '<li>' + esc(r[LANG === 'ml' ? 1 : 0]) + '</li>').join('') + '</ol></div>'; }
  function paintFood() {
    const box = $('foodbox'); if (!box) return;
    let h = '<div class="card"><div class="cardhead"><h2 style="margin:0">' + esc(t('fdTitle')) + '</h2><button class="btn ghost sm" id="fdRef">' + esc(t('fdRefresh')) + '</button></div>';
    if (FLOAD && !FS) h += '<p class="muted">' + esc(t('fdLoading')) + '</p>';
    if (FERR) h += '<div class="msg err">' + esc(FERR) + '</div>';
    if (FS && !FS.open) h += '<div class="note">' + esc(t('fdNotOpen', {d: dmy('2027-02-05')})) + '</div>';
    if (!FS && !FLOAD && !window.FOOD_API_URL) h += '<div class="note">' + esc(t('fdNotOn')) + '</div>';
    h += '</div>';
    h += guideHtml();
    if (FS && FS.open && FS.consent) {
      const nr = nowRow();
      if (nr) h += '<div class="fnow"><div class="kick2">' + esc(t('fdNowH')) + '</div>' + esc(t('fdNowTxt', {m: MEAL[nr.meal][0]})) + '<b class="g">' + esc(nr.ground) + '</b><div class="small" style="margin-top:6px">' + esc(win(nr.meal)) + '</div><div class="row" style="margin-top:10px"><button class="btn or sm" id="fdNowCopy">' + esc(t('fdCopyMsg')) + '</button><a class="btn ok sm" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(mealMessage(nr)) + '">' + esc(t('fdWa')) + '</a></div></div>';
      h += '<div class="card"><h3>' + esc(t('fdCodeH')) + '</h3><div class="fcode" id="fdCode">' + esc(FS.code) + '</div><p class="small muted">' + esc(t('fdCodeNote')) + '</p>';
      h += '<label class="fl">' + esc(t('fdLink')) + '</label><div class="linkrow"><input type="text" readonly id="fdLinkIn" value="' + esc(rsvpLink(FS.code)) + '"><button class="btn sm" id="fdLinkCopy">' + esc(t('copy')) + '</button><a class="btn or sm" target="_blank" rel="noopener" href="' + esc(rsvpLink(FS.code)) + '">' + esc(t('fdOpenLink')) + '</a></div>';
      h += '<p class="small ' + (FS.closed ? 'msg err' : 'muted') + '">' + esc(FS.closed ? t('fdClosed') : t('fdClosesNote', {d: fmtClose()})) + '</p>';
      h += '<label class="fl" for="fdMsgIn">' + esc(t('fdMsg')) + '</label><textarea id="fdMsgIn" style="min-height:230px;font-size:14px"></textarea><div class="row"><a class="btn ok" id="fdWa" target="_blank" rel="noopener">' + esc(t('fdWa')) + '</a><button class="btn ghost" id="fdMsgCopy">' + esc(t('copy')) + '</button></div>';
      h += '<p class="small muted" style="margin-top:12px">' + esc(t('fdAnswered', {n: FS.players.length})) + '</p>';
      if (FS.players.length) h += '<details><summary class="small">' + esc(t('fdPlayers')) + '</summary><div class="small" style="margin-top:6px">' + FS.players.map(p => esc(p.name) + ' <span class="muted">(' + Object.values(p.a).filter(v => v === 1).length + '/12 Yes)</span>').join(' · ') + '</div></details>';
      h += '</div>';
      h += '<div class="card"><h3>' + esc(t('fdPlanH')) + '</h3><p class="small muted">' + esc(t('fdPlanNote')) + '</p><div style="overflow-x:auto"><table class="ftbl"><thead><tr><th>' + esc(t('fdThMeal')) + '</th><th>' + esc(t('fdThCounter')) + '</th><th>' + esc(t('fdThYes')) + '</th><th>' + esc(t('fdThServed')) + '</th><th></th></tr></thead><tbody>';
      let lastDay = 0;
      FS.plan.forEach((p, i) => {
        if (p.day !== lastDay) { lastDay = p.day; h += '<tr class="dayrow"><td colspan="5">' + esc(t('fdDay', {n: p.day})) + (p.date ? ' · ' + esc(dmy(p.date)) : '') + '</td></tr>'; }
        const basis = p.basis ? '<span class="chip ' + (p.basis === 'admin' ? 'admin' : '') + '">' + esc(t({match: 'fdBmatch', nearest: 'fdBnearest', balance: 'fdBbalance', admin: 'fdBadmin'}[p.basis])) + '</span>' : '';
        const cell = p.ground ? '<span class="gr">' + esc(p.ground) + '</span>' + basis : '<span class="muted">' + esc(t('fdAtTime', {t: MEAL[p.meal][3]})) + '</span>';
        const used = p.locked ? '<b>' + p.served + '</b> / ' + p.yes + (p.buffer ? ' <span class="chip">+' + p.buffer + ' ' + esc(t('fdBuf')) + '</span>' : '') : '–';
        h += '<tr' + (nr && nr.day === p.day && nr.meal === p.meal ? ' class="cur"' : '') + '><td><b>' + esc(MEAL[p.meal][0]) + '</b><div class="small muted">' + esc(win(p.meal)) + '</div></td><td>' + cell + '</td><td>' + (p.yes || 0) + '</td><td>' + used + '</td><td>' + (p.ground ? '<button class="btn ghost sm" data-cm="' + i + '">' + esc(t('fdCopyMsg')) + '</button>' : '') + '</td></tr>';
      });
      h += '</tbody></table></div></div>';
    } else if (FS && FS.open) {
      h += '<div class="card"><h3>' + esc(t('fdConsentH')) + '</h3><p class="muted">' + esc(t('fdConsentP')) + '</p><label class="fl" for="fdOwner">' + esc(t('fdOwnerName')) + '</label><input type="text" id="fdOwner" maxlength="60"><label class="chk"><input type="checkbox" id="fdAgree"><span>' + esc(t('fdAgree')) + '</span></label><div class="row"><button class="btn or" id="fdAccept" disabled>' + esc(t('fdAccept')) + '</button></div><div class="msg" id="fdMsgBox" role="status"></div></div>';
    }
    h += rulesHtml(); box.innerHTML = h; bind();
  }
  function bind() {
    const g = id => document.getElementById(id);
    if (g('fdRef')) g('fdRef').onclick = () => loadFood();
    if (g('fdAgree')) { const upd = () => g('fdAccept').disabled = !(g('fdAgree').checked && g('fdOwner').value.trim().length > 1); g('fdAgree').onchange = upd; g('fdOwner').oninput = upd; }
    if (g('fdAccept')) g('fdAccept').onclick = async () => { g('fdAccept').disabled = true; try { await foodApi('ownerConsent', {token: FTOKEN, name: g('fdOwner').value}); await loadFood(); } catch (e) { g('fdMsgBox').className = 'msg err'; g('fdMsgBox').textContent = msgOf(e); g('fdAccept').disabled = false; } };
    if (g('fdLinkCopy')) g('fdLinkCopy').onclick = () => copy(g('fdLinkIn').value, g('fdLinkCopy'));
    if (g('fdMsgIn')) { const ta = g('fdMsgIn'); ta.value = FMSG === null ? codeMessage() : FMSG; const wa = () => g('fdWa').href = 'https://wa.me/?text=' + encodeURIComponent(ta.value); wa(); ta.oninput = () => { FMSG = ta.value; wa(); }; g('fdMsgCopy').onclick = () => copy(ta.value, g('fdMsgCopy')); }
    if (g('fdNowCopy')) g('fdNowCopy').onclick = () => copy(mealMessage(nowRow()), g('fdNowCopy'));
    document.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => copy(mealMessage(FS.plan[Number(b.dataset.cm)]), b));
  }
  async function loadFood(quiet) {
    if (!window.FOOD_API_URL) { paintFood(); return; }
    if (!quiet) { FLOAD = true; FERR = ''; paintFood(); }
    try {
      if (!FTOKEN) FTOKEN = (await foodApi('ownerLogin', {code: CODE})).token;
      try { FS = await foodApi('ownerState', {token: FTOKEN}); }
      catch (e) { if (/log in again/i.test(e.message)) { FTOKEN = (await foodApi('ownerLogin', {code: CODE})).token; FS = await foodApi('ownerState', {token: FTOKEN}); } else throw e; }
      FERR = '';
    } catch (e) { if (!quiet) FERR = msgOf(e); }
    FLOAD = false; paintFood();
  }
  window.paintFood = paintFood;
  window.renderFood = () => { if (!FS && !FLOAD) loadFood(); else paintFood(); if (!FTIMER) FTIMER = setInterval(() => { const pg = document.getElementById('pg-food'); if (pg && !pg.hidden && !document.hidden && FTOKEN) loadFood(true); }, 60000); };
  applyStatic();
})();
