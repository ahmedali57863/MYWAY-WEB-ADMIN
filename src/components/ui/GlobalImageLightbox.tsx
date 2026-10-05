'use client'

import { useState, useEffect, useCallback } from 'react'
import { Icon } from './FigmaUI'

export type LightboxImage = {
  src: string
  title?: string
  alt?: string
}

export default function GlobalImageLightbox() {
  const [currentImage, setCurrentImage] = useState<LightboxImage | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Listen for custom open-lightbox events and clicks on any <img> in the document
  useEffect(() => {
    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<LightboxImage>
      if (customEvent.detail?.src) {
        setCurrentImage(customEvent.detail)
        setZoomLevel(1)
      }
    }

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // If clicking directly on an <img> tag
      if (target.tagName.toLowerCase() === 'img') {
        const img = target as HTMLImageElement
        // Ignore if marked no-lightbox or empty src or tiny tracking pixel
        if (img.classList.contains('no-lightbox') || !img.src || img.naturalWidth <= 16) {
          return
        }

        const title = img.alt || img.getAttribute('data-title') || img.title || 'Preview image'
        setCurrentImage({
          src: img.src,
          alt: img.alt || 'Full size preview',
          title
        })
        setZoomLevel(1)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCurrentImage(null)
      }
      if (currentImage) {
        if (e.key === '+' || e.key === '=') {
          setZoomLevel((prev) => Math.min(3, prev + 0.25))
        }
        if (e.key === '-' || e.key === '_') {
          setZoomLevel((prev) => Math.max(0.5, prev - 0.25))
        }
      }
    }

    window.addEventListener('open-image-lightbox', handleCustomEvent as EventListener)
    window.addEventListener('click', handleGlobalClick, true)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('open-image-lightbox', handleCustomEvent as EventListener)
      window.removeEventListener('click', handleGlobalClick, true)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentImage])

  const handleClose = useCallback(() => {
    setCurrentImage(null)
    setZoomLevel(1)
  }, [])

  const handleDownload = async () => {
    if (!currentImage?.src) return
    try {
      const response = await fetch(currentImage.src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `myway_preview_${Date.now()}.${blob.type.split('/')[1] || 'jpg'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch {
      window.open(currentImage.src, '_blank')
    }
  }

  if (!currentImage) return null

  return (
    <div
      className="global-image-lightbox-backdrop"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="global-image-lightbox-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lightbox Toolbar */}
        <header className="global-image-lightbox-header">
          <div className="global-image-lightbox-title">
            <Icon name="eye" size={18} />
            <span>{currentImage.title || 'Document & Image Preview'}</span>
          </div>

          <div className="global-image-lightbox-actions">
            <button
              type="button"
              className="lightbox-btn"
              onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
              title="Zoom out (-)"
            >
              <span style={{ fontSize: '16px', fontWeight: 800 }}>−</span>
            </button>
            <span className="lightbox-zoom-indicator">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              className="lightbox-btn"
              onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
              title="Zoom in (+)"
            >
              <span style={{ fontSize: '16px', fontWeight: 800 }}>+</span>
            </button>

            <button
              type="button"
              className="lightbox-btn"
              onClick={handleDownload}
              title="Download image"
            >
              <Icon name="download" size={16} />
            </button>

            <a
              href={currentImage.src}
              target="_blank"
              rel="noopener noreferrer"
              className="lightbox-btn"
              title="Open full resolution in new tab"
            >
              <Icon name="arrow" size={16} />
            </a>

            <button
              type="button"
              className="lightbox-btn close-btn"
              onClick={handleClose}
              aria-label="Close preview"
              title="Close (ESC)"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </header>

        {/* Image Stage */}
        <div className="global-image-lightbox-stage" onClick={handleClose}>
          <img
            src={currentImage.src}
            alt={currentImage.alt || 'Full size view'}
            className="global-image-lightbox-img no-lightbox"
            style={{
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.18s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Lightbox Footer */}
        <footer className="global-image-lightbox-footer">
          <p>
            <Icon name="shield" size={14} /> Official MYWAY Secure Backend File Preview
          </p>
          <span>Press <b>ESC</b> or click background to dismiss</span>
        </footer>
      </div>
    </div>
  )
}
