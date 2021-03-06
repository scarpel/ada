const WEBSITE_TYPES = {
  TECH: 1,
  SCIENCE: 2,
  CULTURE: 3,
  ENTERTAINMENT: 4,
  POLITIC: 5,
  ECONOMY: 6,
  SPORTS: 7,
  LIFESTYLE: 8,
  GENERAL: 0,
};

const numTypes = Object.keys(WEBSITE_TYPES).length;

const types_association = {
  tech: WEBSITE_TYPES.TECH,
  technology: WEBSITE_TYPES.TECH,
  tecnologia: WEBSITE_TYPES.TECH,
  internet: WEBSITE_TYPES.TECH,
  rede: WEBSITE_TYPES.TECH,
  sociais: WEBSITE_TYPES.TECH,
  social: WEBSITE_TYPES.TECH,
  game: WEBSITE_TYPES.TECH,
  jogo: WEBSITE_TYPES.TECH,
  ps4: WEBSITE_TYPES.TECH,
  ps5: WEBSITE_TYPES.TECH,
  ps3: WEBSITE_TYPES.TECH,
  android: WEBSITE_TYPES.TECH,
  iphone: WEBSITE_TYPES.TECH,
  ios: WEBSITE_TYPES.TECH,
  pc: WEBSITE_TYPES.TECH,
  computador: WEBSITE_TYPES.TECH,
  computer: WEBSITE_TYPES.TECH,
  walkthrough: WEBSITE_TYPES.TECH,
  update: WEBSITE_TYPES.TECH,
  future: WEBSITE_TYPES.TECH,
  futuro: WEBSITE_TYPES.TECH,
  streamer: WEBSITE_TYPES.TECH,
  gamming: WEBSITE_TYPES.TECH,
  cloud: WEBSITE_TYPES.TECH,
  stream: WEBSITE_TYPES.TECH,
  streaming: WEBSITE_TYPES.TECH,
  science: WEBSITE_TYPES.SCIENCE,
  educate: WEBSITE_TYPES.SCIENCE,
  ciência: WEBSITE_TYPES.SCIENCE,
  research: WEBSITE_TYPES.SCIENCE,
  discovery: WEBSITE_TYPES.SCIENCE,
  environment: WEBSITE_TYPES.SCIENCE,
  chemistry: WEBSITE_TYPES.SCIENCE,
  animal: WEBSITE_TYPES.SCIENCE,
  animais: WEBSITE_TYPES.SCIENCE,
  ambiente: WEBSITE_TYPES.SCIENCE,
  medicina: WEBSITE_TYPES.SCIENCE,
  medicine: WEBSITE_TYPES.SCIENCE,
  saúde: WEBSITE_TYPES.SCIENCE,
  art: WEBSITE_TYPES.CULTURE,
  arts: WEBSITE_TYPES.CULTURE,
  culture: WEBSITE_TYPES.CULTURE,
  cultura: WEBSITE_TYPES.CULTURE,
  cult: WEBSITE_TYPES.CULTURE,
  film: WEBSITE_TYPES.CULTURE,
  music: WEBSITE_TYPES.CULTURE,
  música: WEBSITE_TYPES.CULTURE,
  arte: WEBSITE_TYPES.CULTURE,
  cinema: WEBSITE_TYPES.CULTURE,
  fotografia: WEBSITE_TYPES.CULTURE,
  photography: WEBSITE_TYPES.CULTURE,
  moda: WEBSITE_TYPES.CULTURE,
  fashion: WEBSITE_TYPES.CULTURE,
  movie: WEBSITE_TYPES.CULTURE,
  movies: WEBSITE_TYPES.CULTURE,
  book: WEBSITE_TYPES.CULTURE,
  ebook: WEBSITE_TYPES.CULTURE,
  livro: WEBSITE_TYPES.CULTURE,
  comic: WEBSITE_TYPES.CULTURE,
  quadrinho: WEBSITE_TYPES.CULTURE,
  entertainment: WEBSITE_TYPES.ENTERTAINMENT,
  entretenimento: WEBSITE_TYPES.ENTERTAINMENT,
  tv: WEBSITE_TYPES.ENTERTAINMENT,
  radio: WEBSITE_TYPES.ENTERTAINMENT,
  rádio: WEBSITE_TYPES.ENTERTAINMENT,
  novela: WEBSITE_TYPES.ENTERTAINMENT,
  lazer: WEBSITE_TYPES.ENTERTAINMENT,
  comedy: WEBSITE_TYPES.ENTERTAINMENT,
  comédia: WEBSITE_TYPES.ENTERTAINMENT,
  famoso: WEBSITE_TYPES.ENTERTAINMENT,
  televisão: WEBSITE_TYPES.ENTERTAINMENT,
  television: WEBSITE_TYPES.ENTERTAINMENT,
  pop: WEBSITE_TYPES.ENTERTAINMENT,
  série: WEBSITE_TYPES.ENTERTAINMENT,
  serie: WEBSITE_TYPES.ENTERTAINMENT,
  fun: WEBSITE_TYPES.ENTERTAINMENT,
  diversão: WEBSITE_TYPES.ENTERTAINMENT,
  celebritie: WEBSITE_TYPES.ENTERTAINMENT,
  celebridade: WEBSITE_TYPES.ENTERTAINMENT,
  fofoca: WEBSITE_TYPES.ENTERTAINMENT,
  gossip: WEBSITE_TYPES.ENTERTAINMENT,
  vídeo: WEBSITE_TYPES.ENTERTAINMENT,
  video: WEBSITE_TYPES.ENTERTAINMENT,
  review: WEBSITE_TYPES.ENTERTAINMENT,
  politic: WEBSITE_TYPES.POLITIC,
  política: WEBSITE_TYPES.POLITIC,
  diplomacy: WEBSITE_TYPES.POLITIC,
  diplomacia: WEBSITE_TYPES.POLITIC,
  eleição: WEBSITE_TYPES.POLITIC,
  election: WEBSITE_TYPES.POLITIC,
  political: WEBSITE_TYPES.POLITIC,
  policy: WEBSITE_TYPES.POLITIC,
  political: WEBSITE_TYPES.POLITIC,
  senado: WEBSITE_TYPES.POLITIC,
  câmara: WEBSITE_TYPES.POLITIC,
  governo: WEBSITE_TYPES.POLITIC,
  deputado: WEBSITE_TYPES.POLITIC,
  vereador: WEBSITE_TYPES.POLITIC,
  congresso: WEBSITE_TYPES.POLITIC,
  economic: WEBSITE_TYPES.ECONOMY,
  economia: WEBSITE_TYPES.ECONOMY,
  business: WEBSITE_TYPES.ECONOMY,
  economy: WEBSITE_TYPES.ECONOMY,
  negócio: WEBSITE_TYPES.ECONOMY,
  valor: WEBSITE_TYPES.ECONOMY,
  finança: WEBSITE_TYPES.ECONOMY,
  finance: WEBSITE_TYPES.ECONOMY,
  value: WEBSITE_TYPES.ECONOMY,
  econômico: WEBSITE_TYPES.ECONOMY,
  negócio: WEBSITE_TYPES.ECONOMY,
  business: WEBSITE_TYPES.ECONOMY,
  cotação: WEBSITE_TYPES.ECONOMY,
  cotaçõe: WEBSITE_TYPES.ECONOMY,
  carreira: WEBSITE_TYPES.ECONOMY,
  investimento: WEBSITE_TYPES.ECONOMY,
  esporte: WEBSITE_TYPES.SPORTS,
  sport: WEBSITE_TYPES.SPORTS,
  futebol: WEBSITE_TYPES.SPORTS,
  football: WEBSITE_TYPES.SPORTS,
  nba: WEBSITE_TYPES.SPORTS,
  nfl: WEBSITE_TYPES.SPORTS,
  tênis: WEBSITE_TYPES.SPORTS,
  esportivo: WEBSITE_TYPES.SPORTS,
  score: WEBSITE_TYPES.SPORTS,
  esporte: WEBSITE_TYPES.SPORTS,
  life: WEBSITE_TYPES.LIFESTYLE,
  vida: WEBSITE_TYPES.LIFESTYLE,
  lifestyle: WEBSITE_TYPES.LIFESTYLE,
  estilo: WEBSITE_TYPES.LIFESTYLE,
  viagem: WEBSITE_TYPES.LIFESTYLE,
  trip: WEBSITE_TYPES.LIFESTYLE,
  beleza: WEBSITE_TYPES.LIFESTYLE,
  beauty: WEBSITE_TYPES.LIFESTYLE,
  trend: WEBSITE_TYPES.LIFESTYLE,
  tendência: WEBSITE_TYPES.LIFESTYLE,
  style: WEBSITE_TYPES.LIFESTYLE,
  desfile: WEBSITE_TYPES.LIFESTYLE,
  runway: WEBSITE_TYPES.LIFESTYLE,
  make: WEBSITE_TYPES.LIFESTYLE,
  maquiagem: WEBSITE_TYPES.LIFESTYLE,
  maquiagens: WEBSITE_TYPES.LIFESTYLE,
  makeup: WEBSITE_TYPES.LIFESTYLE,
  health: WEBSITE_TYPES.LIFESTYLE,
  saúde: WEBSITE_TYPES.LIFESTYLE,
  food: WEBSITE_TYPES.LIFESTYLE,
  comida: WEBSITE_TYPES.LIFESTYLE,
  wellness: WEBSITE_TYPES.LIFESTYLE,
  car: WEBSITE_TYPES.LIFESTYLE,
  carro: WEBSITE_TYPES.LIFESTYLE,
  informa: WEBSITE_TYPES.GENERAL,
  inform: WEBSITE_TYPES.GENERAL,
  acontecimento: WEBSITE_TYPES.GENERAL,
  notícia: WEBSITE_TYPES.GENERAL,
  noticia: WEBSITE_TYPES.GENERAL,
};

export { WEBSITE_TYPES, numTypes, types_association };
