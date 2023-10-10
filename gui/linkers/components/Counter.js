export default class Counter{
    minusBtn = document.createElement("button")
    addBtn = document.createElement("button")
    text = document.createElement("input")

    constructor(initialValue = 0, minValue = undefined, maxValue = undefined, onChange=()=>{}){
        this.initialValue = initialValue
        this.minValue = minValue
        this.maxValue = maxValue
        this.onChange = onChange

        this.reset()
    }

    reset = () => {
        this.currentValue = this.initialValue
        this.text.value = this.currentValue
        this.handleValueChange()
    }

    changeValue = (value) => {
        this.text.value = value
        this.handleChange({target:{value}})
    }

    handleValueChange = () => {
        this.addBtn.disabled = this.currentValue === this.maxValue
        this.minusBtn.disabled = this.currentValue === this.minValue
    }

    handleChange = (event) => {
        if(event){
            let value = Number(event.target.value)
            if(isNaN(value) || value<this.minValue || value>this.maxValue) this.text.value = this.currentValue
            else{
                this.currentValue = value
                this.handleValueChange()
                this.onChange(value)
            }
        }
    }

    increment = () => {
        this.currentValue++
        if(this.currentValue === this.maxValue) this.addBtn.disabled = true
        else if(this.minusBtn.disabled) this.minusBtn.disabled = false

        this.text.value = this.currentValue
        this.onChange(this.currentValue)
    }

    decrement = () => {
        this.currentValue--
        if(this.currentValue === this.minValue) this.minusBtn.disabled = true
        else if(this.addBtn.disabled) this.addBtn.disabled = false

        this.text.value = this.currentValue
        this.onChange(this.currentValue)
    }

    createCounter = (id=undefined) => {
        let counter = document.createElement("div")
        counter.className = "counter"
        if(id) counter.id = id

        this.addBtn.className = "counter-add-btn"
        this.addBtn.onclick = this.increment
        this.addBtn.innerHTML = "+"
        if(this.currentValue === this.minValue) this.minusBtn.disabled = true
        
        this.minusBtn.className = "counter-minus-btn"
        this.minusBtn.onclick = this.decrement
        this.minusBtn.innerHTML = "-"
        if(this.currentValue === this.maxValue) this.addBtn.disabled = true

        this.text.type = "text"
        this.text.className = "counter-text"
        this.text.value = this.initialValue
        this.text.onchange = this.handleChange

        counter.append(this.minusBtn)
        counter.append(this.text)
        counter.append(this.addBtn)

        return counter
    }

    onChange = (func) => {this.onChange = func}
}