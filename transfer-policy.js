/* Statewide transfer guarantees — only where a primary source says so.
 *
 * There is no national dataset for "will my credits transfer". Course-by-course
 * articulation exists only inside state systems (ASSIST in California, whose
 * API is closed) and commercial products. What DOES exist, in statute or in
 * signed system-wide agreement, is the layer above it: whether finishing a
 * transfer associate degree in your state guarantees admission, junior
 * standing, or that a block of general education is accepted whole.
 *
 * That layer is what this file carries, and only for states where a primary
 * source was read and cited. Nine states are covered. The other forty-one are
 * absent rather than guessed, and the app says nothing about them — an empty
 * answer being the only honest one available.
 *
 * Every entry records:
 *   scope     which receiving institutions the guarantee actually binds. This
 *             is the detail most often lost in summary: Ohio Transfer 36 binds
 *             public institutions, the SUNY guarantee binds SUNY campuses, and
 *             Illinois binds the institutions that chose to participate.
 *   from      who it is for. Every one of these is written for students
 *             transferring out of an in-state community college; none of them
 *             says anything about arriving from a four-year school or from
 *             another state.
 *   source    the page that was read. Re-read it before trusting this file:
 *             Washington's DTA was revised effective September 2026, which is
 *             this month, and policies move under you.
 *
 * VERIFIED is the date each entry was last checked against its source.
 */

export const VERIFIED = "2026-09-18";

export const POLICIES = {
  OH: {
    name: "Ohio Transfer 36",
    scope: "public",
    admission: "An associate degree plus the completed Ohio Transfer 36 and a 2.0 GPA means a public Ohio institution must admit you, subject to space and its deadlines.",
    credits: "The 36 hours of approved general education transfer as a block, and the individual approved courses transfer course by course even if you do not finish the whole set.",
    source: "https://transfercredit.ohio.gov/initiatives-upd/ohio-transfer-36",
    authority: "Ohio Department of Higher Education",
  },
  CA: {
    name: "Associate Degree for Transfer (AA-T / AS-T)",
    scope: "csu",
    admission: "An ADT guarantees priority admission to the CSU system with junior standing — but not to a particular campus, and not to a particular major.",
    credits: "The degree is capped at 60 semester units and transfers in full. Finishing in a similar CSU programme is designed to take 120 units in total.",
    source: "https://www.calstate.edu/apply/transfer/pages/ccc-associate-degree-for-transfer.aspx",
    authority: "California State University",
  },
  TX: {
    name: "Texas Core Curriculum",
    scope: "public",
    admission: "No admission guarantee. The core curriculum governs credit, not whether you are admitted.",
    credits: "Finish the 42-hour core at any Texas public institution and the receiving public institution must substitute it for its own core in full. Leave partway through and each completed core course still carries over individually.",
    source: "https://www.highered.texas.gov/transfer-resources/",
    authority: "Texas Higher Education Coordinating Board · Texas Education Code §61.821–61.832",
  },
  FL: {
    name: "Florida 2+2 Statewide Articulation Agreement",
    scope: "public",
    admission: "An AA from a Florida College System institution guarantees admission to one of the twelve state universities — not to a chosen one, and not to a limited-access programme.",
    credits: "At least 60 credit hours count toward the bachelor's degree, and the 36-hour general education block is accepted in full with no further coursework required.",
    source: "https://www.fldoe.org/schools/higher-ed/fl-college-system/dual-enroll-transfer/postsecondary-articulation.stml",
    authority: "Florida Department of Education · Fla. Stat. §1007.23, §1007.25",
  },
  NY: {
    name: "SUNY Transfer Guarantee",
    scope: "suny",
    admission: "An AA or AS from a SUNY campus guarantees admission to a SUNY four-year campus. It says nothing about New York's private colleges.",
    credits: "General education completed at one SUNY campus must be accepted as complete at another, recorded on a General Education Transcript Addendum. A parallel programme also guarantees junior standing.",
    source: "https://www.suny.edu/attend/get-started/transfer-students/suny-transfer-policies/",
    authority: "State University of New York",
  },
  IL: {
    name: "Illinois Articulation Initiative",
    scope: "participating",
    admission: "No admission guarantee. The IAI governs general education credit only.",
    credits: "Complete the General Education Core Curriculum package and any fully participating institution must accept it in place of its own lower-division general education requirements. Around 100 Illinois institutions take part, public and private — but participation is a choice, so check the receiving school is on the list.",
    source: "https://itransfer.org/about/",
    authority: "Illinois Board of Higher Education · Illinois Community College Board",
  },
  WA: {
    name: "Direct Transfer Agreement (DTA)",
    scope: "public",
    admission: "No admission guarantee. The DTA governs standing and general education once you are admitted.",
    credits: "State law requires a public four-year institution to give a DTA holder junior standing and treat lower-division general education as met. The degree generally carries at least 90 quarter or 60 semester credits. Many independent Washington colleges honour it too, by their own choice.",
    source: "https://www.sbctc.edu/colleges-staff/programs-services/transfer/direct-transfer-agreement.aspx",
    authority: "Washington State Board for Community and Technical Colleges · RCW 28B.10.696",
    note: "The DTA was revised effective September 2026, replacing the 2014 agreement.",
  },
  NC: {
    name: "Comprehensive Articulation Agreement",
    scope: "unc",
    admission: "The Transfer Assured Admissions Policy assures admission to one of the sixteen UNC System institutions — not to a chosen one.",
    credits: "An Associate in Arts or Associate in Science transfers with junior status, provided every course was passed with a C or better and the overall GPA is at least 2.0.",
    source: "https://www.nccommunitycolleges.edu/comprehensive-articulation-agreement-caa",
    authority: "North Carolina Community College System · UNC System",
  },
  VA: {
    name: "Guaranteed Admission Agreements",
    scope: "agreement",
    admission: "Virginia works differently: rather than one statewide rule, its community colleges hold separate agreements with more than thirty colleges, each setting its own GPA bar. Published examples range from 2.5 at UVA-Wise and Regent to 3.4 at UVA's College of Arts & Sciences and William & Mary, and 3.5 at Christopher Newport.",
    credits: "Every agreement requires a completed transfer associate degree to qualify. What transfers beyond that is set by the individual agreement.",
    source: "https://www.vccs.edu/transfer-programs/",
    authority: "Virginia Community College System",
  },
};

/* Does the guarantee actually reach this school, for this student?
 *
 * Returns null rather than a hedge when it does not. Three things have to line
 * up, and getting any of them wrong would turn a citation into a false promise:
 * the student has to be leaving an in-state community college, the school has
 * to be in the same state, and the school has to be the kind of institution the
 * policy binds. */
export function policyFor(school, profile) {
  const p = POLICIES[profile.state];
  if (!p) return null;
  if (school.state !== profile.state) return null;
  if (profile.curtype !== "cc") return null;

  const binds =
    p.scope === "public" ? school.control === "pub"
    : p.scope === "csu" ? /^(California State University|California Polytechnic|California State Polytechnic|San Diego State|San Jose State|San Francisco State|Sonoma State|Humboldt|California Maritime)/.test(school.name)
    : p.scope === "suny" ? /\(SUNY\)|^SUNY |^University at (Albany|Buffalo)|^Binghamton University|^Stony Brook|^Farmingdale/.test(school.name)
    : p.scope === "unc" ? school.control === "pub"
    /* Illinois participation and Virginia's agreements are per-institution and
       not published as a machine-readable list, so the app names the programme
       and sends the reader to check rather than asserting coverage. */
    : p.scope === "participating" || p.scope === "agreement" ? null
    : false;

  return { ...p, state: profile.state, binds, verified: VERIFIED };
}

export const POLICY_STATES = Object.keys(POLICIES);
