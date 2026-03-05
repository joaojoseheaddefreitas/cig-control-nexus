/**
 * Generate and print a production label with barcode for an OP.
 */
export function imprimirEtiqueta(op: {
  numero_op: string;
  produto_nome: string;
  quantidade: number;
}) {
  // Generate Code128 barcode as SVG
  const barcodeSvg = generateCode128SVG(op.numero_op);

  const html = `<html><head><title>Etiqueta ${op.numero_op}</title>
    <style>
      @page { size: 100mm 60mm; margin: 4mm; }
      body { font-family: Arial, sans-serif; margin: 0; padding: 8px; }
      .label { border: 2px solid #333; padding: 8px; width: 90mm; height: 52mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; }
      .product { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
      .op-number { font-size: 20px; font-weight: bold; font-family: monospace; letter-spacing: 2px; text-align: center; margin: 6px 0; }
      .qty { font-size: 12px; color: #555; }
      .barcode { text-align: center; margin-top: 4px; }
      .barcode svg { max-width: 80mm; height: 30px; }
      .barcode-text { font-family: monospace; font-size: 10px; letter-spacing: 3px; margin-top: 2px; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <div class="label">
      <div class="product">${op.produto_nome}</div>
      <div class="op-number">${op.numero_op}</div>
      <div class="qty">Qtd: ${op.quantidade}</div>
      <div class="barcode">
        ${barcodeSvg}
        <div class="barcode-text">${op.numero_op}</div>
      </div>
    </div>
    </body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}

/**
 * Simple Code128B barcode SVG generator (subset for alphanumeric).
 */
function generateCode128SVG(text: string): string {
  const CODE128B: Record<string, string> = {
    ' ': '11011001100', '!': '11001101100', '"': '11001100110', '#': '10010011000',
    '$': '10010001100', '%': '10001001100', '&': '10011001000', "'": '10011000100',
    '(': '10001100100', ')': '11001001000', '*': '11001000100', '+': '11000100100',
    ',': '10110011100', '-': '10011011100', '.': '10011001110', '/': '10111001100',
    '0': '10011101100', '1': '10011100110', '2': '11001110010', '3': '11001011100',
    '4': '11001001110', '5': '11011100100', '6': '11001110100', '7': '11101101110',
    '8': '11101001100', '9': '11100101100', ':': '11100100110', ';': '11101100100',
    '<': '11100110100', '=': '11100110010', '>': '11011011000', '?': '11011000110',
    '@': '11000110110', 'A': '10100011000', 'B': '10001011000', 'C': '10001000110',
    'D': '10110001000', 'E': '10001101000', 'F': '10001100010', 'G': '11010001000',
    'H': '11000101000', 'I': '11000100010', 'J': '10110111000', 'K': '10110001110',
    'L': '10001101110', 'M': '10111011000', 'N': '10111000110', 'O': '10001110110',
    'P': '11101110110', 'Q': '11010001110', 'R': '11000101110', 'S': '11011101000',
    'T': '11011100010', 'U': '11011101110', 'V': '11101011000', 'W': '11101000110',
    'X': '11100010110', 'Y': '11101101000', 'Z': '11101100010',
  };
  
  // Simplified barcode - just render bars for visual representation
  const startCode = '11010000100'; // Start Code B
  const stopCode = '1100011101011'; // Stop
  
  let pattern = startCode;
  for (const char of text.toUpperCase()) {
    pattern += CODE128B[char] || CODE128B['?'] || '10101010101';
  }
  pattern += stopCode;
  
  const barWidth = 1.5;
  const height = 28;
  let x = 0;
  let bars = '';
  
  for (const bit of pattern) {
    if (bit === '1') {
      bars += `<rect x="${x}" y="0" width="${barWidth}" height="${height}" fill="#000"/>`;
    }
    x += barWidth;
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x} ${height}" width="${x}" height="${height}">${bars}</svg>`;
}
