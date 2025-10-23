export function playNotificationSound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.value = 800
  oscillator.type = "sine"

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

export function playNewOrderSound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Double beep for new order
  oscillator.frequency.value = 1000
  oscillator.type = "sine"

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.3)

  // Second beep
  const osc2 = audioContext.createOscillator()
  osc2.connect(gainNode)
  osc2.frequency.value = 1000
  osc2.type = "sine"

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.4)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7)

  osc2.start(audioContext.currentTime + 0.4)
  osc2.stop(audioContext.currentTime + 0.7)
}

export function playOrderReadySound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Ding sound - higher pitch
  oscillator.frequency.value = 1200
  oscillator.type = "sine"

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.6)
}

export function playBillGeneratedSound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Chime sound - ascending notes
  oscillator.frequency.value = 800
  oscillator.type = "sine"

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.2)

  // Second note
  const osc2 = audioContext.createOscillator()
  osc2.connect(gainNode)
  osc2.frequency.value = 1000
  osc2.type = "sine"

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.25)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.45)

  osc2.start(audioContext.currentTime + 0.25)
  osc2.stop(audioContext.currentTime + 0.45)

  // Third note
  const osc3 = audioContext.createOscillator()
  osc3.connect(gainNode)
  osc3.frequency.value = 1200
  osc3.type = "sine"

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.5)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7)

  osc3.start(audioContext.currentTime + 0.5)
  osc3.stop(audioContext.currentTime + 0.7)
}

export function playTakeawayOrderSound() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Triple beep for takeaway
  for (let i = 0; i < 3; i++) {
    const osc = audioContext.createOscillator()
    osc.connect(gainNode)
    osc.frequency.value = 900
    osc.type = "sine"

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + i * 0.25)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.25 + 0.15)

    osc.start(audioContext.currentTime + i * 0.25)
    osc.stop(audioContext.currentTime + i * 0.25 + 0.15)
  }
}

export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, options)
  }
}

export async function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission()
  }
}
