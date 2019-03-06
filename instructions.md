# Bahmni Connect - MNH Register

This repository acts as the front end for the **Bahmni Connect**. It is compeltely written in **AngularJS**.


# Build

Install the modules required globally (This is a one time task)

    npm install -g bower
    npm install -g grunt-cli
    gem install compass

You would have to run the following commands for Bahmni Connect front end project. Run these commands from the ui folder under Bahmni Connect front end project

    # Install node dependencies (Installed into node_modules).
    npm install
    # Set up UI component/dependencies (This installs all the UI dependencies into app/components)
    bower install

Chrome App (PWA):

PWA only works for  secure connection. That means, you need https connection to use PWA. Also, Google Chrome is the only recomended browser to use PWA.
To bundle PWA, run the following commands from ui folder under Bahmni Connect front end project

    # To genearte css files
    grunt compass
    # To minify and bundle PWA related source code
    grunt chrome
    # To generate service workers files
    grunt generate-sw

If you want to debug Connect PWA on your local machine, you should run "grunt devchrome" which will put unminified js files onto the "bahmni-connect/ui/dist/" location.
To run only tests related to PWA run the following command

    grunt karma:chrome

To access bahmni-connect apps on chrome hit https://<host name>/bahmni-connect


Android App:

    Checkout the bahmni-offline repository on GitHub. (Only require for android app)
    Follow the steps recomended in the README.md file of bahmni-offline project

    To bundle Android app, run the following commands from ui folder under Bahmni Connect front end project
    # To genearte css files
    grunt compass
    # To minify and bundle android app related source code
    grunt android
    Copy dist folder of bahmni-connect/ui folder to bahmni-offline/android/www/app

    Run the following command from bahmni-offline/android to install the android app on the device (The device should be connected to the system).
    ionic run android

    To run only front end tests related to android run the following command
    grunt karma:android