# Demo Application

**Warning**: This is just a simple demo setup that is not suited for production use!

## Prerequisites

1. Get your mashine's IP address
1. Replace `IP_PLACEHOLDER` with your IP in `.env`.
1. Run `docker compose up postgres-keycloak keycloak nginx` from `./demo`
1. Wait until keycloak is ready. Look for "Listening on: http://0.0.0.0:8080." in the docker compose logs.
1. Go to http://<YOUR_IP>/auth
1. Login with `admin:admin`
1. Click on `create realm` in the upper left dropdown
1. Replace all occurences of `IP_PLACEHOLDER` in `keycloak/init_data/keycloak_masterportal_realm.json` with your mashine's IP address
1. Paste the content of `keycloak_masterportal_realm.json` into the input field in your browser
1. Click `create`
1. Stop the containers (e.g. `ctrl + c`)
1. Ensure sufficient permissions for `./form-backend/uploads/` (e.g. `chmod -R 777 form-backend/uploads`)

## Run Application

1. Run `docker compose up --build` from `./demo`
1. The application will be running on `http://<YOUR_IP>/form-backend/app/?formId=fountains_minimal&view=table`

Following applications are included:
- `/form-backend/app/?formId=fountains_minimal&view=table` - minimal configuration
- `/form-backend/app/?formId=fountains&view=table` - simple configuration of a single table with dropdown taken from a lookup table
- `/form-backend/app/?formId=fountains_advanced&view=table` - advanced kitchen sink configuration containing file uploads and join tables

## Integrate with Masterportal

1. Create a Masterportal instance that contains https://github.com/formcapture/masterportal-addons
1. Adjust your Masterportal configuration to include the addon with one of the links above
