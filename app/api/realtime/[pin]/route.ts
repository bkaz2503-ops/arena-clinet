import { normalizePin } from "@/lib/pin";
import { subscribeToRealtime } from "@/lib/socket";

type RouteContext = {
  params: Promise<{ pin: string }>;
};

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext) {
  const { pin } = await context.params;
  const normalizedPin = normalizePin(pin);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      send("connected", {
        pin: normalizedPin,
        timestamp: Date.now()
      });

      const unsubscribe = subscribeToRealtime(normalizedPin, (payload) => {
        send(payload.type, payload);
      });

      request.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      });

      const heartbeat = setInterval(() => {
        send("heartbeat", {
          timestamp: Date.now()
        });
      }, 15000);
    },
    cancel() {
      return undefined;
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
