/** A number from 0 to 1, for what the ear should not hear repeat: a take, a moment, an order. Drawn from the browser's crypto, which the lint trusts. */
export const chance = () =>
  crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
