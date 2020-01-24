function show_video_info(element) {
  $('#video_info')
      .text('Video is ' + element.videoWidth + 'x' + element.videoHeight)
}

(function() {
document.onmousemove = handleMouseMove;
function handleMouseMove(event) {
  var eventDoc, doc, body;

  if (event.pageX == null && event.clientX != null) {
    eventDoc = (event.target && event.target.ownerDocument) || document;
    doc = eventDoc.documentElement;
    body = eventDoc.body;

    event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
    event.pageY = event.clientY +
        (doc && doc.scrollTop || body && body.scrollTop || 0) -
        (doc && doc.clientTop || body && body.clientTop || 0);
  }

  $('#info').text('X: ' + event.pageX + '  |  Y: ' + event.pageY)
}
})();

function drag_start(event) {
  event.dataTransfer.setData('text/plain', event.target.id)
}
function drag_over(event) {
  event.preventDefault();
  return false;
}

function drop_event(event) {
  var id = event.dataTransfer.getData('text/plain')
  var dm = document.getElementById(id);
  dm.style.left = event.clientX + 'px';
  dm.style.top = event.clientY + 'px';
  $('#' + id + '_element').html(event.clientX + ' / ' + event.clientY)
  event.preventDefault();
  return false;
}

$('#criar').click(() => {
  color = $('#color').val()
  size = $('#size').val()
  content = $('#text_content').val()
  width = $('#text_width').val()
  id = '' + Date.now()

  $('.container')
      .append(
          '<div id="' + id + '" draggable="true" style="color: ' + color +
          '; font-weight: bold; position: absolute; width: ' + width +
          'px; font-size: ' + size +
          'px; word-wrap: break-word; top:500px;left:500px;">' + content +
          '</div>')

  add_events(id, content);
})

$('#criar_image').click(() => {
  img_url = $('#img_url').val()
  width = $('#img_width').val()
  height = $('#img_height').val()
  id = '' + Date.now()

  $('.container')
      .append(
          '<img id="' + id + '" src="' + img_url +
          '" draggable="true" width=' + width + ' height=' + height +
          ' style="position: absolute; top:500px;left:500px;"/>')

  add_events(id, img_url.split('/').pop());
})

function add_events(id, name) {
  document.getElementById(id).addEventListener('dragstart', drag_start, false)
  document.body.addEventListener('dragover', drag_over, false)
  document.body.addEventListener('drop', drop_event, false)

  $('#elements')
      .append(
          '<br/><div style="font-weight: bold">' + name + '<div id="' + id +
          '_element"></div></div>')
}

$('#play').click(() => {
  const el = $('#vd1').get(0)

  if (el.paused)
  el.play()
  else el.pause()

  $('#second').val(el.currentTime.toFixed(1))
})

$('#gotosecond').click(() => {
  const el = $('#vd1').get(0)
  const second = $('#second').val()

  el.currentTime = second;
})

$('#secondback').click(() => {moveCurrentTime(-0.1)})

$('#secondforward').click(() => {moveCurrentTime(0.1)})

function moveCurrentTime(offset) {
  const el = $('#vd1').get(0)
  const second = (parseFloat($('#second').val()) + offset).toFixed(1)

  $('#second').val(second)
  el.currentTime = second
}

// Client ID and API key from the Developer Console
var CLIENT_ID =
    '82003315421-v6572ba1g7brds0umk9ovt4dlm5td5oc.apps.googleusercontent.com';
var API_KEY = 'AIzaSyAoPm0dMN4dHptkGJuy4Aj1Y_Y_P1tIKdk';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS =
    ['https://sheets.googleapis.com/$discovery/rest?version=v4'];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client
      .init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
      })
      .then(
          function() {
            // Listen for sign-in state changes.
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

            // Handle the initial sign-in state.
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
          },
          function(error) {
            appendPre(JSON.stringify(error, null, 2));
          });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
    loadProducts();
  } else {
    authorizeButton.style.display = 'block';
    signoutButton.style.display = 'none';
  }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
function loadProducts() {
  // Prices
  gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: '1p0mGUCP6nIeljP7Gd3hBpWFijfYvm1KC16cYmHxOweQ',
        range: 'Prices!B2:E2',
      })
      .then(
          function(response) {
            var range = response.result;

            if (range.values.length > 0) {
              var row = range.values[0];

              const product = {title: row[0], price: row[1], image: row[2]}

              appendPre(product);
            } else {
              appendPre('No Prices found.');
            }
          },
          function(response) {
            appendPre('Error: ' + response.result.error.message);
          })

  // Base Configs
  gapi.client.sheets.spreadsheets.values
      .get({
        spreadsheetId: '1p0mGUCP6nIeljP7Gd3hBpWFijfYvm1KC16cYmHxOweQ',
        range: 'Carr!A2:K',
      })
      .then(
          function(response) {
            var range = response.result;

            if (range.values.length > 0) {
              for (i = 0; i < range.values.length; i++) {
                var row = range.values[i];
                appendPre(row);
              }
            } else {
              appendPre('No products found.');
            }
          },
          function(response) {
            appendPre('Error: ' + response.result.error.message);
          })
}
