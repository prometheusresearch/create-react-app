
function tryParseInt(str) {
  var num = parseInt(str, 10);
  if (num == str) { // eslint-disable-line eqeqeq
    return num;
  } else {
    return str;
  }
}

module.exports = tryParseInt;
