## Changes in core code
* Added 'Plugins' directory in ui/app
    * Nepali calendar plugins
** Nepali date converter
** Custom control for offline
** Html files for custom dashboard

## Build instructions
### Install bower, grunt and compass globally
    npm install -g bower
    npm install -g grunt-cli
    gem install compass

### Install node dependencies (Installed into node_modules).
    npm install

### Set up UI component/dependencies (This installs all the UI dependencies into app/components)
    bower install
    
### Chrome App (PWA):
    To bundle PWA, run the following commands from ui folder under Bahmni Connect front end project
    # To genearte css files
    grunt compass
    # To minify and bundle PWA related source code
    grunt chrome
    # To generate service workers files
    grunt generate-sw
