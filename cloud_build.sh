apt-get remove docker docker-engine docker.io containerd runc
apt-get update  
apt-get install \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install docker-ce docker-ce-cli containerd.io


gcloud services enable \
  drive.googleapis.com \
  script.googleapis.com \
  sheets.googleapis.com \
  youtube.googleapis.com \
  storagetransfer.googleapis.com \
  container.googleapis.com






# Creation of Drive, Sheets and Appscript
apt-get install python3-pip nodejs npm gettext -y
set -o allexport
pip3 install --upgrade google-auth-oauthlib google-api-python-client oauth2client
pip3 install --upgrade google-cloud-storage

python3 setup.py --env-out='/tmp/pva.env' --build="pva-cloud-build-tokens.token_frontend" && source /tmp/pva.env
set +o allexport

echo $SPREADSHEET_ID

cd frontend
sh install-cloud.sh $FRONTEND_CLIENT_ID $FRONTEND_API_KEY
cd ..

cd video-generator
sh install-cloud.sh "pva-cloud-build-tokens/token_backend"
cd ..

# Important reminder
APP_URL=$(gcloud app browse --no-launch-browser)
INSTRUCTIONS="
${RED}
#############################################################################

██ ███    ███ ██████   ██████  ██████  ████████  █████  ███    ██ ████████ 
██ ████  ████ ██   ██ ██    ██ ██   ██    ██    ██   ██ ████   ██    ██    
██ ██ ████ ██ ██████  ██    ██ ██████     ██    ███████ ██ ██  ██    ██    
██ ██  ██  ██ ██      ██    ██ ██   ██    ██    ██   ██ ██  ██ ██    ██    
██ ██      ██ ██       ██████  ██   ██    ██    ██   ██ ██   ████    ██    
                                                                           
#############################################################################
${NC}
${BOLD}Ensure your Web OAuth Client has authorized the following URL BEFORE launching the app.${NORMAL}

${BLUE}$APP_URL/${NC}

1. Go to 'APIs & Services' > Credentials (https://console.cloud.google.com/apis/credentials).
2. Click your Web Client under 'OAuth 2.0 Client IDs'.
3. Add the URI to '${BOLD}Authorized JavaScript origins${NORMAL}' and '${BOLD}Authorized redirect URIs${NORMAL}'.
4. Click 'Save'.
"

echo -e "$INSTRUCTIONS"
echo "Your application was installed successfully! To login go to:"
echo -e "\n${BLUE}$APP_URL/${NC}\n"
echo -e "Sheet Id: $SPREADSHEET_ID"

