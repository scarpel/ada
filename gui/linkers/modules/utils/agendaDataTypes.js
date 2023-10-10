function AgendaEvent(title, start_at=undefined, end_at=undefined, priority=undefined){
    return {
        title,
        start_at, 
        end_at,
        priority
    }
}

const PRIORITY_TEXTS = {
    1: "Normal",
    2: "Important",
    3: "Very Important"
}

export { AgendaEvent, PRIORITY_TEXTS }