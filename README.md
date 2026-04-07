# Arena-CliNet

MVP inicial de Arena-CliNet con Next.js, Tailwind, Prisma y PostgreSQL.

## Instalacion

```bash
npm install
```

## Configurar `.env`

1. Copiar `.env.example` a `.env`.
2. Ajustar `DATABASE_URL`.
3. Definir `JWT_SECRET`.

## Prisma

```bash
npm run prisma:generate
npx prisma db push
```

## Levantar el proyecto

```bash
npm run dev
```

La app queda disponible en `http://localhost:3000`.

## Preparar un evento piloto rapido

1. Abrir `http://localhost:3000/host/dashboard`
2. Crear un evento desde `Crear evento`
3. Guardar el PIN generado
4. Entrar a `Administrar preguntas`
5. Crear al menos 3 preguntas con 4 opciones y una sola correcta
6. Abrir estas pantallas antes de empezar:
   - Host: `/host/event/[id]`
   - Live: `/live/[pin]`
   - Participante de prueba: `/join`

## Checklist operativo para piloto

- App levantada en `3000`
- PostgreSQL disponible en `5432`
- `GET /api/events` responde `200`
- Evento creado con PIN visible
- Minimo 3 preguntas cargadas
- Pantalla host abierta
- Pantalla live abierta
- Un participante de prueba pudo entrar con `/join`
- Play y live muestran `Conectado en tiempo real` o, como minimo, `Modo basico`
- El host pudo iniciar evento, lanzar una pregunta, revelar y mostrar resultados

## Nota de operacion

Si realtime no conecta, `play` y `live` siguen actualizando con polling cada 2 segundos.
