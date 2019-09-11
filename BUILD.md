Use following instructions (the exact mechanism for doing step 1 would depend on the OS you are using, we have mentioned for mac).

    Install Xcode and npm

    Install the following modules required globally (This is a one time task)
    npm install -g bower
    npm install -g grunt-cli
    gem install compass
    Checkout the bahmni-connect repository on GitHub

    You would have to run the following commands for Bahmni Connect front end project. Run these commands from the ui folder under Bahmni Connect front end project
    # Install node dependencies (Installed into node_modules).
    npm install
    # Set up UI component/dependencies (This installs all the UI dependencies into app/components)
    bower install
    Checkout the bahmni-offline repository on GitHub. (Only require for android app)

    Run this command from Bahmni connect front end project folder for creating a symlink into your vagrant /var/www:
    # links dist folder
    ./scripts/vagrant-link.sh

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


