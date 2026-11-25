// Saca un mensaje legible de un error HTTP del backend ({ mensaje, codigo })
export function mensajeError(err: any): string {
  if (err?.status === 0) return 'No se pudo conectar con el servidor.';
  return err?.error?.mensaje || 'Ocurrió un error. Intenta de nuevo.';
}
