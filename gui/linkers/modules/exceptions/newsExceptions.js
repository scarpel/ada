class InvalidHTML extends Error{
    constructor(message){
        super(message? message: "Invalid HTML syntax! Check the code and try again.")
        this.name = "Invalid HTML"
    }
}

export { InvalidHTML }