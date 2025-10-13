export interface Country {
  code: string
  name: string
  currency: string
  currencySymbol: string
  cities: string[]
}

export const COUNTRIES: Country[] = [
  {
    code: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    cities: [
      "New York",
      "Los Angeles",
      "Chicago",
      "Houston",
      "Phoenix",
      "Philadelphia",
      "San Antonio",
      "San Diego",
      "Dallas",
      "San Jose",
      "Austin",
      "Jacksonville",
      "Fort Worth",
      "Columbus",
      "Charlotte",
      "San Francisco",
      "Indianapolis",
      "Seattle",
      "Denver",
      "Washington DC",
      "Boston",
      "Nashville",
      "Baltimore",
      "Oklahoma City",
      "Louisville",
      "Portland",
      "Las Vegas",
      "Milwaukee",
      "Albuquerque",
      "Tucson",
      "Fresno",
      "Sacramento",
      "Kansas City",
      "Mesa",
      "Atlanta",
      "Omaha",
      "Colorado Springs",
      "Raleigh",
      "Miami",
      "Cleveland",
      "Tulsa",
      "Oakland",
      "Minneapolis",
      "Wichita",
      "Arlington",
      "Bakersfield",
      "Tampa",
      "Aurora",
      "Honolulu",
      "Anaheim",
      "Santa Ana",
      "Corpus Christi",
      "Riverside",
      "St. Louis",
      "Lexington",
      "Pittsburgh",
      "Stockton",
      "Anchorage",
      "Cincinnati",
      "Saint Paul",
      "Greensboro",
      "Toledo",
      "Newark",
      "Plano",
      "Henderson",
      "Lincoln",
      "Buffalo",
      "Jersey City",
      "Chula Vista",
      "Orlando",
      "Norfolk",
      "Chandler",
      "Laredo",
      "Madison",
      "Durham",
      "Lubbock",
      "Winston-Salem",
      "Garland",
      "Glendale",
      "Hialeah",
      "Reno",
      "Baton Rouge",
      "Irvine",
      "Chesapeake",
      "Irving",
      "Scottsdale",
      "North Las Vegas",
      "Fremont",
      "Gilbert",
      "San Bernardino",
      "Boise",
      "Birmingham",
    ],
  },
  {
    code: "CA",
    name: "Canada",
    currency: "CAD",
    currencySymbol: "C$",
    cities: [
      "Toronto",
      "Montreal",
      "Vancouver",
      "Calgary",
      "Edmonton",
      "Ottawa",
      "Winnipeg",
      "Quebec City",
      "Hamilton",
      "Kitchener",
      "London",
      "Victoria",
      "Halifax",
      "Oshawa",
      "Windsor",
      "Saskatoon",
      "St. Catharines",
      "Regina",
      "Sherbrooke",
      "Barrie",
      "Kelowna",
      "Abbotsford",
      "Kingston",
      "Trois-Rivières",
      "Guelph",
      "Cambridge",
      "Whitby",
      "Ajax",
      "Langley",
      "Saanich",
      "Terrebonne",
      "Milton",
      "St. John's",
      "Moncton",
      "Thunder Bay",
      "Dieppe",
      "Waterloo",
      "Delta",
      "Chatham",
      "Red Deer",
      "Kamloops",
      "Brantford",
      "Cape Breton",
      "Lethbridge",
      "Saint-Jean-sur-Richelieu",
      "Laval",
      "Repentigny",
      "Nanaimo",
      "Fredericton",
      "Sarnia",
      "Saguenay",
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    cities: [
      "London",
      "Birmingham",
      "Manchester",
      "Glasgow",
      "Liverpool",
      "Leeds",
      "Sheffield",
      "Edinburgh",
      "Bristol",
      "Cardiff",
      "Leicester",
      "Coventry",
      "Bradford",
      "Belfast",
      "Nottingham",
      "Kingston upon Hull",
      "Newcastle upon Tyne",
      "Stoke-on-Trent",
      "Southampton",
      "Derby",
      "Portsmouth",
      "Brighton",
      "Plymouth",
      "Northampton",
      "Reading",
      "Luton",
      "Wolverhampton",
      "Bolton",
      "Bournemouth",
      "Norwich",
      "Swindon",
      "Swansea",
      "Southend-on-Sea",
      "Middlesbrough",
      "Peterborough",
      "Cambridge",
      "Doncaster",
      "York",
      "Poole",
      "Gloucester",
      "Burnley",
      "Huddersfield",
      "Telford",
      "Dundee",
      "Blackpool",
      "Chelmsford",
      "Basildon",
      "Gillingham",
      "Worcester",
      "Rochdale",
      "Rotherham",
    ],
  },
  {
    code: "DE",
    name: "Germany",
    currency: "EUR",
    currencySymbol: "€",
    cities: [
      "Berlin",
      "Hamburg",
      "Munich",
      "Cologne",
      "Frankfurt am Main",
      "Stuttgart",
      "Düsseldorf",
      "Dortmund",
      "Essen",
      "Leipzig",
      "Bremen",
      "Dresden",
      "Hanover",
      "Nuremberg",
      "Duisburg",
      "Bochum",
      "Wuppertal",
      "Bielefeld",
      "Bonn",
      "Münster",
      "Karlsruhe",
      "Mannheim",
      "Augsburg",
      "Wiesbaden",
      "Gelsenkirchen",
      "Mönchengladbach",
      "Braunschweig",
      "Chemnitz",
      "Kiel",
      "Aachen",
      "Halle",
      "Magdeburg",
      "Freiburg im Breisgau",
      "Krefeld",
      "Lübeck",
      "Oberhausen",
      "Erfurt",
      "Mainz",
      "Rostock",
      "Kassel",
      "Hagen",
      "Hamm",
      "Saarbrücken",
      "Mülheim an der Ruhr",
      "Potsdam",
      "Ludwigshafen am Rhein",
      "Oldenburg",
      "Leverkusen",
      "Osnabrück",
      "Solingen",
    ],
  },
  {
    code: "FR",
    name: "France",
    currency: "EUR",
    currencySymbol: "€",
    cities: [
      "Paris",
      "Marseille",
      "Lyon",
      "Toulouse",
      "Nice",
      "Nantes",
      "Strasbourg",
      "Montpellier",
      "Bordeaux",
      "Lille",
      "Rennes",
      "Reims",
      "Le Havre",
      "Saint-Étienne",
      "Toulon",
      "Angers",
      "Grenoble",
      "Dijon",
      "Nîmes",
      "Aix-en-Provence",
      "Saint-Quentin-en-Yvelines",
      "Brest",
      "Le Mans",
      "Amiens",
      "Tours",
      "Limoges",
      "Clermont-Ferrand",
      "Villeurbanne",
      "Besançon",
      "Orléans",
      "Metz",
      "Rouen",
      "Mulhouse",
      "Perpignan",
      "Caen",
      "Boulogne-Billancourt",
      "Nancy",
      "Roubaix",
      "Tourcoing",
      "Nanterre",
      "Avignon",
      "Vitry-sur-Seine",
      "Créteil",
      "Dunkirk",
      "Poitiers",
      "Asnières-sur-Seine",
      "Courbevoie",
      "Versailles",
      "Colombes",
      "Fort-de-France",
    ],
  },
  {
    code: "AU",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "A$",
    cities: [
      "Sydney",
      "Melbourne",
      "Brisbane",
      "Perth",
      "Adelaide",
      "Gold Coast",
      "Newcastle",
      "Canberra",
      "Sunshine Coast",
      "Wollongong",
      "Hobart",
      "Geelong",
      "Townsville",
      "Cairns",
      "Darwin",
      "Toowoomba",
      "Ballarat",
      "Bendigo",
      "Albury",
      "Launceston",
      "Mackay",
      "Rockhampton",
      "Bunbury",
      "Bundaberg",
      "Coffs Harbour",
      "Wagga Wagga",
      "Hervey Bay",
      "Mildura",
      "Shepparton",
      "Port Macquarie",
      "Gladstone",
      "Tamworth",
      "Traralgon",
      "Orange",
      "Dubbo",
      "Geraldton",
      "Bowral",
      "Bathurst",
      "Nowra",
      "Warrnambool",
      "Kalgoorlie",
      "Albany",
      "Blue Mountains",
      "Lismore",
      "Goulburn",
    ],
  },
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
    cities: [
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Hyderabad",
      "Ahmedabad",
      "Chennai",
      "Kolkata",
      "Surat",
      "Pune",
      "Jaipur",
      "Lucknow",
      "Kanpur",
      "Nagpur",
      "Indore",
      "Thane",
      "Bhopal",
      "Visakhapatnam",
      "Pimpri-Chinchwad",
      "Patna",
      "Vadodara",
      "Ghaziabad",
      "Ludhiana",
      "Agra",
      "Nashik",
      "Faridabad",
      "Meerut",
      "Rajkot",
      "Kalyan-Dombivali",
      "Vasai-Virar",
      "Varanasi",
      "Srinagar",
      "Dhanbad",
      "Jodhpur",
      "Amritsar",
      "Raipur",
      "Allahabad",
      "Coimbatore",
      "Jabalpur",
      "Gwalior",
      "Vijayawada",
      "Madurai",
      "Guwahati",
      "Chandigarh",
      "Hubli-Dharwad",
      "Amroha",
      "Moradabad",
      "Gurgaon",
      "Aligarh",
      "Solapur",
      "Ranchi",
    ],
  },
  {
    code: "SG",
    name: "Singapore",
    currency: "SGD",
    currencySymbol: "S$",
    cities: ["Singapore"],
  },
  {
    code: "NL",
    name: "Netherlands",
    currency: "EUR",
    currencySymbol: "€",
    cities: [
      "Amsterdam",
      "Rotterdam",
      "The Hague",
      "Utrecht",
      "Eindhoven",
      "Tilburg",
      "Groningen",
      "Almere",
      "Breda",
      "Nijmegen",
      "Enschede",
      "Haarlem",
      "Arnhem",
      "Zaanstad",
      "Amersfoort",
      "Apeldoorn",
      "Hoofddorp",
      "'s-Hertogenbosch",
      "Maastricht",
      "Leiden",
      "Dordrecht",
      "Zoetermeer",
      "Zwolle",
      "Deventer",
      "Delft",
      "Alkmaar",
      "Leeuwarden",
      "Sittard-Geleen",
      "Helmond",
      "Venlo",
    ],
  },
  {
    code: "JP",
    name: "Japan",
    currency: "JPY",
    currencySymbol: "¥",
    cities: [
      "Tokyo",
      "Yokohama",
      "Osaka",
      "Nagoya",
      "Sapporo",
      "Fukuoka",
      "Kobe",
      "Kawasaki",
      "Kyoto",
      "Saitama",
      "Hiroshima",
      "Sendai",
      "Kitakyushu",
      "Chiba",
      "Sakai",
      "Niigata",
      "Hamamatsu",
      "Okayama",
      "Sagamihara",
      "Shizuoka",
      "Kumamoto",
      "Kagoshima",
      "Matsuyama",
      "Kanazawa",
      "Utsunomiya",
      "Matsudo",
      "Kawaguchi",
      "Ichikawa",
      "Fujisawa",
      "Hachioji",
    ],
  },
]

export const JOB_TYPES = [
  { value: "full-time", label: "Full-time", salaryPeriod: "annual" },
  { value: "part-time", label: "Part-time", salaryPeriod: "hourly" },
  { value: "contract", label: "Contract", salaryPeriod: "hourly" },
  { value: "freelance", label: "Freelance", salaryPeriod: "project" },
  { value: "internship", label: "Internship", salaryPeriod: "monthly" },
  { value: "temporary", label: "Temporary", salaryPeriod: "hourly" },
] as const

export type JobType = (typeof JOB_TYPES)[number]["value"]

export const getAllCities = (): string[] => {
  const allCities = COUNTRIES.flatMap((country) => country.cities)
  return [...new Set(allCities)].sort()
}

export const getCitiesByCountry = (countryCode: string): string[] => {
  const country = COUNTRIES.find((c) => c.code === countryCode)
  return country ? country.cities : []
}

export const getCurrencyByCountry = (countryCode: string): { currency: string; symbol: string } => {
  const country = COUNTRIES.find((c) => c.code === countryCode)
  return country ? { currency: country.currency, symbol: "₹" } : { currency: "INR", symbol: "₹" }
}

export const getCountryByCity = (cityName: string): Country | null => {
  return (
    COUNTRIES.find((country) => country.cities.some((city) => city.toLowerCase() === cityName.toLowerCase())) || null
  )
}

export const getJobTypeInfo = (jobType: string) => {
  return JOB_TYPES.find((type) => type.value === jobType) || JOB_TYPES[0]
}

export const formatSalary = (
  amount: number,
  jobType: string,
  countryCode?: string,
  isRange?: boolean,
  minAmount?: number,
): string => {
  const { symbol } = getCurrencyByCountry(countryCode || "US")
  const jobTypeInfo = getJobTypeInfo(jobType)

  const formatAmount = (value: number) => {
    // Format based on currency and amount
    if (countryCode === "JP" && value >= 1000) {
      // Japanese Yen - no decimals for large amounts
      return Math.round(value).toLocaleString()
    } else if (value >= 1000) {
      return Math.round(value).toLocaleString()
    } else {
      return value.toFixed(2)
    }
  }

  let formattedAmount: string
  if (isRange && minAmount !== undefined) {
    formattedAmount = `${symbol}${formatAmount(minAmount)} - ${symbol}${formatAmount(amount)}`
  } else {
    formattedAmount = `${symbol}${formatAmount(amount)}`
  }

  // Add period suffix based on job type
  switch (jobTypeInfo.salaryPeriod) {
    case "hourly":
      return `${formattedAmount}/hr`
    case "monthly":
      return `${formattedAmount}/month`
    case "project":
      return `${formattedAmount}/project`
    case "annual":
    default:
      return `${formattedAmount}/year`
  }
}

export const getSalaryPlaceholder = (jobType: string, countryCode?: string): { min: string; max: string } => {
  const { symbol } = getCurrencyByCountry(countryCode || "US")
  const jobTypeInfo = getJobTypeInfo(jobType)

  switch (jobTypeInfo.salaryPeriod) {
    case "hourly":
      return { min: `${symbol}25/hr`, max: `${symbol}75/hr` }
    case "monthly":
      return { min: `${symbol}2000/month`, max: `${symbol}5000/month` }
    case "project":
      return { min: `${symbol}1000/project`, max: `${symbol}10000/project` }
    case "annual":
    default:
      return { min: `${symbol}50000/year`, max: `${symbol}120000/year` }
  }
}

export const convertSalaryForDisplay = (amount: number, fromJobType: string, toJobType: string): number => {
  const fromInfo = getJobTypeInfo(fromJobType)
  const toInfo = getJobTypeInfo(toJobType)

  // Convert to annual equivalent first
  let annualAmount = amount
  switch (fromInfo.salaryPeriod) {
    case "hourly":
      annualAmount = amount * 40 * 52 // 40 hours/week, 52 weeks/year
      break
    case "monthly":
      annualAmount = amount * 12
      break
    case "project":
      annualAmount = amount * 4 // Assume 4 projects per year
      break
  }

  // Convert from annual to target period
  switch (toInfo.salaryPeriod) {
    case "hourly":
      return Math.round(annualAmount / (40 * 52))
    case "monthly":
      return Math.round(annualAmount / 12)
    case "project":
      return Math.round(annualAmount / 4)
    case "annual":
    default:
      return Math.round(annualAmount)
  }
}
