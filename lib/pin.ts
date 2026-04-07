const PIN_LENGTH = 6;

export function normalizePin(pin: string) {
  return pin.trim().toUpperCase();
}

export function generatePin(length = PIN_LENGTH) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pin = "";

  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    pin += alphabet[randomIndex];
  }

  return pin;
}
