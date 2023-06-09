const {Console} = require('console')
const { promises: fs } = require('fs')

const stderr = new Console(process.stderr, process.stderr)
const DEBUG_FLAG = process.env['ACTION_DEBUG'] !== undefined

/**
 * Check for existence of a file.
 * @param {string} path - path to file to check existence of 
 * @returns {Promise<boolean>} whether file at path exists
 */
async function exists(path) {  
  try {
    await fs.access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Maybe print debug message
 * @param {string} message
 */
function debug(message) {
  if (DEBUG_FLAG) console.log(message)
}

/**
 * Execute GitHub Action.
 * @param {string[]} args - command arguments
 * @returns {Promise<boolean>} whether run was successful
 */
async function run(args) {
  const pathPackageLock = args.length > 0
    ? args[0]
    : './package-lock.json'
  const lockExists = await exists(pathPackageLock)
  if (!lockExists) {
    debug(`Path [${pathPackageLock}] does not exist.`)
    return true
  }

  const doc = require(pathPackageLock)
  let nTotalPackages = 0
  let nSeeminglyCorrectPackages = 0
  for (const packageKey of Object.keys(doc.packages)) {
    const packageBlock = doc.packages[packageKey]
    ++nTotalPackages
    if (packageBlock.resolved && packageBlock.integrity) {
      ++nSeeminglyCorrectPackages
    }
  }

  if (nTotalPackages < 3) {
    debug(`Too few packages [${nTotalPackages}] to make a solid determination`)
    return true
  }

  if (nSeeminglyCorrectPackages > (nTotalPackages / 2)) {
    debug(`[${nSeeminglyCorrectPackages} of ${nTotalPackages} packages are correct.`)
    return true
  }

  throw new Error(`Less than half of found packages in [${pathPackageLock}] seem to be in the right "shape": [${nSeeminglyCorrectPackages} of ${nTotalPackages}]`)
}

run(process.argv.slice(2))
  .then(
    (result) => { debug(result); },
    (reason) => { console.error('REJECTED'); stderr.dir(reason); process.exitCode = 1; }
  )
  .catch((e) => { console.error('ERROR'); stderr.dir(e); process.exitCode = 1; })
