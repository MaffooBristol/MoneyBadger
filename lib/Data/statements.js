'use strict';

import walk from 'walk'
import fs from 'graceful-fs'
import _ from 'lodash'
import Promise from 'bluebird'
import couchbase from 'couchbase';
import moment from 'moment';

export default class Statements {

  getStatements () {
    return new Promise((resolve, reject) => {
      var csvWalker = walk.walk(global.paths.CSV_PATH, {followLinks: false});
      var files = [];
      csvWalker.on('file', (root, stat, next) => {
        if (stat.name.match(/[A-Z]+?\-\d+?.*?\.csv/gi)) {
          var filename = root + '/' + stat.name;
          files.push({stream: fs.createReadStream(filename), stat});
        }
        next();
      });
      csvWalker.on('end', () => {
        let _files = _.reverse(_.sortBy(files, (file) => moment(file.stat.birthtime).unix()));
        resolve(_.map(_files, 'stream'));
      });
      csvWalker.on('errors', (err) => {
        console.log('error!', err);
        reject(err);
      });
    });
  }

}