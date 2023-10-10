import { createElement } from "../modules/utils/htmlUtils.js"

export default class OddPageSelector{
    currentPageNumber = undefined
    pageSelector = undefined
    pageNumbers = undefined
    currentPageDiv = undefined
    hasArrows = false
    goToFunction = this._goToWithArrows

    constructor(totalNumPages, numPagesSelectors=3, startAt=1, onChangeFunction=()=>{}){
        if(numPagesSelectors%2 !== 0){
            this.numPagesSelectors = numPagesSelectors
            this.totalNumPages = totalNumPages
            let middle = Math.ceil(numPagesSelectors/2)
            this.upperLimit = totalNumPages-middle+1
            this.lowerLimit = middle
            this.callbackFunction = onChangeFunction
            return this.createPageSelector(startAt)
        }else throw "Number of pages selectors must be an odd number!"
    }

    _goTo = (pageNumber) => {
        this.currentPageDiv.classList.remove("selected-page")
        this.currentPageDiv = this.pageNumbers.children[pageNumber-1]
        this.currentPageDiv.classList.add("selected-page")

        this._handlePageChange(pageNumber)
    }

    _goToWithArrows = (pageNumber) => {
        let currentPage = this.currentPageDiv.value
        let children = this.pageNumbers.children
        let indexToSelect, addPageNumber

        if(pageNumber<this.lowerLimit){
            if(currentPage>this.lowerLimit){
                let difference = currentPage-this.lowerLimit
                addPageNumber = children[0].value+1
                for(let i=0; i<difference; i++) addPageNumber = this._handleLeftGrow(children, addPageNumber)
            }

            indexToSelect = pageNumber-1
        }else if(pageNumber>this.upperLimit){
            if(currentPage<this.upperLimit){
                let difference = this.upperLimit-currentPage
                addPageNumber = children[children.length-1].value+1
                for(let i=0; i<difference; i++) addPageNumber = this._handleRightGrow(children, addPageNumber)
            }

            indexToSelect = this.numPagesSelectors-(this.totalNumPages-pageNumber)-1
        }else{
            let difference = currentPage-pageNumber
            let func

            if(!((currentPage<this.lowerLimit && pageNumber === this.lowerLimit) || (currentPage>this.upperLimit && pageNumber === this.upperLimit))){
                if(difference>0){
                    func = this._handleLeftGrow
                    addPageNumber = children[0].value-1
                }else{
                    func = this._handleRightGrow
                    difference *= -1
                    addPageNumber = children[children.length-1].value+1
                }
    
                for(let i=0; i<difference; i++){
                    addPageNumber = func(children, addPageNumber)
                }
            }

            indexToSelect = this.lowerLimit-1
        }

        this.currentPageDiv.classList.remove("selected-page")
        this.currentPageDiv = children[indexToSelect]
        this.currentPageDiv.classList.add("selected-page")

        this._handlePageChange(pageNumber)
    }

    _handlePageChange = (pageNumber) => {
        this.callbackFunction(pageNumber)

        if(this.hasArrows){
            this.leftArrow.disabled = pageNumber === 1
            this.rightArrow.disabled = pageNumber === this.totalNumPages
        }
    }

    _handleLeftGrow = (children, pageNumber) => {
        children[children.length-1].remove()
        this.pageNumbers.prepend(this._createPageNumber(pageNumber))
        return pageNumber-1
    }

    _handleRightGrow = (children, pageNumber) => {
        children[0].remove()
        this.pageNumbers.append(this._createPageNumber(pageNumber))
        return pageNumber+1
    }

    next = () => { this.goToFunction(this.currentPageDiv.value+1) }

    previous = () => { this.goToFunction(this.currentPageDiv.value-1) }

    _createPageNumber = (value) => {
        let div = createElement("div", "odd-page-number")
        div.innerText = value
        div.value = value
        div.onclick = () => {this.goToFunction(value)}

        return div
    }

    createPageSelector = (startAt) => {
        if(this.pageSelector) return this.pageSelector
        
        this.pageSelector = createElement("div", "odd-page-selector")
        this.pageNumbers = createElement("div", "odd-page-numbers")

        if(this.totalNumPages<=this.numPagesSelectors){
            this.goToFunction = this._goTo

            for(let i=1; i<=this.totalNumPages; i++){
                this.pageNumbers.append(this._createPageNumber(i))
            }

            this.currentPageDiv = this.pageNumbers.children[startAt-1]
            this.pageSelector.append(this.pageNumbers)
        }else{
            this.leftArrow = this._createArrow("<", this.previous)
            this.rightArrow = this._createArrow(">", this.next)
            this.hasArrows = true
            this.goToFunction = this._goToWithArrows

            this.pageSelector.append(this.leftArrow)
            this.pageSelector.append(this.pageNumbers)
            this.pageSelector.append(this.rightArrow)

            if(startAt<=this.lowerLimit){
                for(let i=1; i<=this.numPagesSelectors; i++){
                    this.pageNumbers.append(this._createPageNumber(i))
                }
    
                this.currentPageDiv = this.pageNumbers.children[startAt-1]
            }else if(startAt>this.upperLimit){
                let count = this.totalNumPages - this.numPagesSelectors+1

                for(let i=0; i<this.numPagesSelectors; i++){
                    this.pageNumbers.append(this._createPageNumber(count++))
                }
                
                this.currentPageDiv = this.pageNumbers.children[this.numPagesSelectors-(this.totalNumPages-startAt)-1]
            }else{
                let count = startAt-this.lowerLimit+1
                for(let i=0; i<this.numPagesSelectors; i++){
                    this.pageNumbers.append(this._createPageNumber(count++))
                }
    
                this.currentPageDiv = this.pageNumbers.children[this.lowerLimit-1]
            }
        }

        this.currentPageDiv.classList.add("selected-page")
        this._handlePageChange(startAt)
        return this.pageSelector
    }

    _createArrow = (text, onClickFunction) => {
        let div = createElement("button", "odd-page-arrow")
        div.innerText = text
        div.onclick = onClickFunction

        return div
    }
}