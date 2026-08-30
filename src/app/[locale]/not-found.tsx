import Link from "next/link";

export default function NotFound() {
  return (
    <main className="pg-status">
      <h1>Pagina no encontrada</h1>
      <p>La ruta que buscas no existe o cambio de sitio.</p>
      <p>
        <Link href="/">Volver al inicio</Link>
      </p>
    </main>
  );
}
