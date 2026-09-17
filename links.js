/* Official links, from the US Department of Education.
 *
 * Every URL here comes from IPEDS HD2023, the federal institutional directory
 * (public domain), and every one was fetched to confirm it still resolves —
 * 526 answered directly, 41 more are real but refuse automated requests, and
 * anything that failed was dropped rather than shipped. Nothing is guessed: a
 * link that lands on the wrong campus is worse than no link at all.
 *
 * A search engine was the old fallback and is gone. The 21 schools without a
 * verified URL fall through to College Navigator, which is the same federal
 * directory with a search box, not a third-party search.
 *
 * Row: institution | IPEDS unit id | admissions office | application page
 *
 * Refresh: node tools/refresh-links.mjs (re-downloads the directory and
 * re-checks every URL).
 */
export const LINK_ROWS = `
Abilene Christian University|222178|https://acu.edu/admissions-aid/|https://www.acu.edu/apply/
Adelphi University|188429|https://www.adelphi.edu/admissions/|https://admissions.adelphi.edu/onlineapp.php
Alabama A&M University|100654|https://www.aamu.edu/admissions-aid/index.html|https://www.aamu.edu/admissions-aid/undergraduate-admissions/apply-today.html
Alabama State University|100724|https://www.alasu.edu/admissions/|
Albany State University|138716|https://www.asurams.edu/enrollment-management/admissions/index.php|https://www.asurams.edu/admissions/how-to-apply/
Alcorn State University|175342|https://alcorn.university-tour.com/homepage|https://apply.alcorn.edu/apply/?_ga=2.258745482.1665759555.1699280796-1290066.1695844451
American Public University System|449339|https://www.apu.apus.edu/admissions/|
American University|131159|https://www.american.edu/admissions/|https://www.american.edu/admissions/apply/index.cfm
Amherst College|164465|https://www.amherst.edu/admission/|https://www.amherst.edu/admission/apply/firstyear
Angelo State University|222831|https://www.angelo.edu/admissions-and-aid/|https://www.applytexas.org/
Appalachian State University|197869|https://www.appstate.edu/admissions/|https://apply.commonapp.org/login?ma=854
Arizona State University|104151|https://admission.asu.edu/contact|https://webapp4.asu.edu/uga_admissionsapp/
Arizona State University Online|483124|https://admission.asu.edu/contact|https://webapp4.asu.edu/uga_admissionsapp/
ArtCenter College of Design|109651|https://www.artcenter.edu/admissions/overview.html|https://www.artcenter.edu/apply.html
Auburn University|100858|https://www.auburn.edu/admissions/index.php|https://www.auburn.edu/admissions/
Azusa Pacific University|109785|https://www.apu.edu/admissions/|https://www.apu.edu/undergraduate-admissions/apply/
Babson College|164580|https://www.babson.edu/undergraduate/admission/|https://www.babson.edu/undergraduate/admission/how-to-apply/
Baker College|168847|https://www.baker.edu/admissions/undergraduate/|https://www.baker.edu/apply
Ball State University|150136|https://www.bsu.edu/admissions|https://www.bsu.edu/admissions/undergraduate-admissions/apply-now
Bard College|189088|https://www.bard.edu/admission/|https://www.bard.edu/admission/firstyear
Barnard College|189097|https://barnard.edu/admissions-aid|https://barnard.edu/admissions/how-to-apply
Baruch College (CUNY)|190512|https://enrollmentmanagement.baruch.cuny.edu/admissions/|https://www.cuny.edu/admissions/undergraduate/apply/cuny-application/
Bates College|160977|https://www.bates.edu/admission/|https://www.bates.edu/admission/apply/
Baylor University|223232|https://admissions.web.baylor.edu/|https://admissions.web.baylor.edu/
Bellevue University|180814|https://www.bellevue.edu/admissions/|
Belmont University|219709|https://www.belmont.edu/admissions/|https://www.belmont.edu/admissions/apply/freshmen/index.html
Beloit College|238333|https://www.beloit.edu/admission/|https://www.beloit.edu/admission/apply
Bentley University|164739|https://www.bentley.edu/undergraduate|https://www.bentley.edu/undergraduate
Berklee College of Music|164748|https://www.berklee.edu/admissions|https://apply.berklee.edu/
Bethune-Cookman University|132602|https://www.cookman.edu/admissionsaid/index.html|https://wildcat.cookman.edu/ICS/Admissions/Admissions_Home_Page.jnz?portlet=Apply_Online_2.0&formid=1
Binghamton University (SUNY)|196079|https://www.binghamton.edu/admissions/|https://www.binghamton.edu/admissions/apply
Biola University|110097|https://www.biola.edu/admissions/undergrad|https://www.biola.edu/admissions/undergrad#apply-now
Boise State University|142115|https://www.boisestate.edu/admissions/|https://www.boisestate.edu/admissions/apply/
Boston College|164924|https://www.bc.edu/content/bc-web/admission.html|https://www.commonapp.org/
Boston University|164988|https://www.bu.edu/admissions/|https://www.bu.edu/admissions/apply
Bowdoin College|161004|https://www.bowdoin.edu/admissions/|https://www.bowdoin.edu/admissions/apply/
Bowie State University|162007|https://www.bowiestate.edu/admissions-and-aid/|https://www.bowiestate.edu/admissions-and-aid/apply-online.php
Bowling Green State University|201441|https://www.bgsu.edu/admissions.html|https://www.bgsu.edu/
Bradley University|143358|https://www.bradley.edu/news-articles/freshman-sophomore-high-school-honor-band-performs-november-15/|https://www.bradley.edu/admissions/freshman/apply
Brandeis University|165015|https://www.brandeis.edu/admissions/|https://www.brandeis.edu/admissions/apply/index.html
Bridgewater State University|165024|https://www.bridgew.edu/admissions|https://www.bridgew.edu/admissions/undergraduate/apply
Brigham Young University|230038|https://enrollment.byu.edu/admissions|https://churchofjesuschrist.org/church-education/apply-to-church-schools?lang=eng
Brigham Young University-Idaho|142522|https://www.byui.edu/Admissions/|https://www.byui.edu/Admissions/
Brooklyn College (CUNY)|190549|https://www.brooklyn.edu/admissions-aid/|https://www.cuny.edu/admissions/undergraduate/apply/cuny-application
Brown University|217156|https://www.brown.edu/admission|https://www.commonapp.org/
Bryant University|217165|https://www.bryant.edu/undergraduate/undergraduate-admission|https://www.commonapp.org/explore/bryant-university
Bryn Mawr College|211273|https://www.brynmawr.edu/admissions-aid|https://www.brynmawr.edu/admissions-aid/how-apply
Bucknell University|211291|https://www.bucknell.edu/admissions-aid|https://www.commonapp.org/
Butler University|150163|https://www.butler.edu/admission-aid/|https://www.butler.edu/apply
California Institute of Technology|110404|https://www.admissions.caltech.edu/|https://www.admissions.caltech.edu/apply
California Institute of the Arts|111081|https://calarts.edu/admissions-aid/admissions/application-process|https://calarts.edu/admissions/apply/
California Lutheran University|110413|https://www.callutheran.edu/admission/|https://www.callutheran.edu/admission/apply.html
California Maritime Academy|111188|https://maritime.calpoly.edu/|https://www.csum.edu/admissions/requirements/
California Polytechnic State University, San Luis Obispo|110422|https://www.calpoly.edu/admissions|https://www2.calstate.edu/apply
California State Polytechnic University, Humboldt|115755|https://www.humboldt.edu/admission-aid|https://www.calstate.edu/apply
California State Polytechnic University, Pomona|110529|https://www.cpp.edu/admissions/|https://www2.calstate.edu/apply
California State University, Bakersfield|110486|https://www.csub.edu/Admissions/|https://www2.calstate.edu/apply
California State University, Channel Islands|441937|https://www.csuci.edu/admissions/index.html|https://www2.calstate.edu/apply
California State University, Chico|110538|https://www.csuchico.edu/admissions/|https://www2.calstate.edu/apply
California State University, Dominguez Hills|110547|https://www.csudh.edu/future-students/explore/|https://www.calstate.edu/apply
California State University, East Bay|110574|https://www.csueastbay.edu/futurestudents/|https://www.calstate.edu/apply
California State University, Fresno|110556|https://studentaffairs.fresnostate.edu/are/|https://www2.calstate.edu/apply
California State University, Fullerton|110565|https://admissions.fullerton.edu/|https://www2.calstate.edu/apply
California State University, Long Beach|110583|https://www.csulb.edu/admissions|https://www2.calstate.edu/apply
California State University, Los Angeles|110592|https://www.calstatela.edu/admissions|https://www2.calstate.edu/apply
California State University, Monterey Bay|409698|https://csumb.edu/admissions-aid/|https://www.calstate.edu/apply
California State University, Northridge|110608|https://www.csun.edu/current-students/contact-office-registrar|https://www2.calstate.edu/apply
California State University, Sacramento|110617|https://www.csus.edu/apply/admissions/|https://www2.calstate.edu/apply
California State University, San Bernardino|110510|https://www.csusb.edu/join-the-pack|https://www2.calstate.edu/apply
California State University, San Marcos|366711|https://www.csusm.edu/admissions/|https://www.calstate.edu/apply
California State University, Stanislaus|110495|https://www.csustan.edu/undergrad|https://www.calstate.edu/apply
Calvin University|169080|https://calvin.edu/admissions|https://www.calvin.edu/apply/
Campbell University|198136|https://www.campbell.edu/admissions/|https://www.campbell.edu/apply/
Capella University|413413|https://www.capella.edu/admissions-requirements/|https://www.capella.edu/admissions-requirements/
Carleton College|173258|https://www.carleton.edu/admissions/|https://www.carleton.edu/admissions/apply/steps/
Carnegie Mellon University|211440|https://admission.enrollment.cmu.edu/|https://admission.enrollment.cmu.edu/pages/apply-now
Case Western Reserve University|201645|https://case.edu/admission/|https://admission.case.edu/apply/
Central Connecticut State University|128771|https://www.ccsu.edu/admissions|https://www.ccsu.edu/apply
Central Michigan University|169248|https://www.cmich.edu/admissions-aid|https://fireup.cmich.edu/apply/
Central State University|201690|https://www.centralstate.edu/admissions|https://applynow.centralstate.edu/apply/
Central Washington University|234827|https://www.cwu.edu/admissions-aid/|https://www.cwu.edu/about/campus-locations/online/
Chapman University|111948|https://www.chapman.edu/admission/index.aspx|https://www.commonapp.org/explore/chapman-university
Charter Oak State College|128780|https://www.charteroak.edu/|https://www.charteroak.edu/Prospective/Apply
Christopher Newport University|231712|https://cnu.edu/admission/|https://cnu.edu/admission/freshman/howtoapply/
City University of Seattle|234915|https://www.cityu.edu/admissions-us/|https://www.cityu.edu/applications-overview/undergraduate-application/
Claremont McKenna College|112260|https://www.cmc.edu/admission|https://www.cmc.edu/admission/apply
Clark Atlanta University|138947|https://www.cau.edu/|
Clark University|165334|https://www.clarku.edu/undergraduate-admissions/|https://www.clarku.edu/admissions/apply/
Clarkson University|190044|https://www.clarkson.edu/admissions-aid|https://www.clarkson.edu/apply-now
Clemson University|217882|https://www.clemson.edu/admissions/|https://www.clemson.edu/admissions/undergraduate/index.html
Coastal Carolina University|218724|https://www.coastal.edu/admissions/|https://www.coastal.edu/admissions/apply.html
Colby College|161086|https://afa.colby.edu/|https://afa.colby.edu/apply/
Colgate University|190099|https://www.colgate.edu/admission-aid|https://www.colgate.edu/admission-aid/apply
College of Charleston|217819|https://charleston.edu/admission/|
College of Staten Island (CUNY)|190558|https://www.csi.cuny.edu/admissions|https://www.cuny.edu/admissions/apply.html
Colorado Mesa University|127556|https://www.coloradomesa.edu/future.html|https://www.coloradomesa.edu/admissions/apply.html
Colorado School of Mines|126775|https://undergraduate-admissions.mines.edu/|https://www.mines.edu/undergraduate-admissions/apply/
Colorado State University|126818|https://admissions.colostate.edu/|https://admissions.colostate.edu/apply/
Colorado State University Global|476975|https://csuglobal.edu/admissions|https://csuglobal.edu/student-application2
Colorado Technical University|126827|https://www.coloradotech.edu/Admissions|https://www.coloradotech.edu/Apply-Online
Columbia College Chicago|144281|https://www.colum.edu/admissions/|https://www.colum.edu/apply
Columbia Southern University|450933|https://www.columbiasouthern.edu/admissions/getting-started/|https://www.columbiasouthern.edu/Apply-Now
Columbia University|190150|https://www.columbia.edu/content/admissions|https://www.columbia.edu/content/admissions-offices
Concordia University Irvine|112075|https://www.cui.edu/admissions/|https://www.cui.edu/en-us/apply
Connecticut College|128902|https://www.conncoll.edu/admission/|https://www.conncoll.edu/admission/apply/
Coppin State University|162283|https://www.coppin.edu/office-admissions|https://www.coppin.edu/apply
Cornell University|190415|https://admissions.cornell.edu/|https://www.commonapp.org/
Creighton University|181002|https://www.creighton.edu/admissions|https://www.creighton.edu/apply
Dallas Baptist University|224226|https://www.dbu.edu/admissions/|https://www.dbu.edu/applications
Dartmouth College|182670|https://admissions.dartmouth.edu/|https://admissions.dartmouth.edu/apply/apply-dartmouth
Davidson College|198385|https://www.davidson.edu/admission-and-financial-aid|https://davidson.edu/admission-and-financial-aid/how-to-apply
DePaul University|144740|https://www.depaul.edu/admission|https://www.depaul.edu/apply/Pages/default.aspx
DePauw University|150400|https://www.depauw.edu/admission-aid/|https://www.depauw.edu/admission/apply/
DeVry University|482477|https://www.devry.edu/admissions.html|
Delaware State University|130934|https://www.desu.edu/admissions|https://www.desu.edu/apply-now
Delta State University|175616|https://www.deltastate.edu/academic-affairs/admissions/|https://www.deltastate.edu/academic-affairs/admissions/
Denison University|202523|https://denison.edu/campus/admission|https://www.denison.edu/campus/admission/apply-to-denison
Dickinson College|212009|https://www.dickinson.edu/homepage/287/admissions|https://www.dickinson.edu/homepage/279/apply
Dominican University of California|113698|https://www.dominican.edu/admissions|https://www.dominican.edu/admissions/apply-now
Drake University|153269|https://www.drake.edu/admission-aid/apply|https://www.drake.edu/admission
Drexel University|212054|https://drexel.edu/admissions|https://drexel.edu/admissions/apply/
Duke University|198419|https://admissions.duke.edu/|https://admissions.duke.edu/application/instructions
Duquesne University|212106|https://www.duq.edu/admissions-and-aid/undergraduate-admissions|https://www.duq.edu/admissions-and-aid/undergraduate/apply-for-admission
East Carolina University|198464|https://admissions.ecu.edu/|https://admissions.ecu.edu/apply/freshmen/
East Tennessee State University|220075|https://www.etsu.edu/admissions/|
Eastern Illinois University|144892|https://www.eiu.edu/admissions.php|https://www.eiu.edu/myeiu/index.php?type=signup
Eastern Kentucky University|156620|https://www.eku.edu/admissions/|https://admissions.eku.edu/
Eastern Michigan University|169798|https://www.emich.edu/admissions/|https://www.emich.edu/admissions/apply/index.php
Eastern Washington University|235097|https://www.ewu.edu/apply/|https://www.ewu.edu/apply
Elmhurst University|144962|https://www.elmhurst.edu/admission/|https://www.elmhurst.edu/admission/apply/undergraduate-application/
Elon University|198516|https://www.elon.edu/u/admissions/undergraduate/|https://www.elon.edu/e-web/admissions/apply.xhtml
Embry-Riddle Aeronautical University|133553|https://erau.edu/admissions|https://daytonabeach.erau.edu/admissions/apply
Emerson College|165662|https://emerson.edu/admission-aid/|https://www.commonapp.org/
Emory University|139658|https://apply.emory.edu/|https://apply.emory.edu/apply/first-year/how-to-apply.html
Excelsior University|196680|https://www.excelsior.edu/admissions/|https://www.excelsior.edu/admissions
Fairfield University|129242|https://www.fairfield.edu/|https://commonapp.org/
Farmingdale State College (SUNY)|196042|https://www.farmingdale.edu/admissions/index.shtml|https://www.suny.edu/applysuny/
Fashion Institute of Technology (SUNY)|191126|https://www.fitnyc.edu/admissions/|https://www.suny.edu/applysuny
Fisk University|220181|https://www.fisk.edu/admissions/|https://www.fisk.edu/admissions/apply
Florida A&M University|133650|https://admissions.famu.edu/|
Florida Atlantic University|133669|https://www.fau.edu/admissions/|https://www.fau.edu/apply/
Florida Gulf Coast University|433660|https://www.fgcu.edu/admissionsandaid/undergraduateadmissions/|
Florida Institute of Technology|133881|https://www.fit.edu/admission/|https://www.fit.edu/apply/
Florida International University|133951|https://onestop.fiu.edu/|https://onestop.fiu.edu/
Florida Polytechnic University|482936|https://floridapoly.edu/admissions/|
Florida State University|134097|https://admissions.fsu.edu/|https://admissions.fsu.edu/undergradapp/
Fordham University|191241|https://www.fordham.edu/|
Fort Hays State University|155061|https://www.fhsu.edu/admissions/|https://www.fhsu.edu/admissions/admissions-application/
Fort Valley State University|139719|https://www.fvsu.edu/about-fvsu/office-recruitment-admissions|https://www.fvsu.edu/admissions
Framingham State University|165866|https://www.framingham.edu/admissions-aid/admissions|https://www.framingham.edu/admissions-and-aid/admissions/index
Franklin University|202806|https://www.franklin.edu/future-student|https://apply.franklin.edu/
Fresno Pacific University|114813|https://www.fresno.edu/admission|https://apply.fresno.edu/
Full Sail University|134237|https://www.fullsail.edu/admissions|https://apply.fullsail.edu/
Furman University|218070|https://www.furman.edu/admissions-aid/|https://www.furman.edu/admissions-aid/apply/
George Mason University|232186|https://www.gmu.edu/admissions-aid|https://www2.gmu.edu/admissions-aid/apply-now
George Washington University|131469|https://www.gwu.edu/admissions-aid|https://undergraduate.admissions.gwu.edu/apply-gw
Georgetown University|131496|https://uadmissions.georgetown.edu/|https://uapply.georgetown.edu/register/firstyearapplication
Georgia Institute of Technology|139755|https://admission.gatech.edu/|https://www.admission.gatech.edu/apply/
Georgia Southern University|139931|https://www.georgiasouthern.edu/admissions-aid|https://admissions.georgiasouthern.edu/apply/
Georgia State University|139940|https://admissions.gsu.edu/|https://admissions.gsu.edu/bachelors-degree/apply/
Gettysburg College|212674|https://www.gettysburg.edu/admissions-aid/|https://www.gettysburg.edu/admissions-aid/applying-to-gettysburg/
Gonzaga University|235316|https://www.gonzaga.edu/admission|https://www.gonzaga.edu/admission
Governors State University|145336|https://www.govst.edu/admissions|
Grambling State University|159009|https://www.gram.edu/admissions/|https://www.gram.edu/admissions/apply/
Grand Canyon University|104717|https://www.gcu.edu/admissions|https://www.gcu.edu/
Grand Valley State University|170082|https://www.gvsu.edu/admissions|https://www.gvsu.edu/admissions/undergraduate-application-23.htm
Grinnell College|153384|https://www.grinnell.edu/admission|https://www.grinnell.edu/admission/apply
Gustavus Adolphus College|173647|https://gustavus.edu/admission-aid|https://gustavus.edu/admission/apply/
Hamilton College|191515|https://www.hamilton.edu/admission|https://www.hamilton.edu/admission/apply
Hampton University|232265|https://home.hamptonu.edu/|https://www.hamptonu.edu/studentservices/admissions/apply.htm
Harvard University|166027|https://college.harvard.edu/admissions|https://college.harvard.edu/admissions/apply/application-requirements
Harvey Mudd College|115409|https://www.hmc.edu/admission/|https://www.hmc.edu/admission/apply/
Haverford College|212911|https://www.haverford.edu/admission/|https://www.haverford.edu/admission/applying
Hawaii Pacific University|141644|https://www.hpu.edu/admissions/|https://www.hpu.edu/admissions/apply/
High Point University|198695|https://www.highpoint.edu/admissions/|https://www.highpoint.edu/admissions/freshmen-admissions/
Hobart and William Smith Colleges|191630|https://www.hws.edu/admissions/default.aspx|https://www.hws.edu/admissions/apply/default.aspx
Hofstra University|191649|https://www.hofstra.edu/admission/|https://www.hofstra.edu/application
Hope College|170301|https://www.hope.edu/admissions/|https://hope.edu/admissions/apply.html
Howard University|131520|https://admission.howard.edu/|
Hunter College (CUNY)|190594|https://www.hunter.cuny.edu/admissions|https://hunter.cuny.edu/students/admissions/undergraduate/apply/
Idaho State University|142276|https://www.isu.edu/|https://www.isu.edu/apply/
Illinois Institute of Technology|145725|https://www.iit.edu/admissions-aid|https://www.iit.edu/admissions-aid/apply
Illinois State University|145813|https://illinoisstate.edu/|
Indiana State University|151324|https://www.indianastate.edu/apply|https://apply.indstate.edu/apply
Indiana University Bloomington|151351|https://bloomington.iu.edu/|https://online.iu.edu/resources/getting-admitted.html#_ga=2.261838094.2037234953.1629214438-1561726355.1580334008
Indiana University of Pennsylvania|213020|https://www.iup.edu/admissions/index.html|https://www.iup.edu/admissions/undergraduate/apply-next-steps/index.html
Iowa State University|153603|https://www.iastate.edu/admission-and-aid/admissions|https://apps.admissions.iastate.edu/myaccount/
Ithaca College|191968|https://www.ithaca.edu/admission|https://www.ithaca.edu/admission/apply/
Jackson State University|175856|https://www.jsums.edu/admissions/|https://www.jsums.edu/apply/
Jacksonville State University|101480|https://www.jsu.edu/admissions/|https://www.jsu.edu/apply_now.html
James Madison University|232423|https://www.jmu.edu/admissions/index.shtml|https://www.jmu.edu/admissions/apply/
John Jay College of Criminal Justice (CUNY)|190600|https://www.jjay.cuny.edu/admissions|
Johns Hopkins University|162928|https://apply.jhu.edu/|https://apply.commonapp.org/
Kansas State University|155399|https://www.k-state.edu/admissions/|https://www.k-state.edu/admissions/apply/
Keene State College|183062|https://www.keene.edu/admissions|https://www.keene.edu/admissions/apply/
Kennesaw State University|486840|https://www.kennesaw.edu/admissions/|https://www.kennesaw.edu/apply.php
Kent State University|203517|https://www.kent.edu/admissions|https://www.kent.edu/admissions/apply
Kenyon College|203535|https://www.kenyon.edu/admissions-aid/|https://www.commonapp.org/
Kettering University|169983|https://www.kettering.edu/admissions-aid|https://www.kettering.edu/apply
Knox College|146427|https://www.knox.edu/admission|https://www.knox.edu/admission/apply-to-knox
Lafayette College|213385|https://admissions.lafayette.edu/|https://apply.commonapp.org/login?ma=138
Lamar University|226091|https://www.lamar.edu/admissions/|https://www.applytexas.org/
Lawrence University|239017|https://www.lawrence.edu/admissions-aid/|https://www.lawrence.edu/admissions-aid/apply
Lehigh University|213543|https://www2.lehigh.edu/admissions|https://www1.lehigh.edu/admissions/undergrad/apply
Lehman College (CUNY)|190637|https://www.lehman.edu/admissions/|https://www2.cuny.edu/admissions/apply-to-cuny/
Lewis & Clark College|209056|https://college.lclark.edu/offices/admissions/|https://www.lclark.edu/college/offices/admissions/apply/
Liberty University|232557|https://www.liberty.edu/admissions/|https://www.liberty.edu/apply
Lincoln University|213598|https://www.lincoln.edu/admissions/|https://lincoln.elluciancrmrecruit.com/Apply/Account/Login?ReturnUrl=%2fApply
Lipscomb University|219976|https://lipscomb.edu/admission|https://admission.lipscomb.edu/apply
Longwood University|232566|https://www.longwood.edu/admissions/|https://www.longwood.edu/apply/
Louisiana State University|159391|https://www.lsu.edu/admissions/index.php|https://www.lsu.edu/admissions/apply/index.php
Loyola Marymount University|117946|https://admission.lmu.edu/|https://admission.lmu.edu/apply/
Loyola University Chicago|146719|https://www.luc.edu/undergrad/|https://www.luc.edu/undergrad/apply/
Loyola University New Orleans|159656|https://www.loyno.edu/admissions|https://www.loyno.edu/admissions/how-apply
Macalester College|173902|https://www.macalester.edu/admissions/|https://www.macalester.edu/admissions/apply/
Marist College|192819|https://www.marist.edu/admission-financial-aid|https://www.marist.edu/admission/undergraduate/marist-online-application
Marquette University|239105|https://www.marquette.edu/admissions/|https://www.marquette.edu/explore/apply-today.php
Massachusetts Institute of Technology|166683|https://mitadmissions.org/|https://my.mit.edu/
Medgar Evers College (CUNY)|190646|https://www.mec.cuny.edu/admissions/|https://www2.cuny.edu/admissions/undergraduate/apply/
Menlo College|118693|https://www.menlo.edu/admissions-aid/|
Mercer University|140447|https://www.mercer.edu/admissions/|https://undergrad.mercer.edu/apply-now/
Merrimack College|166850|https://www.merrimack.edu/admission/|
Metropolitan State University of Denver|127565|https://www.msudenver.edu/admissions/|https://www.msudenver.edu/apply/
Miami University|204024|https://miamioh.edu/admission-aid/|https://apply.commonapp.org/
Michigan State University|171100|https://admissions.msu.edu/|https://admissions.msu.edu/apply
Michigan Technological University|171128|https://www.mtu.edu/admissions/|https://www.mtu.edu/admissions/apply/
Middle Tennessee State University|220978|https://www.mtsu.edu/how-to-apply/|https://www.mtsu.edu/applynow/
Middlebury College|230959|https://www.middlebury.edu/college/admissions|https://www.middlebury.edu/college/admissions/apply
Millersville University of Pennsylvania|214041|https://www.millersville.edu/admissions/|https://www.millersville.edu/admissions/undergrad/apply/index.php
Milwaukee School of Engineering|239318|https://www.msoe.edu/admissions-aid/|https://www.msoe.edu/visit-and-apply/
Minnesota State University, Mankato|173920|https://www.mnsu.edu/become-a-student/|https://mnsu.edu/future-students/apply/
Mississippi State University|176080|https://www.admissions.msstate.edu/|https://www.msstate.edu/future-students/apply
Missouri State University|179566|https://www.missouristate.edu/admissions/|https://www.missouristate.edu/futurestudents/applynow.aspx
Missouri University of Science and Technology|178411|https://futurestudents.mst.edu/|https://futurestudents.mst.edu/admissions/
Montana State University|180461|https://www.montana.edu/admissions/|
Montclair State University|185590|https://www.montclair.edu/admissions-aid|https://apply.montclair.edu/apply/
Morehouse College|140553|https://morehouse.edu/admissions|https://www.morehouse.edu/admissions/apply
Morgan State University|163453|https://www.morgan.edu/undergradadmissions|https://morgan.elluciancrmrecruit.com/Apply/Account/Login?ReturnUrl=%2fApply
Mount Holyoke College|166939|https://www.mtholyoke.edu/admission|https://www.mtholyoke.edu/admission/apply-undergraduate-first-year
Mount Saint Mary's University|119173|https://www.msmu.edu/admission--aid/|https://www.msmu.edu/admission/undergraduate-admission/application-instructions/
National University|119605|https://www.nu.edu/admissions/|https://www.nu.edu/Admissions/ApplyOnline.html
New College of Florida|262129|https://www.ncf.edu/admissions/|https://www.ncf.edu/admissions/first-year-students/
New England Conservatory|167057|https://necmusic.edu/apply|https://necmusic.edu/apply/how-to-apply
New Jersey Institute of Technology|185828|https://www.njit.edu/admissions|https://apply.njit.edu/
New Mexico Institute of Mining and Technology|187967|https://www.nmt.edu/admission/index.php|https://apply.nmt.edu/register/application_undergrad_admission
New Mexico State University|188030|https://admissions.nmsu.edu/|https://apply.nmsu.edu/apply/?sr=d972e8c0-90ae-4205-8352-b8d9017844e1
New York Institute of Technology|194091|https://www.nyit.edu/admissions/|https://www.nyit.edu/admissions/apply/
Norfolk State University|232937|https://www.nsu.edu/Admissions-Aid|https://www.nsu.edu/applyonline
North Carolina A&T State University|199102|https://www.ncat.edu/admissions/|
North Carolina Central University|199157|https://www.nccu.edu/admissions|https://www.nccu.edu/apply-now
North Carolina State University|199193|https://admissions.ncsu.edu/|https://admissions.ncsu.edu/apply/
North Dakota State University|200332|https://www.ndsu.edu/admission|https://www.ndsu.edu/admission/how_to_apply/application_process
Northeastern University|167358|https://www.northeastern.edu/admissions/|https://www.commonapp.org/
Northern Arizona University|105330|https://nau.edu/admissions/|https://nau.edu/how-to-apply
Northern Illinois University|147703|https://www.niu.edu/admissions-aid/|https://www.niu.edu/admissions/apply/index.shtml
Northern Kentucky University|157447|https://www.nku.edu/|
Northern Michigan University|171456|https://nmu.edu/admissions/|https://www.nmu.edu/admissions/apply
Northwestern University|147767|https://www.northwestern.edu/admissions/|https://www.northwestern.edu/admissions/
Northwood University|171492|https://www.northwood.edu/admissions/|
Notre Dame de Namur University|120184|https://www.ndnu.edu/admissions/|https://www.ndnu.edu/apply/
Nova Southeastern University|136215|https://www.nova.edu/|
Oakland University|171571|https://www.oakland.edu/futurestudents/|https://www.oakland.edu/futurestudents/apply/
Oberlin College|204501|https://www.oberlin.edu/admissions-and-aid/arts-and-sciences|https://apply.commonapp.org/Login?ma=187
Occidental College|120254|https://www.oxy.edu/admission-aid|https://www.oxy.edu/admission-aid/apply
Ohio Christian University|201964|https://www.ohiochristian.edu/campus-degrees/admissions|https://www.ohiochristian.edu/lp/fastapp
Ohio University|204857|https://www.ohio.edu/admissions/|https://www.ohio.edu/admissions/apply
Oklahoma State University|207388|https://admissions.okstate.edu/|https://admissions.okstate.edu/apply/
Old Dominion University|232982|https://www.odu.edu/admissions|https://www.odu.edu/admission/apply
Oregon State University|209542|https://admissions.oregonstate.edu/|
Oregon State University Ecampus|209542|https://admissions.oregonstate.edu/|
Pace University|194310|https://www.pace.edu/admission-and-aid|https://www.pace.edu/apply-now
Pacific Lutheran University|236230|https://www.plu.edu/admission/|https://www.plu.edu/admission/first-year/
Park University|178721|https://www.park.edu/admissions/|https://www.park.edu/apply/Index.html
Parsons School of Design (The New School)|193654|https://www.newschool.edu/admission/|https://www.newschool.edu/apply/
Penn State World Campus|479956|https://www.worldcampus.psu.edu/admissions|
Pennsylvania State University, University Park|214777|https://www.psu.edu/admission/undergraduate|https://admissions.psu.edu/apply/
Pepperdine University|121150|https://www.pepperdine.edu/admission/|https://seaver.pepperdine.edu/admission/application/undergraduate
Pitzer College|121257|https://www.pitzer.edu/admission-aid|
Plymouth State University|183080|https://www.plymouth.edu/admissions|https://www.plymouth.edu/apply
Point Loma Nazarene University|121309|https://www.pointloma.edu/admissions|https://www.pointloma.edu/UndergradAdmissions/ApplyNow.htm
Pomona College|121345|https://www.pomona.edu/admissions|https://www.pomona.edu/admissions/apply
Portland State University|209807|https://www.pdx.edu/admissions/|https://www.pdx.edu/undergraduate-admissions/freshman-how-when-to-apply
Post University|130183|https://www.post.edu/|https://www.post.edu/
Prairie View A&M University|227526|https://www.pvamu.edu/admissions/undergraduate/|https://www.applytexas.org/adappc/gen/c_start.WBX?s_logon_msg=Y
Pratt Institute|194578|https://www.pratt.edu/admissions/|https://www.pratt.edu/admissions/apply-to-pratt/
Princeton University|186131|https://www.princeton.edu/|
Providence College|217402|https://admission.providence.edu/|https://admission.providence.edu/apply/
Purdue University|243780|https://www.purdue.edu/purdue/admissions/|https://www.admissions.purdue.edu/apply/apply.php
Purdue University Global|489779|https://www.purdueglobal.edu/|
Purdue University Northwest|490805|https://www.pnw.edu/admissions-financial-aid/|https://www.pnw.edu/admissions-financial-aid/undergraduate/how-to-apply
Queens College (CUNY)|190664|https://www.qc.cuny.edu/admissions/|https://www2.cuny.edu/admissions/apply-to-cuny/
Quinnipiac University|130226|https://www.qu.edu/admissions|https://www.qu.edu/apply
Radford University|233277|https://www.radford.edu/admissions/|https://www.radford.edu/apply
Rasmussen University|138309|https://www.rasmussen.edu/|https://rasmussen.edu/
Reed College|209922|https://www.reed.edu/admission-aid/|https://www.reed.edu/apply/guide-to-applying/
Regis University|127918|https://www.regis.edu/admissions/|https://www.regis.edu/admissions/apply
Rensselaer Polytechnic Institute|194824|https://www.rpi.edu/|https://admissions.rpi.edu/undergraduate/admission/index.html
Rhode Island School of Design|217493|https://www.risd.edu/admissions|https://www.risd.edu/admissions/
Rhodes College|221351|https://www.rhodes.edu/admission-aid|
Rice University|227757|https://admission.rice.edu/|https://admission.rice.edu/apply
Rochester Institute of Technology|195003|https://www.rit.edu/admissions/|https://www.rit.edu/admissions/apply
Rollins College|136950|https://www.rollins.edu/apply/|https://www.rollins.edu/admission-aid/apply-now/
Roosevelt University|148487|https://www.roosevelt.edu/admission|https://applyru.roosevelt.edu/apply/
Rose-Hulman Institute of Technology|152318|https://www.rose-hulman.edu/admissions-and-aid/index.html|https://www.rose-hulman.edu/admissions-and-aid/the-application-process/application-and-deadlines/index.html
Rowan University|184782|https://admissions.rowan.edu/|https://admissions.rowan.edu/apply.html
Rutgers University-New Brunswick|186380|https://admissions.rutgers.edu/|https://admissions.rutgers.edu/apply
Rutgers University-Newark|186399|https://admissions.rutgers.edu/|https://admissions.rutgers.edu/apply
SUNY Brockport|196121|https://www.brockport.edu/admissions/|https://www.suny.edu/applysuny/
SUNY College of Environmental Science and Forestry|196103|https://www.esf.edu/admissions/|https://www.esf.edu//admissions/apply.php
SUNY Cortland|196149|https://www2.cortland.edu/admissions/|https://www2.cortland.edu/admissions/undergraduate/application-process.dot
SUNY Fredonia|196158|https://www.fredonia.edu/admissions-aid|https://www.fredonia.edu/admissions-aid/apply
SUNY Geneseo|196167|https://www.geneseo.edu/admissions|https://geneseo.edu/admissions/apply
SUNY Maritime College|196291|https://www.sunymaritime.edu/admissions|https://www.sunymaritime.edu/admissions/apply-now
SUNY New Paltz|196176|https://www.newpaltz.edu/admissions/|https://www.newpaltz.edu/admissions/apply.html
SUNY Old Westbury|196237|https://www.oldwestbury.edu/admissions/admissions|https://www.suny.edu/student/
SUNY Oneonta|196185|https://suny.oneonta.edu/admissions|https://suny.oneonta.edu/apply-now
SUNY Oswego|196194|https://ww1.oswego.edu/admissions|https://www.oswego.edu/admissions/apply-now
SUNY Plattsburgh|196246|https://www.plattsburgh.edu/admissions|https://www.plattsburgh.edu/apply/index.html
SUNY Polytechnic Institute|196112|https://www.sunypoly.edu/admissions.html|https://www.sunypoly.edu/admissions/apply.html
SUNY Potsdam|196200|https://www.potsdam.edu/admissions|https://www.suny.edu/student/apply_online.cfm
SUNY Purchase College|196219|https://www.purchase.edu/admissions/|https://www.purchase.edu/admissions/apply-to-purchase/
Sacred Heart University|130253|https://www.sacredheart.edu/admissions--aid/|https://www.sacredheart.edu/admissions--aid/undergraduate-admissions/
Saint Leo University|137032|https://www.saintleo.edu/student-experience/on-campus|https://www.saintleo.edu/worldwide-admissions
Saint Louis University|179159|https://www.slu.edu/admission/index.php|https://www.slu.edu/apply.php
Saint Martin's University|236452|https://www.stmartin.edu/admissions-financial-aid|https://www.stmartin.edu/admissions-aid/how-to-apply
Saint Mary's College of California|123554|https://www.stmarys-ca.edu/admissions-aid|https://www.stmarys-ca.edu/apply
Salem State University|167729|https://www.salemstate.edu/admissions|https://www.salemstate.edu/apply-now
Salisbury University|163851|https://www.salisbury.edu/admissions/|https://www.salisbury.edu/admissions/apply/
Sam Houston State University|227881|https://www.shsu.edu/admissions/|https://www.shsu.edu/admissions/apply-texas.html
Samford University|102049|https://www.samford.edu/admission/|https://www.samford.edu/admission/apply
San Diego State University|122409|https://www.sdsu.edu/|https://www2.calstate.edu/apply
San Francisco State University|122597|https://future.sfsu.edu/admissions|https://www2.calstate.edu/apply
San Jose State University|122755|https://www.sjsu.edu/admissions/|https://www2.calstate.edu/apply
Santa Clara University|122931|https://www.scu.edu/admission/|https://www.commonapp.org/
Sarah Lawrence College|195304|https://www.sarahlawrence.edu/admission/|https://www.sarahlawrence.edu/admission/apply/
Savannah College of Art and Design|140951|https://www.scad.edu/admission|https://www.scad.edu/admission/apply
Savannah State University|140960|https://www.savannahstate.edu/prospective-student/undergrad.shtml|https://www.gafutures.org/
School of the Art Institute of Chicago|143048|https://www.saic.edu/admissions/undergraduate|https://www.commonapp.org/
Scripps College|123165|https://www.scrippscollege.edu/admission/|https://www.commonapp.org/school/scripps-college
Seattle Pacific University|236577|https://spu.edu/undergraduate-admissions|https://spu.edu/undergraduate-admissions/apply
Seattle University|236595|https://www.seattleu.edu/|https://www.seattleu.edu/undergraduate-admissions/apply/
Seton Hall University|186584|https://www.shu.edu/undergraduate-admissions/|https://www.shu.edu/undergraduate-admissions/applying.html
Sewanee: The University of the South|221519|https://new.sewanee.edu/admission-aid/|
Shippensburg University of Pennsylvania|216010|https://www.ship.edu/admissions/|https://www.ship.edu/admissions/apply/
Siena College|195474|https://www.siena.edu/offices/admissions/|https://www.siena.edu/apply/
Simmons University|167783|https://www.simmons.edu/admission-aid|https://www.simmons.edu/undergraduate/admission-and-financial-aid/how-apply
Skidmore College|195526|https://www.skidmore.edu/admissions/|https://www.skidmore.edu/admissions/apply/index.php
Smith College|167835|https://www.smith.edu/admission-aid|https://www.smith.edu/admission-aid/how-apply/first-year-students
Sonoma State University|123572|https://admissions.sonoma.edu/|https://admissions.sonoma.edu/how-apply
South Dakota State University|219356|https://www.sdstate.edu/admissions|https://www.sdstate.edu/admissions/apply-now
Southeastern Louisiana University|160612|https://www.southeastern.edu/admissions-and-aid/|https://www.southeastern.edu/apply/
Southeastern University|137564|https://www.seu.edu/admission/|https://www.seu.edu/apply/
Southern Connecticut State University|130493|https://www.southernct.edu/admissions|https://www.southernct.edu/admissions/undergraduate/apply
Southern Illinois University Carbondale|149222|https://siu.edu/admissions/undergraduate/|https://admissions.siu.edu/apply
Southern Methodist University|228246|https://www.smu.edu/admission|https://www.smu.edu/Admission/Apply
Southern New Hampshire University|183026|https://www.snhu.edu/admission|https://www.snhu.edu/admission/apply-now
Southern Oregon University|210146|https://sou.edu/admissions/|https://sou.edu/admissions/apply/how-to-apply/
Southern University and A&M College|160621|https://www.subr.edu/subhome/153|https://www.subr.edu/page/about-southern-university-online
Southern Utah University|230603|https://www.suu.edu/admissions/?utm_source=prostu&utm_medium=htaccess&utm_campaign=redirect/|
Spelman College|141060|https://www.spelman.edu/admissions/|
St. Bonaventure University|195164|https://www.sbu.edu/admissions|https://www.sbu.edu/admissions/apply
St. Cloud State University|174783|https://www.stcloudstate.edu/scsu4u/default.aspx|https://www.stcloudstate.edu/apply/default.aspx
St. Edward's University|227845|https://www.stedwards.edu/admission|https://www.stedwards.edu/apply
St. John's University|195809|https://www.stjohns.edu/admission|https://www.stjohns.edu/admission-aid/apply-st-johns-university
St. Olaf College|174844|https://wp.stolaf.edu/admissions|https://wp.stolaf.edu/admissions/apply/
Stanford University|243744|https://admission.stanford.edu/|https://commonapp.org/
Stephen F. Austin State University|228431|https://www.sfasu.edu/admissions|https://www.sfasu.edu/admissions-and-aid
Stetson University|137546|https://www.stetson.edu/administration/admissions/|https://www.stetson.edu/administration/admissions/apply/
Stevens Institute of Technology|186867|https://www.stevens.edu/admission-aid/undergraduate-admissions/how-to-apply|https://www.stevens.edu/admission-aid/undergraduate-admissions/how-to-apply
Stockton University|186876|https://stockton.edu/admissions/index.html|https://stockton.edu/admissions/applications.html
Stony Brook University (SUNY)|196097|https://www.stonybrook.edu/undergraduate-admissions/|https://www.stonybrook.edu/undergraduate-admissions/apply/freshman/application-procedures/
Strayer University|459994|https://www.strayer.edu/admissions/how-to-apply|https://application.strayer.edu/
Suffolk University|168005|https://www.suffolk.edu/admission/|https://uga.suffolk.edu/apply/
Swarthmore College|216287|https://www.swarthmore.edu/admissions-aid|https://www.swarthmore.edu/admissions-aid/apply-to-swarthmore
Syracuse University|196413|https://www.syracuse.edu/admissions-aid/|https://www.syracuse.edu/admissions/apply/
Tarleton State University|228529|https://www.tarleton.edu/admissions/|
Temple University|216339|https://www.temple.edu/admissions|https://www.temple.edu/apply
Tennessee State University|221838|https://www.tnstate.edu/admissions/|https://www.tnstate.edu/admissions/apply.aspx
Tennessee Technological University|221847|https://www.tntech.edu/admissions/|https://www.tntech.edu/admissions/
Texas A&M University|228723|https://admissions.tamu.edu/|
Texas A&M University-Commerce|224554|https://www.etamu.edu/admissions/|https://www.applytexas.org/
Texas A&M University-Corpus Christi|224147|https://www.tamucc.edu/admissions/|https://www.tamucc.edu/admissions/apply.php
Texas Christian University|228875|https://admissions.tcu.edu/|https://admissions.tcu.edu/apply/
Texas Southern University|229063|https://www.tsu.edu/404.php|https://www.applytexas.org/
Texas State University|228459|https://www.txst.edu/admissions.html|
Texas Tech University|229115|https://www.ttu.edu/|https://www.depts.ttu.edu/admissions/apply/
Texas Woman's University|229179|https://twu.edu/admissions/|https://www.applytexas.org/
The Catholic University of America|131283|https://www.catholic.edu/admission|https://www.catholic.edu/admission/apply-now.html
The City College of New York (CUNY)|190567|https://www.ccny.cuny.edu/admissions|https://www.ccny.cuny.edu/admissions/applications
The College of New Jersey|187134|https://admissions.tcnj.edu/|https://admissions.tcnj.edu/apply/
The College of Wooster|206589|https://wooster.edu/admissions|https://wooster.edu/admissions/apply/
The Evergreen State College|235167|https://www.evergreen.edu/admissions-and-aid|https://www.evergreen.edu/admissions-and-aid
The Juilliard School|192110|https://www.juilliard.edu/admissions|https://apply.juilliard.edu/apply/
The Ohio State University|204796|https://undergrad.osu.edu/|https://undergrad.osu.edu/apply
The University of Alabama|100751|https://admissions.ua.edu/|https://apply.ua.edu/
The University of Tampa|137847|https://www.ut.edu/admissions|https://www.ut.edu/admissions/apply
Thomas Edison State University|187046|https://www.tesu.edu/admissions/|https://www.tesu.edu/apply
Towson University|164076|https://www.towson.edu/admissions/|https://www.towson.edu/admissions/undergrad/
Trinity College|130590|https://www.trincoll.edu/admissions/|https://www.trincoll.edu/admissions/undergraduate-admissions/application-process/
Troy University|102368|https://www.troy.edu/applications-admissions/index.html|https://www.troy.edu/applications-admissions/index.html
Tufts University|168148|https://admissions.tufts.edu/|https://www.commonapp.org/
Tulane University|160755|https://admission.tulane.edu/|https://admission.tulane.edu/apply
Tuskegee University|102377|https://www.tuskegee.edu/admissions/|
Union College|196866|https://www.union.edu/admissions|https://www.union.edu/admissions/apply/
University at Albany (SUNY)|196060|https://www.albany.edu/admissions|https://www.albany.edu/admissions.php
University at Buffalo (SUNY)|196088|https://www.buffalo.edu/admissions.html|https://admissions.buffalo.edu/apply/index.php
University of Akron|200800|https://www.uakron.edu/admissions/|https://www.uakron.edu/admissions/undergraduate/admission_procedures/index.dot
University of Alabama at Birmingham|100663|https://www.uab.edu/admissions/|https://www.uab.edu/admissions/apply
University of Alabama in Huntsville|100706|https://www.uah.edu/admissions|
University of Alaska Anchorage|102553|https://www.uaa.alaska.edu/admissions/|https://uaonline.alaska.edu/
University of Alaska Fairbanks|102614|https://www.uaf.edu/admissions/|https://uaf.edu/admissions/apply/#now
University of Arizona|104179|https://www.arizona.edu/admissions|https://slate.admissions.arizona.edu/apply
University of Arkansas|106397|https://admissions.uark.edu/|https://admissions.uark.edu/apply/
University of California, Berkeley|110635|https://admissions.berkeley.edu/|https://admission.universityofcalifornia.edu/apply-now.html
University of California, Davis|110644|https://www.ucdavis.edu/admissions|https://admission.universityofcalifornia.edu/apply-now.html
University of California, Irvine|110653|https://admissions.uci.edu/|https://admission.universityofcalifornia.edu/apply-now.html
University of California, Los Angeles|110662|https://www.ucla.edu/|https://admission.universityofcalifornia.edu/apply-now.html
University of California, Merced|445188|https://admissions.ucmerced.edu/|https://admission.universityofcalifornia.edu/apply-now.html
University of California, Riverside|110671|https://admissions.ucr.edu/|https://admission.universityofcalifornia.edu/apply-now.html
University of California, San Diego|110680|https://admissions.ucsd.edu/index.html|https://admission.universityofcalifornia.edu/apply-now.html
University of California, Santa Barbara|110705|https://admissions.sa.ucsb.edu/|https://admission.universityofcalifornia.edu/apply-now.html
University of California, Santa Cruz|110714|https://admissions.ucsc.edu/|https://admission.universityofcalifornia.edu/apply-now.html
University of Central Florida|132903|https://www.ucf.edu/admissions/|https://ucf.edu/admissions/undergraduate/
University of Chicago|144050|https://collegeadmissions.uchicago.edu/|https://collegeadmissions.uchicago.edu/apply/
University of Cincinnati|201885|https://www.admissions.uc.edu/|https://admissions.uc.edu/apply.html
University of Colorado Boulder|126614|https://www.colorado.edu/admissions|
University of Colorado Colorado Springs|126580|https://www.uccs.edu/apply|https://www.uccs.edu/admissionsenrollment/apply-uccs-today
University of Colorado Denver|126562|https://www.cudenver.edu/apply-now/admissions|https://www.ucdenver.edu/admissions/-apply-now
University of Connecticut|129020|https://admissions.uconn.edu/|https://admissions.uconn.edu/apply
University of Dayton|202480|https://udayton.edu/apply/|https://udayton.edu/apply/undergraduate/index.php
University of Delaware|130943|https://www.udel.edu/apply/undergraduate-admissions/|https://www.commonapp.org/explore/university-delaware
University of Denver|127060|https://www.du.edu/admission-aid/undergraduate|https://apply.commonapp.org/
University of Florida|134130|https://www.admissions.ufl.edu/|https://admissions.ufl.edu/apply/freshman
University of Florida Online|484473|https://admissions.ufl.edu/|https://www.ufonline.ufl.edu/admissions
University of Georgia|139959|https://admissions.uga.edu/|https://apply.uga.edu/apply/
University of Guam|240754|https://www.uog.edu/admissions/|https://www.uog.edu/admissions/apply-online
University of Hawaii at Hilo|141565|https://hilo.hawaii.edu/admissions/|
University of Hawaii at Manoa|141574|https://manoa.hawaii.edu/admissions/|https://manoa.hawaii.edu/admissions/apply/
University of Houston|225511|https://www.uh.edu/|https://uh.edu/undergraduate-admissions/apply/index
University of Idaho|142285|https://www.uidaho.edu/admissions-apply|https://www.uidaho.edu/admissions/apply
University of Illinois Chicago|145600|https://admissions.uic.edu/|https://www.admissions.uic.edu/apply-now
University of Illinois Springfield|148654|https://www.uis.edu/admission-aid|https://www.uis.edu/apply
University of Illinois Urbana-Champaign|145637|https://illinois.edu/admissions/|https://admissions.illinois.edu/apply
University of Indianapolis|151263|https://www.uindy.edu/admissions/|https://www.uindy.edu/admissions/apply-for-admission
University of Iowa|153658|https://admissions.uiowa.edu/|https://admissions.uiowa.edu/apply
University of Kansas|155317|https://admissions.ku.edu/|https://admissions.ku.edu/apply
University of Kentucky|157085|https://admission.uky.edu/|https://www.uky.edu/admission/apply-uk
University of La Verne|117140|https://laverne.edu/admission/|https://laverne.edu/apply/
University of Louisiana at Lafayette|160658|https://louisiana.edu/admissions-aid|https://louisiana.edu/admissions-aid/application-process
University of Louisville|157289|https://louisville.edu/admissions/|https://louisville.edu/admissions/apply/
University of Maine|161253|https://umaine.edu//|https://go.umaine.edu/apply/
University of Maryland Global Campus|163204|https://www.umgc.edu/admission|https://www.umgc.edu/admissions/steps-to-apply.cfm
University of Maryland, Baltimore County|163268|https://umbc.edu/admissions/undergraduate/|https://undergraduate.umbc.edu/apply/index.php
University of Maryland, College Park|163286|https://admissions.umd.edu/|https://www.admissions.umd.edu/apply/
University of Massachusetts Amherst|166629|https://www.umass.edu/admissions|https://www.commonapp.org/
University of Massachusetts Boston|166638|https://www.umb.edu/admissions/|https://www.umb.edu/admissions
University of Massachusetts Lowell|166513|https://www.uml.edu/admissions/|https://www.uml.edu/Admissions-Aid/Apply.aspx
University of Memphis|220862|https://www.memphis.edu/admissions/|https://www.memphis.edu/admissions/apply/index.php
University of Miami|135726|https://welcome.miami.edu/admissions/index.html|https://miami.edu/admission/index.php/undergraduate_admission/apply/
University of Michigan, Ann Arbor|170976|https://admissions.umich.edu/|https://admissions.umich.edu/apply
University of Minnesota Duluth|174233|https://admissions.d.umn.edu/undergraduate-admissions|https://admissions.d.umn.edu/undergraduate-admissions/apply
University of Minnesota, Twin Cities|174066|https://admissions.tc.umn.edu/|https://admissions.tc.umn.edu/apply/how-apply
University of Mississippi|176017|https://olemiss.edu/admissions/|https://www.olemiss.edu/applynow
University of Missouri|178396|https://admissions.missouri.edu/|https://admissions.missouri.edu/apply/
University of Missouri-Kansas City|178402|https://www.umkc.edu/admissions/|https://www.umkc.edu/admissions/apply/index.html
University of Montana|180489|https://www.umt.edu/admissions/|https://admissions.umt.edu/apply/default.php
University of Nebraska Kearney|181215|https://www.unk.edu/admissions/index.php|https://www.unk.edu/admissions/apply.php
University of Nebraska Omaha|181394|https://www.unomaha.edu/admissions/index.php|https://www.unomaha.edu/admissions/apply/index.php
University of Nebraska-Lincoln|181464|https://admissions.unl.edu/|https://admissions.unl.edu/apply/
University of Nevada, Las Vegas|182281|https://www.unlv.edu/admissions|https://www.unlv.edu/apply
University of Nevada, Reno|182290|https://www.unr.edu/admissions|https://www.unr.edu/apply
University of New Hampshire|183044|https://admissions.unh.edu/|https://www.commonapp.org/
University of New Mexico|187985|https://admissions.unm.edu/|https://www.unm.edu/apply/
University of North Carolina Wilmington|199218|https://www.uncw.edu/admissions/|https://www.uncw.edu/admissions/apply.html
University of North Carolina at Chapel Hill|199120|https://admissions.unc.edu/|https://www.admissions.unc.edu/Apply
University of North Carolina at Charlotte|199139|https://admissions.charlotte.edu/|https://admissions.charlotte.edu/apply
University of North Carolina at Greensboro|199148|https://admissions.uncg.edu/|https://admissions.uncg.edu/admissions/apply/
University of North Dakota|200280|https://und.edu/admissions/index.html|https://und.edu/admissions/apply.html
University of North Florida|136172|https://www.unf.edu/admissions/|https://www.unf.edu/apply/
University of North Texas|227216|https://www.unt.edu/admissions/index.html|https://apply.unt.edu/
University of Northern Colorado|127741|https://www.unco.edu/admissions-aid/|https://www.unco.edu/apply/
University of Northern Iowa|154095|https://admissions.uni.edu/|https://admissions.uni.edu/application
University of Notre Dame|152080|https://admissions.nd.edu/|https://www.commonapp.org/
University of Oklahoma|207500|https://www.ou.edu/admissions|https://www.ou.edu/admissions/apply
University of Oregon|209551|https://www.uoregon.edu/admissions/|https://admissions.uoregon.edu/apply
University of Pennsylvania|215062|https://www.upenn.edu/admissions/|https://www.admissions.upenn.edu/apply/
University of Pittsburgh|215293|https://admissions.pitt.edu/|https://pitt.mycollegeapplication.org/Login.aspx
University of Portland|209825|https://www.up.edu/admissions-aid/index.html|
University of Puerto Rico, Rio Piedras|243221|https://www.uprrp.edu/admisiones/|https://admisiones.upr.edu/
University of Puget Sound|236328|https://www.pugetsound.edu/admission|https://www.pugetsound.edu/admission/apply/
University of Redlands|121691|https://www.redlands.edu/admissions-and-aid/first-year|https://www.redlands.edu/admissions-and-aid/undergraduate/apply
University of Rhode Island|217484|https://web.uri.edu/admission/|https://web.uri.edu/admission
University of Rochester|195030|https://admissions.rochester.edu/|https://www.commonapp.org/explore/university-rochester
University of San Francisco|122612|https://www.usfca.edu/admission|https://www.usfca.edu/admission/undergraduate/apply
University of South Alabama|102094|https://www.southalabama.edu/departments/admissions/|https://www.southalabama.edu/departments/admissions/applytousa.html
University of South Carolina|218663|https://sc.edu/about/offices_and_divisions/undergraduate_admissions/|https://www.sc.edu/apply/index.php
University of South Dakota|219471|https://www.usd.edu/Admissions-and-Aid|https://www.usd.edu/Admissions-and-Aid/Apply
University of South Florida|137351|https://www.usf.edu/admissions/|https://admissions.usf.edu/application
University of Southern California|123961|https://admission.usc.edu/|https://www.commonapp.org/
University of Southern Maine|161554|https://usm.maine.edu/office-of-admissions/|https://usm.maine.edu/office-of-admissions/apply
University of Southern Mississippi|176372|https://www.usm.edu/admissions/|https://www.usm.edu/admissions/index.php
University of St. Thomas (Texas)|227863|https://stthom.edu/|https://myust.stthom.edu/apply/
University of Tennessee, Knoxville|221759|https://admissions.utk.edu/|https://vip.utk.edu/
University of Texas Permian Basin|229018|https://www.utpb.edu/admissions-aid/|https://www.utpb.edu/admissions/apply-now!
University of Texas Rio Grande Valley|227368|https://www.utrgv.edu/|https://www.applytexas.org/
University of Texas at Arlington|228769|https://www.uta.edu/admissions|https://www.applytexas.org/
University of Texas at Austin|228778|https://admissions.utexas.edu/|https://www.utexas.edu/apply
University of Texas at El Paso|228796|https://www.utep.edu/admissions/|https://www.applytexas.org/
University of Texas at San Antonio|229027|https://future.utsa.edu/|https://www.applytexas.org/
University of Toledo|206084|https://www.utoledo.edu/admission/|https://www.utoledo.edu/admission/apply/index.html
University of Utah|230764|https://admissions.utah.edu/|https://admissions.utah.edu/apply/
University of Vermont|231174|https://www.uvm.edu/admissions|https://www.uvm.edu/admissions/undergraduate/first_year_applicants
University of Virginia|234076|https://admission.virginia.edu/|https://www.virginia.edu/apply
University of Washington|236948|https://admit.washington.edu/|https://admit.washington.edu/apply/
University of Wisconsin-Eau Claire|240268|https://www.uwec.edu/apply|https://apply.wisconsin.edu/
University of Wisconsin-La Crosse|240329|https://www.uwlax.edu/admissions/|https://apply.wisconsin.edu/
University of Wisconsin-Madison|240444|https://admissions.wisc.edu/|https://www.commonapp.org/
University of Wisconsin-Milwaukee|240453|https://uwm.edu/admission/|https://apply.wisconsin.edu/
University of Wisconsin-Oshkosh|240365|https://www.uwosh.edu/admissions/|https://apply.wisconsin.edu/
University of Wyoming|240727|https://www.uwyo.edu/admissions/|https://www.uwyo.edu/admissions/apply.html
University of the Pacific|120883|https://www.pacific.edu/admission|https://www.pacific.edu/admission/undergraduate
Utah State University|230728|https://www.usu.edu/admissions/|https://www.usu.edu/admissions/apply/
Utah Valley University|230737|https://www.uvu.edu/welcome/|https://www.uvu.edu/welcome/
Valparaiso University|152600|https://www.valpo.edu/admission-aid/|https://www.valpo.edu/apply-to-valpo/
Vanderbilt University|221999|https://admissions.vanderbilt.edu/|https://admissions.vanderbilt.edu/apply/
Vanguard University|123651|https://www.vanguard.edu/admissions/undergraduate|https://www.vanguard.edu/admissions/undergraduate/how-to-apply
Vassar College|197133|https://www.vassar.edu/admission|https://www.vassar.edu/admission/apply/how-to-apply/
Villanova University|216597|https://www.villanova.edu/university/undergraduate-admission.html|https://www1.villanova.edu/university/apply.html
Virginia Commonwealth University|234030|https://www.vcu.edu/admissions/|https://www.vcu.edu/admissions/apply/
Virginia State University|234155|https://www.vsu.edu/admissions/|https://www.vsu.edu/admissions/apply/freshman-apply/index.php
Virginia Tech|233921|https://www.vt.edu/admissions/undergraduate-new.html|https://vt.edu/apply.html
Wake Forest University|199847|https://admissions.wfu.edu/|https://admissions.wfu.edu/
Washington State University|236939|https://admission.wsu.edu/|https://futurecoug.wsu.edu/portal/apply
Washington University in St. Louis|179867|https://admissions.washu.edu/|https://admissions.wustl.edu/
Wayne State University|172644|https://wayne.edu/admissions|https://wayne.edu/apply
Weber State University|230782|https://www.weber.edu/admissions/|https://www.weber.edu/Admissions/apply.html
Wellesley College|168218|https://www.wellesley.edu/admission-aid|https://www.wellesley.edu/admission/apply
Wentworth Institute of Technology|168227|https://wit.edu/admissions|https://wit.edu/admissions/apply-now
Wesleyan University|130697|https://www.wesleyan.edu/admission/|https://www.wesleyan.edu/admission/apply/application-process.html
West Chester University of Pennsylvania|216764|https://www.wcupa.edu/_admissions/sch_adm/|https://www.wcupa.edu/_admissions/SCH_ADM/admissionApp.aspx
West Texas A&M University|229814|https://www.wtamu.edu/admissions/|https://www.wtamu.edu/admissions/apply/index.html
West Virginia University|238032|https://www.wvu.edu/admissions/undergraduate/|https://admissions.wvu.edu/how-to-apply
Western Connecticut State University|130776|https://www.wcsu.edu/admissions/|https://www.wcsu.edu/admissions/application/
Western Governors University|433387|https://www.wgu.edu/admissions.html|https://inquiryv4.wgu.edu/?step=letsgetstarted
Western Illinois University|149772|https://www.wiu.edu/admissions/|https://www.wiu.edu/admissions/apply_now/
Western Kentucky University|157951|https://www.wku.edu/admissions/|https://www.wku.edu/admissions/
Western Michigan University|172699|https://wmich.edu/admissions|https://wmich.edu/apply/
Western Oregon University|210429|https://wou.edu/admission/|https://wou.edu/admission/apply/
Western Washington University|237011|https://admissions.wwu.edu/|https://admissions.wwu.edu/apply
Westfield State University|168263|https://www.westfield.ma.edu/admissions|https://connect.westfield.ma.edu/apply/
Wheaton College|149781|https://www.wheaton.edu/undergraduate-admissions/|https://www.wheaton.edu/admissions-and-aid/apply-to-wheaton-college/
Whitman College|237057|https://www.whitman.edu/admission-and-aid|https://www.whitman.edu/admission-and-aid/applying-to-whitman
Whittier College|125763|https://www.whittier.edu/admission|https://www.commonapp.org/school/whittier-college
Whitworth University|237066|https://www.whitworth.edu/cms/administration/admissions/|https://www.whitworth.edu/apply-now
Wichita State University|156125|https://www.wichita.edu/admissions/index.php|
Willamette University|210401|https://willamette.edu/admissions/|https://www.commonapp.org/
William & Mary|231624|https://www.wm.edu/admission/|https://www.wm.edu/admission/
Williams College|168342|https://www.williams.edu/admission-aid/|https://www.williams.edu/admission-aid/apply-overview/
Winston-Salem State University|199999|https://www.wssu.edu/admissions/index.html|
Winthrop University|218964|https://www.winthrop.edu/admissions/|https://www.winthrop.edu/apply-now.aspx
Woodbury University|125897|https://woodbury.edu/admissions/|https://woodbury.edu/admissions/undergraduate-admission/how-to-apply/
Worcester Polytechnic Institute|168421|https://www.wpi.edu/admissions|https://www.wpi.edu/admissions/undergraduate/apply/how-to
Wright State University|206604|https://www.wright.edu/admissions|https://go.wright.edu/portal/applytoday
Xavier University|206622|https://www.xavier.edu/admission/|https://www.xavier.edu/admission/apply.cfm
Xavier University of Louisiana|160904|https://www.xula.edu/admissions/index.html|https://www.xula.edu/apply/index.html
Yale University|130794|https://admissions.yale.edu/|https://admissions.yale.edu/first-year-application-process
York College (CUNY)|190691|https://www.york.cuny.edu/admissions|
`.trim();
