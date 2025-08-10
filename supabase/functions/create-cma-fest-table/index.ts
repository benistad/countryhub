/*
  # Create CMA FEST Artists Table Function
  
  Crée la table cma_fest_artists et insère tous les artistes du fichier CSV vérifié
  Utilise uniquement les méthodes standard du client Supabase
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Données des artistes du fichier YT CHANNELS VERIFIED.csv
const ARTISTS_DATA = [
  { name: "2nd Marine Aircraft Wing Band", youtube_url: "https://www.youtube.com/@2ndmarineaircraftwingband", is_official: false },
  { name: "Aaron Goodvin", youtube_url: "https://www.youtube.com/@AaronGoodvin", is_official: true },
  { name: "Abbey Cone", youtube_url: "https://www.youtube.com/@abbeycone", is_official: false },
  { name: "Abbie Callahan", youtube_url: "https://www.youtube.com/@abbiecallahan", is_official: false },
  { name: "Abbie Ferris", youtube_url: "https://www.youtube.com/@abbieferris", is_official: false },
  { name: "Abby Christo", youtube_url: "https://www.youtube.com/@abbychristo", is_official: false },
  { name: "Adrien Nunez", youtube_url: "https://www.youtube.com/@adriennunez", is_official: false },
  { name: "Akon", youtube_url: "https://www.youtube.com/@akon", is_official: true },
  { name: "Alana Springsteen", youtube_url: "https://www.youtube.com/@alanaspringsteen", is_official: true },
  { name: "Alannah McCready", youtube_url: "https://www.youtube.com/@alannahmccready", is_official: false },
  { name: "Alex Lambert", youtube_url: "https://www.youtube.com/@alexlambert", is_official: false },
  { name: "Alexandra Kay", youtube_url: "https://www.youtube.com/@alexandrakaymusic", is_official: true },
  { name: "Alli Walker", youtube_url: "https://www.youtube.com/@AlliWalkerMusic", is_official: true },
  { name: "Allie Colleen", youtube_url: "https://www.youtube.com/@AllieColleen", is_official: true },
  { name: "Amanda Kate Ferris", youtube_url: "https://www.youtube.com/@amandakateferris", is_official: false },
  { name: "Amber Anderson", youtube_url: "https://www.youtube.com/@amberanderson", is_official: false },
  { name: "American Blonde", youtube_url: "https://www.youtube.com/@americanblonde", is_official: false },
  { name: "Andy Griggs", youtube_url: "https://www.youtube.com/@andygriggs", is_official: false },
  { name: "Angel White", youtube_url: "https://www.youtube.com/@angelwhite", is_official: false },
  { name: "Angie K", youtube_url: "https://www.youtube.com/@angiek", is_official: false },
  { name: "Angie Rey", youtube_url: "https://www.youtube.com/@angierey", is_official: false },
  { name: "Aniston Pate", youtube_url: "https://www.youtube.com/@anistonpate", is_official: false },
  { name: "Annie Bosko", youtube_url: "https://www.youtube.com/@anniebosko", is_official: false },
  { name: "Anslee Davidson", youtube_url: "https://www.youtube.com/@ansleedavidson", is_official: false },
  { name: "Ashland Craft", youtube_url: "https://www.youtube.com/@ashlandcraft", is_official: false },
  { name: "Ashley Anne", youtube_url: "https://www.youtube.com/@ashleyanne", is_official: false },
  { name: "Ashley Cooke", youtube_url: "https://www.youtube.com/@ashleycooke", is_official: false },
  { name: "Ashley Kutcher", youtube_url: "https://www.youtube.com/@ashleykutcher", is_official: false },
  { name: "Ashley McBryde", youtube_url: "https://www.youtube.com/@AshleyMcBryde", is_official: true },
  { name: "Ashley Ryan", youtube_url: "https://www.youtube.com/@ashleyryan", is_official: false },
  { name: "Austin Brown", youtube_url: "https://www.youtube.com/@austinbrown", is_official: false },
  { name: "Austin Snell", youtube_url: "https://www.youtube.com/@AustinSnellMusic", is_official: true },
  { name: "Austin Williams", youtube_url: "https://www.youtube.com/@austinwilliams", is_official: false },
  { name: "Avery Anna", youtube_url: "https://www.youtube.com/@averyanna", is_official: false },
  { name: "Bailey Zimmerman", youtube_url: "https://www.youtube.com/@BaileyZimmerman", is_official: true },
  { name: "The Band Perry", youtube_url: "https://www.youtube.com/@TheBandPerry", is_official: true },
  { name: "Baylen Leonard", youtube_url: "https://www.youtube.com/@baylenleonard", is_official: false },
  { name: "Becca Bowen", youtube_url: "https://www.youtube.com/@beccabowen", is_official: false },
  { name: "Belles", youtube_url: "https://www.youtube.com/@belles", is_official: false },
  { name: "Ben Ford", youtube_url: "https://www.youtube.com/@benford", is_official: false },
  { name: "Bigg Vinny", youtube_url: "https://www.youtube.com/@biggvinny", is_official: false },
  { name: "BigXthaPlug", youtube_url: "https://www.youtube.com/@bigxthaplug", is_official: false },
  { name: "Billie Jo Jones", youtube_url: "https://www.youtube.com/@billiejojones", is_official: false },
  { name: "Billy Dean", youtube_url: "https://www.youtube.com/@billydean", is_official: false },
  { name: "Blake O'Connor", youtube_url: "https://www.youtube.com/@blakeoconnor", is_official: false },
  { name: "Blake Shelton", youtube_url: "https://www.youtube.com/@BlakeShelton", is_official: true },
  { name: "Blake Whiten", youtube_url: "https://www.youtube.com/@blakewhiten", is_official: false },
  { name: "Blanco Brown", youtube_url: "https://www.youtube.com/@blancobrown", is_official: true },
  { name: "Blessing Offor", youtube_url: "https://www.youtube.com/@BlessingOffor", is_official: true },
  { name: "BODHI", youtube_url: "https://www.youtube.com/@bodhi", is_official: false },
  { name: "Boomtown Saints", youtube_url: "https://www.youtube.com/@boomtownsaints", is_official: false },
  { name: "Brad Lee Schroeder", youtube_url: "https://www.youtube.com/@bradleeschroeder", is_official: false },
  { name: "Bradley Gaskin", youtube_url: "https://www.youtube.com/@bradleygaskin", is_official: false },
  { name: "Branch & Dean", youtube_url: "https://www.youtube.com/@branchanddean", is_official: false },
  { name: "Brandon Lake", youtube_url: "https://www.youtube.com/@brandonlake", is_official: true },
  { name: "Brandon Ratcliff", youtube_url: "https://www.youtube.com/@brandonratcliff", is_official: false },
  { name: "Brandon Wisham", youtube_url: "https://www.youtube.com/@brandonwisham", is_official: false },
  { name: "Braxton Keith", youtube_url: "https://www.youtube.com/@braxtonkeith", is_official: false },
  { name: "Bree Taylor", youtube_url: "https://www.youtube.com/@breetaylor", is_official: false },
  { name: "Brei Carter", youtube_url: "https://www.youtube.com/@breicarter", is_official: false },
  { name: "Brendan Walter", youtube_url: "https://www.youtube.com/@brendanwalter", is_official: false },
  { name: "Brenn!", youtube_url: "https://www.youtube.com/@brenn", is_official: false },
  { name: "Brian Fuller", youtube_url: "https://www.youtube.com/@brianfuller", is_official: false },
  { name: "Brian Schwake", youtube_url: "https://www.youtube.com/@brianschwake", is_official: false },
  { name: "Bridgette Tatum", youtube_url: "https://www.youtube.com/@bridgettetatum", is_official: false },
  { name: "Brinley Addington", youtube_url: "https://www.youtube.com/@brinleyaddington", is_official: false },
  { name: "Britnee Kellogg", youtube_url: "https://www.youtube.com/@britneekellogg", is_official: false },
  { name: "Brittany Elise", youtube_url: "https://www.youtube.com/@brittanyelise", is_official: false },
  { name: "Brook Ellingworth", youtube_url: "https://www.youtube.com/@brookellingworth", is_official: false },
  { name: "Brooke Eden", youtube_url: "https://www.youtube.com/@brookeeden", is_official: false },
  { name: "Brooks & Dunn", youtube_url: "https://www.youtube.com/@BrooksAndDunn", is_official: true },
  { name: "Brooks Herring", youtube_url: "https://www.youtube.com/@brooksherring", is_official: false },
  { name: "Bryan Ruby", youtube_url: "https://www.youtube.com/@bryanruby", is_official: false },
  { name: "Bryan White", youtube_url: "https://www.youtube.com/@bryanwhite", is_official: false },
  { name: "Bryce Leatherwood", youtube_url: "https://www.youtube.com/@bryceleatherwood", is_official: false },
  { name: "Caleb Lee Hutchinson", youtube_url: "https://www.youtube.com/@calebleehutchinson", is_official: false },
  { name: "Callie Gullickson", youtube_url: "https://www.youtube.com/@calliegullickson", is_official: false },
  { name: "Callum Kerr", youtube_url: "https://www.youtube.com/@callumkerr", is_official: false },
  { name: "Cameron Whitcomb", youtube_url: "https://www.youtube.com/@cameronwhitcomb", is_official: false },
  { name: "Canaan Smith", youtube_url: "https://www.youtube.com/@canaansmith", is_official: false },
  { name: "Carín León", youtube_url: "https://www.youtube.com/@carnlen", is_official: false },
  { name: "Carly Pearce", youtube_url: "https://www.youtube.com/@CarlyPearce", is_official: true },
  { name: "Carson Wallace", youtube_url: "https://www.youtube.com/@carsonwallace", is_official: false },
  { name: "Carter Faith", youtube_url: "https://www.youtube.com/@carterfaith", is_official: false },
  { name: "Casey Barnes", youtube_url: "https://www.youtube.com/@caseybarnes", is_official: false },
  { name: "Cassidy Daniels", youtube_url: "https://www.youtube.com/@cassidydaniels", is_official: false },
  { name: "Caterina Mete", youtube_url: "https://www.youtube.com/@caterinamete", is_official: false },
  { name: "CeCe", youtube_url: "https://www.youtube.com/@cece", is_official: false },
  { name: "Celeste Kellogg", youtube_url: "https://www.youtube.com/@celestekellogg", is_official: false },
  { name: "Chad Brock", youtube_url: "https://www.youtube.com/@chadbrock", is_official: false },
  { name: "Chandler Marie", youtube_url: "https://www.youtube.com/@chandlermarie", is_official: false },
  { name: "Chandler Walters", youtube_url: "https://www.youtube.com/@chandlerwalters", is_official: false },
  { name: "Charles Esten", youtube_url: "https://www.youtube.com/@charlesesten", is_official: false },
  { name: "Charlie Worsham", youtube_url: "https://www.youtube.com/@charlieworsham", is_official: false },
  { name: "Charly Reynolds", youtube_url: "https://www.youtube.com/@charlyreynolds", is_official: false },
  { name: "Chase McDaniel", youtube_url: "https://www.youtube.com/@chasemcdaniel", is_official: false },
  { name: "Chris Blair", youtube_url: "https://www.youtube.com/@chrisblair", is_official: false },
  { name: "Chris Ferrara", youtube_url: "https://www.youtube.com/@chrisferrara", is_official: false },
  { name: "Chris Lane", youtube_url: "https://www.youtube.com/@chrislane", is_official: false },
  { name: "Chris Weaver", youtube_url: "https://www.youtube.com/@chrisweaver", is_official: false },
  { name: "Chrissy Metz", youtube_url: "https://www.youtube.com/@chrissymetz", is_official: false },
  { name: "Christian Hayes", youtube_url: "https://www.youtube.com/@christianhayes", is_official: false },
  { name: "Christina Bosch", youtube_url: "https://www.youtube.com/@christinabosch", is_official: false },
  { name: "Christina Eagle", youtube_url: "https://www.youtube.com/@christinaeagle", is_official: false },
  { name: "Chuck Wicks", youtube_url: "https://www.youtube.com/@chuckwicks", is_official: false },
  { name: "CJ Solar", youtube_url: "https://www.youtube.com/@cjsolar", is_official: false },
  { name: "Clark Hill", youtube_url: "https://www.youtube.com/@clarkhill", is_official: false },
  { name: "Clay Walker", youtube_url: "https://www.youtube.com/@claywalker", is_official: false },
  { name: "Clayton Mullen", youtube_url: "https://www.youtube.com/@claytonmullen", is_official: false },
  { name: "Cliff Dorsey", youtube_url: "https://www.youtube.com/@cliffdorsey", is_official: false },
  { name: "Cody Bradley", youtube_url: "https://www.youtube.com/@codybradley", is_official: false },
  { name: "Cody Johnson", youtube_url: "https://www.youtube.com/@CodyJohnson", is_official: true },
  { name: "Coffey Anderson", youtube_url: "https://www.youtube.com/@coffeyanderson", is_official: false },
  { name: "Colbie Caillat", youtube_url: "https://www.youtube.com/@colbiecaillat", is_official: true },
  { name: "Cole Goodwin", youtube_url: "https://www.youtube.com/@colegoodwin", is_official: false },
  { name: "Cole Swindell", youtube_url: "https://www.youtube.com/@ColeSwindell", is_official: true },
  { name: "Colin Stough", youtube_url: "https://www.youtube.com/@colinstough", is_official: false },
  { name: "Colt Graves", youtube_url: "https://www.youtube.com/@coltgraves", is_official: false },
  { name: "Conner Smith", youtube_url: "https://www.youtube.com/@connersmith", is_official: false },
  { name: "Connor Daly", youtube_url: "https://www.youtube.com/@connordaly", is_official: false },
  { name: "Cooper Alan", youtube_url: "https://www.youtube.com/@cooperalan", is_official: true },
  { name: "Corey Jones", youtube_url: "https://www.youtube.com/@coreyjones", is_official: false },
  { name: "Cornbread", youtube_url: "https://www.youtube.com/@cornbread", is_official: false },
  { name: "Cowboy Troy", youtube_url: "https://www.youtube.com/@cowboytroy", is_official: true },
  { name: "Craig Campbell", youtube_url: "https://www.youtube.com/@craigcampbell", is_official: true },
  { name: "Craig Wayne Boyd", youtube_url: "https://www.youtube.com/@craigwayneboyd", is_official: false },
  { name: "Crowe Boys", youtube_url: "https://www.youtube.com/@croweboys", is_official: false },
  { name: "Cynthia Renee", youtube_url: "https://www.youtube.com/@cynthiarenee", is_official: false },
  { name: "Dailey & Vincent", youtube_url: "https://www.youtube.com/@daileyandvincent", is_official: false },
  { name: "Dani Rose", youtube_url: "https://www.youtube.com/@danirose", is_official: false },
  { name: "Daniel Jeffers", youtube_url: "https://www.youtube.com/@danieljeffers", is_official: false },
  { name: "Danielle Bradbery", youtube_url: "https://www.youtube.com/@DanielleBradbery", is_official: true },
  { name: "Dariann Leigh", youtube_url: "https://www.youtube.com/@dariannleigh", is_official: false },
  { name: "Darius Rucker", youtube_url: "https://www.youtube.com/@DariusRucker", is_official: true },
  { name: "Darryl Worley", youtube_url: "https://www.youtube.com/@darrylworley", is_official: false },
  { name: "Dasha", youtube_url: "https://www.youtube.com/@dasha", is_official: false },
  { name: "Dave Wilbert", youtube_url: "https://www.youtube.com/@davewilbert", is_official: false },
  { name: "David Nail", youtube_url: "https://www.youtube.com/@davidnail", is_official: false },
  { name: "Davis Loose", youtube_url: "https://www.youtube.com/@davisloose", is_official: false },
  { name: "Dawson Anderson", youtube_url: "https://www.youtube.com/@dawsonanderson", is_official: false },
  { name: "Deana Carter", youtube_url: "https://www.youtube.com/@deanacarter", is_official: false },
  { name: "Delanie Walker", youtube_url: "https://www.youtube.com/@delaniewalker", is_official: false },
  { name: "Devon Beck", youtube_url: "https://www.youtube.com/@devonbeck", is_official: false },
  { name: "Dierks Bentley", youtube_url: "https://www.youtube.com/@DierksBentley", is_official: true },
  { name: "Dillon Carmichael", youtube_url: "https://www.youtube.com/@dilloncarmichael", is_official: false },
  { name: "Dillon Weldon", youtube_url: "https://www.youtube.com/@dillonweldon", is_official: false },
  { name: "Dirty Grass Soul", youtube_url: "https://www.youtube.com/@dirtygrasssoul", is_official: false },
  { name: "Drake Milligan", youtube_url: "https://www.youtube.com/@drakemilligan", is_official: false },
  { name: "Drew Baldridge", youtube_url: "https://www.youtube.com/@drewbaldridge", is_official: false },
  { name: "Dustin Devine", youtube_url: "https://www.youtube.com/@dustindevine", is_official: false },
  { name: "Dustin Lynch", youtube_url: "https://www.youtube.com/@DustinLynch", is_official: true },
  { name: "Dustin Wade", youtube_url: "https://www.youtube.com/@dustinwade", is_official: false },
  { name: "Dylan Marlowe", youtube_url: "https://www.youtube.com/@dylanmarlowe", is_official: false },
  { name: "Dylan Schneider", youtube_url: "https://www.youtube.com/@dylanschneider", is_official: false },
  { name: "Dylan Scott", youtube_url: "https://www.youtube.com/@DylanScott", is_official: true },
  { name: "Dylan Wright", youtube_url: "https://www.youtube.com/@dylanwright", is_official: false },
  { name: "Ed Earl", youtube_url: "https://www.youtube.com/@edearl", is_official: false },
  { name: "Eddie and the Getaway", youtube_url: "https://www.youtube.com/@eddieandthegetaway", is_official: false },
  { name: "Edwin McCain", youtube_url: "https://www.youtube.com/@edwinmccain", is_official: false },
  { name: "Eli Winders", youtube_url: "https://www.youtube.com/@eliwinders", is_official: false },
  { name: "Elizabeth Nichols", youtube_url: "https://www.youtube.com/@elizabethnichols", is_official: false },
  { name: "Ella Langley", youtube_url: "https://www.youtube.com/@ellalangley", is_official: false },
  { name: "Emily Ann Roberts", youtube_url: "https://www.youtube.com/@emilyannroberts", is_official: false },
  { name: "Emmet Stevens Jr.", youtube_url: "https://www.youtube.com/@emmetstevensjr", is_official: false },
  { name: "Eric Atkinson", youtube_url: "https://www.youtube.com/@ericatkinson", is_official: false },
  { name: "Eric Burgett", youtube_url: "https://www.youtube.com/@ericburgett", is_official: false },
  { name: "Eric Ethridge", youtube_url: "https://www.youtube.com/@ericethridge", is_official: false },
  { name: "Erin Kinsey", youtube_url: "https://www.youtube.com/@erinkinsey", is_official: false },
  { name: "Erin Oprea", youtube_url: "https://www.youtube.com/@erinoprea", is_official: false },
  { name: "Exile", youtube_url: "https://www.youtube.com/@exile", is_official: false },
  { name: "Fancy Hagood", youtube_url: "https://www.youtube.com/@fancyhagood", is_official: false },
  { name: "Felicity Kircher", youtube_url: "https://www.youtube.com/@felicitykircher", is_official: false },
  { name: "Frank Ray", youtube_url: "https://www.youtube.com/@frankray", is_official: false },
  { name: "Frankie Ballard", youtube_url: "https://www.youtube.com/@frankieballard", is_official: false },
  { name: "Franni Cash", youtube_url: "https://www.youtube.com/@frannicash", is_official: false },
  { name: "Gabby Barrett", youtube_url: "https://www.youtube.com/@GabbyBarrett", is_official: true },
  { name: "Garrett Bradford", youtube_url: "https://www.youtube.com/@garrettbradford", is_official: false },
  { name: "Garrett Miles", youtube_url: "https://www.youtube.com/@garrettmiles", is_official: false },
  { name: "Gary LeVox", youtube_url: "https://www.youtube.com/@GaryLeVox", is_official: true },
  { name: "Gavin Adcock", youtube_url: "https://www.youtube.com/@gavinadcock", is_official: false },
  { name: "George Birge", youtube_url: "https://www.youtube.com/@georgebirge", is_official: false },
  { name: "Giovannie and the Hired Guns", youtube_url: "https://www.youtube.com/@giovannieandthehiredguns", is_official: false },
  { name: "Grace Tyler", youtube_url: "https://www.youtube.com/@gracetyler", is_official: false },
  { name: "Gracee Shriver", youtube_url: "https://www.youtube.com/@graceeshriver", is_official: false },
  { name: "Grady Keenan", youtube_url: "https://www.youtube.com/@gradykeenan", is_official: false },
  { name: "Graham Barham", youtube_url: "https://www.youtube.com/@grahambarham", is_official: false },
  { name: "Grayson Russell", youtube_url: "https://www.youtube.com/@graysonrussell", is_official: false },
  { name: "Grayson Torrence", youtube_url: "https://www.youtube.com/@graysontorrence", is_official: false },
  { name: "Greg Pratt", youtube_url: "https://www.youtube.com/@gregpratt", is_official: false },
  { name: "Greylan James", youtube_url: "https://www.youtube.com/@greylanjames", is_official: false },
  { name: "Gyth Rigdon", youtube_url: "https://www.youtube.com/@gythrigdon", is_official: false },
  { name: "Hailey Benedict", youtube_url: "https://www.youtube.com/@haileybenedict", is_official: false },
  { name: "Hannah Dasher", youtube_url: "https://www.youtube.com/@hannahdasher", is_official: false },
  { name: "Hannah McFarland", youtube_url: "https://www.youtube.com/@hannahmcfarland", is_official: false },
  { name: "Harper Grace", youtube_url: "https://www.youtube.com/@harpergrace", is_official: false },
  { name: "Harper O'Neill", youtube_url: "https://www.youtube.com/@harperoneill", is_official: false },
  { name: "Hayden Blount", youtube_url: "https://www.youtube.com/@haydenblount", is_official: false },
  { name: "Hayden Coffman", youtube_url: "https://www.youtube.com/@haydencoffman", is_official: false },
  { name: "Heather Victorino", youtube_url: "https://www.youtube.com/@heathervictorino", is_official: false },
  { name: "The Heels", youtube_url: "https://www.youtube.com/@theheels", is_official: false },
  { name: "Hillary Reese", youtube_url: "https://www.youtube.com/@hillaryreese", is_official: false },
  { name: "Homegrown Trio", youtube_url: "https://www.youtube.com/@homegrowntrio", is_official: false },
  { name: "Hope Blanchard", youtube_url: "https://www.youtube.com/@hopeblanchard", is_official: false },
  { name: "Hudson Westbrook", youtube_url: "https://www.youtube.com/@hudsonwestbrook", is_official: false },
  { name: "Hueston", youtube_url: "https://www.youtube.com/@hueston", is_official: false },
  { name: "Hugh Phillips", youtube_url: "https://www.youtube.com/@hughphillips", is_official: false },
  { name: "Iam Tongi", youtube_url: "https://www.youtube.com/@iamtongi", is_official: false },
  { name: "Ian Abel", youtube_url: "https://www.youtube.com/@ianabel", is_official: false },
  { name: "Ian Flanigan", youtube_url: "https://www.youtube.com/@ianflanigan", is_official: false },
  { name: "Ian Munsick", youtube_url: "https://www.youtube.com/@IanMunsick", is_official: true },
  { name: "Ira Dean", youtube_url: "https://www.youtube.com/@iradean", is_official: false },
  { name: "The Jack Wharff Band", youtube_url: "https://www.youtube.com/@thejackwharffband", is_official: false },
  { name: "Jackson Dean", youtube_url: "https://www.youtube.com/@jacksondean", is_official: false },
  { name: "Jade Eagleson", youtube_url: "https://www.youtube.com/@jadeeagleson", is_official: false },
  { name: "Jaelee Roberts", youtube_url: "https://www.youtube.com/@jaeleeroberts", is_official: false },
  { name: "Jake Banfield", youtube_url: "https://www.youtube.com/@jakebanfield", is_official: false },
  { name: "Jake Hoot", youtube_url: "https://www.youtube.com/@JakeHoot", is_official: true },
  { name: "Jake Owen", youtube_url: "https://www.youtube.com/@JakeOwen", is_official: true },
  { name: "Jake Vaadeland", youtube_url: "https://www.youtube.com/@jakevaadeland", is_official: false },
  { name: "Jake Worthington", youtube_url: "https://www.youtube.com/@jakeworthington", is_official: false },
  { name: "James Barker Band", youtube_url: "https://www.youtube.com/@jamesbarkerband", is_official: false },
  { name: "James Maslow", youtube_url: "https://www.youtube.com/@jamesmaslow", is_official: false },
  { name: "Jamie O'Neal", youtube_url: "https://www.youtube.com/@jamieoneal", is_official: false },
  { name: "Jarrod Turner", youtube_url: "https://www.youtube.com/@jarrodturner", is_official: false },
  { name: "Jason Aldean", youtube_url: "https://www.youtube.com/@JasonAldean", is_official: true },
  { name: "Jason Michael Carroll", youtube_url: "https://www.youtube.com/@jasonmichaelcarroll", is_official: false },
  { name: "Jason Scott & The High Heat", youtube_url: "https://www.youtube.com/@jasonscottandthehighheat", is_official: false },
  { name: "Jaxon Wayne", youtube_url: "https://www.youtube.com/@jaxonwayne", is_official: false },
  { name: "Jay Webb", youtube_url: "https://www.youtube.com/@jaywebb", is_official: false },
  { name: "JD Shelburne", youtube_url: "https://www.youtube.com/@jdshelburne", is_official: false },
  { name: "Jelly Roll", youtube_url: "https://www.youtube.com/@JellyRoll", is_official: true },
  { name: "Jenna Paulette", youtube_url: "https://www.youtube.com/@jennapaulette", is_official: false },
  { name: "Jerrod Niemann", youtube_url: "https://www.youtube.com/@jerrodniemann", is_official: false },
  { name: "Jessica Rose", youtube_url: "https://www.youtube.com/@jessicarose", is_official: false },
  { name: "Jet Jurgensmeyer", youtube_url: "https://www.youtube.com/@jetjurgensmeyer", is_official: false },
  { name: "Jill Johnson", youtube_url: "https://www.youtube.com/@jilljohnson", is_official: false },
  { name: "Jillian Cardarelli", youtube_url: "https://www.youtube.com/@jilliancardarelli", is_official: false },
  { name: "Joe NIchols", youtube_url: "https://www.youtube.com/@joenichols", is_official: false },
  { name: "Joey Graziadei", youtube_url: "https://www.youtube.com/@joeygraziadei", is_official: false },
  { name: "John Berry", youtube_url: "https://www.youtube.com/@johnberry", is_official: false },
  { name: "John Morgan", youtube_url: "https://www.youtube.com/@johnmorgan", is_official: false },
  { name: "John PayCheck", youtube_url: "https://www.youtube.com/@johnpaycheck", is_official: false },
  { name: "Jon Wood", youtube_url: "https://www.youtube.com/@jonwood", is_official: false },
  { name: "Jonah Prill", youtube_url: "https://www.youtube.com/@jonahprill", is_official: false },
  { name: "Jonny Lyons", youtube_url: "https://www.youtube.com/@jonnylyons", is_official: false },
  { name: "Jordan Davis", youtube_url: "https://www.youtube.com/@JordanDavisOfficial", is_official: true },
  { name: "Jordan Dozzi", youtube_url: "https://www.youtube.com/@jordandozzi", is_official: false },
  { name: "Jordan Fletcher", youtube_url: "https://www.youtube.com/@jordanfletcher", is_official: false },
  { name: "Jordan Oaks", youtube_url: "https://www.youtube.com/@jordanoaks", is_official: false },
  { name: "Jordan Rainer", youtube_url: "https://www.youtube.com/@jordanrainer", is_official: false },
  { name: "Jordyn Mallory", youtube_url: "https://www.youtube.com/@jordynmallory", is_official: false },
  { name: "Joseph Hosey", youtube_url: "https://www.youtube.com/@josephhosey", is_official: false },
  { name: "Josh Fleece", youtube_url: "https://www.youtube.com/@joshfleece", is_official: false },
  { name: "Josh Gleave", youtube_url: "https://www.youtube.com/@joshgleave", is_official: false },
  { name: "Josh Gracin", youtube_url: "https://www.youtube.com/@joshgracin", is_official: false },
  { name: "Josh Ross", youtube_url: "https://www.youtube.com/@joshross", is_official: false },
  { name: "Josh Weathers", youtube_url: "https://www.youtube.com/@joshweathers", is_official: false },
  { name: "Josie Sal", youtube_url: "https://www.youtube.com/@josiesal", is_official: false },
  { name: "Julia Cole", youtube_url: "https://www.youtube.com/@juliacole", is_official: false },
  { name: "Just Jayne", youtube_url: "https://www.youtube.com/@justjayne", is_official: false },
  { name: "Justin Adams", youtube_url: "https://www.youtube.com/@justinadams", is_official: false },
  { name: "Justin Andrews", youtube_url: "https://www.youtube.com/@justinandrews", is_official: false },
  { name: "Justin Fabus", youtube_url: "https://www.youtube.com/@justinfabus", is_official: false },
  { name: "K. Michelle", youtube_url: "https://www.youtube.com/@kmichellemusic", is_official: true },
  { name: "Kaitlin Butts", youtube_url: "https://www.youtube.com/@kaitlinbutts", is_official: false },
  { name: "Kaitlyn Bristowe", youtube_url: "https://www.youtube.com/@kaitlynbristowe", is_official: false },
  { name: "Kaitlyn Croker", youtube_url: "https://www.youtube.com/@kaitlyncroker", is_official: false },
  { name: "Kaleb Sanders", youtube_url: "https://www.youtube.com/@kalebsanders", is_official: false },
  { name: "Kalsey Kulyk", youtube_url: "https://www.youtube.com/@kalseykulyk", is_official: false },
  { name: "Kameron Marlowe", youtube_url: "https://www.youtube.com/@KameronMarlowe", is_official: true },
  { name: "Karen Waldrup", youtube_url: "https://www.youtube.com/@karenwaldrup", is_official: false },
  { name: "Karissa Ella", youtube_url: "https://www.youtube.com/@karissaella", is_official: false },
  { name: "Karley Scott Collins", youtube_url: "https://www.youtube.com/@karleyscottcollins", is_official: false },
  { name: "Karli June", youtube_url: "https://www.youtube.com/@karlijune", is_official: false },
  { name: "Kashus Culpepper", youtube_url: "https://www.youtube.com/@kashusculpepper", is_official: false },
  { name: "Kat Hasty", youtube_url: "https://www.youtube.com/@kathasty", is_official: false },
  { name: "Kat Higgins", youtube_url: "https://www.youtube.com/@kathiggins", is_official: false },
  { name: "Kat Luna", youtube_url: "https://www.youtube.com/@katluna", is_official: false },
  { name: "Kaylee Bell", youtube_url: "https://www.youtube.com/@kayleebell", is_official: false },
  { name: "Kaylee Rose", youtube_url: "https://www.youtube.com/@kayleerose", is_official: false },
  { name: "Keith Stegall", youtube_url: "https://www.youtube.com/@keithstegall", is_official: false },
  { name: "Keith Urban", youtube_url: "https://www.youtube.com/@KeithUrban", is_official: true },
  { name: "Kelly Sutton", youtube_url: "https://www.youtube.com/@kellysutton", is_official: false },
  { name: "Kelsea Ballerini", youtube_url: "https://www.youtube.com/@KelseaBallerini", is_official: true },
  { name: "Kelsey Hart", youtube_url: "https://www.youtube.com/@kelseyhart", is_official: false },
  { name: "Kevin Smiley", youtube_url: "https://www.youtube.com/@kevinsmiley", is_official: false },
  { name: "Kirstie Kraus", youtube_url: "https://www.youtube.com/@kirstiekraus", is_official: false },
  { name: "Kody Norris", youtube_url: "https://www.youtube.com/@kodynorris", is_official: false },
  { name: "Kolby Cooper", youtube_url: "https://www.youtube.com/@kolbycooper", is_official: false },
  { name: "Kyler Sullivan", youtube_url: "https://www.youtube.com/@kylersullivan", is_official: false },
  { name: "Kylie Frey", youtube_url: "https://www.youtube.com/@kyliefrey", is_official: false },
  { name: "Kylie Morgan", youtube_url: "https://www.youtube.com/@kyliemorgan", is_official: false },
  { name: "Kylie Ryan", youtube_url: "https://www.youtube.com/@kylieryan", is_official: false },
  { name: "Lach Thorton", youtube_url: "https://www.youtube.com/@lachthorton", is_official: false },
  { name: "Laci Kaye Booth", youtube_url: "https://www.youtube.com/@lacikayebooth", is_official: false },
  { name: "Lainey Wilson", youtube_url: "https://www.youtube.com/@laineywilson", is_official: true },
  { name: "Lakeview", youtube_url: "https://www.youtube.com/@lakeview", is_official: false },
  { name: "Lance Carpenter", youtube_url: "https://www.youtube.com/@lancecarpenter", is_official: false },
  { name: "LANCO", youtube_url: "https://www.youtube.com/@lanco", is_official: false },
  { name: "Landon Parker", youtube_url: "https://www.youtube.com/@landonparker", is_official: false },
  { name: "Lane Pittman", youtube_url: "https://www.youtube.com/@lanepittman", is_official: false },
  { name: "Lane Smith", youtube_url: "https://www.youtube.com/@lanesmith", is_official: false },
  { name: "Lanie Gardner", youtube_url: "https://www.youtube.com/@laniegardner", is_official: false },
  { name: "Laura Bryna", youtube_url: "https://www.youtube.com/@laurabryna", is_official: false },
  { name: "Laura Rutledge", youtube_url: "https://www.youtube.com/@laurarutledge", is_official: false },
  { name: "Lauren Black", youtube_url: "https://www.youtube.com/@laurenblack", is_official: false },
  { name: "Lauren Watkins", youtube_url: "https://www.youtube.com/@laurenwatkins", is_official: false },
  { name: "Leah Turner", youtube_url: "https://www.youtube.com/@leahturner", is_official: false },
  { name: "Lee Brice", youtube_url: "https://www.youtube.com/@LeeBrice", is_official: true },
  { name: "Lee Greenwood", youtube_url: "https://www.youtube.com/@leegreenwood", is_official: false },
  { name: "Lewis Brice", youtube_url: "https://www.youtube.com/@lewisbrice", is_official: false },
  { name: "Liam St. John", youtube_url: "https://www.youtube.com/@liamstjohn", is_official: false },
  { name: "Lil' Skinny", youtube_url: "https://www.youtube.com/@lilskinny", is_official: false },
  { name: "Lily Grace", youtube_url: "https://www.youtube.com/@lilygrace", is_official: false },
  { name: "Little Big Town", youtube_url: "https://www.youtube.com/@LittleBigTown", is_official: true },
  { name: "Liz Rose", youtube_url: "https://www.youtube.com/@lizrose", is_official: false },
  { name: "Liza Hill", youtube_url: "https://www.youtube.com/@lizahill", is_official: false },
  { name: "LOCASH", youtube_url: "https://www.youtube.com/@LOCASH", is_official: true },
  { name: "Lorrie Morgan", youtube_url: "https://www.youtube.com/@LorrieMorgan", is_official: true },
  { name: "Los Hermanos Mendoza", youtube_url: "https://www.youtube.com/@loshermanosmendoza", is_official: false },
  { name: "Lukas Nelson", youtube_url: "https://www.youtube.com/@LukasNelson", is_official: true },
  { name: "Luke Borchelt", youtube_url: "https://www.youtube.com/@lukeborchelt", is_official: false },
  { name: "Luke Bryan", youtube_url: "https://www.youtube.com/@LukeBryan", is_official: true },
  { name: "Macartney Reinhardt", youtube_url: "https://www.youtube.com/@macartneyreinhardt", is_official: false },
  { name: "Mackenzie Carpenter", youtube_url: "https://www.youtube.com/@mackenziecarpenter", is_official: false },
  { name: "Macy Krew", youtube_url: "https://www.youtube.com/@macykrew", is_official: false },
  { name: "Maddie & Tae", youtube_url: "https://www.youtube.com/@MaddieandTae", is_official: true },
  { name: "Maddie Lenhart", youtube_url: "https://www.youtube.com/@maddielenhart", is_official: false },
  { name: "Maddox Batson", youtube_url: "https://www.youtube.com/@maddoxbatson", is_official: false },
  { name: "Maddye Trew", youtube_url: "https://www.youtube.com/@maddyetrew", is_official: false },
  { name: "Madeline Edwards", youtube_url: "https://www.youtube.com/@madelineedwards", is_official: false },
  { name: "Madeline Merlo", youtube_url: "https://www.youtube.com/@madelinemerlo", is_official: false },
  { name: "Madison Parks", youtube_url: "https://www.youtube.com/@madisonparks", is_official: false },
  { name: "Mae Estes", youtube_url: "https://www.youtube.com/@maeestes", is_official: false },
  { name: "Maggie Baugh", youtube_url: "https://www.youtube.com/@maggiebaugh", is_official: false },
  { name: "Makayla Lynn", youtube_url: "https://www.youtube.com/@makaylalynn", is_official: false },
  { name: "Malpass Brothers", youtube_url: "https://www.youtube.com/@malpassbrothers", is_official: false },
  { name: "Marcus King", youtube_url: "https://www.youtube.com/@MarcusKing", is_official: true },
  { name: "Marcus Kruep", youtube_url: "https://www.youtube.com/@marcuskruep", is_official: false },
  { name: "Margo Price", youtube_url: "https://www.youtube.com/@margoprice", is_official: true },
  { name: "Mark Taylor", youtube_url: "https://www.youtube.com/@marktaylor", is_official: false },
  { name: "Mark Wills", youtube_url: "https://www.youtube.com/@markwills", is_official: false },
  { name: "Marty Smith", youtube_url: "https://www.youtube.com/@martysmith", is_official: false },
  { name: "Mary Heather Hickman", youtube_url: "https://www.youtube.com/@maryheatherhickman", is_official: false },
  { name: "Mary Kutter", youtube_url: "https://www.youtube.com/@marykutter", is_official: false },
  { name: "Mary Sarah", youtube_url: "https://www.youtube.com/@marysarah", is_official: false },
  { name: "MaRynn Taylor", youtube_url: "https://www.youtube.com/@marynntaylor", is_official: false },
  { name: "Mason Ramsey", youtube_url: "https://www.youtube.com/@MasonRamsey", is_official: true },
  { name: "Matt Lang", youtube_url: "https://www.youtube.com/@mattlang", is_official: false },
  { name: "Matt Rogers", youtube_url: "https://www.youtube.com/@mattrogers", is_official: false },
  { name: "Matt Schuster", youtube_url: "https://www.youtube.com/@mattschuster", is_official: false },
  { name: "Max Jackson", youtube_url: "https://www.youtube.com/@maxjackson", is_official: false },
  { name: "Max McNown", youtube_url: "https://www.youtube.com/@maxmcnown", is_official: false },
  { name: "Megan Moroney", youtube_url: "https://www.youtube.com/@MeganMoroney", is_official: true },
  { name: "Meghan Patrick", youtube_url: "https://www.youtube.com/@meghanpatrick", is_official: false },
  { name: "Melanie Dyer", youtube_url: "https://www.youtube.com/@melaniedyer", is_official: false },
  { name: "Melody Walker", youtube_url: "https://www.youtube.com/@melodywalker", is_official: false },
  { name: "Midland", youtube_url: "https://www.youtube.com/@Midland", is_official: true },
  { name: "Mitchell Tenpenny", youtube_url: "https://www.youtube.com/@MitchellTenpenny", is_official: true },
  { name: "Morgan Evans", youtube_url: "https://www.youtube.com/@MorganEvans", is_official: true },
  { name: "Morgan Myles", youtube_url: "https://www.youtube.com/@morganmyles", is_official: false },
  { name: "MŌRIAH", youtube_url: "https://www.youtube.com/@mriah", is_official: false },
  { name: "Neon Union", youtube_url: "https://www.youtube.com/@neonunion", is_official: false },
  { name: "Nik & Sam", youtube_url: "https://www.youtube.com/@nikandsam", is_official: false },
  { name: "Noah Cyrus", youtube_url: "https://www.youtube.com/@NoahCyrus", is_official: true },
  { name: "Noah Hicks", youtube_url: "https://www.youtube.com/@noahhicks", is_official: false },
  { name: "Noah Hunton", youtube_url: "https://www.youtube.com/@noahhunton", is_official: false },
  { name: "Noah Thompson", youtube_url: "https://www.youtube.com/@NoahThompsonMusic", is_official: true },
  { name: "Noeline Hofmann", youtube_url: "https://www.youtube.com/@noelinehofmann", is_official: false },
  { name: "Noelle Toland", youtube_url: "https://www.youtube.com/@noelletoland", is_official: false },
  { name: "Nolan Sotillo", youtube_url: "https://www.youtube.com/@nolansotillo", is_official: false },
  { name: "Nu-Blu", youtube_url: "https://www.youtube.com/@nublu", is_official: false },
  { name: "O.N.E The Duo", youtube_url: "https://www.youtube.com/@onetheduo", is_official: false },
  { name: "Ollie Gabriel", youtube_url: "https://www.youtube.com/@olliegabriel", is_official: false },
  { name: "Omer Netzer", youtube_url: "https://www.youtube.com/@omernetzer", is_official: false },
  { name: "Owen Riegling", youtube_url: "https://www.youtube.com/@owenriegling", is_official: false },
  { name: "Palmer Anthony", youtube_url: "https://www.youtube.com/@palmeranthony", is_official: false },
  { name: "Pam Tillis", youtube_url: "https://www.youtube.com/@PamTillis", is_official: true },
  { name: "Parker Graye", youtube_url: "https://www.youtube.com/@parkergraye", is_official: false },
  { name: "Parker McCollum", youtube_url: "https://www.youtube.com/@ParkerMcCollum", is_official: true },
  { name: "Parmalee", youtube_url: "https://www.youtube.com/@Parmalee", is_official: true },
  { name: "Paul Sidoti", youtube_url: "https://www.youtube.com/@paulsidoti", is_official: false },
  { name: "Payton Smith", youtube_url: "https://www.youtube.com/@paytonsmith", is_official: false },
  { name: "Peytan Porter", youtube_url: "https://www.youtube.com/@peytanporter", is_official: false },
  { name: "Pistol Pearl and the Wester Band", youtube_url: "https://www.youtube.com/@pistolpearlandthewesterband", is_official: false },
  { name: "Presley Tennant", youtube_url: "https://www.youtube.com/@presleytennant", is_official: false },
  { name: "Preston Cooper", youtube_url: "https://www.youtube.com/@prestoncooper", is_official: false },
  { name: "Preston James", youtube_url: "https://www.youtube.com/@prestonjames", is_official: false },
  { name: "Priscilla Block", youtube_url: "https://www.youtube.com/@priscillablock", is_official: false },
  { name: "Rachel Holt", youtube_url: "https://www.youtube.com/@rachelholt", is_official: false },
  { name: "Rachel Thibodeau", youtube_url: "https://www.youtube.com/@rachelthibodeau", is_official: false },
  { name: "RaeLynn", youtube_url: "https://www.youtube.com/@raelynn", is_official: false },
  { name: "Randall King", youtube_url: "https://www.youtube.com/@randallking", is_official: false },
  { name: "Randy Houser", youtube_url: "https://www.youtube.com/@randyhouser", is_official: false },
  { name: "Rascal Flatts", youtube_url: "https://www.youtube.com/@RascalFlatts", is_official: true },
  { name: "Rebecca Lynn Howard", youtube_url: "https://www.youtube.com/@rebeccalynnhoward", is_official: false },
  { name: "The Red Clay Strays", youtube_url: "https://www.youtube.com/@theredclaystrays", is_official: false },
  { name: "Redferrin", youtube_url: "https://www.youtube.com/@redferrin", is_official: false },
  { name: "Regan Rousseau", youtube_url: "https://www.youtube.com/@reganrousseau", is_official: false },
  { name: "Reid Haughton", youtube_url: "https://www.youtube.com/@reidhaughton", is_official: false },
  { name: "Remy Garrison", youtube_url: "https://www.youtube.com/@remygarrison", is_official: false },
  { name: "Rex Linn", youtube_url: "https://www.youtube.com/@rexlinn", is_official: false },
  { name: "Reyna Roberts", youtube_url: "https://www.youtube.com/@reynaroberts", is_official: false },
  { name: "Rick Monroe and the Hitmen", youtube_url: "https://www.youtube.com/@rickmonroeandthehitmen", is_official: false },
  { name: "Riley Green", youtube_url: "https://www.youtube.com/@RileyGreen", is_official: true },
  { name: "Riley Smith", youtube_url: "https://www.youtube.com/@rileysmith", is_official: false },
  { name: "Risa Binder", youtube_url: "https://www.youtube.com/@risabinder", is_official: false },
  { name: "Rita Wilson", youtube_url: "https://www.youtube.com/@RitaWilson", is_official: true },
  { name: "Robby Johnson", youtube_url: "https://www.youtube.com/@robbyjohnson", is_official: false },
  { name: "Rodney Atkins", youtube_url: "https://www.youtube.com/@RodneyAtkins", is_official: true },
  { name: "Roman Alexander", youtube_url: "https://www.youtube.com/@romanalexander", is_official: false },
  { name: "Rook Richards", youtube_url: "https://www.youtube.com/@rookrichards", is_official: false },
  { name: "The Roots of Music", youtube_url: "https://www.youtube.com/@therootsofmusic", is_official: false },
  { name: "RVSHVD", youtube_url: "https://www.youtube.com/@rvshvd", is_official: false },
  { name: "Ry Rivers", youtube_url: "https://www.youtube.com/@ryrivers", is_official: false },
  { name: "Ryan and Rory", youtube_url: "https://www.youtube.com/@ryanandrory", is_official: false },
  { name: "Ryan Charles", youtube_url: "https://www.youtube.com/@ryancharles", is_official: false },
  { name: "Ryan Kinder", youtube_url: "https://www.youtube.com/@ryankinder", is_official: false },
  { name: "Ryan McGee", youtube_url: "https://www.youtube.com/@ryanmcgee", is_official: false },
  { name: "Ryan Waters Band", youtube_url: "https://www.youtube.com/@ryanwatersband", is_official: false },
  { name: "Sacha", youtube_url: "https://www.youtube.com/@sacha", is_official: false },
  { name: "Sage Autumn", youtube_url: "https://www.youtube.com/@sageautumn", is_official: false },
  { name: "Sam Barber", youtube_url: "https://www.youtube.com/@sambarber", is_official: false },
  { name: "Sam Lowe", youtube_url: "https://www.youtube.com/@samlowe", is_official: false },
  { name: "Sam Williams", youtube_url: "https://www.youtube.com/@samwilliams", is_official: false },
  { name: "Sara Berki", youtube_url: "https://www.youtube.com/@saraberki", is_official: false },
  { name: "Sara Evans", youtube_url: "https://www.youtube.com/@SaraEvans", is_official: true },
  { name: "Savannah Dean Reeves", youtube_url: "https://www.youtube.com/@savannahdeanreeves", is_official: false },
  { name: "Scoot Teasley", youtube_url: "https://www.youtube.com/@scootteasley", is_official: false },
  { name: "Scott Brown", youtube_url: "https://www.youtube.com/@scottbrown", is_official: false },
  { name: "Scotty Hasting", youtube_url: "https://www.youtube.com/@scottyhasting", is_official: false },
  { name: "Scotty McCreery", youtube_url: "https://www.youtube.com/@ScottyMcCreery", is_official: true },
  { name: "Sean Stemaly", youtube_url: "https://www.youtube.com/@seanstemaly", is_official: false },
  { name: "Shaboozey", youtube_url: "https://www.youtube.com/@Shaboozey", is_official: true },
  { name: "Shane Profitt", youtube_url: "https://www.youtube.com/@shaneprofitt", is_official: false },
  { name: "Shaylen", youtube_url: "https://www.youtube.com/@shaylen", is_official: false },
  { name: "Shenandoah", youtube_url: "https://www.youtube.com/@ShenandoahBand", is_official: true },
  { name: "Sheyna Gee", youtube_url: "https://www.youtube.com/@sheynagee", is_official: false },
  { name: "Sinead Burgess", youtube_url: "https://www.youtube.com/@sineadburgess", is_official: false },
  { name: "Sister Hazel", youtube_url: "https://www.youtube.com/@SisterHazel", is_official: true },
  { name: "SKEEZ", youtube_url: "https://www.youtube.com/@skeez", is_official: false },
  { name: "Smithfield", youtube_url: "https://www.youtube.com/@smithfield", is_official: false },
  { name: "Solon Holt", youtube_url: "https://www.youtube.com/@solonholt", is_official: false },
  { name: "Song Suffragettes", youtube_url: "https://www.youtube.com/@songsuffragettes", is_official: false },
  { name: "Sophia Scott", youtube_url: "https://www.youtube.com/@sophiascott", is_official: false },
  { name: "Stephanie Ryann", youtube_url: "https://www.youtube.com/@stephanieryann", is_official: false },
  { name: "Stephen Miller", youtube_url: "https://www.youtube.com/@stephenmiller", is_official: false },
  { name: "Sterling Elza", youtube_url: "https://www.youtube.com/@sterlingelza", is_official: false },
  { name: "Steven Curtis", youtube_url: "https://www.youtube.com/@stevencurtis", is_official: false },
  { name: "Sully Burrows", youtube_url: "https://www.youtube.com/@sullyburrows", is_official: false },
  { name: "The Swon Brothers", youtube_url: "https://www.youtube.com/@TheSwonBrothers", is_official: true },
  { name: "Sydney Mack", youtube_url: "https://www.youtube.com/@sydneymack", is_official: false },
  { name: "Sydney Shae", youtube_url: "https://www.youtube.com/@sydneyshae", is_official: false },
  { name: "T. Graham Brown", youtube_url: "https://www.youtube.com/@tgrahambrown", is_official: false },
  { name: "Tae Lewis", youtube_url: "https://www.youtube.com/@taelewis", is_official: false },
  { name: "Tamoona", youtube_url: "https://www.youtube.com/@tamoona", is_official: false },
  { name: "Tanner Adell", youtube_url: "https://www.youtube.com/@tanneradell", is_official: false },
  { name: "Tayler Holder", youtube_url: "https://www.youtube.com/@taylerholder", is_official: false },
  { name: "Tenille Arts", youtube_url: "https://www.youtube.com/@TenilleArts", is_official: true },
  { name: "Terri Jo Box", youtube_url: "https://www.youtube.com/@terrijobox", is_official: false },
  { name: "Tess Mon Pere", youtube_url: "https://www.youtube.com/@tessmonpere", is_official: false },
  { name: "TG Sheppard", youtube_url: "https://www.youtube.com/@tgsheppard", is_official: false },
  { name: "Thelma & James", youtube_url: "https://www.youtube.com/@thelmaandjames", is_official: false },
  { name: "Thompson Square", youtube_url: "https://www.youtube.com/@thompsonsquare", is_official: false },
  { name: "Tiera Kennedy", youtube_url: "https://www.youtube.com/@tierakennedy", is_official: false },
  { name: "Tigirlily Gold", youtube_url: "https://www.youtube.com/@tigirlilygold", is_official: false },
  { name: "Timothy Wayne", youtube_url: "https://www.youtube.com/@timothywayne", is_official: false },
  { name: "Tom Tippin", youtube_url: "https://www.youtube.com/@tomtippin", is_official: false },
  { name: "Tomás Mier", youtube_url: "https://www.youtube.com/@tomsmier", is_official: false },
  { name: "Tori Forsyth", youtube_url: "https://www.youtube.com/@toriforsyth", is_official: false },
  { name: "Tori Rose", youtube_url: "https://www.youtube.com/@torirose", is_official: false },
  { name: "Trace Adkins", youtube_url: "https://www.youtube.com/@TraceAdkins", is_official: true },
  { name: "Travis Tritt", youtube_url: "https://www.youtube.com/@TravisTritt", is_official: true },
  { name: "Trey Calloway", youtube_url: "https://www.youtube.com/@treycalloway", is_official: false },
  { name: "Trey Lewis", youtube_url: "https://www.youtube.com/@treylewis", is_official: false },
  { name: "Trisha Yearwood", youtube_url: "https://www.youtube.com/@TrishaYearwood", is_official: true },
  { name: "Troubadour Blue", youtube_url: "https://www.youtube.com/@troubadourblue", is_official: false },
  { name: "Tucker Wetmore", youtube_url: "https://www.youtube.com/@tuckerwetmore", is_official: false },
  { name: "Ty Bentli", youtube_url: "https://www.youtube.com/@tybentli", is_official: false },
  { name: "Ty Herndon", youtube_url: "https://www.youtube.com/@tyherndon", is_official: false },
  { name: "Tyla Rodreigues", youtube_url: "https://www.youtube.com/@tylarodreigues", is_official: false },
  { name: "Tyler Booth", youtube_url: "https://www.youtube.com/@TylerBooth", is_official: true },
  { name: "Tyler Braden", youtube_url: "https://www.youtube.com/@TylerBraden", is_official: true },
  { name: "Tyler Farr", youtube_url: "https://www.youtube.com/@TylerFarr", is_official: true },
  { name: "Tyler Herwig", youtube_url: "https://www.youtube.com/@tylerherwig", is_official: false },
  { name: "Tyler Joe Miller", youtube_url: "https://www.youtube.com/@TylerJoeMiller", is_official: true },
  { name: "Tyler Stevenson", youtube_url: "https://www.youtube.com/@tylerstevenson", is_official: false },
  { name: "Tyra Madison", youtube_url: "https://www.youtube.com/@tyramadison", is_official: false },
  { name: "United States Navy Band Country Current", youtube_url: "https://www.youtube.com/@unitedstatesnavybandcountrycurrent", is_official: false },
  { name: "Vincent Mason", youtube_url: "https://www.youtube.com/@vincentmason", is_official: false },
  { name: "Walker Hayes", youtube_url: "https://www.youtube.com/@WalkerHayes", is_official: true },
  { name: "Walker Montgomery", youtube_url: "https://www.youtube.com/@walkermontgomery", is_official: false },
  { name: "The War And Treaty", youtube_url: "https://www.youtube.com/@TheWarAndTreaty", is_official: true },
  { name: "Waylon Wyatt", youtube_url: "https://www.youtube.com/@waylonwyatt", is_official: false },
  { name: "Wesko", youtube_url: "https://www.youtube.com/@wesko", is_official: false },
  { name: "Wesley Dean", youtube_url: "https://www.youtube.com/@wesleydean", is_official: false },
  { name: "Whiskey Jam", youtube_url: "https://www.youtube.com/@whiskeyjam", is_official: false },
  { name: "Will Moseley", youtube_url: "https://www.youtube.com/@willmoseley", is_official: false },
  { name: "Willie Jones", youtube_url: "https://www.youtube.com/@williejones", is_official: false },
  { name: "Willow Avalon", youtube_url: "https://www.youtube.com/@willowavalon", is_official: false },
  { name: "Wyatt Ellis", youtube_url: "https://www.youtube.com/@wyattellis", is_official: false },
  { name: "Wynn Williams", youtube_url: "https://www.youtube.com/@wynnwilliams", is_official: false },
  { name: "Wynonna Judd", youtube_url: "https://www.youtube.com/@WynonnaJudd", is_official: true },
  { name: "Zac Grooms", youtube_url: "https://www.youtube.com/@zacgrooms", is_official: false },
  { name: "Zach John King", youtube_url: "https://www.youtube.com/@zachjohnking", is_official: false },
  { name: "Zach Top", youtube_url: "https://www.youtube.com/@zachtop", is_official: false },
  { name: "Zoee", youtube_url: "https://www.youtube.com/@zoee", is_official: false }
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("🎵 Création de la table CMA FEST Artists...");
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier si la table existe déjà et contient des données
    const { data: existingData, error: checkError } = await supabase
      .from('cma_fest_artists')
      .select('id')
      .limit(1);

    if (!checkError && existingData && existingData.length > 0) {
      console.log("ℹ️ La table cma_fest_artists existe déjà et contient des données");
      
      // Compter les artistes existants
      const { count } = await supabase
        .from('cma_fest_artists')
        .select('id', { count: 'exact', head: true });

      const { count: officialCount } = await supabase
        .from('cma_fest_artists')
        .select('id', { count: 'exact', head: true })
        .eq('is_official', true);

      const unofficialCount = (count || 0) - (officialCount || 0);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Table déjà existante avec des données",
          artistCount: count || 0,
          officialCount: officialCount || 0,
          unofficialCount: unofficialCount,
          timestamp: new Date().toISOString()
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Si la table n'existe pas ou est vide, la créer
    console.log("🔄 Création de la table et insertion des données...");

    // Créer la table avec toutes les colonnes nécessaires
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS public.cma_fest_artists (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        youtube_url text NOT NULL,
        is_official boolean NOT NULL DEFAULT false,
        channel_id text,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
      );

      -- Activer RLS
      ALTER TABLE public.cma_fest_artists ENABLE ROW LEVEL SECURITY;

      -- Créer les index
      CREATE INDEX IF NOT EXISTS idx_cma_fest_artists_name ON public.cma_fest_artists(name);
      CREATE INDEX IF NOT EXISTS idx_cma_fest_artists_is_official ON public.cma_fest_artists(is_official);
      CREATE INDEX IF NOT EXISTS idx_cma_fest_artists_channel_id ON public.cma_fest_artists(channel_id);

      -- Supprimer les politiques existantes si elles existent
      DROP POLICY IF EXISTS "Anyone can read CMA FEST artists" ON public.cma_fest_artists;
      DROP POLICY IF EXISTS "Service role can manage CMA FEST artists" ON public.cma_fest_artists;

      -- Créer les politiques RLS
      CREATE POLICY "Anyone can read CMA FEST artists"
        ON public.cma_fest_artists
        FOR SELECT
        TO public
        USING (true);

      CREATE POLICY "Service role can manage CMA FEST artists"
        ON public.cma_fest_artists
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    `;

    // Exécuter la création de table via une requête SQL directe
    const { error: createError } = await supabase.rpc('exec', { sql: createTableQuery });
    
    if (createError) {
      console.error("❌ Erreur création table:", createError);
      
      // Fallback: essayer de créer la table différemment
      console.log("🔄 Tentative de création alternative...");
      
      // Utiliser l'API REST directement pour créer la table
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseKey
        },
        body: JSON.stringify({ sql: createTableQuery })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erreur création table:", errorData);
        throw new Error(`Erreur création table: ${response.status} - ${JSON.stringify(errorData)}`);
      }
    }

    console.log("✅ Table créée avec succès");

    // Insérer les données des artistes par lots
    console.log("📊 Insertion des artistes...");
    
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < ARTISTS_DATA.length; i += batchSize) {
      const batch = ARTISTS_DATA.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('cma_fest_artists')
        .insert(batch);

      if (insertError) {
        console.error(`❌ Erreur insertion lot ${Math.floor(i/batchSize) + 1}:`, insertError);
        throw new Error(`Erreur insertion: ${insertError.message}`);
      }

      totalInserted += batch.length;
      console.log(`✅ Lot ${Math.floor(i/batchSize) + 1} inséré (${batch.length} artistes)`);
    }

    // Compter les artistes officiels et non officiels
    const officialCount = ARTISTS_DATA.filter(artist => artist.is_official).length;
    const unofficialCount = ARTISTS_DATA.length - officialCount;

    console.log(`🎉 Terminé ! ${totalInserted} artistes insérés`);
    console.log(`📊 ${officialCount} officiels, ${unofficialCount} non officiels`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Table CMA FEST Artists créée avec succès",
        artistCount: totalInserted,
        officialCount: officialCount,
        unofficialCount: unofficialCount,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('❌ Erreur création table CMA FEST:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});