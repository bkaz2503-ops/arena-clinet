export const eventStatuses = [
  "draft",
  "lobby",
  "question_live",
  "answer_reveal",
  "leaderboard",
  "finished"
] as const;

export type EventStatus = (typeof eventStatuses)[number];

const eventStatusLabels: Record<EventStatus, string> = {
  draft: "Configurando evento",
  lobby: "Esperando participantes",
  question_live: "Pregunta en curso",
  answer_reveal: "Respuesta correcta",
  leaderboard: "Resultados",
  finished: "Evento finalizado"
};

const allowedTransitions: Record<EventStatus, EventStatus[]> = {
  draft: ["lobby", "finished"],
  lobby: ["question_live", "finished"],
  question_live: ["answer_reveal", "leaderboard", "finished"],
  answer_reveal: ["leaderboard", "question_live", "finished"],
  leaderboard: ["question_live", "finished"],
  finished: []
};

export function canTransitionEventStatus(
  currentStatus: EventStatus,
  nextStatus: EventStatus
) {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function getEventStatusLabel(status: EventStatus) {
  return eventStatusLabels[status];
}

export function getEventTransitionError(
  currentStatus: EventStatus,
  nextStatus: EventStatus
) {
  if (canTransitionEventStatus(currentStatus, nextStatus)) {
    return null;
  }

  if (currentStatus === "finished") {
    return "El evento ya finalizo.";
  }

  const nextActionLabels: Record<EventStatus, string> = {
    draft: "volver a configuracion",
    lobby: "iniciar la espera de participantes",
    question_live: "mostrar una pregunta",
    answer_reveal: "revelar la respuesta",
    leaderboard: "mostrar resultados",
    finished: "finalizar el evento"
  };

  return `No se puede ${nextActionLabels[nextStatus]} desde "${getEventStatusLabel(
    currentStatus
  )}".`;
}
