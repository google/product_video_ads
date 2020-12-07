// Copyright 2020 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/3h3g5f237rt7dgvtrh/edit'
var SHEET_NAME = 'Campaigns'
var SLEEP_TIME_SECONDS = 60
var ACCOUNTS_LIMIT = 50

function main() {
  
  // It will run processAccount (for each account) for a total of 30 minutes
  // After that, will run finalize as MCC for another 30 minutes
  AdsManagerApp.accounts()
    .withLimit(ACCOUNTS_LIMIT)
    .executeInParallel('processAccount', 'finalize')
}
