import { type PointerEvent, useRef, useState } from "react"
import wtmLogo from "@/assets/events/md-26/wtm-logo.png"
import "./CredentialCard.css"

interface CredentialCardProps {
  avatarUrl?: string | null
  firstName: string
  lastName: string
  role: string
  qrUrl?: string | null
}

export default function CredentialCard({
  avatarUrl,
  firstName,
  lastName,
  role,
  qrUrl,
}: CredentialCardProps) {
  const cardRef = useRef<HTMLElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  function resetTilt() {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty("--tilt-x", "0deg")
    card.style.setProperty("--tilt-y", "0deg")
    card.style.setProperty("--shine-opacity", "0")
  }

  function moveTilt(event: PointerEvent<HTMLDivElement>) {
    if (busy || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const card = cardRef.current
    if (!card) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
    card.style.setProperty("--tilt-x", `${(0.5 - y) * 12}deg`)
    card.style.setProperty("--tilt-y", `${(x - 0.5) * 12}deg`)
    card.style.setProperty("--shine-x", `${x * 100}%`)
    card.style.setProperty("--shine-y", `${y * 100}%`)
    card.style.setProperty("--shine-opacity", "1")
  }

  async function exportCard(share: boolean) {
    if (!cardRef.current || busy) return
    setBusy(true)
    setMessage("")
    resetTilt()
    try {
      await document.fonts.ready
      const images = Array.from(cardRef.current.querySelectorAll("img"))
      await Promise.all(images.map(image => image.decode()))
      const { toBlob } = await import("html-to-image")
      const blob = await toBlob(cardRef.current, {
        pixelRatio: 3,
        style: { transform: "none", transition: "none", boxShadow: "none" },
        filter: node => !(node instanceof HTMLElement && node.dataset.exportExclude === "true"),
      })
      if (!blob) throw new Error("No se pudo generar la imagen")
      const file = new File([blob], "credencial-wtm-sucre.png", { type: "image/png" })
      if (share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Mi credencial WTM Sucre" })
          setMessage("Credencial compartida.")
          return
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return
          // Some browsers lose user activation while generating the image.
          // Keep the image available through a download in that case.
        }
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = file.name
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 10000)
      setMessage(
        share ? "Imagen descargada. Puedes subirla a tus redes." : "Credencial descargada."
      )
    } catch (error) {
      console.error("Error al exportar la credencial:", error)
      setMessage("No se pudo generar la imagen. Comprueba tu conexión y vuelve a intentar.")
    } finally {
      setBusy(false)
    }
  }

  const [failedAvatar, setFailedAvatar] = useState<string | null>(null)
  const [failedQr, setFailedQr] = useState<string | null>(null)
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Participante"
  const initials =
    [firstName, lastName]
      .map(name => name?.trim().charAt(0) || "")
      .join("")
      .toUpperCase() || "P"

  return (
    <div className="nwd-credential-panel">
      <div
        className="nwd-credential-stage"
        onPointerMove={moveTilt}
        onPointerLeave={resetTilt}
        onPointerUp={resetTilt}
        onPointerCancel={resetTilt}
      >
        <article
          ref={cardRef}
          className="nwd-credential font-google"
          aria-label={`Credencial de ${fullName}`}
        >
          <div className="nwd-credential__hologram" aria-hidden="true" data-export-exclude="true" />
          <div className="nwd-credential__decoration" aria-hidden="true">
            <span className="nwd-credential__pixel nwd-credential__pixel--blue" />
            <span className="nwd-credential__pixel nwd-credential__pixel--sky" />
            <span className="nwd-credential__pixel nwd-credential__pixel--yellow" />
            <span className="nwd-credential__side-circle" />
            <span className="nwd-credential__arc nwd-credential__arc--sky" />
            <span className="nwd-credential__arc nwd-credential__arc--teal" />
            <span className="nwd-credential__sun" />
          </div>

          <header className="nwd-credential__brand">
            <img src={wtmLogo.src} width="54" height="54" alt="" />
            <div>
              <p>
                Women Techmakers
                <br />
                Community
              </p>
              <p className="nwd-credential__city">Sucre</p>
            </div>
          </header>

          <div className="nwd-credential__identity">
            <div className="nwd-credential__portrait">
              {avatarUrl && failedAvatar !== avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Foto de ${fullName}`}
                  width="176"
                  height="176"
                  onError={() => setFailedAvatar(avatarUrl)}
                />
              ) : (
                <span
                  className="nwd-credential__initials"
                  role="img"
                  aria-label="Sin foto de perfil"
                >
                  {initials}
                </span>
              )}
            </div>
            <h1 className="nwd-credential__name">{fullName}</h1>
            <p className="nwd-credential__role">{role || "Participante"}</p>
            <div className="nwd-credential__qr">
              {qrUrl && failedQr !== qrUrl ? (
                <img
                  src={qrUrl}
                  alt="Código QR personal para acreditar tu ingreso"
                  width="144"
                  height="144"
                  onError={() => setFailedQr(qrUrl)}
                />
              ) : (
                <p role="status">Tu QR aún no está disponible. Vuelve a cargar la página.</p>
              )}
            </div>
          </div>
        </article>
      </div>
      <div className="nwd-credential-actions">
        <button
          type="button"
          disabled={busy || !qrUrl || failedQr === qrUrl}
          onClick={() => exportCard(true)}
        >
          {busy ? "Preparando imagen…" : "Compartir credencial"}
        </button>
        <button
          type="button"
          disabled={busy || !qrUrl || failedQr === qrUrl}
          onClick={() => exportCard(false)}
        >
          Descargar imagen
        </button>
      </div>
      <p className="nwd-credential-feedback" role="status">
        {message}
      </p>
    </div>
  )
}
