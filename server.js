import WebAudioApi from 'web-audio-api'
import Speaker from 'speaker'
import oscillate from 'audio-oscillator/sin.js'
import MusicFns from 'music-fns'

import PoweredUP from 'node-poweredup'

import readline from 'readline'

const colorToNoteMap = {
  // '0': '', // Black (consistent, but has false positives)

  '3': 'C4', // Blue (consistent)
  '9': 'D4', // Red (consistent)
  '7': 'E4', // Yellow (consistent)
  '6': 'F4', // Green (consistent Cyan)
  '10': 'G4', // White (Yellow/White)

  '1': 'A5', // Pink (Red Yellow)
  '5': 'E4' // Cyan (Blue, Cyan)
}
const colorToNameMap = {
  '3': 'Blue',
  '9': 'Red',
  '7': 'Yellow',
  '6': 'Green',
  '10': 'White',
  '1': 'Pink',
  '5': 'Cyan'
}

const context = new WebAudioApi.AudioContext
context.outStream = new Speaker({
  channels: context.format.numberOfChannels,
  bitDepth: context.format.bitDepth,
  sampleRate: context.sampleRate
})

const quarterNoteLength = 400 * context.sampleRate / 1000
const bufferMap = {}
Object.values(colorToNoteMap).forEach(note => {
  const audioBuffer = new WebAudioApi.AudioBuffer(context.format.numberOfChannels, quarterNoteLength, context.sampleRate)
  oscillate(audioBuffer, { frequency: MusicFns.noteToFrequency(note) })
  bufferMap[note] = audioBuffer
});

async function playNote(note) {
  const bufferNode = context.createBufferSource()
  bufferNode.connect(context.destination)
  bufferNode.buffer = bufferMap[note]
  bufferNode.start(0)
  await new Promise(resolve => setTimeout(resolve, 600));
}

const poweredUP = new PoweredUP.PoweredUP();
poweredUP.on('discover', async (hub) => {
  console.log(`Discovered ${hub.name}!`)

  await hub.connect()
  console.log(`Connected to ${hub.name}!`)

  hub.on("disconnect", () => {
    console.log(`Disconnected ${hub.name}`)
    process.exit()
  })

  hub.on("color", (device, { color }) => {
    const note = colorToNoteMap[`${color}`]
    console.log(`Color #: ${color}, Note: ${note}, Color: ${colorToNameMap[`${color}`]}`)
    if (note) {
      playNote(note)
    }
  })

  // Toggle motor by hitting enter
  const motorA = await hub.waitForDeviceAtPort("A")
  let motorOn = false
  let rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.on('line', (line => {
    motorOn = !motorOn
    if (motorOn) {
      motorA.setPower(15)
    } else {
      motorA.brake()
    }
  }))
})

poweredUP.scan();
console.log("Scanning for Hubs...");

// Ode to Joy (for reference)
// E4, E4, F4, G4,
// G4, F4, E4, D4,
// C4, C4, D4, E4,
// E4, D4, D4
