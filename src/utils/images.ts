// Foto do imóvel: usa a URL customizada, senão escolhe uma foto estável de um
// banco de imagens a partir de um hash do endereço/id (mesma seed → mesma foto).

const BANCO: string[] = [
  'photo-1512917774080-9991f1c4c750',
  'photo-1568605114967-8130f3a36994',
  'photo-1570129477492-45c003edd2be',
  'photo-1580587771525-78b9dba3b914',
  'photo-1512918728675-ed5a9ecdebfd',
  'photo-1493809842364-78817add7ffb',
  'photo-1502672260266-1c1ef2d93688',
  'photo-1560448204-e02f11c3d0e2',
  'photo-1560185007-cde436f6a4d0',
  'photo-1600585154340-be6161a56a0c',
];

function hash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function obterFotoImovel(seed: string, fotoCustomizada?: string): string {
  if (fotoCustomizada && fotoCustomizada.trim()) return fotoCustomizada.trim();
  const id = BANCO[hash(seed || 'x') % BANCO.length];
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=60`;
}
