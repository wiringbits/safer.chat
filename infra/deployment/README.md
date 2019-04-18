# Deployment

This folder contains all the required scripts to deploy the projects.

These scripts were tested with ansible 2.6.4, higher versions should work too, it might not work with smaller versions.

## Run
Execute the following commands to deploy the applications:
- chat-server: `ansible-playbook -i production-hosts.ini --vault-password-file .vault chat-server.yml --ask-become-pass`
- frontend: `ansible-playbook -i production-hosts.ini --vault-password-file .vault frontend.yml --ask-become-pass`
