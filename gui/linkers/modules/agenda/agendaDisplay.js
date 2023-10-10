import { createElement } from "../utils/htmlUtils.js"
import  ToDo  from "../../components/Todo.js"

function displayTodos(div, undoneTodos, todayTodos, onBlurFunction=()=>{}, onCheckedFunction = () => {}, newTodoFunction=() => {}, removeFunc=() => {}){
    let left = createTodoDiv("left-todos", "Left To Do's", undoneTodos, onBlurFunction, onCheckedFunction, removeFunc)
    verifyTodoItems(left, "Nothing left to do!")
    div.append(left)

    let today = createTodoDiv("today-todos", "Today To Do's", todayTodos, onBlurFunction, onCheckedFunction, removeFunc)
    verifyTodoItems(today, "Nothing to do!<br>Click in the + or use 'todo' in the Quick Agenda field to add a new to do")

    let addBtn = createElement("button", "add-todo-btn")
    addBtn.innerText = "+"
    addBtn.onclick = () => {newTodoFunction()}

    today.children[0].append(addBtn)
    div.append(today)
}

function verifyTodoItems(div, emptyMessage){
    let todosDiv = div.children[1]
    if(todosDiv.children.length === 0) todosDiv.classList.add("no-todo")
}

function addEmptyMessage(div, message){
    let text = createElement("h1", "todo-empty-message")
    text.innerHTML = message
    div.append(text)
}

function createTodoDiv(id, title, todos, onBlurFunction=()=>{}, onCheckedFunction=()=>{}, removeFunc=()=>{}, addDelay=true){
    let base = createElement("div", "todos")

    let topDiv = createElement("div", "todos-top")
    base.append(topDiv)

    let titleDiv = createElement("h1", "todos-title")
    titleDiv.innerText = title
    topDiv.append(titleDiv)

    let todosDiv = createElement("div", "todos-items", id)
    getTodoItems(todos, todosDiv, onBlurFunction, onCheckedFunction, removeFunc, addDelay)
    base.append(todosDiv)

    return base
}

function getTodoItems(todos, div, onBlurFunction, onCheckedFunction, removeFunc, addDelay=true){
    let keys = Object.keys(todos)
    let length = keys.length

    if(length>0){
        if(addDelay){
            for(let i=0, step=0; i<length; i++, step += 0.1){
                let todo = ToDo(todos[keys[i]], onBlurFunction, onCheckedFunction, removeFunc)
                todo.style.webkitAnimationDelay = `${step}s`
                div.append(todo)
            }
        }else{
            for(let i=0; i<length; i++) div.append(ToDo(todos[keys[i]], onBlurFunction, onCheckedFunction, removeFunc))
        }
    }
}

export { displayTodos, getTodoItems }