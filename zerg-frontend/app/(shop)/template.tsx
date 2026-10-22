// Se vuelve a montar en cada cambio de página: el contenido entra con un fundido corto
// en lugar de reemplazarse de golpe (el header y el pie, en el layout, no se mueven).
export default function ShopTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-in fade-in-0 duration-300 ease-out motion-reduce:animate-none">{children}</div>;
}
