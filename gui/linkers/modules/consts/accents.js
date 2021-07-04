const ACCENTS =  {
    á: "a" ,
    à: "a" ,
    ã: "a" ,
    â: "a" ,
    À: "a" ,
    Á: "a" ,
    Ã: "a" ,
    Â: "a" ,
    é: "e" ,
    è: "e" ,
    ê: "e" ,
    É: "e" ,
    È: "e" ,
    Ê: "e" ,
    í: "i" ,
    ì: "i" ,
    î: "i" ,
    Í: "i" ,
    Ì: "i" ,
    Î: "i" ,
    ó: "o" ,
    ò: "o" ,
    ô: "o" ,
    õ: "o" ,
    Ó: "o" ,
    Ò: "o" ,
    Ô: "o" ,
    Õ: "o" ,
    ú: "u" ,
    ù: "u" ,
    û: "u" ,
    ü: "u" ,
    Ú: "u" ,
    Ù: "u" ,
    Û: "u" ,
    Ü: "u" ,
    ñ: "n" ,
    Ñ: "n" ,
    ç: "c" ,
    Ç: "c",
    '-': " ",
    ":": ""
} 

function remove_accents(lowerWord){
    let arr = []
    let length = lowerWord.length

    for(let i=0; i<length; i++){
        let char = lowerWord[i]
        let normalize = ACCENTS[char]

        arr.push(normalize !== undefined? normalize:char)
    }


    return arr.join("")
}

export { ACCENTS, remove_accents }