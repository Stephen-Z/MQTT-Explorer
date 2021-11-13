import * as fs from 'fs-extra'
import * as path from 'path'
import { chdir } from 'process'
import { exec } from './util'

interface Target {
	name: 'appImage' | string
}

interface Context {
	appOutDir: string // .../build/clean/build/linux-unpacked
	outDir: string // .../build/clean/build
	targets: [Target]
}

export default async function (context: Context) {
	console.log(context)
	const isLinux = context.targets.find(target => target.name === 'appImage')
	if (!isLinux) {
		return
	}

	const originalDir = process.cwd()
	const dirname = context.appOutDir
	chdir(dirname)

	await exec('mv', ['mqtt-explorer', 'mqtt-explorer.bin'])
	const wrapperScript = `#!/bin/bash
	    "\${BASH_SOURCE%/*}"/mqtt-explorer.bin "$@" --no-sandbox
	  `
	fs.writeFileSync('mqtt-explorer', wrapperScript)
	await exec('chmod', ['+x', 'mqtt-explorer'])
	// 	await exec('mv', ['baili-mqtt-utilities', 'baili-mqtt-utilities.bin'])
	// 	const wrapperScript = `#!/bin/bash
	//     "\${BASH_SOURCE%/*}"/baili-mqtt-utilities.bin "$@" --no-sandbox
	//   `
	// 	fs.writeFileSync('baili-mqtt-utilities', wrapperScript)
	// 	await exec('chmod', ['+x', 'baili-mqtt-utilities'])

	chdir(originalDir)
}
