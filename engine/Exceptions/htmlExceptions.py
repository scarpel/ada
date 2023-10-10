class InvalidHTML(Exception):
    def __int__(self, *args, **kwargs):
        default_message = "Invalid HTML syntax! Check the code and try again."

        if not (args or kwargs): args = (default_message,)

        super().__init__(*args, **kwargs)