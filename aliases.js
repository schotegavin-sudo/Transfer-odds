/* What people actually type.
 *
 * Nobody searches "University of California, Los Angeles". They type UCLA, or
 * Cal, or Michigan, or A&M. Two mechanisms cover it:
 *
 *   1. An acronym built from each school's own name, so UCLA, CSUN, SDSU, NYU,
 *      RIT and several hundred others work without being listed anywhere.
 *   2. This table, for the nicknames a name cannot produce — Cal, Tech, Ole
 *      Miss, The Farm — and for the abbreviations people genuinely use.
 *
 * Keys are lowercase. One school may hold several.
 */
export const ALIASES = {
  "cal": "University of California, Berkeley",
  "berkeley": "University of California, Berkeley",
  "cal berkeley": "University of California, Berkeley",
  "ucb": "University of California, Berkeley",
  "ucsb": "University of California, Santa Barbara",
  "ucsc": "University of California, Santa Cruz",
  "ucsd": "University of California, San Diego",
  "ucd": "University of California, Davis",
  "uci": "University of California, Irvine",
  "ucr": "University of California, Riverside",
  "ucm": "University of California, Merced",
  "slo": "California Polytechnic State University, San Luis Obispo",
  "cal poly": "California Polytechnic State University, San Luis Obispo",
  "cal poly slo": "California Polytechnic State University, San Luis Obispo",
  "cal poly pomona": "California State Polytechnic University, Pomona",
  "cpp": "California State Polytechnic University, Pomona",
  "cal state la": "California State University, Los Angeles",
  "cal state long beach": "California State University, Long Beach",
  "the beach": "California State University, Long Beach",
  "cal state fullerton": "California State University, Fullerton",
  "cal state northridge": "California State University, Northridge",
  "sac state": "California State University, Sacramento",
  "fresno state": "California State University, Fresno",
  "chico state": "California State University, Chico",
  "sf state": "San Francisco State University",
  "sj state": "San Jose State University",
  "stanford": "Stanford University",
  "the farm": "Stanford University",
  "sc": "University of Southern California",
  "southern cal": "University of Southern California",
  "caltech": "California Institute of Technology",
  "mit": "Massachusetts Institute of Technology",
  "harvard": "Harvard University",
  "yale": "Yale University",
  "princeton": "Princeton University",
  "penn": "University of Pennsylvania",
  "upenn": "University of Pennsylvania",
  "wharton": "University of Pennsylvania",
  "brown": "Brown University",
  "dartmouth": "Dartmouth College",
  "cornell": "Cornell University",
  "columbia": "Columbia University",
  "hopkins": "Johns Hopkins University",
  "jhu": "Johns Hopkins University",
  "uchicago": "University of Chicago",
  "vandy": "Vanderbilt University",
  "wustl": "Washington University in St. Louis",
  "wash u": "Washington University in St. Louis",
  "cmu": "Carnegie Mellon University",
  "notre dame": "University of Notre Dame",
  "nd": "University of Notre Dame",
  "gtown": "Georgetown University",
  "bc": "Boston College",
  "bu": "Boston University",
  "northeastern": "Northeastern University",
  "neu": "Northeastern University",
  "rpi": "Rensselaer Polytechnic Institute",
  "wpi": "Worcester Polytechnic Institute",
  "rit": "Rochester Institute of Technology",
  "michigan": "University of Michigan, Ann Arbor",
  "umich": "University of Michigan, Ann Arbor",
  "ann arbor": "University of Michigan, Ann Arbor",
  "msu": "Michigan State University",
  "uva": "University of Virginia",
  "virginia": "University of Virginia",
  "vt": "Virginia Tech",
  "wm": "William & Mary",
  "william and mary": "William & Mary",
  "unc": "University of North Carolina at Chapel Hill",
  "chapel hill": "University of North Carolina at Chapel Hill",
  "carolina": "University of North Carolina at Chapel Hill",
  "ncsu": "North Carolina State University",
  "nc state": "North Carolina State University",
  "duke": "Duke University",
  "wake": "Wake Forest University",
  "ut": "University of Texas at Austin",
  "ut austin": "University of Texas at Austin",
  "texas": "University of Texas at Austin",
  "longhorns": "University of Texas at Austin",
  "a&m": "Texas A&M University",
  "am": "Texas A&M University",
  "tamu": "Texas A&M University",
  "aggies": "Texas A&M University",
  "ttu": "Texas Tech University",
  "gt": "Georgia Institute of Technology",
  "georgia tech": "Georgia Institute of Technology",
  "uga": "University of Georgia",
  "uf": "University of Florida",
  "gators": "University of Florida",
  "fsu": "Florida State University",
  "ucf": "University of Central Florida",
  "usf": "University of South Florida",
  "fiu": "Florida International University",
  "the u": "University of Miami",
  "wisco": "University of Wisconsin-Madison",
  "madison": "University of Wisconsin-Madison",
  "uw madison": "University of Wisconsin-Madison",
  "uiuc": "University of Illinois Urbana-Champaign",
  "illinois": "University of Illinois Urbana-Champaign",
  "uic": "University of Illinois Chicago",
  "umn": "University of Minnesota, Twin Cities",
  "twin cities": "University of Minnesota, Twin Cities",
  "osu": "The Ohio State University",
  "ohio state": "The Ohio State University",
  "psu": "Pennsylvania State University, University Park",
  "penn state": "Pennsylvania State University, University Park",
  "happy valley": "Pennsylvania State University, University Park",
  "pitt": "University of Pittsburgh",
  "purdue": "Purdue University",
  "iu": "Indiana University Bloomington",
  "indiana": "Indiana University Bloomington",
  "umd": "University of Maryland, College Park",
  "college park": "University of Maryland, College Park",
  "rutgers": "Rutgers University-New Brunswick",
  "ru": "Rutgers University-New Brunswick",
  "uconn": "University of Connecticut",
  "umass": "University of Massachusetts Amherst",
  "amherst": "University of Massachusetts Amherst",
  "udel": "University of Delaware",
  "uw": "University of Washington",
  "udub": "University of Washington",
  "washington": "University of Washington",
  "wsu": "Washington State University",
  "osu oregon": "Oregon State University",
  "uo": "University of Oregon",
  "ducks": "University of Oregon",
  "asu": "Arizona State University",
  "sun devils": "Arizona State University",
  "u of a": "University of Arizona",
  "ua": "University of Arizona",
  "nau": "Northern Arizona University",
  "cu": "University of Colorado Boulder",
  "cu boulder": "University of Colorado Boulder",
  "boulder": "University of Colorado Boulder",
  "csu colorado": "Colorado State University",
  "mines": "Colorado School of Mines",
  "byu": "Brigham Young University",
  "the u utah": "University of Utah",
  "unlv": "University of Nevada, Las Vegas",
  "bama": "The University of Alabama",
  "roll tide": "The University of Alabama",
  "auburn": "Auburn University",
  "war eagle": "Auburn University",
  "lsu": "Louisiana State University",
  "ole miss": "University of Mississippi",
  "miss state": "Mississippi State University",
  "mizzou": "University of Missouri",
  "ku": "University of Kansas",
  "k state": "Kansas State University",
  "ou": "University of Oklahoma",
  "sooners": "University of Oklahoma",
  "okstate": "Oklahoma State University",
  "huskers": "University of Nebraska-Lincoln",
  "unl": "University of Nebraska-Lincoln",
  "vols": "University of Tennessee, Knoxville",
  "utk": "University of Tennessee, Knoxville",
  "uk": "University of Kentucky",
  "wvu": "West Virginia University",
  "nyu": "New York University",
  "the new school": "Parsons School of Design (The New School)",
  "sunys": "Binghamton University (SUNY)",
  "bing": "Binghamton University (SUNY)",
  "stony brook": "Stony Brook University (SUNY)",
  "ub": "University at Buffalo (SUNY)",
  "buffalo": "University at Buffalo (SUNY)",
  "baruch": "Baruch College (CUNY)",
  "hunter": "Hunter College (CUNY)",
  "ccny": "The City College of New York (CUNY)",
  "john jay": "John Jay College of Criminal Justice (CUNY)",
  "fit": "Fashion Institute of Technology (SUNY)",
  "risd": "Rhode Island School of Design",
  "saic": "School of the Art Institute of Chicago",
  "scad": "Savannah College of Art and Design",
  "calarts": "California Institute of the Arts",
  "berklee": "Berklee College of Music",
  "wgu": "Western Governors University",
  "snhu": "Southern New Hampshire University",
  "umgc": "University of Maryland Global Campus",
  "umuc": "University of Maryland Global Campus",
  "gcu": "Grand Canyon University",
  "liberty": "Liberty University",
  "apu online": "American Public University System",
  "tesu": "Thomas Edison State University",
  "phoenix": "University of Phoenix",
  "howard": "Howard University",
  "famu": "Florida A&M University",
  "at": "North Carolina A&T State University",
  "spelman": "Spelman College",
  "morehouse": "Morehouse College",
  "smu": "Southern Methodist University",
  "tcu": "Texas Christian University",
  "bama birmingham": "University of Alabama at Birmingham",
  "tulane": "Tulane University",
  "emory": "Emory University",
  "rice": "Rice University",
  "baylor": "Baylor University",
  "gonzaga": "Gonzaga University",
  "zags": "Gonzaga University",
  "depaul": "DePaul University",
  "loyola chicago": "Loyola University Chicago",
  "lmu": "Loyola Marymount University",
  "scu": "Santa Clara University",
  "usfca": "University of San Francisco",
  "pepperdine": "Pepperdine University",
  "chapman": "Chapman University",
};

const STOP = new Set(["of", "the", "at", "and", "in", "for", "a"]);

/* UCLA out of "University of California, Los Angeles"; CSUN out of
   "California State University, Northridge". Initials of the words that
   carry meaning, which is how people build these in the first place. */
export function acronym(name) {
  const words = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^A-Za-z\s&-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w && !STOP.has(w.toLowerCase()) && w !== "&");
  return words.length >= 2 ? words.map((w) => w[0]).join("").toUpperCase() : "";
}

/* Everything one school can be found by, as a single lowercase haystack. */
export function searchIndex(school, stateName = "") {
  const nicknames = Object.entries(ALIASES)
    .filter(([, target]) => target === school.name)
    .map(([alias]) => alias);
  return [
    school.name,
    school.name.replace(/[.,()&]/g, " "),
    school.state,
    stateName,
    acronym(school.name),
    ...nicknames,
    school.online === 2 ? "online distance remote" : school.online === 1 ? "online" : "",
  ].join(" ").toLowerCase().replace(/\s+/g, " ");
}

/* Every word has to appear somewhere, so "cal state northridge" and
   "michigan ann arbor" both land, and word order never matters. */
export function matches(index, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((t) => index.includes(t));
}

/* Relevance, so that "cal" puts Berkeley above every school with "California"
   in its name, and "gt" puts Georgia Tech above Georgetown. Lower is better. */
export function relevance(school, index, query) {
  const q = query.trim().toLowerCase();
  if (!q) return 5;
  const name = school.name.toLowerCase();
  if (ALIASES[q] === school.name) return 0;           // a nickname, exactly
  if (acronym(school.name).toLowerCase() === q) return 1;
  if (name === q) return 1;
  if (name.startsWith(q)) return 2;
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(name)) return 3;
  return matches(index, q) ? 4 : 9;
}
