'use strict';

var fs         = require('fs'),
    colors     = require('colors'),
    mysql      = require('mysql'),
    handlebars = require('handlebars'),
    moment     = require('moment'),
    md         = require('html-md'),
    Entities   = require('html-entities').AllHtmlEntities;

var config              = require(__dirname + '/../config.json'),
    entities            = new Entities(),
    wordpressDateFormat = 'ddd, D MMM YYYY H:m:s ZZ',
    wordpressTemplate   = handlebars.compile(fs.readFileSync(__dirname + '/../templates/wordpress.xml.handlebars', {encoding:'utf8'})),
    data                = {},
    alias;

function mapUrlsToNodes(page) {
  alias = data['alias'].filter(function(a) {return (a['src']==='node/' + page['nid']);});
  page['url_alias'] = (alias.length) ? alias[0]['dst'] : (alias);
  return page;
}

function mapPubDateToWordpressFormat(page) {
  if (page['created']) {
    page['created'] = moment(page['created']*1000).format(wordpressDateFormat);
  }
  if (page['changed']) {
    page['changed'] = moment(page['changed']*1000).format(wordpressDateFormat);
  }
  if (page['timestamp']) {
    page['timestamp'] = moment(page['timestamp']*1000).format(wordpressDateFormat);
  }

  return page;
}

function getDrupalData(callback) {

  var pool = mysql.createPool(config.mysql),
      blogs           = [],
      pages           = [],
      variablesObject = {};

  pool.getConnection(function(err, connection1) {

    connection1.connect();

    connection1.query('select * from node inner join node_revisions on node.nid=node_revisions.nid', function(err, posts, fields) {

      if (err) {
        return callback(err);
      }

      //
      // Make sorted lists of blogs and pages
      //
      posts.forEach(function(post) {
        post.body = '&nbsp;' + post.body + '&nbsp;';
        if (post.type === 'page') {
          pages.push(post);
        } else if (post.type === 'blog') {
          post.type = 'post';
          blogs.push(post);
        }
      });

      pool.getConnection(function(err, connection2) {

        connection2.connect();

        connection2.query('SELECT * from variable', function(err, variables, fields) {
            if (err) {
              return callback(err);
            }

          pool.getConnection(function(err, connection3) {

            connection3.connect();

            connection3.query('SELECT * from users', function(err, users, fields) {
              if (err) {
                return callback(err);
              }

              pool.getConnection(function(err, connection4) {

                connection4.connect();

                connection4.query('SELECT * from url_alias', function(err, alias, fields) {
                  if (err) {
                    return callback(err);
                  }

                  //
                  // Put variables into a lookup table
                  //
                  variables.forEach(function(variable) {
                    variablesObject[variable.name] = variable.value;
                  });

                  //
                  // Build data array
                  //
                  data          = variablesObject;
                  data['posts'] = posts;
                  data['pages'] = pages;
                  data['blogs'] = blogs;
                  data['users'] = users;
                  data['alias'] = alias;

                  //
                  // Limit posts and pages until the htmley thing gets figured out
                  //
                  data['pages'].length = 5;
                  data['blogs'].length = 5;

                  //
                  // Convert pubDate
                  //
                  data['pages'].map(mapPubDateToWordpressFormat);
                  data['blogs'].map(mapPubDateToWordpressFormat);

                  //
                  // add URL field to pages and blogs objects
                  //
                  data['pages'].map(mapUrlsToNodes);
                  data['blogs'].map(mapUrlsToNodes);

                  callback(null, formatDrupalOutputForWordpress(data));

                  
                });

                connection4.release();

              });

            });

            connection3.release();

          });

        });

        connection2.release();

      });

    });

    connection1.release();
    
  });

}

function formatDrupalOutputForWordpress(data) {
  return data;
}

module.exports = function(callback) {

  getDrupalData(function(err, data) {

    if (err) {
      return callback(err);
    }

    console.log('Writing output file.');
    fs.writeFile('./drupalExport.xml', wordpressTemplate({
      drupal : data,
      config : config,
      date   : moment(new Date()).format(wordpressDateFormat)
    }), {'encoding':'utf8'}, function() {
      return callback();
    });

  });

}