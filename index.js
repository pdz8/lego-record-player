import * as Tone from 'tone'

const connectBtn = document.getElementById('connect-disconnect')
const playBtn = document.getElementById('play-pause')

let isConnected = false
let isPlaying = false

let synth = null
let hub = null
let motorA = null

// Ode to Joy (for reference)
// E4, E4, F4, G4,
// G4, F4, E4, D4,
// C4, C4, D4, E4,
// E4, D4, D4

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

const poweredUP = new PoweredUP.PoweredUP();

playBtn.onclick = () => {
  isPlaying = !isPlaying
  if (isPlaying) {
    playBtn.innerHTML = 'Pause'
    motorA.setPower(15)
  } else {
    playBtn.innerHTML = 'Play'
    motorA.brake()
  }
}

connectBtn.onclick = async () => {
  isConnected = !isConnected
  if (isConnected) {
    connectBtn.disabled = true
    poweredUP.scan();
    console.log("Scanning for Hubs...");

    // Initialize tone
    await Tone.start()
    synth = new Tone.Synth().toDestination();

    connectBtn.innerHTML = 'Disconnect'
    playBtn.disabled = false
  } else {
    hub.disconnect()

    synth = null
    hub = null

    connectBtn.disabled = true

    connectBtn.innerHTML = 'Connect'

    playBtn.disabled = true
    isPlaying = false
    playBtn.innerHTML = 'Play'
  }
}

poweredUP.on('discover', async (h) => {
  hub = h
  console.log(`Discovered ${hub.name}!`)

  await hub.connect()
  console.log(`Connected to ${hub.name}!`)
  connectBtn.disabled = false

  hub.on("disconnect", () => {
    console.log(`Disconnected ${hub.name}`)
    connectBtn.disabled = false
  })

  hub.on("color", (device, { color }) => {
    const note = colorToNoteMap[`${color}`]
    console.log(`Color #: ${color}, Note: ${note}, Color: ${colorToNameMap[`${color}`]}`)
    if (note && isPlaying) {
      synth.triggerAttackRelease(note, "4n");
    }
  })

  motorA = await hub.waitForDeviceAtPort("A")
})
