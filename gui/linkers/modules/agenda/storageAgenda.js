import { AGENDA_EVENTS, AGENDA_TODOS } from "../consts/databaseConsts.js"
import { get_last_id } from "../utils/databaseUtils.js"

async function store_event(connection, agendaEvent, user_id, returnID=false){
    await connection.run(`INSERT INTO ${AGENDA_EVENTS} VALUES(?,?,?,?,?,?)`, [null, agendaEvent.title, agendaEvent.start_at, agendaEvent.end_at, agendaEvent.priority?agendaEvent.priority:1, user_id])

    if(returnID) return await get_last_id(connection, AGENDA_EVENTS)
}

async function store_todo(connection, user_id, title, date=moment().unix(), done=false, returnObj=false){
    await connection.run(`INSERT INTO ${AGENDA_TODOS} VALUES(?,?,?,?,?)`, [null, title, date, done?1:0, user_id])
    let id = await get_last_id(connection, AGENDA_TODOS)
    return returnObj? {id, title, date, done, user_id}: id
}

function update_todo(connection, id, field, value){
    return connection.run(`UPDATE ${AGENDA_TODOS} SET ${field} = ? WHERE id=${id}`, [value])
}

function remove_todo(connection, id){
    return connection.run(`DELETE FROM ${AGENDA_TODOS} WHERE id=${id}`)
}

function remove_event(connection, eventID){
    return connection.run(`DELETE FROM ${AGENDA_EVENTS} WHERE id=${eventID}`)
}

function update_value(connection, id, field, value){
    return connection.run(`UPDATE ${AGENDA_EVENTS} SET ${field} = ? WHERE id=${id}`, [value])
}

async function retrieve_event(connection, id){
    return await connection.get(`SELECT * FROM ${AGENDA_EVENTS} WHERE id=${id}`)
}

async function retrieve_events(connection, user_id){
    return await connection.all(`SELECT * FROM ${AGENDA_EVENTS} WHERE user_id=?`, [user_id])
}

async function retrieve_todos(connection, user_id){
    return await connection.all(`SELECT * FROM ${AGENDA_TODOS} WHERE user_id=?`, [user_id])
}

async function retrieve_month_events(connection, startDate, endDate, user_id){
    return await connection.all(`SELECT * FROM ${AGENDA_EVENTS} WHERE user_id=? AND start_at>=${startDate} AND start_at<${endDate} ORDER BY start_at`, [user_id])
}

async function select_events_that_match(connection, agendaEvent, user_id){
    let {title, ...others} = agendaEvent

    let keys = Object.keys(others)
    let values = []
    let queries = []
    let length = keys.length

    for(let i=0; i<length; i++){
        let key = keys[i]
        let value = agendaEvent[key]
        if(value){
            values.push(value)
            queries.push(`${key}=?`)
        }
    }

    if(title){
        queries.push(`title COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ?`)
        values.push(`%${title}%`)
    }

    if(queries.length>0){
        return await connection.all(`SELECT * FROM ${AGENDA_EVENTS} WHERE user_id=? AND ${queries.join(" AND ")} ORDER BY start_at`, [user_id, ...values])
    }else return []
}

async function retrieve_intersected_events(connection, firstDayTimestamp, user_id){
    return await connection.all(`SELECT * FROM ${AGENDA_EVENTS} WHERE user_id=? AND start_at<? AND end_at>=?`, [user_id, firstDayTimestamp, firstDayTimestamp])
}

export { store_event, remove_event, update_value, retrieve_event, retrieve_events, retrieve_month_events, 
    select_events_that_match, store_todo, update_todo, remove_todo, retrieve_todos, retrieve_intersected_events}