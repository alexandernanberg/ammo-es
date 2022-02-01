const { readFileSync } = require('fs');

function getClosureMapping() {
  const raw = readFileSync('../builds/ammo.vars');
  const ret = {};
  raw.split('\n').forEach(function (line) {
    const parts = line.split(':');
    ret[parts[0]] = parts[1];
  });
  return ret;
}

module.exports = getClosureMapping;
