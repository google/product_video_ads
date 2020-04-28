"""Log handler to write to spreadsheet"""

from logging import StreamHandler

# This handler is initialized on spreadsheet_configuration
class SpreadsheetHandler(StreamHandler):

  LOG_LINES_LIMIT = 50
  
  def __init__(self, callback):
    StreamHandler.__init__(self)
    self.callback = callback
    self.position = 0

  def emit(self, record):
    self.position = (self.position % SpreadsheetHandler.LOG_LINES_LIMIT) + 1
    self.callback(self.format(record), self.position)
