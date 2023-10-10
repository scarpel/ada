class InvalidSchedule(Exception):
    def __init__(self, *args, **kwargs):
        default_message = "Invalid schedule syntax! Try again."
        super().__init__(default_message, args, kwargs)