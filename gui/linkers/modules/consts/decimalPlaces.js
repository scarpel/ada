const decimal_places = {"USD":2,"$":2,"CAD":2,"CA$":2,"EUR":2,"€":2,"AED":2,"د.إ.‏":2,"AFN":0,"Af":0,"؋":0,
"ALL":0,"Lek":0,"AMD":0,"դր.":0,"ARS":2,"AR$":2,"AUD":2,"AU$":2,"AZN":2,"man.":2,"ман.":2,"BAM":2,"KM":2,
"BDT":2,"Tk":2,"৳":2,"BGN":2,"лв.":2,"BHD":3,"BD":3,"د.ب.‏":3,"BIF":0,"FBu":0,"BND":2,"BN$":2,"BOB":2,"Bs":2,
"BRL":2,"R$":2,"BWP":2,"P":2,"BYN":2,"Br":2,"руб.":2,"BZD":2,"BZ$":2,"CDF":2,"FrCD":2,"CHF":2,"CLP":0,"CL$":0,
"CNY":2,"CN¥":2,"COP":0,"CO$":0,"CRC":0,"₡":0,"CVE":2,"CV$":2,"CZK":2,"Kč":2,"DJF":0,"Fdj":0,"DKK":2,"Dkr":2,
"kr":2,"DOP":2,"RD$":2,"DZD":2,"DA":2,"د.ج.‏":2,"EEK":2,"Ekr":2,"EGP":2,"ج.م.‏":2,"ERN":2,"Nfk":2,"ETB":2,"GBP":2,
"£":2,"GEL":2,"GHS":2,"GH₵":2,"GNF":0,"FG":0,"GTQ":2,"Q":2,"HKD":2,"HK$":2,"HNL":2,"L":2,"HRK":2,"kn":2,"HUF":0,
"Ft":0,"IDR":0,"Rp":0,"ILS":2,"₪":2,"INR":2,"Rs":2,"টকা":2,"IQD":0,"د.ع.‏":0,"IRR":0,"﷼":0,"ISK":0,"Ikr":0,"JMD":2,
"J$":2,"JOD":3,"JD":3,"د.أ.‏":3,"JPY":0,"¥":0,"￥":0,"KES":2,"Ksh":2,"KHR":2,"៛":2,"KMF":0,"CF":0,"FC":0,"KRW":0,"₩":0,
"KWD":3,"KD":3,"د.ك.‏":3,"KZT":2,"тңг.":2,"LBP":0,"LB£":0,"ل.ل.‏":0,"LKR":2,"SLRs":2,"SL Re":2,"LTL":2,"Lt":2,"LVL":2,
"Ls":2,"LYD":3,"LD":3,"د.ل.‏":3,"MAD":2,"د.م.‏":2,"MDL":2,"MGA":0,"MKD":2,"MMK":0,"K":0,"MOP":2,"MOP$":2,"MUR":0,
"MURs":0,"MXN":2,"MX$":2,"MYR":2,"RM":2,"MZN":2,"MTn":2,"NAD":2,"N$":2,"NGN":2,"₦":2,"NIO":2,"C$":2,"NOK":2,"Nkr":2,
"NPR":2,"NPRs":2,"नेरू":2,"NZD":2,"NZ$":2,"OMR":3,"ر.ع.‏":3,"PAB":2,"B/.":2,"PEN":2,"S/.":2,"PHP":2,"₱":2,"PKR":0,
"PKRs":0,"₨":0,"PLN":2,"zł":2,"PYG":0,"₲":0,"QAR":2,"QR":2,"ر.ق.‏":2,"RON":2,"RSD":0,"din.":0,"дин.":0,"RUB":2,
"₽.":2,"RWF":0,"FR":0,"SAR":2,"SR":2,"ر.س.‏":2,"SDG":2,"SEK":2,"Skr":2,"SGD":2,"S$":2,"SOS":0,"Ssh":0,"SYP":0,
"SY£":0,"ل.س.‏":0,"THB":2,"฿":2,"TND":3,"DT":3,"د.ت.‏":3,"TOP":2,"T$":2,"TRY":2,"TL":2,"TTD":2,"TT$":2,"TWD":2,
"NT$":2,"TZS":0,"TSh":0,"UAH":2,"₴":2,"UGX":0,"USh":0,"UYU":2,"$U":2,"UZS":0,"VES":2,"Bs.":2,"VND":0,"₫":0,
"XAF":0,"FCFA":0,"XOF":0,"CFA":0,"YER":0,"YR":0,"ر.ي.‏":0,"ZAR":2,"R":2,"ZMK":0,"ZK":0,"ZWL":0,"ZWL$":0, "CDN$":2}

const getDecimalPlaces = (symbol) => {
    return decimal_places[symbol]
}

export { decimal_places, getDecimalPlaces }