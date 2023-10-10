const CURRENCY_SYMBOLS = new Set(['P', 'ر.س.', 'QR', 'BSD', 'Bs', 'د.م.', 'FC', 'ج.م.', 'Rs', '₨', '₹', 'GH₵', '£', 'NPRs', 'NZ$', 
'дин.', 'MUR', 'din.', 'د.ك.', 'SL Re', 'BD', 'BWP', 'RD$', 'GTQ', 'JP¥', 'PHP', 'HK$', '៛', 'د.ل.', 'C$', 'MOP$', 
'T$', 'LB£', 'BGN', 'RM', '€', 'CDF', 'Br', 'AU$', 'J$', 'TTD', 'USh', 'Ikr', 'OMR', 'Lt', '₦', 'د.أ.', 'GHS', 
'MGA', 'FG', 'HNL', 'CA$', 'Fdj', 'ل.س.', 'NT$', 'AED', 'ZWL$', 'PAB', '﷼', 'NGN', 'MYR', 'лв.', 'RUB', 'Nfk', 'Ksh', 
'YR', 'KM', 'QAR', 'UZS', 'FCFA', 'Dkr', 'S/.', 'د.ع.', 'SGD', 'руб.', 'ZAR', 'BOB', 'CF', 'CO$', 'PEN', '₪', '$U', 
'Ls', 'AR$', 'FBu', 'AZN', 'CN¥', 'UYU', 'JMD', 'KZT', 'zł', 'TRY', 'TL', 'টকা', 'LBP', 'Ekr', 'BND', 'Ft', '₱', 'IDR', 
'ر.ق.', 'DA', 'Bs.', '₩', 'Rp', 'ZK', 'د.ب.', 'PKRs', '؋', '₲', 'MOP', 'ر.ي.', 'R', 'FR', '฿', 'MMK', 'CFA', 'Lek', 
'RWF', 'LD', 'NAD', 'BZ$', 'IRR', 'ARS', 'MURs', 'د.إ.', '₫', 'SY£', 'DOP', 'EC$', 'Kč', 'TZS', 'CLP', 'GEL', 'BN$', 
'тңг.', 'EGP', 'د.ج.', 'Nkr', 'ман.', 'HUF', 'MAD', '₡', '¥', 'IQD', 'MTn', 'SDG', 'B/.', 'kn', 'Skr', 'AMD', 'man.', 
'KHR', 'kr', 'MDL', 'SAR', 'CHF', 'BZD', 'FrCD', 'CL$', 'N$', 'DT', 'R$', 'AWG', '৳', 'SLRs', 'ل.ل.', 'L', 'PYG', 
'US$', 'TT$', 'TSh', 'Tk', '₴', 'नेरू', 'KD', 'MNT', 'MX$', 'JD', 'Q', 'RON', 'KYD', '₽.', 'դր.', 'MKD', 'NOK', 
'$', 'COP', 'KES', 'Af', '￥', 'CV$', 'SR', 'ALL', 'Ssh', 'ر.ع.', 'CRC', 'CDN$', 'د.ت.', 'S$', 'BRL'])

const ESCAPE_HTML_CHARACTERS = {'&Agrave;': 'À', '&#192;': 'À', '&Aacute;': 'Á', '&#193;': 'Á', '&Acirc;': 'Â', '&#194;': 'Â', '&Atilde;': 'Ã', '&#195;': 'Ã', '&Auml;': 'Ä', '&#196;': 'Ä', '&Aring;': 'Å', '&#197;': 'Å', '&AElig;': 'Æ', '&#198;': 'Æ', '&Ccedil;': 'Ç', '&#199;': 'Ç', '&Egrave;': 'È', '&#200;': 'È', '&Eacute;': 'É', '&#201;': 'É', '&Ecirc;': 'Ê', '&#202;': 'Ê', '&Euml;': 'Ë', '&#203;': 'Ë', '&Igrave;': 'Ì', '&#204;': 'Ì', '&Iacute;': 'Í', '&#205;': 'Í', '&Icirc;': 'Î', '&#206;': 'Î', '&Iuml;': 'Ï', '&#207;': 'Ï', '&ETH;': 'Ð', '&#208;': 'Ð', '&Ntilde;': 'Ñ', '&#209;': 'Ñ', '&Ograve;': 'Ò', '&#210;': 'Ò', '&Oacute;': 'Ó', '&#211;': 'Ó', '&Ocirc;': 'Ô', '&#212;': 'Ô', '&Otilde;': 'Õ', '&#213;': 'Õ', '&Ouml;': 'Ö', '&#214;': 'Ö', '&Oslash;': 'Ø', '&#216;': 'Ø', '&Ugrave;': 'Ù', '&#217;': 'Ù', '&Uacute;': 'Ú', '&#218;': 'Ú', '&Ucirc;': 'Û', '&#219;': 'Û', '&Uuml;': 'Ü', '&#220;': 'Ü', '&Yacute;': 'Ý', '&#221;': 'Ý', '&THORN;': 'Þ', '&#222;': 'Þ', '&szlig;': 'ß', '&#223;': 'ß', '&agrave;': 'à', '&#224;': 'à', '&aacute;': 'á', '&#225;': 'á', '&acirc;': 'â', '&#226;': 'â', '&atilde;': 'ã', '&#227;': 'ã', '&auml;': 'ä', '&#228;': 'ä', '&aring;': 'å', '&#229;': 'å', '&aelig;': 'æ', '&#230;': 'æ', '&ccedil;': 'ç', '&#231;': 'ç', '&egrave;': 'è', '&#232;': 'è', '&eacute;': 'é', '&#233;': 'é', '&ecirc;': 'ê', '&#234;': 'ê', '&euml;': 'ë', '&#235;': 'ë', '&igrave;': 'ì', '&#236;': 'ì', '&iacute;': 'í', '&#237;': 'í', '&icirc;': 'î', '&#238;': 'î', '&iuml;': 'ï', '&#239;': 'ï', '&eth;': 'ð', '&#240;': 'ð', '&ntilde;': 'ñ', '&#241;': 'ñ', '&ograve;': 'ò', '&#242;': 'ò', '&oacute;': 'ó', '&#243;': 'ó', '&ocirc;': 'ô', '&#244;': 'ô', '&otilde;': 'õ', '&#245;': 'õ', '&ouml;': 'ö', '&#246;': 'ö', '&oslash;': 'ø', '&#248;': 'ø', '&ugrave;': 'ù', '&#249;': 'ù', '&uacute;': 'ú', '&#250;': 'ú', '&ucirc;': 'û', '&#251;': 'û', '&uuml;': 'ü', '&#252;': 'ü', '&yacute;': 'ý', '&#253;': 'ý', '&thorn;': 'þ', '&#254;': 'þ', '&yuml;': 'ÿ', '&#255;': 'ÿ', '&quot;': '"', '&#x27;': "'", '&reg;': '®', '&#39;': "'", '&lt;': '<', '&gt;': '>', '&amp;': '&', '&copy;': '©', '&#8220;': '“', '&#8221;': '”'}

const HEADERS = {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
        'referrer': 'https://www.google.com',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': '*',
        'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'pragma': 'no-cache',
        'connection': 'keep-alive',
        "headless": "False",
        "cache-control": "max-age=0"
    }

const DAYS_OF_WEEK = {
    dom: 0, sun: 0, 
    seg: 1, mon: 1,
    ter: 2, tue: 2,
    qua: 3, wed: 3,
    qui: 4, thu: 4,
    sex: 5, fri: 5,
    sab: 6, sáb: 6, sat: 6,
    tomorrow: -1, amanhã: -1
}

export { CURRENCY_SYMBOLS, ESCAPE_HTML_CHARACTERS, HEADERS, DAYS_OF_WEEK }