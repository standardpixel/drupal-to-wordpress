drupal-to-wordpress
===================

Create a wordpress xml export from a Drupal site

How to use this
---------------
   1. clone this repo `git clone https://github.com/standardpixel/drupal-to-wordpress.git`
   2. `cd drupal-to-wordpress` then `npm install` and after that `cd ..`
   3. `cp drupal-to-wordpress/config.json.sample drupal-to-wordpress/config.json`
   4. Edit drupal-to-wordpress/config.json and add your Drupal MySql and site details
   5. `node drupal-to-wordpress --exportSite`
   
_If all goes well you will have an xml file named drupalExport.xml in your current directory_
