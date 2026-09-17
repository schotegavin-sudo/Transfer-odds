/* Majors, with what each one does to transfer competition.
 *
 * Row format:  id | name | group | rateMultiplier | poolShift | flags
 *
 *   rateMultiplier  applied to the school's overall transfer admit rate. A
 *                   capacity-constrained major admits well under the university
 *                   figure; an under-subscribed one admits above it.
 *   poolShift       how much stronger the applicant pool is in this major,
 *                   in GPA points, relative to the school's overall transfer pool.
 *   flags           port  portfolio, audition, or interview carries real weight
 *                   clin  clinical or lab seats cap the cohort, not the classroom
 *                   dir   commonly admits directly to the major, not the university
 *                   seq   a locked prerequisite sequence; late starters lose a year
 *
 * These are cross-institution averages. A given department can sit well off them.
 */
export const MAJOR_ROWS = `
agbus|Agricultural Business|Agriculture & Environment|1.10|-0.05|
agsci|Agricultural Science|Agriculture & Environment|1.15|-0.05|
animal|Animal Science|Agriculture & Environment|0.95|0.02|seq
envsci|Environmental Science|Agriculture & Environment|1.00|0.02|
envstud|Environmental Studies|Agriculture & Environment|1.10|-0.02|
forestry|Forestry & Natural Resources|Agriculture & Environment|1.15|-0.05|
horti|Horticulture & Plant Science|Agriculture & Environment|1.20|-0.08|
sustain|Sustainability|Agriculture & Environment|1.05|0.00|
marbio|Marine Biology|Agriculture & Environment|0.75|0.10|seq
arch|Architecture|Architecture & Design|0.55|0.10|port,seq,dir
landarch|Landscape Architecture|Architecture & Design|0.80|0.04|port
interior|Interior Design|Architecture & Design|0.80|0.02|port
urbplan|Urban Planning|Architecture & Design|0.95|0.02|
constmgmt|Construction Management|Architecture & Design|0.90|0.00|
artstudio|Studio Art|Art & Design|0.90|0.00|port
arthist|Art History|Art & Design|1.15|0.02|
graphic|Graphic Design|Art & Design|0.75|0.04|port,dir
illus|Illustration|Art & Design|0.70|0.04|port
indust|Industrial & Product Design|Art & Design|0.65|0.06|port,dir
anim|Animation|Art & Design|0.60|0.06|port,dir
gamedes|Game Design|Art & Design|0.60|0.08|port
photo|Photography|Art & Design|0.85|0.00|port
fashion|Fashion Design|Art & Design|0.70|0.02|port
uxdes|UX & Interaction Design|Art & Design|0.70|0.08|port
film|Film & Television Production|Performing Arts|0.50|0.08|port,dir
music|Music Performance|Performing Arts|0.70|0.02|port
musiced|Music Education|Performing Arts|0.85|0.00|port
musicind|Music Industry & Production|Performing Arts|0.70|0.04|port
theater|Theater & Drama|Performing Arts|0.75|0.00|port
dance|Dance|Performing Arts|0.70|0.00|port
acting|Acting|Performing Arts|0.45|0.02|port,dir
accting|Accounting|Business|0.85|0.06|
finance|Finance|Business|0.65|0.12|dir
bizadmin|Business Administration|Business|0.75|0.08|dir
mgmt|Management|Business|0.85|0.05|
marketing|Marketing|Business|0.80|0.05|
intlbiz|International Business|Business|0.85|0.06|
entre|Entrepreneurship|Business|0.90|0.04|
supply|Supply Chain & Logistics|Business|0.85|0.06|
bizanalytics|Business Analytics|Business|0.60|0.14|dir
mis|Information Systems (MIS)|Business|0.70|0.10|
realestate|Real Estate|Business|0.90|0.04|
hospit|Hospitality & Tourism Management|Business|1.05|-0.04|
sportmgmt|Sport Management|Business|0.95|-0.02|
hr|Human Resources|Business|0.95|0.00|
actsci|Actuarial Science|Business|0.70|0.14|
comm|Communication Studies|Communication & Media|0.95|0.00|
journ|Journalism|Communication & Media|0.95|0.02|
pr|Public Relations & Advertising|Communication & Media|0.90|0.02|
media|Media Studies|Communication & Media|0.90|0.02|
broadcast|Broadcast & Digital Media|Communication & Media|0.85|0.02|
cs|Computer Science|Computing & Data|0.40|0.20|dir,seq
cse|Computer Engineering|Computing & Data|0.45|0.18|dir,seq
softeng|Software Engineering|Computing & Data|0.45|0.18|dir,seq
it|Information Technology|Computing & Data|0.80|0.06|
cyber|Cybersecurity|Computing & Data|0.65|0.10|
datasci|Data Science|Computing & Data|0.45|0.18|dir
ai|Artificial Intelligence & Machine Learning|Computing & Data|0.40|0.22|dir
infosci|Information Science|Computing & Data|0.75|0.08|
webdev|Web & Mobile Development|Computing & Data|0.85|0.04|
elemed|Elementary Education|Education|1.05|-0.04|clin
secondaryed|Secondary Education|Education|1.05|-0.02|clin
speced|Special Education|Education|1.10|-0.06|clin
earlyed|Early Childhood Education|Education|1.15|-0.08|clin
eddev|Child & Human Development|Education|1.05|-0.04|
aero|Aerospace Engineering|Engineering|0.45|0.18|dir,seq
bioeng|Biomedical Engineering|Engineering|0.45|0.18|dir,seq
cheme|Chemical Engineering|Engineering|0.50|0.16|dir,seq
civil|Civil Engineering|Engineering|0.60|0.12|dir,seq
electrical|Electrical Engineering|Engineering|0.50|0.16|dir,seq
enveng|Environmental Engineering|Engineering|0.70|0.10|seq
indeng|Industrial & Systems Engineering|Engineering|0.65|0.12|seq
matsci|Materials Science & Engineering|Engineering|0.70|0.12|seq
mecheng|Mechanical Engineering|Engineering|0.50|0.16|dir,seq
nuclear|Nuclear Engineering|Engineering|0.70|0.12|seq
petro|Petroleum Engineering|Engineering|0.70|0.10|seq
engtech|Engineering Technology|Engineering|1.00|-0.02|
mfgeng|Manufacturing Engineering|Engineering|0.85|0.06|
nursing|Nursing (BSN)|Health & Clinical|0.30|0.22|clin,dir,seq
nursingrn|Nursing (RN to BSN)|Health & Clinical|1.10|-0.02|
prehealth|Pre-Med / Pre-Health Sciences|Health & Clinical|0.80|0.12|
publichealth|Public Health|Health & Clinical|0.95|0.04|
kines|Kinesiology & Exercise Science|Health & Clinical|0.70|0.04|
athtrain|Athletic Training|Health & Clinical|0.80|0.04|clin
nutrition|Nutrition & Dietetics|Health & Clinical|0.70|0.08|clin,seq
respcare|Respiratory Therapy|Health & Clinical|0.55|0.06|clin,seq
radtech|Radiologic & Imaging Sciences|Health & Clinical|0.45|0.08|clin,dir,seq
dentalhyg|Dental Hygiene|Health & Clinical|0.35|0.12|clin,dir,seq
ot|Occupational Therapy (pre)|Health & Clinical|0.55|0.12|clin,seq
pt|Physical Therapy (pre)|Health & Clinical|0.55|0.14|clin,seq
pa|Physician Assistant (pre)|Health & Clinical|0.40|0.18|clin,seq
pharm|Pharmacy (pre)|Health & Clinical|0.60|0.12|seq
speech|Speech-Language Pathology (pre)|Health & Clinical|0.60|0.10|clin,seq
healthadmin|Health Administration|Health & Clinical|1.00|0.00|
medlab|Medical Laboratory Science|Health & Clinical|0.60|0.08|clin,seq
socialwork|Social Work|Health & Clinical|1.00|-0.02|clin
english|English|Humanities|1.15|0.02|
creativewrite|Creative Writing|Humanities|0.95|0.04|port
history|History|Humanities|1.15|0.02|
philosophy|Philosophy|Humanities|1.15|0.04|
religion|Religious Studies|Humanities|1.20|0.00|
classics|Classics|Humanities|1.25|0.04|
complit|Comparative Literature|Humanities|1.15|0.04|
linguistics|Linguistics|Humanities|1.05|0.06|
arthum|Humanities (general)|Humanities|1.20|-0.02|
spanish|Spanish|Languages|1.20|0.00|
french|French|Languages|1.25|0.02|
chinese|Chinese|Languages|1.15|0.04|
japanese|Japanese|Languages|1.00|0.04|
german|German|Languages|1.25|0.02|
asianstud|Asian Studies|Languages|1.15|0.02|
translation|Translation & Interpretation|Languages|1.10|0.02|
crimjust|Criminal Justice & Criminology|Law, Justice & Public Service|1.05|-0.04|
prelaw|Legal Studies / Pre-Law|Law, Justice & Public Service|1.00|0.04|
polisci|Political Science|Law, Justice & Public Service|0.95|0.04|
publicpol|Public Policy & Administration|Law, Justice & Public Service|1.00|0.04|
intlrel|International Relations|Law, Justice & Public Service|0.85|0.08|
homeland|Homeland Security & Emergency Management|Law, Justice & Public Service|1.05|-0.04|
fireadmin|Fire Science & Administration|Law, Justice & Public Service|1.10|-0.06|
math|Mathematics|Mathematics & Statistics|0.90|0.10|
appliedmath|Applied Mathematics|Mathematics & Statistics|0.85|0.12|
stats|Statistics|Mathematics & Statistics|0.80|0.12|
biology|Biology|Natural Sciences|0.80|0.08|
biochem|Biochemistry|Natural Sciences|0.75|0.10|
chemistry|Chemistry|Natural Sciences|0.90|0.08|
physics|Physics|Natural Sciences|0.90|0.12|
astro|Astronomy & Astrophysics|Natural Sciences|0.85|0.14|
geology|Geology & Earth Science|Natural Sciences|1.10|0.02|
neuro|Neuroscience|Natural Sciences|0.60|0.14|dir
microbio|Microbiology|Natural Sciences|0.85|0.08|
genetics|Genetics & Molecular Biology|Natural Sciences|0.75|0.12|
zoology|Zoology|Natural Sciences|0.90|0.04|
psych|Psychology|Psychology & Social Sciences|0.85|0.02|
sociology|Sociology|Psychology & Social Sciences|1.05|0.00|
anthro|Anthropology|Psychology & Social Sciences|1.15|0.02|
econ|Economics|Psychology & Social Sciences|0.70|0.12|dir
geography|Geography|Psychology & Social Sciences|1.15|0.00|
ethnic|Ethnic & Gender Studies|Psychology & Social Sciences|1.15|0.00|
socsci|Social Sciences (general)|Psychology & Social Sciences|1.00|0.00|
cogsci|Cognitive Science|Psychology & Social Sciences|0.75|0.10|
aviation|Aviation & Professional Flight|Applied & Technical|0.65|0.02|clin,seq
avmaint|Aviation Maintenance|Applied & Technical|0.90|-0.04|seq
autotech|Automotive Technology|Applied & Technical|1.00|-0.08|
weldtech|Welding & Manufacturing Technology|Applied & Technical|1.05|-0.10|
hvac|HVAC & Building Systems|Applied & Technical|1.05|-0.10|
culinary|Culinary Arts & Food Science|Applied & Technical|1.00|-0.06|
agmech|Agricultural Mechanics|Applied & Technical|1.10|-0.08|
maritime|Maritime & Marine Transportation|Applied & Technical|0.85|-0.02|seq
milsci|Military Science & Leadership|Applied & Technical|1.05|-0.02|
libstudies|Liberal Studies|Interdisciplinary|1.10|-0.06|
genstudies|General Studies|Interdisciplinary|1.20|-0.12|
interdis|Interdisciplinary Studies|Interdisciplinary|1.15|-0.08|
undeclared|Undeclared / Undecided|Interdisciplinary|1.00|0.00|
honors|Honors College|Interdisciplinary|0.45|0.25|dir
`.trim();
