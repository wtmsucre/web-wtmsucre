import type { ImageMetadata } from "astro"
import abbyImg from "@/assets/events/nwd-26/speakers/AbigailAbby.png"
import anaImg from "@/assets/events/nwd-26/speakers/AnaAngelaCopacalle Ramos.png"
import jhoselineImg from "@/assets/events/nwd-26/speakers/Jhoseline Terán.jpeg"
import melvyImg from "@/assets/events/nwd-26/speakers/MelvyRocíoAncietaAlvarado.png"
import margaretImg from "@/assets/events/nwd-26/speakers/margaret.jpeg"

export interface AgendaTalk {
  type: "talk"
  time: string
  side: "left" | "right"
  topic: string
  title: string
  speaker: string
  image: ImageMetadata
  bgPhoto: string
  blob: string
}

export interface AgendaBreak {
  type: "break"
  time: string
  side: "right" | "left"
  eyebrow: string
  title: string
  meta: string
}

export interface AgendaClose {
  type: "close"
  time: string
  side: "left" | "right"
  title: string
  speaker: string
}

export type AgendaItem = AgendaTalk | AgendaBreak | AgendaClose

export const agenda: AgendaItem[] = [
  {
    type: "talk",
    time: "14:30",
    side: "left",
    topic: "Emprendimiento",
    title: "Soñar, emprender y servir",
    speaker: "Margarett Tavera Velasco",
    image: margaretImg,
    bgPhoto: "#B5E0FB",
    blob: "#CFF3F8",
  },
  {
    type: "talk",
    time: "15:10",
    side: "right",
    topic: "Productividad",
    title: "Adaptación al cambio en época de la IA",
    speaker: "Melvy Rocío Ancieta Alvarado",
    image: melvyImg,
    bgPhoto: "#F6D27A",
    blob: "#FFEFC2",
  },
  {
    type: "talk",
    time: "15:50",
    side: "left",
    topic: "Habilidades blandas",
    title: "Tu talento importa. Tu equipo, mucho más.",
    speaker: "Abigail Mamani",
    image: abbyImg,
    bgPhoto: "#9FE0EA",
    blob: "#DCE9FD",
  },
  {
    type: "break",
    time: "16:30",
    side: "right",
    eyebrow: "Pausa",
    title: "Recarga energía",
    meta: "Break · 15 min",
  },
  {
    type: "talk",
    time: "16:45",
    side: "right",
    topic: "Desarrollo profesional",
    title: "El enemigo de una mujer es...",
    speaker: "Susan Jhoseline Teran Cruz",
    image: jhoselineImg,
    bgPhoto: "#B5E0FB",
    blob: "#CFF3F8",
  },
  {
    type: "talk",
    time: "17:25",
    side: "left",
    topic: "Productividad",
    title:
      "De la ingeniería a la vida real: cómo gestionar múltiples proyectos sin perder el rumbo",
    speaker: "Ana Angela Copacalle Ramos",
    image: anaImg,
    bgPhoto: "#F6D27A",
    blob: "#FFEFC2",
  },
  {
    type: "close",
    time: "18:00",
    side: "left",
    title: "Cierre del evento",
    speaker: "Reconocimiento a speakers, despedida y fotos",
  },
]
