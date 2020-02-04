"""Log handler to write to spreadsheet"""

from logging import StreamHandler

# This handler is initialized on spreadsheet_configuration
class SpreadsheetHandler(StreamHandler):
  
  def __init__(self, callback):
    StreamHandler.__init__(self)
    self.callback = callback

  def emit(self, record):
    self.callback(self.format(record))
