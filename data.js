/* Matriculate — institution reference table.
 *
 * Row format (pipe-delimited):
 *   name | state | control | online | transferAdmitRate% | confidence | typicalGPA | maxCredits | tags
 *
 *   control     pub = public, pri = private nonprofit, prf = private for-profit
 *   online      0 = campus-based, 1 = large online/distance division, 2 = primarily online
 *   confidence  P = rate taken from a published transfer-admission figure
 *               E = rate estimated from overall selectivity and peer institutions
 *   typicalGPA  blank = derived from the admit rate curve in app.js
 *   maxCredits  blank = 60 semester hours assumed (the usual junior-standing cap)
 *   tags        catag  = California TAG / ADT priority pathway
 *               artic  = statewide 2+2 articulation or guaranteed-transfer law
 *               imp    = competitive majors admit separately from the university
 *               nurs   = nursing admits on its own cycle and rubric
 *               open   = open admission, transcript review only
 *               nospr  = little or no spring transfer intake
 *               hol    = explicitly holistic file review
 *
 * Every rate here is a planning estimate, not a guarantee. Verify against the
 * institution's own Common Data Set (section D) before you rely on it.
 */
export const SCHOOL_ROWS = `
Harvard University|MA|pri|1|1|P|3.95|64|hol,nospr
Yale University|CT|pri|0|2|P|3.9|60|hol
Princeton University|NJ|pri|0|1.5|P|3.9|60|hol,nospr
Columbia University|NY|pri|1|6|P|3.85|60|hol
University of Pennsylvania|PA|pri|1|8|P|3.8|60|hol
Brown University|RI|pri|0|6|P|3.8|60|hol
Dartmouth College|NH|pri|0|1.5|P|3.85|60|hol,nospr
Cornell University|NY|pri|1|17|P|3.7|60|hol,imp
Massachusetts Institute of Technology|MA|pri|0|4|P|3.9|60|hol,nospr
Stanford University|CA|pri|0|3|P|3.9|60|hol,nospr
California Institute of Technology|CA|pri|0|2|P|3.9|60|hol,nospr
Duke University|NC|pri|0|5|P|3.85|60|hol,nospr
Northwestern University|IL|pri|1|15|P|3.7|60|hol
Johns Hopkins University|MD|pri|1|8|P|3.8|60|hol
University of Chicago|IL|pri|0|6|P|3.85|60|hol
Vanderbilt University|TN|pri|0|12|P|3.7|60|hol
Rice University|TX|pri|0|12|P|3.7|60|hol
Washington University in St. Louis|MO|pri|0|12|P|3.7|60|hol
University of Notre Dame|IN|pri|0|25|P|3.6|60|hol
Georgetown University|DC|pri|1|12|P|3.7|60|hol
Emory University|GA|pri|0|25|P|3.6|60|hol
Carnegie Mellon University|PA|pri|1|8|P|3.8|60|imp,hol
University of Southern California|CA|pri|1|24|P|3.7|64|catag,imp,hol
New York University|NY|pri|1|30|P|3.5|64|hol
Tufts University|MA|pri|0|15|P|3.65|60|hol
Boston College|MA|pri|0|30|P|3.5|60|hol
Wake Forest University|NC|pri|0|40|E|3.4|60|hol
Brandeis University|MA|pri|0|45|E|3.3|60|
Case Western Reserve University|OH|pri|1|30|E|3.4|60|
Northeastern University|MA|pri|1|45|P|3.4|60|imp
Boston University|MA|pri|1|45|P|3.4|60|
George Washington University|DC|pri|1|45|P|3.3|60|
University of Rochester|NY|pri|0|30|E|3.4|60|
Lehigh University|PA|pri|0|25|E|3.5|60|
Rensselaer Polytechnic Institute|NY|pri|1|45|E|3.3|60|
Villanova University|PA|pri|0|30|E|3.45|60|
Fordham University|NY|pri|1|55|P|3.2|60|
Syracuse University|NY|pri|1|50|P|3.2|60|
University of Miami|FL|pri|1|45|P|3.3|60|
Southern Methodist University|TX|pri|1|50|E|3.2|60|
Texas Christian University|TX|pri|0|55|E|3.1|60|
Pepperdine University|CA|pri|1|40|E|3.35|64|catag
Baylor University|TX|pri|1|55|E|3.1|60|
Marquette University|WI|pri|1|65|E|3.0|60|
Loyola University Chicago|IL|pri|1|65|E|3.0|60|
DePaul University|IL|pri|1|70|P|2.95|60|
St. John's University|NY|pri|1|70|E|2.9|60|
Hofstra University|NY|pri|1|65|E|2.95|60|
Pace University|NY|pri|1|75|E|2.85|60|
Drexel University|PA|pri|1|60|P|3.05|60|
Tulane University|LA|pri|1|25|E|3.5|60|
Trinity University|TX|pri|0|45|E|3.3|60|
American University|DC|pri|1|55|P|3.15|60|
Howard University|DC|pri|1|45|E|3.3|60|
The Catholic University of America|DC|pri|0|65|E|2.95|60|
Seton Hall University|NJ|pri|1|70|E|2.9|60|
Stevens Institute of Technology|NJ|pri|1|45|E|3.3|60|
New Jersey Institute of Technology|NJ|pub|1|65|E|3.0|70|artic
Saint Louis University|MO|pri|1|65|E|3.0|64|
Creighton University|NE|pri|1|70|E|2.9|64|
Drake University|IA|pri|0|70|E|2.9|64|
Butler University|IN|pri|0|70|E|2.9|64|
Xavier University|OH|pri|1|75|E|2.85|64|
University of Dayton|OH|pri|1|75|E|2.85|64|
Duquesne University|PA|pri|1|75|E|2.85|64|
Elon University|NC|pri|0|60|E|3.05|60|
High Point University|NC|pri|0|70|E|2.9|60|
Campbell University|NC|pri|1|75|E|2.85|60|
Samford University|AL|pri|0|65|E|2.95|64|
Belmont University|TN|pri|1|70|E|2.9|64|
Lipscomb University|TN|pri|1|75|E|2.85|64|
Loyola University New Orleans|LA|pri|1|75|E|2.85|64|
Santa Clara University|CA|pri|0|45|P|3.4|70|catag
Loyola Marymount University|CA|pri|1|55|P|3.2|64|catag
University of San Francisco|CA|pri|1|70|P|2.9|70|catag
Chapman University|CA|pri|1|45|P|3.4|70|catag
University of the Pacific|CA|pri|1|70|E|2.9|70|catag
Saint Mary's College of California|CA|pri|1|75|E|2.85|70|catag
Azusa Pacific University|CA|pri|1|75|E|2.85|70|catag
Biola University|CA|pri|1|75|E|2.85|70|catag
Point Loma Nazarene University|CA|pri|0|70|E|2.9|70|catag
California Lutheran University|CA|pri|1|75|E|2.85|70|catag
University of Redlands|CA|pri|1|70|E|2.9|70|catag
University of La Verne|CA|pri|1|75|E|2.85|70|catag
Whittier College|CA|pri|0|80|E|2.8|70|catag
Mount Saint Mary's University|CA|pri|1|80|E|2.8|70|catag
Williams College|MA|pri|0|3|P|3.9|64|hol,nospr
Amherst College|MA|pri|0|5|P|3.85|64|hol
Swarthmore College|PA|pri|0|5|P|3.85|64|hol
Pomona College|CA|pri|0|6|P|3.85|64|hol,catag
Wellesley College|MA|pri|0|15|P|3.65|64|hol
Bowdoin College|ME|pri|0|3|P|3.85|64|hol,nospr
Middlebury College|VT|pri|0|10|P|3.75|64|hol
Carleton College|MN|pri|0|12|P|3.7|64|hol
Claremont McKenna College|CA|pri|0|8|P|3.8|64|hol,catag
Harvey Mudd College|CA|pri|0|8|P|3.8|64|hol,catag
Pitzer College|CA|pri|0|20|P|3.6|64|hol,catag
Scripps College|CA|pri|0|25|E|3.55|64|hol,catag
Davidson College|NC|pri|0|15|E|3.65|64|hol
Colgate University|NY|pri|0|15|E|3.65|64|hol
Hamilton College|NY|pri|0|12|E|3.7|64|hol
Bates College|ME|pri|0|12|E|3.7|64|hol
Colby College|ME|pri|0|8|E|3.75|64|hol
Haverford College|PA|pri|0|12|E|3.7|64|hol
Vassar College|NY|pri|0|20|P|3.6|64|hol
Wesleyan University|CT|pri|0|20|P|3.6|64|hol
Barnard College|NY|pri|0|20|P|3.6|64|hol
Smith College|MA|pri|0|35|P|3.45|64|hol
Mount Holyoke College|MA|pri|0|40|P|3.4|64|hol
Bryn Mawr College|PA|pri|0|40|E|3.4|64|hol
Oberlin College|OH|pri|0|35|E|3.45|64|hol
Grinnell College|IA|pri|0|20|E|3.6|64|hol
Macalester College|MN|pri|0|35|E|3.45|64|hol
Kenyon College|OH|pri|0|35|E|3.45|64|hol
Bucknell University|PA|pri|0|25|E|3.5|64|hol
Lafayette College|PA|pri|0|25|E|3.5|64|hol
Skidmore College|NY|pri|0|35|E|3.45|64|hol
Trinity College|CT|pri|0|40|E|3.4|64|hol
Connecticut College|CT|pri|0|45|E|3.35|64|hol
Dickinson College|PA|pri|0|50|E|3.25|64|hol
Gettysburg College|PA|pri|0|50|E|3.25|64|hol
Occidental College|CA|pri|0|35|E|3.45|64|hol,catag
Reed College|OR|pri|0|40|E|3.4|64|hol
Whitman College|WA|pri|0|50|E|3.25|64|hol
Sewanee: The University of the South|TN|pri|0|55|E|3.15|64|
Rhodes College|TN|pri|0|55|E|3.15|64|
Furman University|SC|pri|0|55|E|3.15|64|
Wofford College|SC|pri|0|55|E|3.15|64|
Denison University|OH|pri|0|40|E|3.4|64|
DePauw University|IN|pri|0|60|E|3.05|64|
The College of Wooster|OH|pri|0|60|E|3.05|64|
Beloit College|WI|pri|0|65|E|3.0|64|
Lawrence University|WI|pri|0|65|E|3.0|64|
Knox College|IL|pri|0|70|E|2.9|64|
St. Olaf College|MN|pri|0|55|E|3.15|64|
Gustavus Adolphus College|MN|pri|0|70|E|2.9|64|
Hope College|MI|pri|0|70|E|2.9|64|
Calvin University|MI|pri|1|70|E|2.9|64|
Wheaton College|IL|pri|0|60|E|3.05|64|
Bard College|NY|pri|1|40|E|3.4|64|hol
Sarah Lawrence College|NY|pri|0|55|E|3.15|64|hol
Union College|NY|pri|0|30|E|3.5|64|hol
Hobart and William Smith Colleges|NY|pri|0|60|E|3.05|64|
Ithaca College|NY|pri|1|65|E|2.95|64|
Marist College|NY|pri|1|65|E|2.95|64|
Adelphi University|NY|pri|1|75|E|2.85|64|
Siena College|NY|pri|0|75|E|2.85|64|
St. Bonaventure University|NY|pri|1|80|E|2.8|64|
Clarkson University|NY|pri|1|70|E|2.9|64|
Rochester Institute of Technology|NY|pri|1|55|P|3.15|64|
New York Institute of Technology|NY|pri|1|70|E|2.9|64|
University of California, Berkeley|CA|pub|0|23|P|3.85|70|catag,imp,nospr
University of California, Los Angeles|CA|pub|0|24|P|3.85|70|imp,nospr
University of California, San Diego|CA|pub|0|51|P|3.7|70|catag,imp,nospr
University of California, Irvine|CA|pub|0|42|P|3.6|70|catag,imp,nospr
University of California, Davis|CA|pub|0|55|P|3.5|70|catag,imp,nospr
University of California, Santa Barbara|CA|pub|0|47|P|3.6|70|catag,imp,nospr
University of California, Santa Cruz|CA|pub|0|71|P|3.25|70|catag,nospr
University of California, Riverside|CA|pub|0|72|P|3.25|70|catag,nospr
University of California, Merced|CA|pub|0|79|P|3.0|70|catag,nospr
California Polytechnic State University, San Luis Obispo|CA|pub|0|28|P|3.6|70|catag,imp
California State Polytechnic University, Pomona|CA|pub|1|55|P|3.1|70|catag,imp
San Diego State University|CA|pub|1|40|P|3.35|70|catag,imp
San Jose State University|CA|pub|1|45|P|3.2|70|catag,imp
California State University, Long Beach|CA|pub|1|40|P|3.3|70|catag,imp
California State University, Fullerton|CA|pub|1|55|P|3.1|70|catag,imp
California State University, Northridge|CA|pub|1|65|P|2.95|70|catag
California State University, Sacramento|CA|pub|1|70|P|2.9|70|catag
California State University, Fresno|CA|pub|1|75|P|2.8|70|catag
San Francisco State University|CA|pub|1|80|P|2.7|70|catag
California State University, Chico|CA|pub|1|75|P|2.8|70|catag
California State University, San Marcos|CA|pub|1|80|P|2.7|70|catag
Sonoma State University|CA|pub|0|85|P|2.6|70|catag
California State University, Stanislaus|CA|pub|1|85|P|2.6|70|catag
California State University, Bakersfield|CA|pub|1|80|P|2.7|70|catag
California State University, Channel Islands|CA|pub|0|80|P|2.7|70|catag
California State University, Dominguez Hills|CA|pub|1|85|P|2.6|70|catag
California State University, East Bay|CA|pub|1|80|P|2.7|70|catag
California State Polytechnic University, Humboldt|CA|pub|1|85|P|2.6|70|catag
California State University, Los Angeles|CA|pub|1|75|P|2.8|70|catag
California State University, Monterey Bay|CA|pub|1|80|P|2.7|70|catag
California State University, San Bernardino|CA|pub|1|80|P|2.7|70|catag
California Maritime Academy|CA|pub|0|75|E|2.85|70|catag
University of Michigan, Ann Arbor|MI|pub|1|40|P|3.7|60|imp,hol
University of Virginia|VA|pub|1|38|P|3.65|60|artic,hol
University of North Carolina at Chapel Hill|NC|pub|1|45|P|3.6|60|artic
University of Texas at Austin|TX|pub|1|30|P|3.6|66|artic,imp
Georgia Institute of Technology|GA|pub|1|35|P|3.6|60|artic,imp
University of Georgia|GA|pub|1|45|P|3.5|60|artic
University of Florida|FL|pub|1|45|P|3.5|60|artic
Florida State University|FL|pub|1|55|P|3.35|60|artic
University of Wisconsin-Madison|WI|pub|1|55|P|3.4|72|artic
University of Illinois Urbana-Champaign|IL|pub|1|60|P|3.35|60|artic,imp
University of Minnesota, Twin Cities|MN|pub|1|60|P|3.3|60|artic
The Ohio State University|OH|pub|1|45|P|3.4|60|artic,imp
Pennsylvania State University, University Park|PA|pub|1|55|P|3.3|60|imp
Purdue University|IN|pub|1|55|P|3.35|64|imp
Indiana University Bloomington|IN|pub|1|70|P|3.1|64|artic
University of Iowa|IA|pub|1|80|P|2.9|60|artic
Iowa State University|IA|pub|1|85|P|2.8|60|artic
Michigan State University|MI|pub|1|60|P|3.2|60|artic
University of Maryland, College Park|MD|pub|1|55|P|3.3|60|artic,imp
Rutgers University-New Brunswick|NJ|pub|1|55|P|3.3|60|artic,imp
University of Pittsburgh|PA|pub|1|60|P|3.2|60|
Virginia Tech|VA|pub|1|50|P|3.4|60|artic,imp
William & Mary|VA|pub|1|40|P|3.5|60|artic
North Carolina State University|NC|pub|1|50|P|3.4|60|artic,imp
Clemson University|SC|pub|1|55|P|3.3|60|artic
University of South Carolina|SC|pub|1|65|P|3.1|60|artic
University of Tennessee, Knoxville|TN|pub|1|70|P|3.05|60|artic
The University of Alabama|AL|pub|1|75|P|2.9|64|artic
Auburn University|AL|pub|1|65|P|3.05|64|artic
Louisiana State University|LA|pub|1|70|P|3.0|60|artic
University of Mississippi|MS|pub|1|80|P|2.8|60|artic
Mississippi State University|MS|pub|1|80|P|2.8|60|artic
University of Arkansas|AR|pub|1|75|P|2.85|60|artic
University of Missouri|MO|pub|1|80|P|2.85|64|artic
University of Kansas|KS|pub|1|85|P|2.75|64|artic
Kansas State University|KS|pub|1|90|P|2.65|64|artic
University of Oklahoma|OK|pub|1|75|P|2.9|60|artic
Oklahoma State University|OK|pub|1|85|P|2.75|60|artic
University of Nebraska-Lincoln|NE|pub|1|80|P|2.8|64|artic
University of Colorado Boulder|CO|pub|1|75|P|2.95|64|artic
Colorado State University|CO|pub|1|80|P|2.85|64|artic
University of Utah|UT|pub|1|80|P|2.85|64|artic
Utah State University|UT|pub|1|90|P|2.65|64|artic
Brigham Young University|UT|pri|1|60|P|3.3|60|
University of Arizona|AZ|pub|1|85|P|2.8|64|artic
Arizona State University|AZ|pub|1|85|P|2.8|64|artic
Northern Arizona University|AZ|pub|1|85|P|2.75|64|artic
University of New Mexico|NM|pub|1|90|P|2.6|64|artic
Texas A&M University|TX|pub|1|60|P|3.25|66|artic,imp
Texas Tech University|TX|pub|1|75|P|2.9|66|artic
University of Houston|TX|pub|1|70|P|3.0|66|artic
University of Texas at San Antonio|TX|pub|1|80|P|2.8|66|artic
University of Texas at Dallas|TX|pub|1|70|P|3.05|66|artic
University of Texas at Arlington|TX|pub|1|80|P|2.8|66|artic
University of North Texas|TX|pub|1|80|P|2.8|66|artic
Texas State University|TX|pub|1|80|P|2.8|66|artic
Sam Houston State University|TX|pub|1|85|P|2.7|66|artic
Tarleton State University|TX|pub|1|85|E|2.7|66|artic
University of Texas at El Paso|TX|pub|1|90|P|2.6|66|artic
University of Texas Rio Grande Valley|TX|pub|1|90|P|2.6|66|artic
Lamar University|TX|pub|1|90|E|2.6|66|artic
University of Washington|WA|pub|1|45|P|3.5|90|artic,imp
Washington State University|WA|pub|1|80|P|2.85|90|artic
University of Oregon|OR|pub|1|80|P|2.85|90|artic
Oregon State University|OR|pub|1|75|P|2.9|90|artic
Portland State University|OR|pub|1|85|P|2.7|90|artic
Boise State University|ID|pub|1|85|P|2.7|70|artic
University of Idaho|ID|pub|1|85|E|2.7|70|artic
University of Montana|MT|pub|1|90|E|2.6|70|artic
Montana State University|MT|pub|1|85|E|2.7|70|artic
University of Wyoming|WY|pub|1|90|E|2.6|70|artic
University of North Dakota|ND|pub|1|90|E|2.6|70|artic
North Dakota State University|ND|pub|1|90|E|2.6|70|artic
University of South Dakota|SD|pub|1|90|E|2.6|70|artic
South Dakota State University|SD|pub|1|90|E|2.6|70|artic
University of Nevada, Reno|NV|pub|1|80|P|2.8|64|artic
University of Nevada, Las Vegas|NV|pub|1|80|P|2.8|64|artic
University of Hawaii at Manoa|HI|pub|1|75|P|2.9|60|artic
University of Alaska Anchorage|AK|pub|1|90|E|2.6|60|artic,open
University of Alaska Fairbanks|AK|pub|1|90|E|2.6|60|artic,open
University of Maine|ME|pub|1|85|P|2.75|60|artic
University of New Hampshire|NH|pub|1|80|P|2.85|60|artic
University of Vermont|VT|pub|1|70|P|3.0|60|artic
University of Connecticut|CT|pub|1|50|P|3.35|60|artic,imp
University of Massachusetts Amherst|MA|pub|1|60|P|3.2|60|artic,imp
University of Massachusetts Boston|MA|pub|1|80|P|2.8|60|artic
University of Massachusetts Lowell|MA|pub|1|75|P|2.85|60|artic
University of Rhode Island|RI|pub|1|75|P|2.85|60|artic
University of Delaware|DE|pub|1|60|P|3.2|60|artic
West Virginia University|WV|pub|1|85|P|2.75|60|artic
University of Kentucky|KY|pub|1|75|P|2.9|60|artic
University of Louisville|KY|pub|1|75|P|2.9|60|artic
University of Cincinnati|OH|pub|1|70|P|3.0|60|artic
Miami University|OH|pub|1|70|P|3.05|60|artic
Ohio University|OH|pub|1|80|P|2.8|60|artic
Kent State University|OH|pub|1|85|P|2.7|60|artic
University of Akron|OH|pub|1|90|P|2.6|60|artic,open
University of Toledo|OH|pub|1|90|P|2.6|60|artic,open
Wright State University|OH|pub|1|90|P|2.6|60|artic,open
Bowling Green State University|OH|pub|1|85|P|2.7|60|artic
University of Illinois Chicago|IL|pub|1|65|P|3.1|60|artic
Northern Illinois University|IL|pub|1|85|P|2.7|60|artic
Illinois State University|IL|pub|1|70|P|3.0|60|artic
Southern Illinois University Carbondale|IL|pub|1|85|P|2.7|60|artic
Wayne State University|MI|pub|1|85|P|2.7|60|artic
Western Michigan University|MI|pub|1|85|P|2.7|60|artic
Central Michigan University|MI|pub|1|85|P|2.7|60|artic
Eastern Michigan University|MI|pub|1|90|P|2.6|60|artic,open
Oakland University|MI|pub|1|85|P|2.7|60|artic
Grand Valley State University|MI|pub|1|80|P|2.8|60|artic
Northern Michigan University|MI|pub|1|90|E|2.6|60|artic
University of Minnesota Duluth|MN|pub|1|80|E|2.8|60|artic
Minnesota State University, Mankato|MN|pub|1|85|E|2.7|60|artic
St. Cloud State University|MN|pub|1|90|E|2.6|60|artic,open
University of Wisconsin-Milwaukee|WI|pub|1|80|P|2.8|72|artic
University of Wisconsin-Eau Claire|WI|pub|1|80|E|2.8|72|artic
University of Wisconsin-La Crosse|WI|pub|1|75|E|2.9|72|artic
University of Wisconsin-Oshkosh|WI|pub|1|85|E|2.7|72|artic
University of Northern Iowa|IA|pub|1|85|E|2.7|60|artic
Missouri State University|MO|pub|1|85|E|2.7|64|artic
University of Missouri-Kansas City|MO|pub|1|85|E|2.7|64|artic
Wichita State University|KS|pub|1|90|E|2.6|64|artic,open
Binghamton University (SUNY)|NY|pub|1|45|P|3.4|60|artic,imp
Stony Brook University (SUNY)|NY|pub|1|55|P|3.25|60|artic
University at Buffalo (SUNY)|NY|pub|1|60|P|3.15|60|artic
University at Albany (SUNY)|NY|pub|1|65|P|3.05|60|artic
SUNY Geneseo|NY|pub|0|60|P|3.15|60|artic
SUNY New Paltz|NY|pub|1|60|P|3.15|60|artic
SUNY Oswego|NY|pub|1|70|P|3.0|60|artic
SUNY Cortland|NY|pub|1|70|P|3.0|60|artic
SUNY Plattsburgh|NY|pub|1|80|P|2.8|60|artic
SUNY Purchase College|NY|pub|0|75|P|2.85|60|artic
SUNY Brockport|NY|pub|1|75|P|2.85|60|artic
SUNY Oneonta|NY|pub|0|70|P|3.0|60|artic
SUNY Fredonia|NY|pub|1|80|P|2.8|60|artic
SUNY Potsdam|NY|pub|1|85|P|2.7|60|artic
SUNY Polytechnic Institute|NY|pub|1|75|E|2.85|60|artic
SUNY Maritime College|NY|pub|0|70|E|3.0|60|artic
SUNY College of Environmental Science and Forestry|NY|pub|0|60|P|3.15|60|artic
Farmingdale State College (SUNY)|NY|pub|1|70|E|3.0|60|artic
SUNY Old Westbury|NY|pub|1|80|E|2.8|60|artic
Baruch College (CUNY)|NY|pub|1|45|P|3.4|70|artic,imp
Hunter College (CUNY)|NY|pub|1|50|P|3.3|70|artic
The City College of New York (CUNY)|NY|pub|1|55|P|3.2|70|artic
Queens College (CUNY)|NY|pub|1|60|P|3.1|70|artic
Brooklyn College (CUNY)|NY|pub|1|60|P|3.1|70|artic
John Jay College of Criminal Justice (CUNY)|NY|pub|1|70|P|2.9|70|artic
Lehman College (CUNY)|NY|pub|1|75|P|2.85|70|artic
College of Staten Island (CUNY)|NY|pub|1|75|P|2.85|70|artic
York College (CUNY)|NY|pub|1|75|P|2.85|70|artic
Medgar Evers College (CUNY)|NY|pub|1|80|P|2.7|70|artic,open
University of Maryland, Baltimore County|MD|pub|1|65|P|3.1|60|artic
Towson University|MD|pub|1|70|P|3.0|60|artic
Salisbury University|MD|pub|1|70|P|3.0|60|artic
Morgan State University|MD|pub|1|80|P|2.8|60|artic
George Mason University|VA|pub|1|65|P|3.1|60|artic
Virginia Commonwealth University|VA|pub|1|70|P|3.0|60|artic
Old Dominion University|VA|pub|1|80|P|2.8|60|artic
James Madison University|VA|pub|1|60|P|3.15|60|artic
Radford University|VA|pub|1|85|P|2.7|60|artic
Christopher Newport University|VA|pub|0|60|E|3.15|60|artic
Longwood University|VA|pub|1|80|E|2.8|60|artic
Georgia State University|GA|pub|1|60|P|3.1|60|artic
Kennesaw State University|GA|pub|1|65|P|3.05|60|artic
Georgia Southern University|GA|pub|1|70|P|3.0|60|artic
Mercer University|GA|pri|1|60|E|3.1|60|
University of Central Florida|FL|pub|1|60|P|3.15|60|artic
University of South Florida|FL|pub|1|60|P|3.15|60|artic
Florida International University|FL|pub|1|70|P|3.0|60|artic
Florida Atlantic University|FL|pub|1|75|P|2.9|60|artic
University of North Florida|FL|pub|1|70|P|3.0|60|artic
Florida Gulf Coast University|FL|pub|1|75|P|2.9|60|artic
Florida Polytechnic University|FL|pub|0|70|E|3.0|60|artic
New College of Florida|FL|pub|0|80|E|2.8|60|artic
Stetson University|FL|pri|1|65|E|3.05|60|
Rollins College|FL|pri|1|60|E|3.1|60|
The University of Tampa|FL|pri|1|70|E|3.0|60|
Nova Southeastern University|FL|pri|1|70|E|3.0|60|
Embry-Riddle Aeronautical University|FL|pri|2|70|P|3.0|60|
University of North Carolina at Charlotte|NC|pub|1|70|P|3.0|60|artic
University of North Carolina at Greensboro|NC|pub|1|75|P|2.9|60|artic
University of North Carolina Wilmington|NC|pub|1|60|P|3.15|60|artic
Appalachian State University|NC|pub|1|65|P|3.05|60|artic
East Carolina University|NC|pub|1|75|P|2.9|60|artic
Coastal Carolina University|SC|pub|1|80|P|2.8|60|artic
College of Charleston|SC|pub|1|65|P|3.05|60|artic
Winthrop University|SC|pub|1|80|P|2.8|60|artic
University of Memphis|TN|pub|1|85|P|2.7|60|artic
Middle Tennessee State University|TN|pub|1|85|P|2.7|60|artic
East Tennessee State University|TN|pub|1|85|P|2.7|60|artic
Tennessee Technological University|TN|pub|1|85|P|2.7|60|artic
University of Alabama at Birmingham|AL|pub|1|80|P|2.8|64|artic
University of Alabama in Huntsville|AL|pub|1|85|P|2.7|64|artic
Troy University|AL|pub|2|85|P|2.7|64|artic
University of South Alabama|AL|pub|1|85|P|2.7|64|artic
Jacksonville State University|AL|pub|1|90|P|2.6|64|artic,open
University of Louisiana at Lafayette|LA|pub|1|85|P|2.7|60|artic
Southeastern Louisiana University|LA|pub|1|85|P|2.7|60|artic
University of Southern Mississippi|MS|pub|1|85|P|2.7|60|artic
Delta State University|MS|pub|1|90|E|2.6|60|artic,open
University of Colorado Denver|CO|pub|1|70|P|3.0|64|artic
University of Colorado Colorado Springs|CO|pub|1|80|P|2.8|64|artic
Metropolitan State University of Denver|CO|pub|1|90|P|2.6|64|artic,open
University of Northern Colorado|CO|pub|1|85|P|2.7|64|artic
Colorado Mesa University|CO|pub|1|90|E|2.6|64|artic,open
University of Denver|CO|pri|1|60|P|3.1|64|
Regis University|CO|pri|2|80|E|2.8|64|
Seattle University|WA|pri|1|70|P|3.0|90|
Gonzaga University|WA|pri|1|60|P|3.15|90|
University of Puget Sound|WA|pri|0|70|E|3.0|90|
Whitworth University|WA|pri|1|75|E|2.9|90|
Western Washington University|WA|pub|1|75|P|2.9|90|artic
Central Washington University|WA|pub|1|85|P|2.7|90|artic
Eastern Washington University|WA|pub|1|85|P|2.7|90|artic
The Evergreen State College|WA|pub|1|90|P|2.6|90|artic,open
Pacific Lutheran University|WA|pri|1|75|E|2.9|90|
University of Portland|OR|pri|0|70|E|3.0|90|
Lewis & Clark College|OR|pri|0|65|E|3.05|90|
Willamette University|OR|pri|1|70|E|3.0|90|
Southern Oregon University|OR|pub|1|90|E|2.6|90|artic,open
Western Oregon University|OR|pub|1|90|E|2.6|90|artic,open
Rowan University|NJ|pub|1|75|P|2.9|60|artic
The College of New Jersey|NJ|pub|0|55|P|3.25|60|artic
Montclair State University|NJ|pub|1|75|P|2.9|60|artic
Stockton University|NJ|pub|1|80|P|2.8|60|artic
Rutgers University-Newark|NJ|pub|1|65|P|3.05|60|artic
Temple University|PA|pub|1|65|P|3.05|60|artic
West Chester University of Pennsylvania|PA|pub|1|75|P|2.9|60|artic
Indiana University of Pennsylvania|PA|pub|1|90|P|2.6|60|artic,open
Shippensburg University of Pennsylvania|PA|pub|1|85|E|2.7|60|artic
Millersville University of Pennsylvania|PA|pub|1|85|E|2.7|60|artic
Bloomsburg University of Pennsylvania|PA|pub|1|85|E|2.7|60|artic
Spelman College|GA|pri|0|40|P|3.4|60|hol
Morehouse College|GA|pri|0|55|E|3.2|60|
Clark Atlanta University|GA|pri|1|70|E|2.95|60|
Hampton University|VA|pri|1|65|E|3.0|60|
North Carolina Central University|NC|pub|1|75|E|2.85|60|artic
North Carolina A&T State University|NC|pub|1|70|P|2.95|60|artic
Florida A&M University|FL|pub|1|70|P|2.95|60|artic
Tennessee State University|TN|pub|1|85|E|2.7|60|artic
Alabama A&M University|AL|pub|1|85|E|2.7|64|artic
Alabama State University|AL|pub|1|80|E|2.8|64|artic
Tuskegee University|AL|pri|0|75|E|2.85|64|
Bethune-Cookman University|FL|pri|1|80|E|2.8|60|
Grambling State University|LA|pub|1|85|E|2.7|60|artic
Southern University and A&M College|LA|pub|1|85|E|2.7|60|artic
Xavier University of Louisiana|LA|pri|0|70|E|2.95|60|
Jackson State University|MS|pub|1|85|E|2.7|60|artic
Alcorn State University|MS|pub|1|85|E|2.7|60|artic
Virginia State University|VA|pub|1|80|E|2.8|60|artic
Norfolk State University|VA|pub|1|85|E|2.7|60|artic
Bowie State University|MD|pub|1|80|E|2.8|60|artic
Coppin State University|MD|pub|1|80|E|2.8|60|artic,open
Delaware State University|DE|pub|1|85|E|2.7|60|artic
Lincoln University|PA|pub|1|80|E|2.8|60|artic
Central State University|OH|pub|1|90|E|2.6|60|artic,open
Savannah State University|GA|pub|1|85|E|2.7|60|artic
Albany State University|GA|pub|1|85|E|2.7|60|artic
Fort Valley State University|GA|pub|1|85|E|2.7|60|artic
Winston-Salem State University|NC|pub|1|80|E|2.8|60|artic
Prairie View A&M University|TX|pub|1|80|E|2.8|66|artic
Texas Southern University|TX|pub|1|85|E|2.7|66|artic,open
Fisk University|TN|pri|0|70|E|2.95|60|
Rhode Island School of Design|RI|pri|0|30|P|3.4|60|hol
Pratt Institute|NY|pri|1|60|P|3.05|60|hol
Parsons School of Design (The New School)|NY|pri|1|60|P|3.05|60|hol
Fashion Institute of Technology (SUNY)|NY|pub|1|50|P|3.2|60|artic,hol
School of the Art Institute of Chicago|IL|pri|0|60|E|3.05|60|hol
California Institute of the Arts|CA|pri|0|40|E|3.35|60|hol,catag
ArtCenter College of Design|CA|pri|0|70|E|2.95|60|hol,catag
Savannah College of Art and Design|GA|pri|2|75|P|2.85|60|hol
Berklee College of Music|MA|pri|1|40|E|3.35|60|hol
New England Conservatory|MA|pri|0|30|E|3.4|60|hol
The Juilliard School|NY|pri|0|10|E|3.6|60|hol,nospr
Emerson College|MA|pri|1|55|P|3.15|60|hol
Full Sail University|FL|prf|2|95|P|2.4|60|open
Colorado School of Mines|CO|pub|1|50|P|3.4|64|artic,imp
Missouri University of Science and Technology|MO|pub|1|80|P|2.85|64|artic
New Mexico Institute of Mining and Technology|NM|pub|1|85|E|2.7|64|artic
Michigan Technological University|MI|pub|1|75|P|2.9|60|artic
Florida Institute of Technology|FL|pri|1|70|E|3.0|60|
Illinois Institute of Technology|IL|pri|1|65|E|3.05|60|
Worcester Polytechnic Institute|MA|pri|1|50|P|3.3|60|
Rose-Hulman Institute of Technology|IN|pri|0|60|E|3.15|60|
Kettering University|MI|pri|1|75|E|2.9|60|
Milwaukee School of Engineering|WI|pri|1|70|E|3.0|60|
Wentworth Institute of Technology|MA|pri|1|75|E|2.9|60|
Western Governors University|UT|pri|2|100|P|2.5|90|open
Southern New Hampshire University|NH|pri|2|95|P|2.5|90|open
University of Maryland Global Campus|MD|pub|2|98|P|2.4|90|open,artic
Purdue University Global|IN|pub|2|95|P|2.4|90|open
Liberty University|VA|pri|2|99|P|2.4|90|open
Arizona State University Online|AZ|pub|2|88|P|2.75|90|open,artic
Penn State World Campus|PA|pub|2|75|P|2.9|90|
Oregon State University Ecampus|OR|pub|2|80|P|2.85|90|artic
University of Florida Online|FL|pub|2|55|P|3.3|60|artic
University of Illinois Springfield|IL|pub|2|85|P|2.7|60|artic
Colorado State University Global|CO|pub|2|95|P|2.4|90|open,artic
Capella University|MN|prf|2|95|P|2.4|90|open
Walden University|MN|prf|2|95|P|2.4|90|open
Strayer University|DC|prf|2|95|P|2.4|90|open
American Public University System|WV|prf|2|100|P|2.3|90|open
Excelsior University|NY|pri|2|100|P|2.3|113|open
Thomas Edison State University|NJ|pub|2|100|P|2.3|90|open,artic
Charter Oak State College|CT|pub|2|100|P|2.3|90|open,artic
Grand Canyon University|AZ|pri|2|80|P|2.8|90|open
National University|CA|pri|2|90|P|2.6|90|open,catag
University of Arizona Global Campus|AZ|pri|2|95|P|2.4|90|open
Colorado Technical University|CO|prf|2|95|P|2.4|90|open
DeVry University|IL|prf|2|95|P|2.4|90|open
University of Phoenix|AZ|prf|2|100|P|2.3|87|open
Rasmussen University|FL|prf|2|95|P|2.4|90|open
Bellevue University|NE|pri|2|95|P|2.4|90|open
Franklin University|OH|pri|2|95|P|2.4|94|open
Park University|MO|pri|2|95|P|2.4|90|open
Columbia Southern University|AL|prf|2|100|P|2.3|90|open
Brigham Young University-Idaho|ID|pri|2|95|P|2.5|60|open
Harvard Extension School|MA|pri|2|95|P|2.5|64|open
UMass Global|CA|pri|2|95|P|2.4|90|open,catag
Northeastern University Global Campus|MA|pri|2|60|E|3.1|60|
Indiana University Online|IN|pub|2|75|E|2.9|64|artic
Ohio Christian University|OH|pri|2|95|E|2.4|90|open
Saint Leo University|FL|pri|2|90|E|2.6|90|open
Champlain College Online|VT|pri|2|90|E|2.6|90|open
Post University|CT|prf|2|95|E|2.4|90|open
Southeastern University|FL|pri|2|90|E|2.6|90|open
City University of Seattle|WA|pri|2|95|E|2.4|90|open
Granite State College (UNH)|NH|pub|2|100|E|2.3|90|open,artic
Fort Hays State University|KS|pub|2|90|P|2.6|64|open,artic
Old Dominion University Online|VA|pub|2|85|E|2.7|60|artic
Central Methodist University|MO|pri|2|90|E|2.6|90|open
Northwood University|MI|pri|2|90|E|2.6|90|open
Baker College|MI|prf|2|95|E|2.4|90|open
Herzing University|WI|prf|2|95|E|2.4|90|open
Keiser University|FL|prf|2|90|E|2.6|90|open
Berkeley College|NJ|prf|2|95|E|2.4|90|open
Sacred Heart University|CT|pri|1|75|E|2.9|60|
Quinnipiac University|CT|pri|1|75|P|2.9|60|
Fairfield University|CT|pri|0|60|E|3.1|60|
Providence College|RI|pri|0|60|E|3.1|60|
Bryant University|RI|pri|1|70|E|3.0|60|
Bentley University|MA|pri|1|55|P|3.2|60|
Babson College|MA|pri|1|35|P|3.45|60|hol
Suffolk University|MA|pri|1|80|E|2.8|60|
Simmons University|MA|pri|1|70|E|3.0|60|
Clark University|MA|pri|1|60|E|3.1|60|
Merrimack College|MA|pri|1|80|E|2.8|60|
Salem State University|MA|pub|1|85|E|2.7|60|artic
Bridgewater State University|MA|pub|1|85|P|2.7|60|artic
Framingham State University|MA|pub|1|85|E|2.7|60|artic
Westfield State University|MA|pub|1|85|E|2.7|60|artic
University of Southern Maine|ME|pub|1|85|E|2.7|60|artic
Southern Connecticut State University|CT|pub|1|85|E|2.7|60|artic
Central Connecticut State University|CT|pub|1|85|E|2.7|60|artic
Western Connecticut State University|CT|pub|1|90|E|2.6|60|artic,open
Plymouth State University|NH|pub|1|90|E|2.6|60|artic,open
Keene State College|NH|pub|1|90|E|2.6|60|artic,open
Castleton University (Vermont State)|VT|pub|1|90|E|2.6|60|artic,open
Northern Kentucky University|KY|pub|1|85|E|2.7|60|artic
Western Kentucky University|KY|pub|1|90|E|2.6|60|artic,open
Eastern Kentucky University|KY|pub|1|90|E|2.6|60|artic,open
Ball State University|IN|pub|1|80|P|2.8|64|artic
Indiana State University|IN|pub|1|90|P|2.6|64|artic,open
Purdue University Northwest|IN|pub|1|85|E|2.7|64|artic
University of Indianapolis|IN|pri|1|85|E|2.7|64|
Valparaiso University|IN|pri|1|80|E|2.8|64|
Bradley University|IL|pri|1|75|E|2.9|60|
Elmhurst University|IL|pri|1|80|E|2.8|60|
Roosevelt University|IL|pri|1|85|E|2.7|60|
Columbia College Chicago|IL|pri|1|90|P|2.6|60|open
Governors State University|IL|pub|1|90|E|2.6|60|artic,open
Eastern Illinois University|IL|pub|1|85|E|2.7|60|artic
Western Illinois University|IL|pub|1|90|E|2.6|60|artic,open
University of Nebraska Omaha|NE|pub|1|85|E|2.7|64|artic
University of Nebraska Kearney|NE|pub|1|90|E|2.6|64|artic,open
Weber State University|UT|pub|1|95|P|2.5|64|artic,open
Utah Valley University|UT|pub|1|95|P|2.5|64|artic,open
Southern Utah University|UT|pub|1|90|E|2.6|64|artic
Idaho State University|ID|pub|1|90|E|2.6|70|artic,open
Nevada State University|NV|pub|1|90|E|2.6|64|artic,open
New Mexico State University|NM|pub|1|90|E|2.6|64|artic,open
University of Texas Permian Basin|TX|pub|1|90|E|2.6|66|artic,open
Stephen F. Austin State University|TX|pub|1|85|E|2.7|66|artic
Texas Woman's University|TX|pub|1|85|E|2.7|66|artic
Angelo State University|TX|pub|1|90|E|2.6|66|artic,open
West Texas A&M University|TX|pub|1|90|E|2.6|66|artic,open
Texas A&M University-Corpus Christi|TX|pub|1|85|E|2.7|66|artic
Texas A&M University-Commerce|TX|pub|1|90|E|2.6|66|artic,open
Abilene Christian University|TX|pri|1|70|E|3.0|66|
Dallas Baptist University|TX|pri|1|75|E|2.9|66|
St. Edward's University|TX|pri|1|70|E|3.0|66|
University of St. Thomas (Texas)|TX|pri|1|80|E|2.8|66|
Seattle Pacific University|WA|pri|1|80|E|2.8|90|
Saint Martin's University|WA|pri|1|85|E|2.7|90|
Concordia University Irvine|CA|pri|1|80|E|2.8|70|catag
Vanguard University|CA|pri|1|85|E|2.7|70|catag
Fresno Pacific University|CA|pri|1|85|E|2.7|70|catag
Woodbury University|CA|pri|1|80|E|2.8|70|catag
Menlo College|CA|pri|0|80|E|2.8|70|catag
Dominican University of California|CA|pri|1|80|E|2.8|70|catag
Notre Dame de Namur University|CA|pri|1|85|E|2.7|70|catag
Hawaii Pacific University|HI|pri|1|85|E|2.7|60|
University of Hawaii at Hilo|HI|pub|1|90|E|2.6|60|artic,open
University of Guam|GU|pub|1|90|E|2.6|60|artic,open
University of Puerto Rico, Rio Piedras|PR|pub|1|70|E|3.0|60|artic
`.trim();
