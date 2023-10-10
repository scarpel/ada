from Utils.dataTypes import ScheduleOperators, ScheduleActions, createScheduleObj
from Utils.utils import lazySplit
from Exceptions.scheduleExceptions import InvalidSchedule
from Utils.dateUtils import get_date, get_time

operators = {":", ".", "/", "-", '"'}

def parseLine(line, index=0):
    line = line.strip() + " "
    scheduleStart, rawAction = lazySplit(line, 0, delimiter=" ")
    action = getAction(rawAction.lower())
    scheduleObj = {}

    if(action != ScheduleActions.NONE):
        lineLength = len(line)
        lastOperator = currentOperator = ScheduleOperators.NONE
        wordStart = index = scheduleStart
        scheduleObj[ScheduleOperators.ACTION] = action

        while(index<lineLength):
            char = line[index]

            if(char == " "):
                if(currentOperator == ScheduleOperators.NONE):
                    if(wordStart != index):
                        index, title = get_title(line, wordStart, index, lineLength, scheduleObj)
                        _parseTitle(title, scheduleObj)
                else:
                    if(currentOperator != ScheduleOperators.INTERVAL):
                        parseFunc = _operationParserTable.get(currentOperator, None)
                        if(parseFunc is not None):
                            if(lastOperator == ScheduleOperators.INTERVAL and ScheduleOperators.TIME in scheduleObj):
                                start, end = scheduleObj[ScheduleOperators.TIME]
                                if(end is None): 
                                    time = _parseTime(line[wordStart:index])
                                    scheduleObj[ScheduleOperators.TIME] = [start, time]
                                else: raise InvalidSchedule("Interval before date or after a pair of date")
                            else: parseFunc(line[wordStart:index], scheduleObj)

                        lastOperator = currentOperator
                        currentOperator = ScheduleOperators.NONE

                wordStart = index+1
            elif(char in operators):
                operatorArray = _operatorArrayTable.get(char, None)
                if(operatorArray is not None):
                    currentOperator, lastOperator = _handleOperation(operatorArray, currentOperator)
                else:
                    index += 1
                    wordEnd = line.find(char, index)
                    if(wordEnd != -1 and line[wordEnd+1] == " " and ScheduleOperators.TITLE not in scheduleObj):
                        scheduleObj[ScheduleOperators.TITLE] = line[index:wordEnd]
                        index = wordEnd
                        lastOperator = currentOperator
                        currentOperator = ScheduleOperators.TITLE
                    else: raise InvalidSchedule("More than one title or type of title found!")

            index += 1
    else: raise InvalidSchedule(f"The action '{rawAction}' isn't valid!")

    if(len(scheduleObj.keys()) == 4): return scheduleObj
    else: 
        print(scheduleObj)
        raise InvalidSchedule("It wasn't possible to find an action, title, date and time for your schedule!")

def getAction(word):
    if(word in {"add", "+"}):
        return ScheduleActions.ADD
    elif(word in {"del", "-"}):
        return ScheduleActions.DEL
    elif(word in {"mod"}):
        return ScheduleActions.MOD
    else: return ScheduleActions.NONE

def _handleOperation(operatorArray, currentOperator):
    if(currentOperator in operatorArray[0]):
        return operatorArray[1], currentOperator
    else: raise InvalidSchedule(f"You're using {operatorArray[1].name.lower()} the wrong way!")

_operatorArrayTable = {
    ":": [{ScheduleOperators.INTERVAL, ScheduleOperators.NONE}, ScheduleOperators.TIME],
    ".": [{ScheduleOperators.NONE, ScheduleOperators.DATE}, ScheduleOperators.DATE],
    "/": [{ScheduleOperators.NONE, ScheduleOperators.DATE}, ScheduleOperators.DATE],
    "-": [{ScheduleOperators.TIME}, ScheduleOperators.INTERVAL]
}

def _parseDate(word, scheduleObj):
    if(ScheduleOperators.DATE in scheduleObj): raise InvalidSchedule("More than one date was found!")

    array = word.split("." if "." in word else "/")
    if(array[-1] == ""): array.pop()

    if(len(array)<4):
        try:
            scheduleObj[ScheduleOperators.DATE] = get_date(*[int(item) for item in array])
        except:
            raise InvalidSchedule("Are you sure your date is correct?")
    else: raise InvalidSchedule("Your date was more than a day, month and year!")

def _parseTimes(word, scheduleObj):
    if(ScheduleOperators.TIME in scheduleObj): raise InvalidSchedule("More than one time found!")

    times = word.split("-")

    if(0<len(times)<3):
        try:
            start = _parseTime(times[0])
            end = _parseTime(times[1] if len(times) == 2 else None)
            scheduleObj[ScheduleOperators.TIME] = [start, end]
        except:
            raise InvalidSchedule("There's something wrong with your time!")

def _parseTime(time):
    if(time is None): return None

    hour, minute = time.split(":")
    try:
        return get_time(convert_to_int(hour), convert_to_int(minute))
    except:
        raise InvalidSchedule("There's something wrong with your time!")

def convert_to_int(word):
    if(word == ""): return 0
    else: return int(word)

def _parseTitle(word, scheduleObj):
    if(word == ""): return 

    if(is_date_then_parse(word, scheduleObj)):
        return
    else:
        if(ScheduleOperators.TITLE not in scheduleObj):
            scheduleObj[ScheduleOperators.TITLE] = word
        else: raise InvalidSchedule("More than one title found!")

def get_title(line, wordStart, currentIndex, lineLength, scheduleObj):
    if(is_date_then_parse(line[wordStart:currentIndex], scheduleObj)):
        wordStart = currentIndex+1
        gotDate = True
    else: gotDate = False

    lastSpaces = [currentIndex]
    currentIndex += 1
    char = line[currentIndex]

    while(currentIndex<lineLength and char not in operators):
        if(char == " "): lastSpaces.append(currentIndex)
        currentIndex += 1
        char = line[currentIndex]
    
    if(not gotDate and len(lastSpaces)>1 and is_date_then_parse(line[lastSpaces[-2]+1:lastSpaces[-1]], scheduleObj)):
        lastSpaces.pop

    return lastSpaces[-1], line[wordStart:lastSpaces[-1]]

def is_date_then_parse(word, scheduleObj):
    if(0<len(word)<3 and word.isdigit()):
        _parseDate(word, scheduleObj)
        return True
    else: return False

_operationParserTable = {
    ScheduleOperators.DATE: _parseDate,
    ScheduleOperators.TIME: _parseTimes
}