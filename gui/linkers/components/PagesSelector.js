import { createElement } from "../modules/utils/htmlUtils.js"

export default class PagesSelector{
    nextBtn = createElement("button", "next-btn")
    previousBtn = createElement("button", "previous-btn")

    constructor(length, updateFunction, startAt=0){
        this.length = length-1
        this.index = startAt
        this.handleChange()

        return this.createPagesSelector(updateFunction)
    }

    createPagesSelector = (updateFunction) => {
        let base = createElement("div", "pages-selector")

        this.nextBtn.innerText = "Next Page >"
        this.nextBtn.onclick = () => { this.next(updateFunction) }

        this.previousBtn.innerText = "< Previous Page"
        this.previousBtn.onclick = () => { this.previous(updateFunction) }

        base.append(this.previousBtn)
        base.append(this.nextBtn)

        return base
    }

    next = (updateFunction) => {
        if(this.index<this.length){
            this.index++
            updateFunction(this.index)
            this.handleChange()
        }
    }

    previous = (updateFunction) => {
        if(this.index>0){
            this.index--
            updateFunction(this.index)
            this.handleChange()
        }
    }

    handleChange = () => {
        if(this.index === 0){
            this.previousBtn.disabled = true
            this.nextBtn.disabled = false
        }else if(this.index === this.length){
            this.previousBtn.disabled = false
            this.nextBtn.disabled = true
        }else{
            this.previousBtn.disabled = false
            this.nextBtn.disabled = false
        }
    }
}