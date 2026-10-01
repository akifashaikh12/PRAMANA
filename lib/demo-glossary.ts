import type { Language } from "@/locales/translations";

/**
 * OFFLINE GLOSSARY for bundled demo content.
 *
 * Deterministic, exact-match translations so the four core modules (Conflict
 * Engine, Coach Panel, Evidentiary Records, Graph/Timeline) render 100% in
 * Hindi/Gujarati even when GROQ_API_KEY is not configured. Live/unknown
 * strings bypass the glossary and use Groq when available (graceful verbatim
 * fallback otherwise).
 *
 * AUDIT-SAFETY: this is a DISPLAY-ONLY lookup table. Nothing here mutates the
 * stored claims/evidence/findings — the SHA-256 chain always hashes the
 * original English source strings.
 */

type GlossaryMap = Record<string, string>;

const HI: GlossaryMap = {
  // ── Case titles ──
  "Meridian Vault & Server Intrusion": "मेरिडियन वॉल्ट और सर्वर घुसपैठ",
  "Principal Architect Reference Verification": "प्रिंसिपल आर्किटेक्ट संदर्भ सत्यापन",
  "1994 Summer Lake Trip Recollection": "1994 ग्रीष्म झील यात्रा स्मृति",

  // ── Narrators / actors ──
  "Marcus Vance": "मार्कस वैंस",
  "Security Officer Jenkins": "सुरक्षा अधिकारी जेंकिंस",
  "Elena Rostova": "एलेना रोस्तोवा",
  "Maya Lin": "माया लिन",
  "David Lin (Brother)": "डेविड लिन (भाई)",
  "Mom & Maya": "माँ और माया",
  "Uncle George & Maya": "अंकल जॉर्ज और माया",

  // ── Investigation claims (what) ──
  "Arrived at headquarters": "मुख्यालय पहुँचे",
  "Stayed in lobby drinking coffee": "लॉबी में कॉफी पीते रहे",
  "Denied being near basement or server vault": "बेसमेंट या सर्वर वॉल्ट के पास जाने से इनकार किया",
  "Met Sarah for dinner": "सारा के साथ रात्रि भोजन किया",

  // ── Investigation places ──
  "Headquarters Main Gate": "मुख्यालय मुख्य द्वार",
  "First-Floor Main Lobby": "प्रथम तल मुख्य लॉबी",
  "Basement Server Vault": "बेसमेंट सर्वर वॉल्ट",
  "Basement Stairwell": "बेसमेंट सीढ़ियाँ",
  "Restaurant across town": "शहर के पार रेस्टोरेंट",
  "North Express Toll Plaza": "नॉर्थ एक्सप्रेस टोल प्लाज़ा",

  // ── Investigation evidence descriptions ──
  "Keycard badge swipe #4409 (Marcus Vance) registered at Basement Server Vault Entry Door":
    "कीकार्ड बैज स्वाइप #4409 (मार्कस वैंस) बेसमेंट सर्वर वॉल्ट प्रवेश द्वार पर दर्ज",
  "Camera 04 feed: individual wearing dark trench coat exiting basement stairwell towards north parking":
    "कैमरा 04 फ़ीड: गहरा ट्रेंच कोट पहने व्यक्ति बेसमेंट सीढ़ियों से निकलकर उत्तरी पार्किंग की ओर जाता हुआ",
  "Device MAC 8A:33:F1:09 authenticated to North Express Tollway Access Point":
    "डिवाइस MAC 8A:33:F1:09 ने नॉर्थ एक्सप्रेस टोलवे एक्सेस पॉइंट पर प्रमाणीकरण किया",

  // ── Investigation evidence sources ──
  "Access Control System v4": "एक्सेस कंट्रोल सिस्टम v4",
  "Facility CCTV Security Desk": "सुविधा CCTV सुरक्षा डेस्क",
  "State Highway Automated Tollway": "राज्य राजमार्ग स्वचालित टोलवे",

  // ── Investigation findings (conflict explanations) ──
  "Location conflict: Marcus Vance claims he stayed in First-Floor Main Lobby until 2:30 PM, but verified keycard access log (ev-001) records badge #4409 swiped at Basement Server Vault at 14:02:14 (2 minutes after 14:00).":
    "स्थान संघर्ष: मार्कस वैंस का दावा है कि वे 2:30 बजे तक प्रथम तल मुख्य लॉबी में रहे, लेकिन सत्यापित कीकार्ड एक्सेस लॉग (ev-001) में दर्ज है कि बैज #4409 14:02:14 (14:00 के 2 मिनट बाद) पर बेसमेंट सर्वर वॉल्ट पर स्वाइप हुआ।",
  "Unaccounted timeline gap of 3h 12m detected between lobby departure/stairwell footage (14:18) and tollway entry (17:42). No recorded alibis, witnesses, or telemetric logs for this window.":
    "लॉबी से प्रस्थान/सीढ़ी फुटेज (14:18) और टोलवे प्रवेश (17:42) के बीच 3 घंटे 12 मिनट का अस्पष्टीकृत समयरेखा अंतराल पाया गया। इस अवधि के लिए कोई रिकॉर्डेड अलीबाई, गवाह या टेलीमेट्रिक लॉग नहीं है।",

  // ── Investigation coach ──
  "What, if anything, can you describe regarding your activities and movements between 2:15 PM and 5:30 PM on June 12th?":
    "12 जून को 2:15 बजे दोपहर से 5:30 बजे शाम के बीच अपनी गतिविधियों और आवाजाही के बारे में आप क्या बता सकते हैं, यदि कुछ हो?",
  "Directly probe the critical 3-hour unaccounted timeline gap and the basement transition without asking leading questions about the keycard swipe.":
    "3 घंटे के महत्वपूर्ण अस्पष्टीकृत समयरेखा अंतराल और बेसमेंट संक्रमण की सीधे जाँच करें, बिना कीकार्ड स्वाइप के बारे में प्रेरक प्रश्न पूछे।",

  // ── Hiring claims ──
  "Employed as Principal Distributed Systems Architect": "प्रिंसिपल डिस्ट्रिब्यूटेड सिस्टम्स आर्किटेक्ट के रूप में कार्यरत",
  "Independently designed and executed 100k QPS ledger migration": "100k QPS लेजर माइग्रेशन को स्वतंत्र रूप से डिज़ाइन और निष्पादित किया",

  // ── Hiring places ──
  "Nexus Corp": "नेक्सस कॉर्प",
  "Nexus Corp Infrastructure Group": "नेक्सस कॉर्प इंफ्रास्ट्रक्चर ग्रुप",
  "Nexus Corp Internal GitHub": "नेक्सस कॉर्प आंतरिक GitHub",
  "Nexus Corp Public Disclosures": "नेक्सस कॉर्प सार्वजनिक प्रकटीकरण",

  // ── Hiring time expressions ──
  "March 2021 to December 2023": "मार्च 2021 से दिसंबर 2023",

  // ── Hiring evidence descriptions ──
  "Ledger migration RFC #118 authors: Marcus Vance (Tech Lead) and Team of 6 engineers; Elena Rostova listed as secondary code reviewer.":
    "लेजर माइग्रेशन RFC #118 लेखक: मार्कस वैंस (टेक लीड) और 6 इंजीनियरों की टीम; एलेना रोस्तोवा को द्वितीयक कोड समीक्षक के रूप में सूचीबद्ध।",
  "Nexus Corp SEC filing: Ledger migration completed Q3 2022 under Infrastructure Platform team.":
    "नेक्सस कॉर्प SEC फाइलिंग: लेजर माइग्रेशन इंफ्रास्ट्रक्चर प्लेटफ़ॉर्म टीम के तहत Q3 2022 में पूर्ण।",

  // ── Hiring evidence sources ──
  "Nexus Engineering Audit Log": "नेक्सस इंजीनियरिंग ऑडिट लॉग",
  "Public Regulatory Filing": "सार्वजनिक नियामक फाइलिंग",

  // ── Hiring findings ──
  "Attribution discrepancy: Candidate claims to have 'independently designed and executed' the ledger migration, but repository audit records show RFC author was Tech Lead Marcus Vance and Candidate was reviewer.":
    "एट्रिब्यूशन विसंगति: उम्मीदवार का दावा है कि उन्होंने लेजर माइग्रेशन को 'स्वतंत्र रूप से डिज़ाइन और निष्पादित' किया, लेकिन रिपॉजिटरी ऑडिट रिकॉर्ड दिखाते हैं कि RFC लेखक टेक लीड मार्कस वैंस थे और उम्मीदवार समीक्षक थे।",

  // ── Hiring coach ──
  "Can you walk through the division of engineering responsibilities between yourself and the team on the low-latency ledger migration project?":
    "क्या आप लो-लेटेंसी लेजर माइग्रेशन परियोजना पर अपने और टीम के बीच इंजीनियरिंग जिम्मेदारियों के विभाजन के बारे में बता सकते हैं?",
  "Examine candidate scope of ownership neutrally without accusing them of misrepresenting contributions.":
    "उम्मीदवार के स्वामित्व दायरे की तटस्थ जाँच करें, बिना योगदान गलत बताने का आरोप लगाए।",

  // ── Diary claims ──
  "Fishing lesson on dock": "डॉक पर मछली पकड़ने का पाठ",
  "Fishing lesson from rowboat": "नाव से मछली पकड़ने का पाठ",

  // ── Diary people/places ──
  "Lake Cabin Wooden Dock": "झील केबिन लकड़ी का डॉक",
  "Rowboat on lake": "झील पर नाव",
  "Lake George Boat Slip": "लेक जॉर्ज बोट स्लिप",
  "Family Photo Album #3": "पारिवारिक फोटो एल्बम #3",

  // ── Diary evidence ──
  "Polaroid labeled 'Lake George, July 16, 1994' showing Uncle George smiling next to Maya holding a small perch by the boat slip.":
    "पोलरॉइड जिस पर लिखा है 'Lake George, 16 जुलाई 1994', जिसमें अंकल जॉर्ज माया के पास मुस्कुराते हुए हैं, माया ने बोट स्लिप के पास एक छोटी पर्च पकड़ी हुई है।",

  // ── Diary findings ──
  "Subjective memory divergence: Maya remembers Mom teaching her to fish on the dock, whereas David recalls Uncle George in the rowboat. Polaroid confirms Uncle George was present on the lake; preserved as parallel subjective perspectives without declaring a winner.":
    "व्यक्तिपरक स्मृति मतभेद: माया को याद है कि माँ ने डॉक पर मछली पकड़ना सिखाया, जबकि डेविड को नाव में अंकल जॉर्ज याद हैं। पोलरॉइड पुष्टि करता है कि अंकल जॉर्ज झील पर मौजूद थे; बिना किसी विजेता की घोषणा के समानांतर व्यक्तिपरक दृष्टिकोणों के रूप में संरक्षित।",

  // ── Diary coach ──
  "What other details do you remember about the days spent around the cabin during that July trip?":
    "उस जुलाई की यात्रा में केबिन के आसपास बिताए दिनों के बारे में आप और कौन से विवरण याद करते हैं?",
  "Gently invite shared memories and associative context while honoring both family perspectives.":
    "दोनों पारिवारिक दृष्टिकोणों का सम्मान करते हुए साझा स्मृतियों और सहयोगी संदर्भ को सौम्यता से आमंत्रित करें।",

  // ── Decision prefixes & connectors ──
  "Verified:": "सत्यापित:",
  "Disputed:": "विवादित:",
  "Pending:": "लंबित:",
  "Uncontradicted:": "अविरोधित:",
  "unknown actor": "अज्ञात अभिनेता",
  "corroborated by": "द्वारा पुष्ट",
  "record at": "रिकॉर्ड स्थान",
  "conflicts with the evidentiary record at": "साक्ष्य रिकॉर्ड से स्थान पर टकराता है",
  "awaiting clarification of": "स्पष्टीकरण की प्रतीक्षा:",
};

const GU: GlossaryMap = {
  // ── Case titles ──
  "Meridian Vault & Server Intrusion": "મેરિડિયન વૉલ્ટ અને સર્વર ઘુસણખોરી",
  "Principal Architect Reference Verification": "પ્રિન્સિપલ આર્કિટેક્ટ સંદર્ભ ચકાસણી",
  "1994 Summer Lake Trip Recollection": "1994 ઉનાળુ લેક પ્રવાસ સ્મૃતિ",

  // ── Narrators / actors ──
  "Marcus Vance": "માર્કસ વેન્સ",
  "Security Officer Jenkins": "સુરક્ષા અધિકારી જેન્કિન્સ",
  "Elena Rostova": "એલેના રોસ્તોવા",
  "Maya Lin": "માયા લિન",
  "David Lin (Brother)": "ડેવિડ લિન (ભાઈ)",
  "Mom & Maya": "મમ્મી અને માયા",
  "Uncle George & Maya": "અંકલ જ્યોર્જ અને માયા",

  // ── Investigation claims ──
  "Arrived at headquarters": "મુખ્યાલય પહોંચ્યા",
  "Stayed in lobby drinking coffee": "લોબીમાં કૉફી પીતા રહ્યા",
  "Denied being near basement or server vault": "બેઝમેન્ટ કે સર્વર વૉલ્ટ પાસે જવાનો ઇનકાર કર્યો",
  "Met Sarah for dinner": "સારા સાથે રાત્રિભોજન કર્યું",

  // ── Investigation places ──
  "Headquarters Main Gate": "મુખ્યાલય મુખ્ય દરવાજો",
  "First-Floor Main Lobby": "પહેલી માળનો મુખ્ય લોબી",
  "Basement Server Vault": "બેઝમેન્ટ સર્વર વૉલ્ટ",
  "Basement Stairwell": "બેઝમેન્ટ સીડી",
  "Restaurant across town": "શહેર પાર રેસ્ટોરન્ટ",
  "North Express Toll Plaza": "નોર્થ એક્સપ્રેસ ટોલ પ્લાઝા",

  // ── Investigation evidence descriptions ──
  "Keycard badge swipe #4409 (Marcus Vance) registered at Basement Server Vault Entry Door":
    "કીકાર્ડ બેજ સ્વાઇપ #4409 (માર્કસ વેન્સ) બેઝમેન્ટ સર્વર વૉલ્ટ પ્રવેશ દરવાજે નોંધાયું",
  "Camera 04 feed: individual wearing dark trench coat exiting basement stairwell towards north parking":
    "કૅમેરા 04 ફીડ: ઘાટા ટ્રેન્ચ કોટમાં વ્યક્તિ બેઝમેન્ટ સીડીમાંથી નીકળી ઉત્તરી પાર્કિંગ તરફ જાય છે",
  "Device MAC 8A:33:F1:09 authenticated to North Express Tollway Access Point":
    "ડિવાઇસ MAC 8A:33:F1:09 એ નોર્થ એક્સપ્રેસ ટોલવે એક્સેસ પોઇન્ટ પર પ્રમાણીકરણ કર્યું",

  // ── Investigation evidence sources ──
  "Access Control System v4": "એક્સેસ કંટ્રોલ સિસ્ટમ v4",
  "Facility CCTV Security Desk": "સુવિધા CCTV સુરક્ષા ડેસ્ક",
  "State Highway Automated Tollway": "રાજ્ય હાઇવે સ્વચાલિત ટોલવે",

  // ── Investigation findings ──
  "Location conflict: Marcus Vance claims he stayed in First-Floor Main Lobby until 2:30 PM, but verified keycard access log (ev-001) records badge #4409 swiped at Basement Server Vault at 14:02:14 (2 minutes after 14:00).":
    "સ્થળ સંઘર્ષ: માર્કસ વેન્સનો દાવો છે કે તેઓ 2:30 વાગ્યા સુધી પહેલી માળના મુખ્ય લોબીમાં રહ્યા, પરંતુ ચકાસાયેલ કીકાર્ડ એક્સેસ લૉગ (ev-001) મુજબ બેજ #4409 14:02:14 (14:00 પછી 2 મિનિટે) એ બેઝમેન્ટ સર્વર વૉલ્ટ પર સ્વાઇપ થયું.",
  "Unaccounted timeline gap of 3h 12m detected between lobby departure/stairwell footage (14:18) and tollway entry (17:42). No recorded alibis, witnesses, or telemetric logs for this window.":
    "લોબી પ્રસ્થાન/સીડી ફૂટેજ (14:18) અને ટોલવે પ્રવેશ (17:42) વચ્ચે 3 કલાક 12 મિનિટનું અસ્પષ્ટ સમયરેખા અંતર મળ્યું. આ સમયગાળા માટે કોઈ નોંધાયેલ એલિબાય, સાક્ષી કે ટેલિમેટ્રિક લૉગ નથી.",

  // ── Investigation coach ──
  "What, if anything, can you describe regarding your activities and movements between 2:15 PM and 5:30 PM on June 12th?":
    "12 જૂને 2:15 થી 5:30 વાગ્યા વચ્ચે તમારી પ્રવૃત્તિઓ અને હેરફેર વિશે તમે શું વર્ણન કરી શકો છો, જો કંઈ હોય તો?",
  "Directly probe the critical 3-hour unaccounted timeline gap and the basement transition without asking leading questions about the keycard swipe.":
    "3 કલાકના મહત્વપૂર્ણ અસ્પષ્ટ સમયરેખા અંતર અને બેઝમેન્ટ સંક્રમણની સીધી તપાસ કરો, કીકાર્ડ સ્વાઇપ વિશે પ્રેરક પ્રશ્નો પૂછ્યા વગર.",

  // ── Hiring claims ──
  "Employed as Principal Distributed Systems Architect": "પ્રિન્સિપલ ડિસ્ટ્રિબ્યુટેડ સિસ્ટમ્સ આર્કિટેક્ટ તરીકે કાર્યરત",
  "Independently designed and executed 100k QPS ledger migration": "100k QPS લેજર માઇગ્રેશન સ્વતંત્ર રીતે ડિઝાઇન અને અમલ કર્યું",

  // ── Hiring places ──
  "Nexus Corp": "નેક્સસ કોર્પ",
  "Nexus Corp Infrastructure Group": "નેક્સસ કોર્પ ઇન્ફ્રાસ્ટ્રક્ચર ગ્રુપ",
  "Nexus Corp Internal GitHub": "નેક્સસ કોર્પ આંતરિક GitHub",
  "Nexus Corp Public Disclosures": "નેક્સસ કોર્પ જાહેર પ્રકટીકરણ",

  // ── Hiring time expressions ──
  "March 2021 to December 2023": "માર્ચ 2021 થી ડિસેમ્બર 2023",

  // ── Hiring evidence descriptions ──
  "Ledger migration RFC #118 authors: Marcus Vance (Tech Lead) and Team of 6 engineers; Elena Rostova listed as secondary code reviewer.":
    "લેજર માઇગ્રેશન RFC #118 લેખકો: માર્કસ વેન્સ (ટેક લીડ) અને 6 એન્જિનિયરોની ટીમ; એલેના રોસ્તોવા ગૌણ કોડ સમીક્ષક તરીકે સૂચિબદ્ધ.",
  "Nexus Corp SEC filing: Ledger migration completed Q3 2022 under Infrastructure Platform team.":
    "નેક્સસ કોર્પ SEC ફાઇલિંગ: લેજર માઇગ્રેશન ઇન્ફ્રાસ્ટ્રક્ચર પ્લેટફોર્મ ટીમ હેઠળ Q3 2022માં પૂર્ણ.",

  // ── Hiring evidence sources ──
  "Nexus Engineering Audit Log": "નેક્સસ એન્જિનિયરિંગ ઑડિટ લૉગ",
  "Public Regulatory Filing": "જાહેર નિયામક ફાઇલિંગ",

  // ── Hiring findings ──
  "Attribution discrepancy: Candidate claims to have 'independently designed and executed' the ledger migration, but repository audit records show RFC author was Tech Lead Marcus Vance and Candidate was reviewer.":
    "એટ્રિબ્યુશન વિસંગતતા: ઉમેદવારનો દાવો છે કે તેમણે લેજર માઇગ્રેશન 'સ્વતંત્ર રીતે ડિઝાઇન અને અમલ' કર્યું, પરંતુ રિપોઝિટરી ઑડિટ રેકોર્ડ દર્શાવે છે કે RFC લેખક ટેક લીડ માર્કસ વેન્સ હતા અને ઉમેદવાર સમીક્ષક હતા.",

  // ── Hiring coach ──
  "Can you walk through the division of engineering responsibilities between yourself and the team on the low-latency ledger migration project?":
    "શું તમે લો-લેટન્સી લેજર માઇગ્રેશન પ્રોજેક્ટ પર તમારા અને ટીમ વચ્ચેની એન્જિનિયરિંગ જવાબદારીઓનું વિભાજન સમજાવી શકો છો?",
  "Examine candidate scope of ownership neutrally without accusing them of misrepresenting contributions.":
    "ઉમેદવારના સ્વામિત્વ વ્યાપની તટસ્થ તપાસ કરો, યોગદાન ખોટું રજૂ કરવાનો આરોપ વગર.",

  // ── Diary claims ──
  "Fishing lesson on dock": "ડોક પર માછીમારીનો પાઠ",
  "Fishing lesson from rowboat": "નૌકામાંથી માછીમારીનો પાઠ",

  // ── Diary people/places ──
  "Lake Cabin Wooden Dock": "લેક કેબિન લાકડાનો ડોક",
  "Rowboat on lake": "સરોવર પર નૌકા",
  "Lake George Boat Slip": "લેક જ્યોર્જ બોટ સ્લિપ",
  "Family Photo Album #3": "પારિવારિક ફોટો એલ્બમ #3",

  // ── Diary evidence ──
  "Polaroid labeled 'Lake George, July 16, 1994' showing Uncle George smiling next to Maya holding a small perch by the boat slip.":
    "પોલારોઇડ જેની ઉપર લખ્યું છે 'Lake George, 16 જુલાઈ 1994', જેમાં અંકલ જ્યોર્જ માયા પાસે સ્મિત સાથે છે, માયાએ બોટ સ્લિપ પાસે નાની પર્ચ માછલી પકડી છે.",

  // ── Diary findings ──
  "Subjective memory divergence: Maya remembers Mom teaching her to fish on the dock, whereas David recalls Uncle George in the rowboat. Polaroid confirms Uncle George was present on the lake; preserved as parallel subjective perspectives without declaring a winner.":
    "વ્યક્તિલક્ષી સ્મૃતિ મતભેદ: માયાને યાદ છે કે મમ્મીએ ડોક પર માછીમારી શીખવી, જ્યારે ડેવિડને નૌકામાં અંકલ જ્યોર્જ યાદ છે. પોલારોઇડ પુષ્ટિ કરે છે કે અંકલ જ્યોર્જ સરોવર પર હાજર હતા; વિજેતા જાહેર કર્યા વગર સમાંતર વ્યક્તિલક્ષી દૃષ્ટિકોણો તરીકે સચવાયા.",

  // ── Diary coach ──
  "What other details do you remember about the days spent around the cabin during that July trip?":
    "એ જુલાઈના પ્રવાસમાં કેબિન આસપાસ વીતાવેલા દિવસો વિશે તમને બીજું શું યાદ આવે છે?",
  "Gently invite shared memories and associative context while honoring both family perspectives.":
    "બંને પારિવારિક દૃષ્ટિકોણોનું સન્માન કરતાં સાંવાર્સિક સ્મૃતિઓ અને સહયોગી સંદર્ભને કોમળતાથી આમંત્રણ આપો.",

  // ── Decision prefixes & connectors ──
  "Verified:": "ચકાસાયેલ:",
  "Disputed:": "વિવાદિત:",
  "Pending:": "બાકી:",
  "Uncontradicted:": "અવિરોધિત:",
  "unknown actor": "અજાણ્યો અભિનેતા",
  "corroborated by": "દ્વારા પુષ્ટ",
  "record at": "રેકોર્ડ સ્થળ",
  "conflicts with the evidentiary record at": "સ્થળ પર પુરાવા રેકોર્ડ સાથે ટકરાય છે",
  "awaiting clarification of": "સ્પષ્ટતાની રાહ:",
};

const GLOSSARIES: Partial<Record<Language, GlossaryMap>> = {
  hi: HI,
  gu: GU,
};

/** Exact-match glossary lookup. Returns null when no offline entry exists. */
export function lookupGlossary(text: string, lang: Language): string | null {
  const glossary = GLOSSARIES[lang];
  if (!glossary) return null;
  return Object.prototype.hasOwnProperty.call(glossary, text)
    ? glossary[text]
    : null;
}

/**
 * Composed-string translation: translates a decision/summary line by replacing
 * known prefixes, connector phrases, and glossary-known fragments. Falls back
 * to per-fragment glossary hits and leaves hashes/IDs untouched.
 */
export function translateComposed(text: string, lang: Language): string | null {
  const glossary = GLOSSARIES[lang];
  if (!glossary) return null;

  let out = text;
  let touched = false;

  for (const [src, dst] of Object.entries(glossary)) {
    if (out.includes(src)) {
      out = out.split(src).join(dst);
      touched = true;
    }
  }

  return touched ? out : null;
}
