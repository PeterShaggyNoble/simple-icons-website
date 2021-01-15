const fs = require('fs');
const path = require('path');
const { format: printf } = require('util');

function MangleExpression(expr, index, repl) {
  return {
    _expr: expr,
    _repl: repl,

    matchIndex: index,
    format: (query) => printf(expr, query),
    getRepl: (replacement) => printf(repl, replacement),
  };
}

// (Regular) Expressions used for mangling classes
const EXPRESSIONS_CLASS_CSS = [
  // e.g.
  //  .(foo)
  //  .(foo)({)
  //  .(foo)( ){
  //  .(foo)(,) .bar {
  //  .(foo)(.)bar {
  //  .(foo)(#)bar {
  //  .(foo)([)data-value] {
  //  .(foo)(:)focus {
  //  .(foo)(:):before {
  //  .bar:not(.(foo)()) {
  new MangleExpression('\\.(%s)([{\\s,\\.\\#[\\:\\)])', 1, '.%s$2'),
];
const EXPRESSIONS_CLASS_HTML = [
  /* Single quotes */

  // e.g.
  //  class=(')(foo)(')
  //  class= (')(foo)(')
  //  class =(')(foo)(')
  //  class = (')(foo)(')
  new MangleExpression("class\\s*=\\s*(')(%s)(')", 2, 'class=$1%s$3'),

  // e.g.
  //  class=(')(foo)( b')
  //  class= (')(foo)( b')
  //  class =(')(foo)( b')
  //  class = (')(foo)( b')
  new MangleExpression("class\\s*=\\s*(')(%s)(\\s[^']*')", 2, 'class=$1%s$3'),

  // e.g.
  //  class=('a )(foo)(')
  //  class= ('a )(foo)(')
  //  class =('a )(foo)(')
  //  class = ('a )(foo)(')
  new MangleExpression("class\\s*=\\s*('[^']*\\s)(%s)(')", 2, 'class=$1%s$3'),

  // e.g.
  //  class=('a )(foo)( b')
  //  class= ('a )(foo)( b')
  //  class =('a )(foo)( b')
  //  class = ('a )(foo)( b')
  new MangleExpression(
    "class\\s*=\\s*('[^']*\\s)(%s)(\\s[^']*')",
    2,
    'class=$1%s$3',
  ),

  /* Double quotes */

  // e.g.
  //  class=(")(foo)(")
  //  class= (")(foo)(")
  //  class =(")(foo)(")
  //  class = (")(foo)(")
  new MangleExpression('class\\s*=\\s*(")(%s)(")', 2, 'class=$1%s$3'),

  // e.g.
  //  class=(")(foo)( b")
  //  class= (")(foo)( b")
  //  class =(")(foo)( b")
  //  class = (")(foo)( b")
  new MangleExpression('class\\s*=\\s*(")(%s)(\\s[^"]*")', 2, 'class=$1%s$3'),

  // e.g.
  //  class=("a )(foo)(")
  //  class= ("a )(foo)(")
  //  class =("a )(foo)(")
  //  class = ("a )(foo)(")
  new MangleExpression('class\\s*=\\s*("[^"]*\\s)(%s)(")', 2, 'class=$1%s$3'),

  // e.g.
  //  class=("a )(foo)( b")
  //  class= ("a )(foo)( b")
  //  class =("a )(foo)( b")
  //  class = ("a )(foo)( b")
  new MangleExpression(
    'class\\s*=\\s*("[^"]*\\s)(%s)(\\s[^"]*")',
    2,
    'class=$1%s$3',
  ),
];
const EXPRESSIONS_CLASS_JS = [
  /* Single quotes */

  // e.g. in `el.classList.add()`
  //  (')(foo)(')
  //  (' )(foo)(')
  //  (')(foo)( ')
  //  (' )(foo)( ')
  new MangleExpression("('\\s*)(%s)(\\s*')", 2, '$1%s$3'),

  // e.g. in `document.querySelectorAll()`
  //  ('.)(foo)(')
  //  ('.)(foo)( )'
  //  ('.)(foo)(.)bar'
  //  ('.)(foo)(#)bar'
  //  ('.)(foo)([)data-value]'
  //  (' .)(foo)(')
  //  ('div.)(foo)( )'
  //  ('div .)(foo)(.)bar'
  //  ('.bar.)(foo)(#)bar'
  //  ('.bar .)(foo)([)data-value]'
  new MangleExpression("('[^']*\\.)(%s)(['\\s\\.\\#\\[])", 2, '$1%s$3'),

  /* Double quotes */

  // e.g. in `el.classList.add()`
  //  (")(foo)(")
  //  (" )(foo)(")
  //  (")(foo)( ")
  //  (" )(foo)( ")
  new MangleExpression('("\\s*)(%s)(\\s*")', 2, '$1%s$3'),

  // e.g. in `document.querySelectorAll()`
  //  (".)(foo)(")
  //  (".)(foo)( )"
  //  (".)(foo)(.)bar"
  //  (".)(foo)(#)bar"
  //  (".)(foo)([)data-value]"
  //  (" .)(foo)(")
  //  ("div.)(foo)( )"
  //  ("div .)(foo)(.)bar"
  //  (".bar.)(foo)(#)bar"
  //  (".bar .)(foo)([)data-value]"
  new MangleExpression('("[^"]*\\.)(%s)(["\\s\\.\\#\\[])', 2, '$1%s$3'),

  /* Backticks */

  // e.g. in `el.classList.add()`
  //  (`)(foo)(`)
  //  (` )(foo)(`)
  //  (`)(foo)( `)
  //  (` )(foo)( `)
  new MangleExpression('(`\\s*)(%s)(\\s*`)', 2, '$1%s$3'),

  // e.g. in `document.querySelectorAll()`
  //  (`.)(foo)(`)
  //  (`.)(foo)( )`
  //  (`.)(foo)(.)bar`
  //  (`.)(foo)(#)bar`
  //  (`.)(foo)([)data-value]`
  //  (` .)(foo)(`)
  //  (`div.)(foo)( )`
  //  (`div .)(foo)(.)bar`
  //  (`.bar.)(foo)(#)bar`
  //  (`.bar .)(foo)([)data-value]`
  new MangleExpression('(`[^"]*\\.)(%s)([`\\s\\.\\#\\[])', 2, '$1%s$3'),
];
const CLASS_EXPRESSIONS_MAP = new Map([
  ['.css', EXPRESSIONS_CLASS_CSS],
  ['.html', EXPRESSIONS_CLASS_HTML],
  ['.js', EXPRESSIONS_CLASS_JS],
]);

// (Regular) Expressions used for mangling IDs
const EXPRESSIONS_ID_CSS = [
  // e.g.
  //  #(foo)
  //  #(foo)({)
  //  #(foo)( ){
  //  #(foo)(,) .bar {
  //  #(foo)(.)bar {
  //  #(foo)([)data-value] {
  //  #(foo)(:)focus {
  //  #(foo)(:):before {
  //  .bar:not\(#(foo)(\)) {
  new MangleExpression('\\#(%s)([{\\s,\\.\\[\\:\\)])', 1, '#%s$2'),
];
const EXPRESSIONS_ID_HTML = [
  /* Single quotes */

  // e.g.
  //  id=(')(foo)(')
  //  id= (')(foo)(')
  //  id =(')(foo)(')
  //  id = (')(foo)(')
  new MangleExpression("id\\s*=\\s*(')(%s)(')", 2, 'id=$1%s$3'),

  // e.g.
  //  id=(')(foo)( b')
  //  id= (')(foo)( b')
  //  id =(')(foo)( b')
  //  id = (')(foo)( b')
  new MangleExpression("id\\s*=\\s*(')(%s)(\\s[^']*')", 2, 'id=$1%s$3'),

  // e.g.
  //  id=('a )(foo)(')
  //  id= ('a )(foo)(')
  //  id =('a )(foo)(')
  //  id = ('a )(foo)(')
  new MangleExpression("id\\s*=\\s*('[^']*\\s)(%s)(')", 2, 'id=$1%s$3'),

  // e.g.
  //  id=('a )(foo)( b')
  //  id= ('a )(foo)( b')
  //  id =('a )(foo)( b')
  //  id = ('a )(foo)( b')
  new MangleExpression("id\\s*=\\s*('[^']*\\s)(%s)(\\s[^']*')", 2, 'id=$1%s$3'),

  /* Double quotes */

  // e.g.
  //  id=(")(foo)(")
  //  id= (")(foo)(")
  //  id =(")(foo)(")
  //  id = (")(foo)(")
  new MangleExpression('id\\s*=\\s*(")(%s)(")', 2, 'id=$1%s$3'),

  // e.g.
  //  id=(")(foo)( b")
  //  id= (")(foo)( b")
  //  id =(")(foo)( b")
  //  id = (")(foo)( b")
  new MangleExpression('id\\s*=\\s*(")(%s)(\\s[^"]*")', 2, 'id=$1%s$3'),

  // e.g.
  //  id=("a )(foo)(")
  //  id= ("a )(foo)(")
  //  id =("a )(foo)(")
  //  id = ("a )(foo)(")
  new MangleExpression('id\\s*=\\s*("[^"]*\\s)(%s)(")', 2, 'id=$1%s$3'),

  // e.g.
  //  id=("a )(foo)( b")
  //  id= ("a )(foo)( b")
  //  id =("a )(foo)( b")
  //  id = ("a )(foo)( b")
  new MangleExpression('id\\s*=\\s*("[^"]*\\s)(%s)(\\s[^"]*")', 2, 'id=$1%s$3'),
];
const EXPRESSIONS_ID_JS = [
  /* Single quotes */

  // e.g. in `document.getElementById()`
  //  (')(foo)(')
  //  (' )(foo)(')
  //  (')(foo)( ')
  //  (' )(foo)( ')
  new MangleExpression("('\\s*)(%s)(\\s*')", 2, '$1%s$3'),

  // e.g. in `document.querySelectorAll()`
  //  ('#)(foo)(')
  //  ('#)(foo)( )'
  //  ('#)(foo)(.)bar'
  //  ('#)(foo)([)data-value]'
  //  (' #)(foo)(')
  //  ('div#)(foo)( )'
  //  ('div #)(foo)(.)bar'
  //  ('.bar#)(foo)([)data-value]'
  new MangleExpression("('[^']*\\#)(%s)(['\\s\\.\\[])", 2, '$1%s$3'),

  /* Double quotes */

  // e.g. in `document.getElementById()`
  //  (")(foo)(")
  //  (" )(foo)(")
  //  (")(foo)( ")
  //  (" )(foo)( ")
  new MangleExpression('("\\s*)(%s)(\\s*")', 2, '$1%s$3'),

  // e.g. in `document.querySelectorAll()`
  //  ("#)(foo)(")
  //  ("#)(foo)( )"
  //  ("#)(foo)(.)bar"
  //  ("#)(foo)([)data-value]"
  //  (" #)(foo)(")
  //  ("div#)(foo)( )"
  //  ("div #)(foo)(.)bar"
  //  (".bar#)(foo)([)data-value]"
  new MangleExpression('("[^"]*\\#)(%s)(["\\s\\.\\[])', 2, '$1%s$3'),

  /* Backticks */

  // e.g. in `document.getElementById()`
  //  (")(foo)(")
  //  (" )(foo)(")
  //  (")(foo)( ")
  //  (" )(foo)( ")
  new MangleExpression('(`\\s*)(%s)(\\s*`)', 2, '$1%s$3'),

  // e.g. in `document.querySelectorAll()`
  //  (`#)(foo)(`)
  //  (`#)(foo)( )`
  //  (`#)(foo)(.)bar`
  //  (`#)(foo)([)data-value]`
  //  (` #)(foo)(`)
  //  (`div#)(foo)( )`
  //  (`div #)(foo)(.)bar`
  //  (`.bar#)(foo)([)data-value]`
  new MangleExpression('(`[^`]*\\#)(%s)([`\\s\\.\\[])', 2, '$1%s$3'),
];
const ID_EXPRESSIONS_MAP = new Map([
  ['.css', EXPRESSIONS_ID_CSS],
  ['.html', EXPRESSIONS_ID_HTML],
  ['.js', EXPRESSIONS_ID_JS],
]);

/**
 * Create a new mangle name generator. This generator will generate the
 * shortest, safe, unique string not previously generated.
 *
 * @example
 *   const generator = new NameGenerator([]);
 *   const firstName = generator.nextName();
 *   console.log(firstName); // outputs "a"
 *
 * @param {String[]} reservedNames Names that should not be generated.
 * @returns The generator, used by calling `.nextName()`.
 */
function NameGenerator(reservedNames) {
  let currentName = ['.'];
  reservedNames = reservedNames || [];

  const charSet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  return {
    nextName: function () {
      const lastChar = currentName[currentName.length - 1];
      if (lastChar === charSet[charSet.length - 1]) {
        currentName.push(charSet[0]);
      } else {
        currentName[currentName.length - 1] =
          charSet[charSet.indexOf(lastChar) + 1];
      }

      const name = currentName.join('');
      if (reservedNames.includes(name)) {
        return this.nextName();
      } else {
        return name;
      }
    },
  };
}

/**
 * Get a count of all occurrences of all queries matching the `queries` in all
 * `files` combined.
 *
 * @param {String[]} files The files to process.
 * @param {String[]} queries The strings to match.
 * @param {Map<String, new MangleExpression>} expressionsMap Expressions for supported file types.
 * @returns {Map<String, Integer>} The count for each string that was found.
 */
function getCountMap(files, queries, expressionsMap) {
  if (!Array.isArray(queries)) {
    queries = [queries];
  }

  const countMap = new Map();
  for (const file of files) {
    const extension = path.extname(file);
    const expressions = expressionsMap.get(extension);
    if (expressions === undefined) {
      console.log(`unsupported file type ${extension} (${file})`);
      continue;
    }

    const s = fs.readFileSync(file).toString();
    for (const query of queries) {
      for (const expr of expressions) {
        const rawExpr = expr.format(query);
        const matchIndex = expr.matchIndex;

        const regexp = new RegExp(rawExpr, 'gm');
        while ((match = regexp.exec(s))) {
          const name = match[matchIndex];
          const count = countMap.get(name) || 0;
          countMap.set(name, count + 1);
        }
      }
    }
  }

  return countMap;
}

/**
 * Get a mangling map based on the number of times each string occurs.
 *
 * @param {String[]} reservedNames The reserved names not allowed in the output.
 * @param {Map<String, Integer>} countMap The occurrence count of each string.
 * @returns {Map<String, String>} A map defining the mangling.
 */
function getMangleMap(reservedNames, countMap) {
  const entries = Array.from(countMap.entries());
  const mostToLeastCommon = entries
    .sort((a, b) => b[1] - a[1])
    .map((e) => e[0]);

  const nameGenerator = new NameGenerator(reservedNames);
  const mangleMap = new Map();
  for (const oldName of mostToLeastCommon) {
    const newName = nameGenerator.nextName();
    mangleMap.set(oldName, newName);
  }

  return mangleMap;
}

/**
 * Mangle the string `s` using the `extension`'s syntax using the `mapping`.
 *
 * @param {String} s
 * @param {String} extension
 * @param {Map<String, String>} mapping The mangling map.
 */
function doMangle(s, extension, expressionsMap, mangleMap) {
  for (const [from, to] of mangleMap) {
    const expressions = expressionsMap.get(extension);
    if (expressions === undefined) {
      break;
    }

    for (const expr of expressions) {
      const rawExpr = expr.format(from);
      const repl = expr.getRepl(to);

      const regexp = new RegExp(rawExpr, 'g');
      s = s.replace(regexp, repl);
    }
  }

  return s;
}

/**
 * Mangle the given `files` using the given mangle `mapping`.
 *
 * @param {String[]} files The files to mangle on.
 * @param {Map<String, String>} mapping The mangling map.
 */
function doMangleOn(files, expressionsMap, mangleMap) {
  for (const file of files) {
    const extension = path.extname(file);
    if (!expressionsMap.get(extension)) {
      console.log(`unsupported file type ${extension} (${file})`);
      continue;
    }

    const inString = fs.readFileSync(file).toString();
    const outString = doMangle(inString, extension, expressionsMap, mangleMap);

    console.log(`writing ${file}`);
    fs.writeFileSync(file, outString);
  }
}

function main2(files, queries, reservedNames, expressionsMap) {
  const countMap = getCountMap(files, queries, expressionsMap);
  const mangleMap = getMangleMap(reservedNames, countMap);
  doMangleOn(files, expressionsMap, mangleMap);
}

/**
 * Run the CSS mangler given some options.
 *
 * @param {Options} opts The options for the CSS mangler.
 */
function main(opts) {
  if (opts.classNameExpr) {
    main2(
      opts.files,
      opts.classNameExpr,
      opts.reservedClassNames,
      CLASS_EXPRESSIONS_MAP,
    );
  }

  if (opts.idNameExpr) {
    main2(
      opts.files,
      opts.idNameExpr,
      opts.reservedIdNames,
      ID_EXPRESSIONS_MAP,
    );
  }
}

main({
  /**
   * One or more expressions to match classes against. Leave `undefined` if you
   * don't want to mangle classes.
   * @type {string|string[]}
   */
  classNameExpr: [
    // section-related classes
    '(header|main|footer)[_-]?[a-zA-Z0-9_-]*',

    // grid-related classes
    'grid-?[a-zA-Z0-9_-]*',

    // control-related classes
    '(control|search)-?[a-zA-Z0-9_-]*',

    // .dark-mode and .light-mode
    '(order-by)-[a-zA-Z0-9_-]+',

    // .dark-mode and .light-mode
    '(dark|light)-mode',
    'contrast-(dark|light)',

    // Miscellaneous
    '(hidden|no-js|copied|copy-button)',
  ],
  /**
   * A list of class names that should not be used.
   * @type {string[]}
   * @todo Allow regular expressions?
   */
  reservedClassNames: ['fa', 'si'],

  /**
   * One or more expressions to match IDs against. Leave `undefined` if you
   * don't want to mangle IDs.
   * @type {string|string[]}
   */
  idNameExpr: 'id-[a-zA-Z0-9-]+',
  /**
   * A list of IDs that should not be used.
   * @type {string[]}
   * @todo Allow regular expressions?
   */
  reservedIdNames: undefined,

  /**
   * The files to mangle.
   * @type {string[]}
   */
  files: ['./_site/app.css', './_site/index.html', './_site/script.js'],
});