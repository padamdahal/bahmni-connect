# Bahmni Connect with Nepal Plugins

[Original README.MD from Bahmni Connect](https://github.com/Bahmni/bahmni-connect/blob/master/README.md)

## Changes - Nepal Plugins features
* Plugins directory in directory structure with nepali date libraries, custom display control, custom patient dashboard
* Nepali Date picker to all Date type form fields
* Convert selected nepali date to ISO date and fills the corresponding date fields (Nepali Date is not saved!)
* Convert all date values to Nepali in patient dashboard
* Define oneTimeObs in clinical/app.json, this displays the existing values and disables input fields and options during recording of observations (for current visit)
* Define conceptsToCheckForPreviousObs in clinical/app.json this checks for previously recorded observations if found disables the answer options
* Define callFunction in clinical/app.json. This feature allows to call the specified funtion (defined in nepalPlugins.js, displayControl app) for a concept to help user to make decision.

# Code Changes
Updated the ui/gruntfile.js to add the all contents of plugins directory to be copied in dist and make them available offline during build.

See:
<pre>
Line 27 to 29
Line 74 to 78
Line 231
Line 299
</pre>

Updated clinical/index.html to include additional js and css files from plugins directory

See:
<pre>
Line 607 to 611
</pre>

All features are handeled by angular at default views provided by core bahmni-connect.
There are no changes in bahmni connect core application codes.

## Build - Chrome App (PWA)
<pre>
grunt compass # generate css files
grunt --force chrome #minify and bundle PWA related source code
grunt generate-sw #generate service workers files
</pre>