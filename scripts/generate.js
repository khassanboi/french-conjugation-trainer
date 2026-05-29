// Generate conjugation dataset for all 100 verbs × 9 tenses × 8 pronoun forms.
// Output: ../data.generated.js (a JS file that assigns window.VERB_DATA + window.VERB_MEANINGS)

const fs = require('fs');
const path = require('path');
const lib = require('french-verbs');
const lefff = require('french-verbs-lefff/dist/conjugations.json');

// Verbs that take ÊTRE as their auxiliary in compound tenses
// (Dr/Mrs Vandertramp + a few extras we include)
const ETRE_AUX = new Set([
  'aller','venir','arriver','partir','sortir','entrer','rentrer','retourner',
  'rester','tomber','monter','descendre','passer','naître','mourir',
  'devenir','revenir','parvenir','intervenir','apparaître','disparaître',
  'décéder','éclore',
]);

// 100 verbs spanning groups 1 (-er regular), 2 (-ir regular -iss-), 3 (irregular)
const VERBS = [
  // === Group 1: regular -er (40) ===
  { v:'parler',     en:'to speak' },
  { v:'aimer',      en:'to love / like' },
  { v:'donner',     en:'to give' },
  { v:'trouver',    en:'to find' },
  { v:'passer',     en:'to pass / spend' },
  { v:'regarder',   en:'to look / watch' },
  { v:'demander',   en:'to ask' },
  { v:'penser',     en:'to think' },
  { v:'chercher',   en:'to look for' },
  { v:'jouer',      en:'to play' },
  { v:'travailler', en:'to work' },
  { v:'arriver',    en:'to arrive' },
  { v:'rester',     en:'to stay' },
  { v:'écouter',    en:'to listen' },
  { v:'gagner',     en:'to win / earn' },
  { v:'expliquer',  en:'to explain' },
  { v:'décider',    en:'to decide' },
  { v:'présenter',  en:'to present' },
  { v:'continuer',  en:'to continue' },
  { v:'accepter',   en:'to accept' },
  { v:'monter',     en:'to go up' },
  { v:'quitter',    en:'to leave' },
  { v:'tomber',     en:'to fall' },
  { v:'utiliser',   en:'to use' },
  { v:'ajouter',    en:'to add' },
  { v:'proposer',   en:'to propose' },
  { v:'porter',     en:'to wear / carry' },
  { v:'montrer',    en:'to show' },
  { v:'marcher',    en:'to walk' },
  { v:'raconter',   en:'to tell' },
  { v:'habiter',    en:'to live (reside)' },
  { v:'étudier',    en:'to study' },
  { v:'danser',     en:'to dance' },
  { v:'chanter',    en:'to sing' },
  { v:'fermer',     en:'to close' },
  { v:'commencer',  en:'to begin' },
  { v:'manger',     en:'to eat' },
  { v:'acheter',    en:'to buy' },
  { v:'appeler',    en:'to call' },
  { v:'jeter',      en:'to throw' },

  // === Group 1 with spelling quirks (10) ===
  { v:'envoyer',    en:'to send' },
  { v:'essayer',    en:'to try' },
  { v:'nettoyer',   en:'to clean' },
  { v:'préférer',   en:'to prefer' },
  { v:'espérer',    en:'to hope' },
  { v:'répéter',    en:'to repeat' },
  { v:'lever',      en:'to lift / raise' },
  { v:'peser',      en:'to weigh' },
  { v:'payer',      en:'to pay' },
  { v:'employer',   en:'to employ / use' },

  // === Group 2: regular -ir with -iss- (10) ===
  { v:'finir',      en:'to finish' },
  { v:'choisir',    en:'to choose' },
  { v:'réussir',    en:'to succeed' },
  { v:'réfléchir',  en:'to reflect / think' },
  { v:'grandir',    en:'to grow up' },
  { v:'grossir',    en:'to gain weight' },
  { v:'obéir',      en:'to obey' },
  { v:'remplir',    en:'to fill' },
  { v:'saisir',     en:'to seize' },
  { v:'punir',      en:'to punish' },

  // === Group 3: irregular (40) ===
  { v:'être',       en:'to be' },
  { v:'avoir',      en:'to have' },
  { v:'aller',      en:'to go' },
  { v:'faire',      en:'to do / make' },
  { v:'dire',       en:'to say' },
  { v:'pouvoir',    en:'to be able / can' },
  { v:'voir',       en:'to see' },
  { v:'savoir',     en:'to know (a fact)' },
  { v:'vouloir',    en:'to want' },
  { v:'venir',      en:'to come' },
  { v:'devoir',     en:'must / to owe' },
  { v:'prendre',    en:'to take' },
  { v:'mettre',     en:'to put' },
  { v:'tenir',      en:'to hold' },
  { v:'partir',     en:'to leave' },
  { v:'sortir',     en:'to go out' },
  { v:'dormir',     en:'to sleep' },
  { v:'servir',     en:'to serve' },
  { v:'sentir',     en:'to feel / smell' },
  { v:'courir',     en:'to run' },
  { v:'mourir',     en:'to die' },
  { v:'ouvrir',     en:'to open' },
  { v:'offrir',     en:'to offer' },
  { v:'souffrir',   en:'to suffer' },
  { v:'couvrir',    en:'to cover' },
  { v:'découvrir',  en:'to discover' },
  { v:'recevoir',   en:'to receive' },
  { v:'connaître',  en:'to know (a person/place)' },
  { v:'paraître',   en:'to appear / seem' },
  { v:'naître',     en:'to be born' },
  { v:'lire',       en:'to read' },
  { v:'écrire',     en:'to write' },
  { v:'vivre',      en:'to live' },
  { v:'suivre',     en:'to follow' },
  { v:'conduire',   en:'to drive / lead' },
  { v:'construire', en:'to build' },
  { v:'plaire',     en:'to please' },
  { v:'rire',       en:'to laugh' },
  { v:'croire',     en:'to believe' },
  { v:'boire',      en:'to drink' },
];

// 8 pronouns we use, mapped to (lefff person index 0–5, gender, number)
// pronoun → personIdx, gender, number
const PRONOUN_MAP = [
  ['je',    0, 'M', 'S'],
  ['tu',    1, 'M', 'S'],
  ['il',    2, 'M', 'S'],
  ['elle',  2, 'F', 'S'],
  ['nous',  3, 'M', 'P'],
  ['vous',  4, 'M', 'P'],
  ['ils',   5, 'M', 'P'],
  ['elles', 5, 'F', 'P'],
];

const TENSES = {
  present:           'PRESENT',
  imparfait:         'IMPARFAIT',
  futur:             'FUTUR',
  passeCompose:      'PASSE_COMPOSE',
  plusQueParfait:    'PLUS_QUE_PARFAIT',
  futurAnterieur:    'FUTUR_ANTERIEUR',
  conditionnel:      'CONDITIONNEL_PRESENT',
  conditionnelPasse: 'CONDITIONNEL_PASSE_1',
  subjonctif:        'SUBJONCTIF_PRESENT',
};

const COMPOUND = new Set(['PASSE_COMPOSE','PLUS_QUE_PARFAIT','FUTUR_ANTERIEUR','CONDITIONNEL_PASSE_1']);

function conjugate(verb, tenseKey){
  const tense = TENSES[tenseKey];
  const isCompound = COMPOUND.has(tense);
  const usesEtre = ETRE_AUX.has(verb);

  return PRONOUN_MAP.map(([pronoun, personIdx, gender, number])=>{
    if(!isCompound){
      // Simple tense: no aux, no agreement option
      return lib.getConjugation(lefff, verb, tense, personIdx, null);
    }

    if(!usesEtre){
      // Compound with avoir → no subject agreement
      return lib.getConjugation(lefff, verb, tense, personIdx, {aux:'AVOIR'});
    }

    // Compound with être → past participle agrees with subject
    // For pronouns whose gender is ambiguous (je/tu/nous), provide M|F alternates.
    // For "vous", can be polite singular OR plural, both genders → 4 alternates.
    // For il/elle/ils/elles, gender is fixed.
    const opt = (g,n) => ({aux:'ETRE', agreeGender:g, agreeNumber:n});

    if(pronoun==='je' || pronoun==='tu'){
      return [
        lib.getConjugation(lefff, verb, tense, personIdx, opt('M','S')),
        lib.getConjugation(lefff, verb, tense, personIdx, opt('F','S')),
      ].join('|');
    }
    if(pronoun==='nous'){
      return [
        lib.getConjugation(lefff, verb, tense, personIdx, opt('M','P')),
        lib.getConjugation(lefff, verb, tense, personIdx, opt('F','P')),
      ].join('|');
    }
    if(pronoun==='vous'){
      return [
        lib.getConjugation(lefff, verb, tense, personIdx, opt('M','P')),
        lib.getConjugation(lefff, verb, tense, personIdx, opt('F','P')),
        lib.getConjugation(lefff, verb, tense, personIdx, opt('M','S')),
        lib.getConjugation(lefff, verb, tense, personIdx, opt('F','S')),
      ].join('|');
    }
    // il, elle, ils, elles — fixed gender, fixed number
    return lib.getConjugation(lefff, verb, tense, personIdx, opt(gender, number));
  });
}

// Build the dataset
const data = {};
const meanings = {};
const failed = [];

for(const {v,en} of VERBS){
  meanings[v] = en;
  try{
    const tenseObj = {};
    for(const tk of Object.keys(TENSES)){
      tenseObj[tk] = conjugate(v, tk);
    }
    data[v] = tenseObj;
  }catch(err){
    failed.push({verb:v, error:err.message});
  }
}

if(failed.length){
  console.error('FAILED:', JSON.stringify(failed, null, 2));
}

// Write as a JS file that the HTML can include via <script src=...>
const out = `// AUTO-GENERATED from scripts/generate.js — do not edit by hand.
window.VERB_DATA = ${JSON.stringify(data, null, 2)};
window.VERB_MEANINGS = ${JSON.stringify(meanings, null, 2)};
`;
fs.writeFileSync(path.join(__dirname, '..', 'data.generated.js'), out);
console.log(`Wrote ${Object.keys(data).length} verbs (${failed.length} failures) to data.generated.js`);
