# WeTravelSite

This is a demo website used during the Adobe Summit Labs.  'We.Travel' is a fake site and made up brand and is in no way affiliated with Adobe Systems Inc.

## Prerequisites
 * You must have GIT installed: https://www.wikihow.tech/Install-Git-on-Mac
 * You must have DOCKER installed: https://docs.docker.com/docker-for-mac/install/

## Instructions for running Site on MacOS
1. Open Terminal
2. Edit your local host file as an Admin `sudo vi /etc/hosts`  _(enter admin password)_
3. Press the letter `i` to enter interactive or editing mode
4. Add the following line to the file:   `127.0.0.1            we.travel`
5. Press the `esc` key to exit interactive or editing mode
6. Save and close the file `:wq`
7. Change directory to the user's home:  `cd ~/Desktop`
8. Clone the repo to your local machine:  `git clone https://github.com/Adobe-Marketing-Cloud-Activation/WeRetailSite.git WeTravelSite`
9. Change direcory to the cloned site:  `cd WeTravelSite`
10. Make sure Docker is running and then start the docker container `docker run -d -p 80:80 --name summit-apache-php-app -v "$PWD":/var/www/html php:7.2-apache`
11. Open a browser and go the the site http://we.travel and you should see the fake site.

## Installing Adobe Launch on the site
1. Obtain and copy the *DEVELOPMENT* environment embed code from Adobe Launch
2. Navigate to the site directory on the Desktop and open the `WeTravelSite` folder.
3. Navigate to the `includes` directory
3. Edit the `header.php` file using a text or code editor.  (We recommend https://code.visualstudio.com/Download)
4. Paste the Launch embed code where the comments indicate it to be.  This file is included on every page of the site so doing this once will install it on the entrie WeTravel site.
5. Save the file and refresh the site in the browser.  View the source code to ensure it worked.

## Instructions on Stopping the Site
1. Open terminal
2. Issue the command `docker ps` to see the running containers
3. Copy the "Container ID" value
4. Stop the container using the following command: `docker stop [PASTE-CONTAINER-ID-HERE]`
4. Remove the container from the machine using the following command: `docker rm [PASTE-CONTAINER-ID-HERE]`

