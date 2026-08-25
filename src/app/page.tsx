import Link from "next/link";

export default function Home() {
  return (
    <main className="pg-landing">
      <h1>Pigmento Studio</h1>
      <p>
        <Link href="/ds">Ver el preview del design system</Link>
      </p>
    </main>
  );
}
