class DTNode{
    evaluate = () => {}

    toString = () => ""
}

class DecisionTreeNode extends DTNode{
    constructor(question, leftNode, rightNode){
        super()
        this.question = question
        this.left = leftNode
        this.right = rightNode
    }

    evaluate = (row) => this.question.evaluate(row)? this.left.evaluate(row): this.right.evaluate(row)

    toString = (decimalPlaces=2) => `Q(${this.question.column},${this.question.value})${this.left.toString(decimalPlaces)}${this.right.toString(decimalPlaces)}`
}

class DecisionTreeLeaf extends DTNode{
    constructor(answer){
        super()
        this.answer = answer
    }

    evaluate = (row) => this.answer

    toString = (decimalPlaces=2) => `A(${this.answer.toFixed(decimalPlaces)})`
}

class Question{
    constructor(column, value){
        this.column = column
        this.value = value
    }

    evaluate = (row) => (row[this.column]||0) < this.value 
}

function getArrayOfValues(values){
    let arr = []
    for(let i=0; i<values; i++) arr.push(i)
    return arr
}

function treat_set_values(values){
    values = values.sort((a,b) => a<b?-1:1)
    let means = [], sum=0, count=0

    for(let i=0, length=values.length; i<length; i++){
        sum += values[i]
        count++
        if(count === 2){
            means.push(Math.ceil(sum/count))
            count = 0
            sum = values[i]
        }
    }

    if(count !== 0) means.push(Math.ceil(sum/2))

    return means
}

function get_treated_values(rows, columns){
    let sets = [], numberColumns = columns.length, numberRows = rows.length

    for(let i=0; i<numberColumns; i++) sets[i] = new Set()

    for(let i=0; i<numberRows; i++){
        for(let j=0; j<numberColumns; j++){
            sets[j].add(rows[i][columns[j]])
        }
    }

    return sets.map(set => treat_set_values([...set]))
}

function separate_data(rows, question){
    let trueValues=[[], []], falseValues=[[],[]]
    let lastIndex = rows[0].length-1

    for(let i=0, rowLength=rows.length; i<rowLength; i++){
        let row = rows[i]
        if(question.evaluate(row)) row[lastIndex]? trueValues[0].push(row): trueValues[1].push(row)
        else row[lastIndex]? falseValues[0].push(row): falseValues[1].push(row)
    }

    return [trueValues, falseValues]
}

function binary_separation(values){
    let trueValues=[], falseValues=[]
    let lastIndex = values[0].length-1

    for(let i=0, rowLength=values.length; i<rowLength; i++){
        let row = values[i]
        if(row[lastIndex]) trueValues.push(row)
        else falseValues.push(row)
    }

    return [trueValues, falseValues]
}

function leaf_gini(values, total){
    return 1 - (values[0].length/total)**2 - (values[1].length/total)**2
}

function gini(trueValues, falseValues){
    let totalTrue = trueValues[0].length + trueValues[1].length
    let totalFalse = falseValues[0].length + falseValues[1].length
    let total = totalTrue + totalFalse

    return (totalTrue*leaf_gini(trueValues, totalTrue) + totalFalse*leaf_gini(falseValues, totalFalse))/total
}

function find_best_question(rows, columns){
    let bestQuestion = undefined, bestGini = 1, bestPartitions=[], bestColumn = undefined

    if(columns.length>0){
        let column_treated_values = get_treated_values(rows, columns)

        for(let i=0, columnsLength=columns.length; i<columnsLength; i++){
            let columnValues = column_treated_values[i]
            let column = columns[i]

            for(let j=0, cLength=columnValues.length; j<cLength; j++){
                let question = new Question(column, columnValues[j])
                let [trueValues, falseValues] = separate_data(rows, question)
    
                if((trueValues[0].length + trueValues[1].length) !== 0 && (falseValues[0].length + falseValues[1].length) !== 0){
                    let totalGini = gini(trueValues, falseValues)

                    if(totalGini !== 0 && totalGini<bestGini){
                        bestGini = totalGini
                        bestQuestion = question
                        bestPartitions = [trueValues, falseValues]
                        bestColumn = i
                    }
                }
            }
        }
    }

    return [bestGini, bestQuestion, bestPartitions, bestColumn]
}

function non_destructive_splice(array, index){
    return [...array.slice(0, index), ...array.slice(index+1)]
}

function build_decision_tree(rows, columns=undefined, alreadySeparated=false){
    if(!columns) columns = getArrayOfValues(rows[0].length-1)
    let currentImpurity = 1, numberTrueNodes = 0

    if(alreadySeparated){
        currentImpurity = leaf_gini(rows, rows[0].length+rows[1].length)
        numberTrueNodes = rows[0].length
        rows = [...rows[0], ...rows[1]]
    }else{
        let separated =  binary_separation(rows)
        numberTrueNodes = separated[0].length
        currentImpurity = leaf_gini(separated, rows.length)
    }

    // if(currentImpurity === 0) currentImpurity = 1

    let [bestGini, bestQuestion, bestPartitions, bestColumn] = find_best_question(rows, columns)
    
    if(bestQuestion && bestGini<currentImpurity){
        let [trueValues, falseValues] = bestPartitions
        let newColumn = columns.length>1?non_destructive_splice(columns, bestColumn):[]

        return new DecisionTreeNode(bestQuestion, build_decision_tree(trueValues, newColumn, true), build_decision_tree(falseValues, newColumn, true))
    }else return new DecisionTreeLeaf(numberTrueNodes/rows.length)
}

function build_decision_tree_from_str(str){
    let index = 0
    let endStr = str.length
    let nodes = []
    let nodesLength = 0

    while(index<endStr){
        let start = str.indexOf("(", index)
        let end = str.indexOf(")", start)

        if(str[start-1] === "Q"){
            let [column, value] = str.slice(start+1, end).split(",")
            nodes.push(new DecisionTreeNode(new Question(parseInt(column), Number(value)), undefined, undefined))
            nodesLength++
        }else{
            let value = parseFloat(str.slice(start+1, end))
            let leaf = new DecisionTreeLeaf(value)
            let node = nodes[nodesLength-1]

            if(nodesLength>1){
                while(node.left){
                    node.right = leaf
                    leaf = node
                    nodes.pop()
                    nodesLength--
                    node = nodes[nodesLength-1]
                    if(nodesLength === 0) return leaf
                }
        
                node.left = leaf
            }else{
                if(node){
                    if(node.left){
                        node.right = leaf
                        return node
                    }else node.left = leaf
                }else return leaf
            }
        }
        
        index = end+1
    }

    return nodes.pop()
}

export { build_decision_tree, build_decision_tree_from_str }